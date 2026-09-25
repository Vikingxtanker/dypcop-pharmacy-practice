import test from "node:test";
import assert from "node:assert/strict";
import {
  buildHealthScreeningReportData,
  demoReportData,
  getAvailableReportTests,
  inferBpStatus,
  inferTestStatus,
  normalizeIncludedTests,
  resultStatusClass,
  resultStatusLabel,
  resultStatusTone,
  type ScreeningTestRecord,
} from "./patient-report-data.ts";

const patient = {
  id: "HSC-P-00127",
  name: "Aarav Sharma",
  dob: "2002-09-25",
  age: 99,
  gender: "Male",
  phone: "9876543210",
  bmi: 23.45,
  address: "Nigdi",
};

test("builds demographics and reportId", () => {
  const data = buildHealthScreeningReportData(patient, [], "2026-09-25");
  assert.equal(data.patient.name, "Aarav Sharma");
  assert.equal(data.patient.phone, "9876543210");
  assert.equal(data.patient.age, 24);
  assert.equal(data.patient.date, "25 September 2026");
  assert.equal(data.reportId, "HSC-P-00127-2026-09-25");
  assert.deepEqual(data.laboratoryResults, []);
  assert.deepEqual(data.counselingPoints, []);
});

test("falls back to mobile for phone, omits empty values", () => {
  const data = buildHealthScreeningReportData({ id: "X", name: "P", mobile: "91" }, [], "2026-09-25");
  assert.equal(data.patient.phone, "91");
  assert.equal(data.patient.age, undefined);
  assert.equal(data.patient.bmi, undefined);
  assert.equal(data.patient.gender, undefined);
});

test("report age comes from DOB, never from the stale stored patients.age", () => {
  const stale = { id: "P1", name: "Patient", dob: "2006-09-25", age: 19, gender: "Female" };
  const data = buildHealthScreeningReportData(stale, [], "2026-09-25");
  assert.equal(data.patient.age, 20);
});

test("a wildly wrong stored age is ignored when DOB yields a sane age", () => {
  const stale = { id: "P2", name: "Patient", dob: "2002-09-25", age: 99, gender: "Male" };
  const data = buildHealthScreeningReportData(stale, [], "2026-09-25");
  assert.equal(data.patient.age, 24);
});

test("historical report age is pinned to the screening date, not a later birthday", () => {
  const patientRow = { id: "P3", name: "Patient", dob: "2006-09-25", age: 20, gender: "Female" };
  const onScreeningDay = buildHealthScreeningReportData(patientRow, [], "2026-09-25");
  assert.equal(onScreeningDay.patient.age, 20);
  const dayBeforeBirthday = buildHealthScreeningReportData(patientRow, [], "2026-09-24");
  assert.equal(dayBeforeBirthday.patient.age, 19);
});

test("picks latest record per test type", () => {
  const records = [
    { test_type: "HbA1c", value_numeric: 6.2, value_text: null, unit: "%", created_at: "2026-09-25T02:10:00Z" },
    { test_type: "HbA1c", value_numeric: 5.7, value_text: null, unit: "%", created_at: "2026-09-25T01:10:00Z" },
  ];
  const data = buildHealthScreeningReportData(patient, records, "2026-09-25");
  const row = data.laboratoryResults.find((r) => r.test.includes("HbA1c"));
  assert.equal(row?.result, "6.2 %");
  assert.equal(row?.status, "normal");
});

test("combines Systolic + Diastolic pairing into one Blood Pressure row", () => {
  const records = [
    { test_type: "Systolic", value_numeric: 138, value_text: null, unit: null, created_at: "2026-09-25T02:12:00Z" },
    { test_type: "Diastolic", value_numeric: 86, value_text: null, unit: null, created_at: "2026-09-25T02:11:00Z" },
    { test_type: "BP", value_text: "138/86", value_numeric: null, unit: "mmHg", created_at: "2026-09-25T02:10:00Z" },
  ];
  const data = buildHealthScreeningReportData(patient, records, "2026-09-25");
  const bp = data.laboratoryResults.find((r) => r.test === "Blood Pressure");
  assert.equal(bp?.result, "138/86 mmHg");
  assert.equal(bp?.status, "info");
});

test("Blood Pressure falls back to the text row when no pairing exists", () => {
  const records = [
    { test_type: "BP", value_text: "160/100", value_numeric: null, unit: "mmHg", created_at: "2026-09-25T02:10:00Z" },
  ];
  const data = buildHealthScreeningReportData(patient, records, "2026-09-25");
  const bp = data.laboratoryResults.find((r) => r.test === "Blood Pressure");
  assert.equal(bp?.result, "160/100 mmHg");
  assert.equal(bp?.status, "high");
});

const FULL_DAY: ScreeningTestRecord[] = [
  { test_type: "Hemoglobin", value_numeric: 14.2, value_text: null, unit: "g/dL", created_at: "2026-09-25T02:00:00Z" },
  { test_type: "RBG", value_numeric: 96, value_text: null, unit: "mg/dL", created_at: "2026-09-25T02:01:00Z" },
  { test_type: "Systolic", value_numeric: 138, value_text: null, unit: null, created_at: "2026-09-25T02:02:00Z" },
  { test_type: "Diastolic", value_numeric: 86, value_text: null, unit: null, created_at: "2026-09-25T02:03:00Z" },
  { test_type: "Heart Rate", value_numeric: 89, value_text: null, unit: null, created_at: "2026-09-25T02:04:00Z" },
  { test_type: "SpO2", value_numeric: 99, value_text: null, unit: null, created_at: "2026-09-25T02:05:00Z" },
  { test_type: "Counseling", value_text: "Keep doses consistent.", value_numeric: null, unit: null, created_at: "2026-09-25T02:06:00Z" },
];

test("all available tests selected -> all rows appear (no counseling checkbox)", () => {
  const options = getAvailableReportTests(FULL_DAY);
  const allIds = options.map((o) => o.id);
  assert.equal(allIds.includes("Counseling"), false);
  assert.equal(options.some((o) => o.id === "BP" && o.label === "Blood Pressure"), true);
  const data = buildHealthScreeningReportData(patient, FULL_DAY, "2026-09-25", allIds);
  assert.equal(data.laboratoryResults.length, options.length);
  for (const option of options) {
    assert.equal(data.laboratoryResults.some((r) => r.test === option.label), true);
  }
});

test("one test excluded -> that row is absent, other rows remain", () => {
  const allIds = getAvailableReportTests(FULL_DAY).map((o) => o.id);
  const data = buildHealthScreeningReportData(patient, FULL_DAY, "2026-09-25", allIds.filter((id) => id !== "Hemoglobin"));
  const labels = data.laboratoryResults.map((r) => r.test);
  assert.equal(labels.includes("Hemoglobin (Hb)"), false);
  assert.equal(labels.includes("Random Blood Glucose (RBS)"), true);
  assert.equal(labels.includes("Blood Pressure"), true);
});

test("multiple tests excluded -> only selected rows remain in canonical order", () => {
  const data = buildHealthScreeningReportData(patient, FULL_DAY, "2026-09-25", ["RBG", "BP"]);
  assert.deepEqual(
    data.laboratoryResults.map((r) => r.test),
    ["Random Blood Glucose (RBS)", "Blood Pressure"],
  );
});

test("empty selection -> no laboratory rows (rejected at generation time)", () => {
  const data = buildHealthScreeningReportData(patient, FULL_DAY, "2026-09-25", []);
  assert.deepEqual(data.laboratoryResults, []);
});

test("unknown includedTests identifiers never create arbitrary rows", () => {
  assert.deepEqual(normalizeIncludedTests(["NotARealTest", "Hemoglobin", "NotARealTest"]), ["Hemoglobin"]);
  assert.deepEqual(normalizeIncludedTests(["TotallyFake"]), []);
  const data = buildHealthScreeningReportData(patient, FULL_DAY, "2026-09-25", ["TotallyFake"]);
  assert.deepEqual(data.laboratoryResults, []);
});

test("includedTests input validation rejects non-arrays and non-strings", () => {
  assert.equal(normalizeIncludedTests("Hemoglobin"), null);
  assert.equal(normalizeIncludedTests(42), null);
  assert.equal(normalizeIncludedTests(["Hemoglobin", 42]), null);
  assert.equal(normalizeIncludedTests(undefined), null);
  assert.equal(normalizeIncludedTests(null), null);
  assert.deepEqual(normalizeIncludedTests([]), []);
});

test("duplicate same-type measurements -> one checkbox and one report row, latest wins", () => {
  const records: ScreeningTestRecord[] = [
    { test_type: "HbA1c", value_numeric: 6.2, value_text: null, unit: "%", created_at: "2026-09-25T02:10:00Z" },
    { test_type: "HbA1c", value_numeric: 5.7, value_text: null, unit: "%", created_at: "2026-09-25T01:10:00Z" },
  ];
  const options = getAvailableReportTests(records);
  assert.equal(options.length, 1);
  assert.equal(options[0].id, "HbA1c");
  assert.equal(options[0].label, "Glycated Hemoglobin (HbA1c)");
  const data = buildHealthScreeningReportData(patient, records, "2026-09-25", ["HbA1c"]);
  assert.deepEqual(data.laboratoryResults.map((r) => r.test), ["Glycated Hemoglobin (HbA1c)"]);
  assert.equal(data.laboratoryResults[0].result, "6.2 %");
});

test("BP composite stays one selectable option and one report row", () => {
  const records: ScreeningTestRecord[] = [
    { test_type: "Systolic", value_numeric: 138, value_text: null, unit: null, created_at: "2026-09-25T02:02:00Z" },
    { test_type: "Diastolic", value_numeric: 86, value_text: null, unit: null, created_at: "2026-09-25T02:03:00Z" },
  ];
  const options = getAvailableReportTests(records);
  assert.equal(options.filter((o) => o.id === "BP").length, 1);
  assert.equal(options.length, 1);
  const data = buildHealthScreeningReportData(patient, records, "2026-09-25", ["BP"]);
  assert.deepEqual(data.laboratoryResults.map((r) => r.test), ["Blood Pressure"]);
  assert.equal(data.laboratoryResults[0].result, "138/86 mmHg");
});

test("legacy: omitted includedTests includes all available tests", () => {
  const data = buildHealthScreeningReportData(patient, FULL_DAY, "2026-09-25");
  assert.equal(data.laboratoryResults.length, getAvailableReportTests(FULL_DAY).length);
  assert.equal(data.counselingPoints[0], "Keep doses consistent.");
});

test("counseling is split by lines and never truncated", () => {
  const long = "A very long counseling point that must be preserved in full, every single word kept intact when building the report data model.";
  const records = [
    { test_type: "Counseling", value_text: `First point.\n${long}\nThird point.`, value_numeric: null, unit: null, created_at: "2026-09-25T02:10:00Z" },
  ];
  const data = buildHealthScreeningReportData(patient, records, "2026-09-25");
  assert.deepEqual(data.counselingPoints, ["First point.", long, "Third point."]);
  assert.ok(data.counselingPoints[1].includes("every single word"));
});

test("counseling collapses extra whitespace per line", () => {
  const records = [
    { test_type: "Counseling", value_text: "  Keep  doses   consistent. \n\n", value_numeric: null, unit: null, created_at: "2026-09-25T02:10:00Z" },
  ];
  const data = buildHealthScreeningReportData(patient, records, "2026-09-25");
  assert.deepEqual(data.counselingPoints, ["Keep doses consistent."]);
});

test("missing counseling yields empty points", () => {
  const data = buildHealthScreeningReportData(patient, [], "2026-09-25");
  assert.deepEqual(data.counselingPoints, []);
});

test("inferTestStatus boundaries", () => {
  assert.equal(inferTestStatus("FBS", 125), "normal");
  assert.equal(inferTestStatus("FBS", 126), "high");
  assert.equal(inferTestStatus("FBS", 70), "low");
  assert.equal(inferTestStatus("RBG", 199), "normal");
  assert.equal(inferTestStatus("RBG", 200), "high");
  assert.equal(inferTestStatus("PPBS", 180), "high");
  assert.equal(inferTestStatus("HbA1c", 6.5), "high");
  assert.equal(inferTestStatus("HbA1c", 6.4), "normal");
  assert.equal(inferTestStatus("SpO2", 94), "normal");
  assert.equal(inferTestStatus("SpO2", 93), "low");
  assert.equal(inferTestStatus("Heart Rate", 101), "high");
  assert.equal(inferTestStatus("Heart Rate", 55), "low");
  assert.equal(inferTestStatus("Hemoglobin", 18), "high");
  assert.equal(inferTestStatus("Hemoglobin", 10.9), "low");
  assert.equal(inferTestStatus("Uric Acid", 5.8), "info");
  assert.equal(inferTestStatus("FBS", ""), "info");
  assert.equal(inferTestStatus("FBS", null), "info");
});

test("inferBpStatus boundaries", () => {
  assert.equal(inferBpStatus("118/70"), "normal");
  assert.equal(inferBpStatus("119/79"), "normal");
  assert.equal(inferBpStatus("120/70"), "info");
  assert.equal(inferBpStatus("138/86"), "info");
  assert.equal(inferBpStatus("139/89"), "info");
  assert.equal(inferBpStatus("140/90"), "high");
  assert.equal(inferBpStatus("159/99"), "high");
  assert.equal(inferBpStatus("110/80"), "info");
  assert.equal(inferBpStatus("90/60"), "low");
  assert.equal(inferBpStatus("garbage"), "info");
});

test("sqrt demo data covers >=15 lab rows and long counseling", () => {
  const demo = demoReportData();
  assert.ok(demo.laboratoryResults.length >= 15, `got ${demo.laboratoryResults.length}`);
  assert.ok(demo.counselingPoints.length >= 10);
  assert.equal(demo.patient.name, "Aarav Sharma");
  assert.equal(demo.onlineReportUrl, "https://dypcoppharmacypractice.in/report/demo-HSC-P-00127");
});

test("status-to-visual tone mapping is centralized on the existing status model", () => {
  assert.equal(resultStatusTone("normal"), "normal");
  assert.equal(resultStatusTone("low"), "low");
  assert.equal(resultStatusTone("high"), "high");
  assert.equal(resultStatusTone("info"), "neutral");
  assert.equal(resultStatusTone(undefined), "neutral");

  assert.equal(resultStatusClass("normal"), "rp-result--normal");
  assert.equal(resultStatusClass("low"), "rp-result--low");
  assert.equal(resultStatusClass("high"), "rp-result--high");
  assert.equal(resultStatusClass("info"), "rp-result--neutral");
  assert.equal(resultStatusClass(undefined), "rp-result--neutral");
});

test("status phrases are plain-text and readable for assistive tech", () => {
  assert.equal(resultStatusLabel("normal"), "within normal range");
  assert.equal(resultStatusLabel("low"), "below normal range");
  assert.equal(resultStatusLabel("high"), "above normal range");
  assert.equal(resultStatusLabel("info"), "unclassified status");
  assert.equal(resultStatusLabel(undefined), "unclassified status");
});

test("boundary values map to the correct visual tone via EXISTING inference", () => {
  // Normal (green): upper/lower boundaries of a range remain normal.
  assert.equal(resultStatusClass(inferTestStatus("Heart Rate", 60)), "rp-result--normal");
  assert.equal(resultStatusClass(inferTestStatus("Heart Rate", 100)), "rp-result--normal");
  assert.equal(resultStatusClass(inferTestStatus("RBG", 110)), "rp-result--normal");
  assert.equal(resultStatusClass(inferTestStatus("SpO2", 94)), "rp-result--normal");
  assert.equal(resultStatusClass(inferBpStatus("119/79")), "rp-result--normal");

  // Below normal (yellow) for anything the model flags as low.
  assert.equal(resultStatusClass(inferTestStatus("Heart Rate", 55)), "rp-result--low");
  assert.equal(resultStatusClass(inferTestStatus("Hemoglobin", 10.9)), "rp-result--low");
  assert.equal(resultStatusClass(inferTestStatus("SpO2", 93)), "rp-result--low");
  assert.equal(resultStatusClass(inferBpStatus("90/60")), "rp-result--low");

  // Above normal (red) for anything the model flags as high.
  assert.equal(resultStatusClass(inferTestStatus("RBG", 200)), "rp-result--high");
  assert.equal(resultStatusClass(inferTestStatus("HbA1c", 6.5)), "rp-result--high");
  assert.equal(resultStatusClass(inferBpStatus("140/90")), "rp-result--high");

  // Unclassified (neutral) stays neutral — never falsely green.
  assert.equal(resultStatusClass(inferTestStatus("Uric Acid", 5.8)), "rp-result--neutral");
  assert.equal(resultStatusClass(inferTestStatus("FBS", "")), "rp-result--neutral");
  assert.equal(resultStatusClass(inferBpStatus("garbage")), "rp-result--neutral");
});

test("kum413-style example values yield the expected visual tones", () => {
  // Mirrors the sample outcomes: only statuses produced by EXISTING inference are asserted.
  assert.equal(resultStatusClass(inferTestStatus("Hemoglobin", 10.4)), "rp-result--low");
  assert.equal(resultStatusClass(inferTestStatus("RBG", 110)), "rp-result--normal");
  assert.equal(resultStatusClass(inferTestStatus("Heart Rate", 89)), "rp-result--normal");
  assert.equal(resultStatusClass(inferTestStatus("SpO2", 99)), "rp-result--normal");
  assert.equal(resultStatusClass(inferBpStatus("100/69")), "rp-result--normal");
});