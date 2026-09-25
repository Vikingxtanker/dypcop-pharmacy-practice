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

const HERE = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = join(HERE, "..", "supabase", "migrations");

const RECORD_PATIENT_REVIEW_MIGRATIONS = [
  "20260925120000_record_patient_review.sql",
  "20260925130000_fix_record_patient_review_patient_id_ambiguity.sql",
];

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
      .replace(/returns\s+table\s*\([^)]*\)/i, ""); // RETURNS TABLE declaration span

    const ambiguousLines = codeOnly
      .split(/\r?\n/)
      .map((line, i) => ({ line, i }))
      .filter(({ line }) => /\bpatient_id\b/i.test(line) && !barePatientIdLineIsSafe(line));
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