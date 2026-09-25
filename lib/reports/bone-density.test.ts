import test from "node:test";
import assert from "node:assert/strict";
import {
  BONE_DENSITY_REFERENCE_TEXT,
  BONE_DENSITY_TEST_ID,
  REPORT_LAB_TEST_IDS,
  boneDensityStatus,
  buildHealthScreeningReportData,
  classifyBoneDensityTScore,
  getAvailableReportTests,
  normalizeIncludedTests,
  type ScreeningTestRecord,
} from "./patient-report-data.ts";

const patient = {
  id: "HSC-P-00777",
  name: "Bone Density Case",
  dob: "1970-01-01",
  gender: "Female",
};

const bonedensity = (value_numeric: number): ScreeningTestRecord[] => [
  { test_type: BONE_DENSITY_TEST_ID, value_numeric, value_text: null, unit: "T Score", created_at: "2026-09-25T02:10:00Z" },
];

test("Bone Density (T Score) is a canonical reportable test id", () => {
  assert.equal(REPORT_LAB_TEST_IDS.includes(BONE_DENSITY_TEST_ID), true);
  assert.deepEqual(normalizeIncludedTests([BONE_DENSITY_TEST_ID]), [BONE_DENSITY_TEST_ID]);
  assert.deepEqual(normalizeIncludedTests(["bone density", "Bone Density (T Score)"]), [BONE_DENSITY_TEST_ID]);
  assert.deepEqual(normalizeIncludedTests([]), []);
});

test("classification boundaries (no value gaps): Normal at T >= -1.0", () => {
  assert.equal(classifyBoneDensityTScore(-0.5), "Normal");
  assert.equal(classifyBoneDensityTScore(0), "Normal");
  assert.equal(classifyBoneDensityTScore(2.1), "Normal");
  assert.equal(classifyBoneDensityTScore(-1.0), "Normal");
});

test("classification boundaries: Osteopenia between -2.5 and -1.0", () => {
  assert.equal(classifyBoneDensityTScore(-1.01), "Osteopenia");
  assert.equal(classifyBoneDensityTScore(-1.5), "Osteopenia");
  assert.equal(classifyBoneDensityTScore(-2.5), "Osteopenia");
  assert.equal(classifyBoneDensityTScore(-2.49), "Osteopenia");
});

test("classification boundaries: Osteoporosis below -2.5", () => {
  assert.equal(classifyBoneDensityTScore(-2.51), "Osteoporosis");
  assert.equal(classifyBoneDensityTScore(-3.0), "Osteoporosis");
});

test("status mapping follows the clinical category", () => {
  assert.equal(boneDensityStatus(-0.8), "normal");
  assert.equal(boneDensityStatus(-1.0), "normal");
  assert.equal(boneDensityStatus(-1.8), "low");
  assert.equal(boneDensityStatus(-2.5), "low");
  assert.equal(boneDensityStatus(-2.6), "high");
  assert.equal(boneDensityStatus(0), "normal");
  assert.equal(boneDensityStatus(null), "info");
  assert.equal(boneDensityStatus(undefined), "info");
  assert.equal(boneDensityStatus(Number.NaN), "info");
});

test("report row shows stored numeric value, category interpretation and status", () => {
  const data = buildHealthScreeningReportData(patient, bonedensity(-1.8), "2026-09-25");
  assert.equal(data.laboratoryResults.length, 1);
  const row = data.laboratoryResults[0];
  assert.equal(row.test, BONE_DENSITY_TEST_ID);
  assert.equal(row.result, "-1.8 T Score");
  assert.equal(row.unit, "T Score");
  assert.equal(row.interpretation, "Osteopenia");
  assert.equal(row.status, "low");
  assert.ok(row.normalRange?.startsWith("Osteopenia"));
  assert.ok(row.normalRange?.includes(BONE_DENSITY_REFERENCE_TEXT));
});

test("numeric value is preserved verbatim and never replaced by the interpretation", () => {
  const data = buildHealthScreeningReportData(patient, bonedensity(-1.8), "2026-09-25");
  const result = data.laboratoryResults[0]?.result;
  assert.equal(result?.includes("-1.8"), true);
  assert.equal(result?.includes("Osteopenia"), false);
});

test("absolutely normal T Score of zero is not swallowed as missing", () => {
  const data = buildHealthScreeningReportData(patient, bonedensity(0), "2026-09-25");
  const row = data.laboratoryResults.find((r) => r.test === BONE_DENSITY_TEST_ID);
  assert.equal(row?.result, "0 T Score");
  assert.equal(row?.interpretation, "Normal");
  assert.equal(row?.status, "normal");
});

test("Osteoporosis boundary renders the red category and high status", () => {
  const data = buildHealthScreeningReportData(patient, bonedensity(-2.6), "2026-09-25");
  const row = data.laboratoryResults.find((r) => r.test === BONE_DENSITY_TEST_ID);
  assert.equal(row?.result, "-2.6 T Score");
  assert.equal(row?.interpretation, "Osteoporosis");
  assert.equal(row?.status, "high");
});

test("row is absent when no Bone Density record exists for the patient", () => {
  const data = buildHealthScreeningReportData(patient, [], "2026-09-25");
  assert.equal(data.laboratoryResults.length, 0);
  assert.equal(getAvailableReportTests([]).some((o) => o.id === BONE_DENSITY_TEST_ID), false);
});

test("available-test discovery includes Bone Density only when a record exists", () => {
  const options = getAvailableReportTests(bonedensity(-1.8));
  const option = options.find((o) => o.id === BONE_DENSITY_TEST_ID);
  assert.equal(option?.label, BONE_DENSITY_TEST_ID);
  assert.equal(options.length, 1);
});

test("includedTests filter controls the Bone Density row like any other report row", () => {
  const records = [...bonedensity(-0.8), { test_type: "Hemoglobin", value_numeric: 14.2, value_text: null, unit: "g/dL", created_at: "2026-09-25T02:00:00Z" }];
  const included = buildHealthScreeningReportData(patient, records, "2026-09-25", [BONE_DENSITY_TEST_ID]);
  assert.deepEqual(
    included.laboratoryResults.map((r) => r.test),
    [BONE_DENSITY_TEST_ID],
  );
  const excluded = buildHealthScreeningReportData(patient, records, "2026-09-25", ["Hemoglobin"]);
  assert.equal(excluded.laboratoryResults.some((r) => r.test === BONE_DENSITY_TEST_ID), false);
});

test("text-only fallback parses the T Score deterministically", () => {
  const records: ScreeningTestRecord[] = [
    { test_type: BONE_DENSITY_TEST_ID, value_numeric: null, value_text: "-2.6", unit: "T Score", created_at: "2026-09-25T02:10:00Z" },
  ];
  const data = buildHealthScreeningReportData(patient, records, "2026-09-25");
  const row = data.laboratoryResults.find((r) => r.test === BONE_DENSITY_TEST_ID);
  assert.equal(row?.interpretation, "Osteoporosis");
  assert.equal(row?.status, "high");
});

test("latest Bone Density record wins when duplicates exist on the same day", () => {
  const records: ScreeningTestRecord[] = [
    { test_type: BONE_DENSITY_TEST_ID, value_numeric: -0.9, value_text: null, unit: "T Score", created_at: "2026-09-25T03:10:00Z" },
    { test_type: BONE_DENSITY_TEST_ID, value_numeric: -2.6, value_text: null, unit: "T Score", created_at: "2026-09-25T02:10:00Z" },
  ];
  const data = buildHealthScreeningReportData(patient, records, "2026-09-25");
  const row = data.laboratoryResults.find((r) => r.test === BONE_DENSITY_TEST_ID);
  assert.equal(row?.result, "-0.9 T Score");
  assert.equal(row?.interpretation, "Normal");
});