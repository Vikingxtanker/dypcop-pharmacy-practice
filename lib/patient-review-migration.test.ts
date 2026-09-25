import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

// Static regression guard for the production PostgreSQL 42702 failure in
// public.record_patient_review ("column reference patient_id is ambiguous").
//
// RETURNS TABLE output columns become PL/pgSQL variables, so `patient_id` could
// mean either the output variable or a column of public.patient_tests. The
// corrected function uses `#variable_conflict use_column` and table-qualified
// references. This test cannot execute SQL (no database in the test harness), so
// it verifies the migration text has no unqualified ambiguous references left.
//
// The only places a bare `patient_id` may still appear are the ones that are
// syntactically forced to be columns and are covered by the pragma:
//   - the RETURNS TABLE declaration itself (that is where the variable comes from)
//   - the INSERT target column list
//   - the ON CONFLICT conflict-target list
// Any other bare `patient_id` occurrence is a regression.
//
// The file also guards the uniqueness redesign (20260925150000):
//   - the only same-day index enforced on patient_tests is PARTIAL and covers
//     ONLY Height/Weight/BMI (Patient Information Review's own dated rows);
//   - the historical global UNIQUE (patient_id, IST-day, test_type) index was
//     rejected because live data legitimately repeats RBG/FEV/BP/Temperature/
//     SpO2 same-day, so the active migration DROPs it and never re-creates it;
//   - every RPC ON CONFLICT target carries the exact partial-index predicate;
//   - no migration deletes/merges patient_tests rows.

const HERE = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = join(HERE, "..", "supabase", "migrations");

const RECORD_PATIENT_REVIEW_MIGRATIONS = [
  "20260925120000_record_patient_review.sql",
  "20260925130000_fix_record_patient_review_patient_id_ambiguity.sql",
  "20260925150000_patient_review_partial_uniqueness.sql",
];

const PARTIAL_INDEX_NAME = "patient_tests_review_ist_day_test_type_key";
const GLOBAL_INDEX_NAME = "patient_tests_patient_ist_day_test_type_key";
const REVIEW_PREDICATE = "where test_type in ('Height', 'Weight', 'BMI')";
const ACTIVE_MIGRATION_RANGE_START = "20260925150000";

const SIGNATURE_PARAMS = "p_patient_id text, p_height_cm numeric, p_weight_kg numeric, p_bmi numeric, p_past_medical text, p_past_medication text";
const RETURNS_TABLE = "patient_id text, updated_at timestamptz, current_height numeric, current_weight numeric, current_bmi numeric";

const barePatientIdLineIsSafe = (line: string): boolean =>
  /returns\s+table\s*\(\s*patient_id\s+text/i.test(line) || // RETURNS TABLE declaration
  /insert\s+into\s+public\.patient_tests\s+\(patient_id,/i.test(line) || // INSERT column list
  /on\s+conflict\s+\(patient_id,/i.test(line); // ON CONFLICT conflict target

async function migrationText(fileName: string): Promise<string> {
  try {
    return await readFile(join(MIGRATIONS_DIR, fileName), "utf8");
  } catch {
    throw new Error(`Migration file not found: supabase/migrations/${fileName}`);
  }
}

const collapse = (s: string) => s.replace(/\s+/g, " ").trim();

for (const fileName of RECORD_PATIENT_REVIEW_MIGRATIONS) {
  test(`record_patient_review migration ${fileName} is not ambiguous`, async () => {
    const sql = await migrationText(fileName);

    // 1. PL/pgSQL must prefer table columns for colliding identifiers.
    assert.match(sql, /#variable_conflict\s+use_column/);

    // 2. Signature is preserved exactly (single function, no overload):
    //    name, parameter names, parameter types, return type, output columns.
    const signatureMatch = sql.match(
      /create\s+or\s+replace\s+function\s+public\.record_patient_review\s*\(([\s\S]*?)\)\s*returns\s+table\s*\(([\s\S]*?)\)/i,
    );
    assert.ok(signatureMatch, "create or replace function public.record_patient_review(...) returns table (...) must exist");
    assert.equal(collapse(signatureMatch[1]), SIGNATURE_PARAMS, "parameter signature must be preserved exactly");
    assert.equal(collapse(signatureMatch[2]), RETURNS_TABLE, "returned column set must be preserved exactly");

    // 3. Security mode and search_path preserved.
    assert.match(sql, /security\s+invoker/i);
    assert.match(sql, /set\s+search_path\s*=\s*public/i);

    // 4. Grants preserved.
    assert.match(
      sql,
      /grant\s+execute\s+on\s+function\s+public\.record_patient_review\(text,\s*numeric,\s*numeric,\s*numeric,\s*text,\s*text\)\s+to\s+anon,\s*authenticated/i,
    );

    // 5. No unqualified ambiguous `patient_id` outside the pragma-covered,
    //    syntactically column-only positions. Comments and the RETURNS TABLE
    //    declaration (the very source of the output variables) are excluded;
    //    the remaining bare references must be INSERT column lists or ON
    //    CONFLICT conflict targets — both covered by #variable_conflict.
    const codeOnly = sql
      .split(/\r?\n/)
      .map((line) => line.split(" -- ")[0].trim())
      .filter((line) => line.length > 0 && !line.startsWith("--"))
      .join("\n")
      .replace(/returns\s+table\s*\([^)]*\)/i, "") // RETURNS TABLE declaration span
      .replace(/create\s+unique\s+index[\s\S]*?;/gi, ""); // indexes are DDL, not PL/pgSQL (bare column names there are unambiguous)

    const ambiguousLines = codeOnly
      .split(/\r?\n/)
      .map((line, i) => ({ line, i }))
      .filter(({ line }) => /(?<![\w.])patient_id\b/i.test(line) && !barePatientIdLineIsSafe(line));
    assert.deepEqual(
      ambiguousLines,
      [],
      `unqualified patient_id outside allowed positions:\n${ambiguousLines
        .map(({ line, i }) => `  line ${i + 1}: ${line}`)
        .join("\n")}`,
    );
  });
}

test("record_patient_review history and corrective migration define the same corrected body", async () => {
  const original = await migrationText("20260925120000_record_patient_review.sql");
  const corrective = await migrationText("20260925130000_fix_record_patient_review_patient_id_ambiguity.sql");

  const bodyOf = (sql: string) => {
    const m = sql.match(/as\s+\$\$(?:[\s\S]*?)^#variable_conflict\s+use_column[\s\S]*?\$\$/im);
    return m ? m[0] : "";
  };

  assert.ok(bodyOf(original), "original migration should contain the pragma-prefixed body");
  assert.ok(bodyOf(corrective), "corrective migration should contain the pragma-prefixed body");
  assert.equal(bodyOf(original), bodyOf(corrective), "both files must contain the identical corrected function body");
});

test("record_patient_review corrective migration applies via create or replace (no overload)", async () => {
  const corrective = await migrationText("20260925130000_fix_record_patient_review_patient_id_ambiguity.sql");
  const functionDefs = corrective.match(/create\s+or\s+replace\s+function\s+public\.record_patient_review/gi);
  assert.deepEqual(functionDefs, ["create or replace function public.record_patient_review"]);
  const dropsOrCreates = corrective.match(/\b(drop|create)\s+(or\s+replace\s+)?function\b/gi) ?? [];
  assert.deepEqual(dropsOrCreates, ["create or replace function"], "no unrelated function objects are touched");
});

test("20260925150000 applies the corrected function via a single create or replace", async () => {
  const sql = await migrationText("20260925150000_patient_review_partial_uniqueness.sql");
  const functionDefs = sql.match(/create\s+or\s+replace\s+function\s+public\.record_patient_review/gi);
  assert.deepEqual(functionDefs, ["create or replace function public.record_patient_review"]);
  const dropsOrCreates = sql.match(/\b(drop|create)\s+(or\s+replace\s+)?function\b/gi) ?? [];
  assert.deepEqual(dropsOrCreates, ["create or replace function"], "no unrelated function objects are touched");
});

const rpcBodyOf = (sql: string) => {
  const m = sql.match(/as\s+\$\$(?:[\s\S]*?)^#variable_conflict\s+use_column[\s\S]*?\$\$/im);
  return m ? m[0] : "";
};

async function allMigrationFiles(): Promise<string[]> {
  const { readdir } = await import("node:fs/promises");
  const files = await readdir(MIGRATIONS_DIR);
  return files.filter((f) => /^\d{14}_.*\.sql$/i.test(f)).sort();
}

test("20260925150000 creates exactly one partial unique index scoped to Height/Weight/BMI", async () => {
  const sql = await migrationText("20260925150000_patient_review_partial_uniqueness.sql");

  const uniqueIndexCreates = sql.match(/create\s+unique\s+index/gi) ?? [];
  assert.deepEqual(uniqueIndexCreates, ["create unique index"], "exactly one UNIQUE index may be created");

  const indexStmt = sql.match(/create\s+unique\s+index[\s\S]*?;/i);
  assert.ok(indexStmt, "partial unique index definition must exist");
  const stmt = collapse(indexStmt[0]);
  const columns = stmt.match(/on\s+public\.patient_tests\s*\(\s*(.*?)\s*\)\s+where\s+([^;]*?)\s*;?$/i);
  assert.ok(columns, "index statement must carry an ON public.patient_tests (...) WHERE ... shape");
  assert.equal(
    collapse(columns[1]),
    collapse("patient_id, ((created_at at time zone 'Asia/Kolkata')::date), test_type"),
    "index must cover (patient_id, IST-day, test_type)",
  );
  assert.equal(
    collapse(`where ${columns[2]}`),
    collapse(REVIEW_PREDICATE),
    `index must be PARTIAL with predicate ${REVIEW_PREDICATE}`,
  );
});

test("every record_patient_review ON CONFLICT target matches the partial index predicate exactly", async () => {
  const sql = await migrationText("20260925150000_patient_review_partial_uniqueness.sql");
  const body = rpcBodyOf(sql);
  assert.ok(body, "new migration must contain the pragma-prefixed function body");

  const conflictTargetLines = body
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("on conflict (patient_id, "));
  assert.equal(conflictTargetLines.length, 3, "exactly three ON CONFLICT upserts must exist in the code");

  const conflictColumns = "on conflict (patient_id, ((created_at at time zone 'Asia/Kolkata')::date), test_type)";
  for (const line of conflictTargetLines) {
    assert.equal(line, conflictColumns, "every conflict target must name the same functional-expression columns");
  }

  const predicateLines = body
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line === REVIEW_PREDICATE);
  assert.equal(predicateLines.length, 3, "every ON CONFLICT target must carry the partial-index predicate");
});

test("the RPC migration and the partial-index predicate match exactly (predicate-equivalence guard)", async () => {
  const sql = await migrationText("20260925150000_patient_review_partial_uniqueness.sql");
  const body = rpcBodyOf(sql);

  const indexStmt = sql.match(/create\s+unique\s+index[\s\S]*?;/i);
  assert.ok(indexStmt, "partial index statement must exist");
  const escaped = REVIEW_PREDICATE.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const indexPredicate = indexStmt[0].match(new RegExp(escaped, "i"));
  assert.ok(indexPredicate, "index statement must carry the predicate");

  const bodyPredicates = body
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line === REVIEW_PREDICATE);
  assert.equal(bodyPredicates.length, 3, "RPC body must carry the predicate on all three upserts");

  assert.equal(collapse(indexPredicate[0]), collapse(REVIEW_PREDICATE), "index predicate must be the canonical spelling");
  for (const p of bodyPredicates) {
    assert.equal(
      collapse(p),
      collapse(REVIEW_PREDICATE),
      "every body predicate must be textually identical to the index predicate",
    );
  }
});

test("the historical global uniqueness index is NOT enforced: the active migration drops it, never creates it", async () => {
  const sql = await migrationText("20260925150000_patient_review_partial_uniqueness.sql");
  assert.doesNotMatch(sql, /create\s+(unique\s+)?index[\s\S]*?patient_tests_patient_ist_day_test_type_key/i);

  const globalNameLines = sql
    .split(/\r?\n/)
    .map((line) => line.split(" -- ")[0].trim())
    .filter((line) => line.includes(GLOBAL_INDEX_NAME));
  assert.equal(globalNameLines.length, 1, "GLOBAL_INDEX_NAME must appear exactly once");
  assert.match(
    globalNameLines[0],
    /^drop\s+index\s+if\s+exists\s+public\.patient_tests_patient_ist_day_test_type_key;?$/i,
    "the only occurrence must be the DROP INDEX IF EXISTS abandonment",
  );
});

test("20260925140000 stays guarded historical evidence of the abandoned global index", async () => {
  const ensure = await migrationText("20260925140000_ensure_patient_tests_ist_day_uniqueness_index.sql");
  assert.match(ensure, /CREATE UNIQUE INDEX IF NOT EXISTS/);
  assert.match(ensure, /patient_tests_patient_ist_day_test_type_key/);
  assert.match(ensure, /HAVING\s+COUNT\s*\(\s*\*\s*\)\s*>\s*1/, "the never-applied global-index migration kept its duplicate guard");
});

test("no active migration may re-introduce a global (non-partial) unique index on patient_tests", async () => {
  const files = await allMigrationFiles();
  const active = files.filter((f) => f >= ACTIVE_MIGRATION_RANGE_START);
  assert.ok(active.length >= 1, "expected at least the 20260925150000 migration in the active range");
  for (const file of active) {
    const sql = await migrationText(file);
    assert.doesNotMatch(
      sql,
      /create\s+(unique\s+)?index[\s\S]*?patient_tests_patient_ist_day_test_type_key/i,
      `${file} re-introduces the global index name in a CREATE INDEX`,
    );
    const uniqueStmt = sql.match(/create\s+unique\s+index\s+[^;]*;/i);
    if (uniqueStmt) {
      assert.match(
        collapse(uniqueStmt[0]),
        new RegExp(`where\\s+test_type\\s+in\\s*\\(['"]Height['"],\\s*['"]Weight['"],\\s*['"]BMI['"]\\)`, "i"),
        `${file}: any unique index on patient_tests must be partial to Height/Weight/BMI`,
      );
    }
  }
});

test("legitimate same-day clinical measurements stay possible: only Height/Weight/BMI may be unique per IST day", async () => {
  // The predicate scope is asserted textually here; the corresponding
  // MEASUREMENT_TEST_TYPES scope showing clinical types (RBG, FEV, BP,
  // Temperature, SpO2, Hemoglobin) are NOT covered lives in lib/patient-review.test.ts.
  const sql = await migrationText("20260925150000_patient_review_partial_uniqueness.sql");
  const indexStmt = sql.match(/create\s+unique\s+index[\s\S]*?;/i);
  assert.ok(indexStmt, "partial unique index statement must exist");
  const predicateMatch = indexStmt[0].match(new RegExp(`where\\s+test_type\\s+in\\s*\\([^;]*\\)`, "i"));
  assert.ok(predicateMatch, "index must be a partial index carrying a WHERE test_type IN (...) predicate");
  assert.equal(
    collapse(predicateMatch[0]),
    collapse(REVIEW_PREDICATE),
    "the index predicate must be exactly WHERE test_type IN ('Height', 'Weight', 'BMI') and nothing else",
  );
});

test("no review/patient migration ever deletes, merges or truncates existing patient_tests rows", async () => {
  const files = [
    "20260918120000_add_patient_daily_test_uniqueness.sql",
    "20260925120000_record_patient_review.sql",
    "20260925130000_fix_record_patient_review_patient_id_ambiguity.sql",
    "20260925140000_ensure_patient_tests_ist_day_uniqueness_index.sql",
    "20260925150000_patient_review_partial_uniqueness.sql",
  ];
  for (const file of files) {
    const sql = await migrationText(file);
    assert.doesNotMatch(sql, /\bdelete\s+from\b/i, `${file} must not DELETE patient_tests rows`);
    assert.doesNotMatch(sql, /\btruncate\b/i, `${file} must not TRUNCATE patient_tests`);
    assert.doesNotMatch(sql, /\bmerge\s+into\b/i, `${file} must not MERGE INTO patient_tests`);
  }
});

test("20260925150000 RPC body is the corrective body plus the partial-index predicate only", async () => {
  const corrective = await migrationText("20260925130000_fix_record_patient_review_patient_id_ambiguity.sql");
  const withPredicate = await migrationText("20260925150000_patient_review_partial_uniqueness.sql");

  const withoutPredicateLines = (sql: string) =>
    rpcBodyOf(sql)
      .split(/\r?\n/)
      .filter((line) => !/^\s*where test_type in \('Height', 'Weight', 'BMI'\)\s*$/.test(line))
      .join("\n");

  assert.ok(rpcBodyOf(corrective), "corrective migration must contain the pragma-prefixed body");
  assert.ok(rpcBodyOf(withPredicate), "20260925150000 must contain the pragma-prefixed body");
  assert.equal(
    withoutPredicateLines(withPredicate),
    withoutPredicateLines(corrective),
    "20260925150000 must differ from the corrective body ONLY by the added conflict-target predicates",
  );
});