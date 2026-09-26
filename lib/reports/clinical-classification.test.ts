import test from "node:test";
import assert from "node:assert/strict";
import {
  classifyBloodPressure,
  classifyBoneDensity,
  classifyClinicalResult,
  classifyFastingGlucose,
  classifyHba1c,
  classifyHemoglobin,
  classifyHeartRate,
  classifyRandomGlucose,
  classifyTwoHourGlucose,
  clinicalToneClass,
  clinicalToneLabel,
  parseBloodPressure,
  resultStatusClass,
  resultStatusLabel,
  resultStatusTone,
  toClinicalSex,
  type ClinicalTone,
} from "./clinical-classification.ts";
import {
  NORMAL_RANGES,
  REPORT_BP_TEST_ID,
  REPORT_DEMOGRAPHIC_VITAL_TEST_IDS,
  REPORT_LAB_TEST_IDS,
  buildHealthScreeningReportData,
  demoReportData,
  getAvailableReportTests,
  type ScreeningTestRecord,
} from "./patient-report-data.ts";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const tone = (value: number | null | undefined, testId: string, sex?: "male" | "female" | "unknown", ageYears?: number): ClinicalTone =>
  classifyClinicalResult({ testId, value, sex, ageYears }).tone;

/* ------------------------------------------------------------------ *
 * Tone model
 * ------------------------------------------------------------------ */

test("every tone has one class, one screen-reader phrase and one legacy status", () => {
  assert.equal(clinicalToneClass("normal"), "rp-result--normal");
  assert.equal(clinicalToneClass("mild-moderate"), "rp-result--mild-moderate");
  assert.equal(clinicalToneClass("abnormal"), "rp-result--abnormal");
  assert.equal(clinicalToneClass("neutral"), "rp-result--neutral");
  assert.equal(clinicalToneClass(undefined), "rp-result--neutral");

  assert.equal(resultStatusClass("normal"), "rp-result--normal");
  assert.equal(resultStatusClass("low"), "rp-result--mild-moderate");
  assert.equal(resultStatusClass("high"), "rp-result--abnormal");
  assert.equal(resultStatusClass("info"), "rp-result--neutral");
  assert.equal(resultStatusClass(undefined), "rp-result--neutral");

  assert.equal(resultStatusTone("low"), "mild-moderate");
  assert.equal(resultStatusTone("high"), "abnormal");
  assert.equal(resultStatusTone("info"), "neutral");

  assert.equal(resultStatusLabel("normal"), "within the reference interval");
  assert.equal(resultStatusLabel("low"), "in an intermediate clinical range");
  assert.equal(resultStatusLabel("high"), "abnormal");
  assert.equal(resultStatusLabel("info"), "not classified");
  assert.equal(clinicalToneLabel("mild-moderate"), "in an intermediate clinical range");
});

test("a missing or unparseable result is never given a colour", () => {
  for (const testId of ["Hemoglobin", "FBS", "PPBS", "OGTT", "RBG", "HbA1c", "Heart Rate", "BP", "Bone Density (T Score)"]) {
    assert.equal(tone(null, testId), "neutral", testId);
    assert.equal(tone(undefined, testId), "neutral", testId);
    assert.equal(tone(Number.NaN, testId), "neutral", testId);
  }
});

test("sex is only derived from an explicit recorded value", () => {
  assert.equal(toClinicalSex("Male"), "male");
  assert.equal(toClinicalSex("female"), "female");
  assert.equal(toClinicalSex("M"), "male");
  assert.equal(toClinicalSex("F"), "female");
  assert.equal(toClinicalSex(""), "unknown");
  assert.equal(toClinicalSex(null), "unknown");
  assert.equal(toClinicalSex("Other"), "unknown");
});

/* ------------------------------------------------------------------ *
 * Hemoglobin - WHO reference interval and severity
 * ------------------------------------------------------------------ */

test("hemoglobin: male adult reference interval and WHO severity bands", () => {
  assert.equal(tone(18, "Hemoglobin", "male"), "normal");
  assert.equal(tone(13, "Hemoglobin", "male"), "normal");
  assert.equal(tone(12.9, "Hemoglobin", "male"), "mild-moderate");
  assert.equal(tone(11, "Hemoglobin", "male"), "mild-moderate");
  assert.equal(tone(10.9, "Hemoglobin", "male"), "abnormal");
  assert.equal(tone(8, "Hemoglobin", "male"), "abnormal");
  assert.equal(tone(7.9, "Hemoglobin", "male"), "abnormal");
  assert.equal(tone(18.1, "Hemoglobin", "male"), "abnormal");
  assert.equal(classifyHemoglobin(11.5, { sex: "male" }).label, "Mild anemia");
  assert.equal(classifyHemoglobin(9, { sex: "male" }).label, "Moderate anemia");
  assert.equal(classifyHemoglobin(6, { sex: "male" }).label, "Severe anemia");
  assert.equal(classifyHemoglobin(19, { sex: "male" }).label, "Above reference interval");
});

test("hemoglobin: female adult reference interval and WHO severity bands", () => {
  assert.equal(tone(16, "Hemoglobin", "female"), "normal");
  assert.equal(tone(12, "Hemoglobin", "female"), "normal");
  assert.equal(tone(11.9, "Hemoglobin", "female"), "mild-moderate");
  assert.equal(tone(11, "Hemoglobin", "female"), "mild-moderate");
  assert.equal(tone(10.9, "Hemoglobin", "female"), "abnormal");
  assert.equal(tone(8, "Hemoglobin", "female"), "abnormal");
  assert.equal(tone(7.9, "Hemoglobin", "female"), "abnormal");
  assert.equal(tone(16.1, "Hemoglobin", "female"), "abnormal");
});

test("hemoglobin: a female value is never graded against the male interval", () => {
  // 12.5 g/dL is normal for a woman (12-16) and mild anemia for a man (13-18).
  assert.equal(tone(12.5, "Hemoglobin", "female"), "normal");
  assert.equal(tone(12.5, "Hemoglobin", "male"), "mild-moderate");
  // 17 g/dL is normal for a man and above the interval for a woman.
  assert.equal(tone(17, "Hemoglobin", "male"), "normal");
  assert.equal(tone(17, "Hemoglobin", "female"), "abnormal");
});

test("hemoglobin: unknown sex only uses the bands that apply to both sexes", () => {
  assert.equal(tone(13, "Hemoglobin", "unknown"), "normal");
  assert.equal(tone(16, "Hemoglobin", "unknown"), "normal");
  assert.equal(tone(11.5, "Hemoglobin", "unknown"), "mild-moderate");
  assert.equal(tone(9, "Hemoglobin", "unknown"), "abnormal");
  assert.equal(tone(7, "Hemoglobin", "unknown"), "abnormal");
  // Sex-dependent bands stay neutral rather than borrowing another sex's interval.
  assert.equal(tone(12.4, "Hemoglobin", "unknown"), "neutral");
  assert.equal(tone(17.2, "Hemoglobin", "unknown"), "neutral");
  // Above the higher of the two upper limits it is outside the interval for
  // either sex, so it no longer depends on the missing sex.
  assert.equal(tone(18, "Hemoglobin", "unknown"), "neutral");
  assert.equal(tone(18.1, "Hemoglobin", "unknown"), "abnormal");
  assert.equal(tone(19.5, "Hemoglobin", "unknown"), "abnormal");
  assert.equal(classifyHemoglobin(12.4, { sex: "unknown" }).basis, classifyHemoglobin(12.4, {}).basis);
  assert.match(classifyHemoglobin(12.4, { sex: "unknown" }).basis, /sex was not recorded/);
  assert.match(classifyHemoglobin(19, { sex: "unknown" }).basis, /either sex/);
});

test("hemoglobin: a child is only reported against this application's paediatric interval", () => {
  assert.equal(tone(12, "Hemoglobin", "male", 8), "normal");
  assert.equal(tone(11, "Hemoglobin", "male", 8), "normal");
  assert.equal(tone(10.9, "Hemoglobin", "male", 8), "abnormal");
  assert.equal(tone(14.1, "Hemoglobin", "male", 8), "abnormal");
  // No adult anemia grade is applied to a child.
  assert.equal(classifyHemoglobin(9, { sex: "male", ageYears: 8 }).label, "Below reference interval");
});

test("hemoglobin: every basis sentence names the threshold it used", () => {
  assert.match(classifyHemoglobin(10.9, { sex: "female" }).basis, /WHO/);
  assert.match(classifyHemoglobin(11.5, { sex: "male" }).basis, /11/);
  assert.match(classifyHemoglobin(14, { sex: "male" }).basis, /13-18 g\/dL/);
});

/* ------------------------------------------------------------------ *
 * Glucose - ADA 2025
 * ------------------------------------------------------------------ */

test("fasting glucose: ADA 100 / 126 decision limits", () => {
  assert.equal(tone(69.9, "FBS"), "abnormal");
  assert.equal(tone(70, "FBS"), "normal");
  assert.equal(tone(99, "FBS"), "normal");
  assert.equal(tone(100, "FBS"), "mild-moderate");
  assert.equal(tone(125, "FBS"), "mild-moderate");
  assert.equal(tone(126, "FBS"), "abnormal");
  assert.equal(classifyFastingGlucose(110).label, "Prediabetes range");
  assert.equal(classifyFastingGlucose(140).label, "Diabetes range");
  assert.equal(classifyFastingGlucose(65).label, "Below reference interval");
  assert.match(classifyFastingGlucose(140).basis, /not a diagnosis/);
});

test("two-hour glucose: ADA 140 / 200 decision limits for PPBS and OGTT", () => {
  for (const testId of ["PPBS", "OGTT"]) {
    assert.equal(tone(69.9, testId), "abnormal", testId);
    assert.equal(tone(70, testId), "normal", testId);
    assert.equal(tone(139, testId), "normal", testId);
    assert.equal(tone(140, testId), "mild-moderate", testId);
    assert.equal(tone(199, testId), "mild-moderate", testId);
    assert.equal(tone(200, testId), "abnormal", testId);
    assert.equal(tone(300, testId), "abnormal", testId);
  }
  assert.equal(classifyTwoHourGlucose(150).label, "Impaired glucose tolerance");
  assert.match(classifyTwoHourGlucose(150).basis, /prediabetes/);
});

test("random glucose: a diabetes-range value is flagged for confirmation, never called diabetes", () => {
  assert.equal(tone(69.9, "RBG"), "abnormal");
  assert.equal(tone(70, "RBG"), "normal");
  assert.equal(tone(139, "RBG"), "normal");
  assert.equal(tone(140, "RBG"), "mild-moderate");
  assert.equal(tone(199, "RBG"), "mild-moderate");
  // >=200 meets the ADA number but not the ADA criterion: no symptoms are recorded.
  assert.equal(tone(200, "RBG"), "mild-moderate");
  assert.equal(tone(312, "RBG"), "mild-moderate");
  assert.equal(classifyRandomGlucose(250).label, "Diabetes-range (confirm)");
  assert.match(classifyRandomGlucose(250).basis, /classic hyperglycemic symptoms/);
  assert.match(classifyRandomGlucose(250).basis, /not.*diagnos|confirmatory/i);
});

test("random glucose: the printed 70-110 interval and the colour cannot disagree", () => {
  // Inside the printed laboratory interval.
  assert.equal(classifyRandomGlucose(70).label, "Within reference interval");
  assert.equal(classifyRandomGlucose(110).label, "Within reference interval");
  // Above it, but below the 140 mg/dL two-hour decision limit: the label says
  // so instead of the tone changing, because a random sample rises after food.
  assert.equal(tone(111, "RBG"), "normal");
  assert.equal(tone(139, "RBG"), "normal");
  assert.equal(classifyRandomGlucose(115).label, "Above lab reference");
  assert.equal(classifyRandomGlucose(139).label, "Above lab reference");
  assert.match(classifyRandomGlucose(115).basis, /expected to rise after food/);
  // The 110 boundary is inclusive in both directions.
  assert.equal(tone(110, "RBG"), "normal");
  assert.equal(classifyRandomGlucose(110).label, "Within reference interval");
  assert.equal(NORMAL_RANGES.RBG, "70\u2013110 mg/dL");
});

test("HbA1c: ADA 5.7 / 6.5 decision limits and a data-quality guard", () => {
  assert.equal(tone(4, "HbA1c"), "normal");
  assert.equal(tone(5.6, "HbA1c"), "normal");
  assert.equal(tone(5.7, "HbA1c"), "mild-moderate");
  assert.equal(tone(6.4, "HbA1c"), "mild-moderate");
  assert.equal(tone(6.5, "HbA1c"), "abnormal");
  assert.equal(tone(14, "HbA1c"), "abnormal");
  // Not plausible for a reporting method: unclassified, never graded.
  assert.equal(tone(35, "HbA1c"), "neutral");
  assert.equal(tone(20.5, "HbA1c"), "neutral");
  assert.equal(tone(1.9, "HbA1c"), "neutral");
  assert.match(classifyHba1c(35).basis, /verified/);
});

/* ------------------------------------------------------------------ *
 * Heart rate and blood pressure
 * ------------------------------------------------------------------ */

test("heart rate: 60-100 bpm adult range, no invented amber tier", () => {
  assert.equal(tone(59, "Heart Rate"), "abnormal");
  assert.equal(tone(60, "Heart Rate"), "normal");
  assert.equal(tone(100, "Heart Rate"), "normal");
  assert.equal(tone(101, "Heart Rate"), "abnormal");
  assert.equal(tone(40, "Heart Rate"), "abnormal");
  assert.equal(classifyHeartRate(55).label, "Below reference interval");
  assert.match(classifyHeartRate(120).basis, /tachycardia/);
  // A child is not graded against the adult interval.
  assert.equal(tone(70, "Heart Rate", "male", 10), "neutral");
  assert.match(classifyHeartRate(70, { ageYears: 10 }).basis, /under 18/);
});

test("blood pressure: 2017 ACC/AHA categories, evaluated jointly", () => {
  assert.equal(classifyBloodPressure(118, 70).tone, "normal");
  assert.equal(classifyBloodPressure(119, 79).tone, "normal");
  assert.equal(classifyBloodPressure(120, 70).tone, "mild-moderate");
  assert.equal(classifyBloodPressure(129, 79).tone, "mild-moderate");
  assert.equal(classifyBloodPressure(130, 79).tone, "mild-moderate");
  assert.equal(classifyBloodPressure(120, 80).tone, "mild-moderate");
  assert.equal(classifyBloodPressure(139, 89).tone, "mild-moderate");
  assert.equal(classifyBloodPressure(140, 89).tone, "abnormal");
  assert.equal(classifyBloodPressure(139, 90).tone, "abnormal");
  assert.equal(classifyBloodPressure(159, 99).tone, "abnormal");
  assert.equal(classifyBloodPressure(89, 59).tone, "abnormal");
  assert.equal(classifyBloodPressure(180, 120).tone, "abnormal");
});

test("blood pressure: the higher category wins when the two values disagree", () => {
  // 145 systolic with a normal diastolic is still stage 2, not "normal".
  assert.equal(classifyBloodPressure(145, 70).label, "Stage 2 hypertension range");
  // 132/95 is stage 2 because of the diastolic, not stage 1.
  assert.equal(classifyBloodPressure(132, 95).label, "Stage 2 hypertension range");
  assert.equal(classifyBloodPressure(125, 85).label, "Stage 1 hypertension range");
  assert.equal(classifyBloodPressure(200, 70).label, "Severe hypertension range");
  assert.equal(classifyBloodPressure(110, 125).label, "Severe hypertension range");
});

test("blood pressure: the crisis boundary is strictly greater than 180/120", () => {
  // The AHA chart and the 2017 ACC/AHA guideline both read "higher than 180
  // and/or higher than 120", so exactly 180/120 is still stage 2.
  assert.equal(classifyBloodPressure(180, 120).label, "Stage 2 hypertension range");
  assert.equal(classifyBloodPressure(180, 119).label, "Stage 2 hypertension range");
  assert.equal(classifyBloodPressure(179, 120).label, "Stage 2 hypertension range");
  // One step above the boundary is the crisis range.
  assert.equal(classifyBloodPressure(181, 120).label, "Severe hypertension range");
  assert.equal(classifyBloodPressure(180, 121).label, "Severe hypertension range");
  assert.equal(classifyBloodPressure(200, 100).label, "Severe hypertension range");
});

test("blood pressure: a low value never masks a high one, and the conflict is stated", () => {
  // 80/130 is outside the interval on both sides; the urgent high diastolic wins.
  assert.equal(classifyBloodPressure(80, 130).label, "Severe hypertension range");
  assert.equal(classifyBloodPressure(80, 100).label, "Stage 2 hypertension range");
  assert.equal(classifyBloodPressure(85, 125).label, "Severe hypertension range");
  assert.equal(classifyBloodPressure(135, 55).label, "Stage 1 hypertension range");
  // The other half of the reading is still reported so a reviewer sees it.
  assert.match(classifyBloodPressure(85, 125).basis, /other value is also below the reference limit/);
  assert.match(classifyBloodPressure(200, 50).basis, /other value is also below the reference limit/);
  assert.doesNotMatch(classifyBloodPressure(145, 70).basis, /other value is also below/);
  // A purely low reading keeps the reference-interval label.
  assert.equal(classifyBloodPressure(85, 55).label, "Below reference interval");
});

test("blood pressure: labels and basis state that one reading is not a diagnosis", () => {
  assert.equal(classifyBloodPressure(135, 85).label, "Stage 1 hypertension range");
  assert.match(classifyBloodPressure(135, 85).basis, /repeat/);
  assert.equal(classifyBloodPressure(118, 76).label, "Within reference interval");
  assert.equal(classifyBloodPressure(85, 55).label, "Below reference interval");
  assert.equal(classifyBloodPressure(120, null).tone, "neutral");
  assert.equal(classifyBloodPressure(null, 80).tone, "neutral");
});

test("blood pressure: combined readings are parsed and unparseable text stays neutral", () => {
  assert.deepEqual(parseBloodPressure("138/86"), { systolic: 138, diastolic: 86 });
  assert.equal(parseBloodPressure("garbage"), null);
  assert.equal(parseBloodPressure("138"), null);
  assert.equal(parseBloodPressure(""), null);
  assert.equal(parseBloodPressure(null), null);
  assert.equal(
    classifyClinicalResult({ testId: "BP", value: 138, secondaryValue: 86 }).label,
    "Stage 1 hypertension range",
  );
});

/* ------------------------------------------------------------------ *
 * Bone density, and tests with no defensible threshold
 * ------------------------------------------------------------------ */

test("bone density: unchanged ISCD classification", () => {
  assert.equal(tone(2.1, "Bone Density (T Score)"), "normal");
  assert.equal(tone(-1, "Bone Density (T Score)"), "normal");
  assert.equal(tone(-1.01, "Bone Density (T Score)"), "mild-moderate");
  assert.equal(tone(-2.5, "Bone Density (T Score)"), "mild-moderate");
  assert.equal(tone(-2.51, "Bone Density (T Score)"), "abnormal");
  assert.equal(classifyBoneDensity(-0.5).label, "Normal");
  assert.equal(classifyBoneDensity(-1.8).label, "Osteopenia");
  assert.equal(classifyBoneDensity(-3.2).label, "Osteoporosis");
});

test("FEV and Target Weight stay neutral instead of being given a guessed colour", () => {
  for (const value of [2.4, 3.1, 8.65, 106]) {
    assert.equal(tone(value, "FEV"), "neutral", String(value));
  }
  assert.match(classifyClinicalResult({ testId: "FEV", value: 3.1 }).basis, /predicted/);
  assert.equal(tone(72, "Target Weight"), "neutral");
  assert.match(classifyClinicalResult({ testId: "Target Weight", value: 72 }).basis, /clinician/);
  // Any other analyte the station may add is unclassified by default.
  assert.equal(tone(5.8, "Uric Acid"), "neutral");
  assert.equal(tone(178, "Total Cholesterol (TC)"), "neutral");
});

/* ------------------------------------------------------------------ *
 * Reference text never contradicts the colour
 * ------------------------------------------------------------------ */

test("displayed reference intervals state the same decision limits the classifier uses", () => {
  assert.match(NORMAL_RANGES.FBS, /100.125 mg\/dL/);
  assert.match(NORMAL_RANGES.FBS, /126 mg\/dL/);
  assert.match(NORMAL_RANGES.HbA1c, /5.7.6.4%/);
  assert.match(NORMAL_RANGES.HbA1c, /6.5%/);
  // The old wording called the 5.7-6.4% band "diabetes prone".
  assert.doesNotMatch(NORMAL_RANGES.HbA1c, /Diab\.?\s*Prone/i);
  assert.match(NORMAL_RANGES.PPBS, /<140 mg\/dL/);
  assert.match(NORMAL_RANGES.PPBS, /200 mg\/dL/);
  assert.match(NORMAL_RANGES.OGTT, /<140 mg\/dL/);
  // The Blood Pressure text used to contradict the classification (JNC7 staging).
  assert.match(NORMAL_RANGES.BP, /Stage 1: 130.139 or 80.89 mmHg/);
  assert.match(NORMAL_RANGES.BP, /Stage 2: .140 or .90 mmHg/);
  assert.doesNotMatch(NORMAL_RANGES.BP, /Pre-HTN/);
  // Every printed interval must stay short: the table already sits at the
  // single-page limit, so no reference text may grow to a fourth line.
  for (const [test, range] of Object.entries(NORMAL_RANGES)) {
    const lines = range.split("\n").length;
    assert.ok(lines <= 4, `${test} reference text is ${lines} lines`);
  }
  // Hemoglobin keeps all four bands on three lines.
  assert.match(NORMAL_RANGES.Hemoglobin, /Women: 12.16 . Men: 13.18 g\/dL/);
  assert.match(NORMAL_RANGES.Hemoglobin, /Children: 11.14 g\/dL/);
  assert.match(NORMAL_RANGES.Hemoglobin, /Pregnant: 11.14 g\/dL/);
});

/* ------------------------------------------------------------------ *
 * Report rows
 * ------------------------------------------------------------------ */

const patient = {
  id: "HSC-P-00127",
  name: "Aarav Sharma",
  dob: "2002-09-25",
  age: 99,
  gender: "Male",
};

const record = (test_type: string, value_numeric: number | null, unit: string | null = null): ScreeningTestRecord => ({
  test_type,
  value_numeric,
  value_text: null,
  unit,
  created_at: "2026-09-25T02:00:00Z",
});

test("every report row carries a tone, a short label and a full basis", () => {
  const records = [
    record("Hemoglobin", 10.4, "g/dL"),
    record("FBS", 132, "mg/dL"),
    record("HbA1c", 7.1, "%"),
    record("PPBS", 210, "mg/dL"),
    record("OGTT", 150, "mg/dL"),
    record("RBG", 250, "mg/dL"),
    record("Heart Rate", 72, "/min"),
    record("FEV", 3.1, "L"),
    record("Target Weight", 72, "kg"),
    record("Bone Density (T Score)", -1.8),
    record("Systolic", 132, null),
    record("Diastolic", 86, null),
    record("Temperature", 36.8, "\u00b0C"),
    record("SpO2", 98, "%"),
  ];
  const rows = buildHealthScreeningReportData(patient, records, "2026-09-25").laboratoryResults;
  for (const row of rows) {
    assert.ok(row.tone, `${row.test} has no tone`);
    assert.ok(row.interpretation, `${row.test} has no visible interpretation`);
    assert.ok(row.basis && row.basis.length > 10, `${row.test} has no basis`);
    assert.equal(typeof row.result, "string");
  }
  const byTest = (name: string) => rows.find((r) => r.test === name);
  assert.equal(byTest("Hemoglobin (Hb)")?.tone, "abnormal");
  assert.equal(byTest("Fasting Blood Sugar (FBS)")?.tone, "abnormal");
  assert.equal(byTest("Glycated Hemoglobin (HbA1c)")?.tone, "abnormal");
  assert.equal(byTest("Post-Prandial Blood Sugar (PPBS)")?.tone, "abnormal");
  assert.equal(byTest("Oral Glucose Tolerance Test (OGTT)")?.tone, "mild-moderate");
  assert.equal(byTest("Random Blood Glucose (RBS)")?.tone, "mild-moderate");
  assert.equal(byTest("Forced Expiratory Volume (FEV1)")?.tone, "neutral");
  assert.equal(byTest("Target Weight")?.tone, "neutral");
  assert.equal(byTest("Bone Density (T Score)")?.interpretation, "Osteopenia");
  assert.equal(byTest("Blood Pressure")?.tone, "mild-moderate");
  // Vitals are never laboratory rows.
  assert.equal(rows.some((r) => r.test.includes("Temperature") || r.test.includes("Oxygen")), false);
});

test("report rows use the patient's recorded sex and DOB-derived age", () => {
  const records = [record("Hemoglobin", 12.5, "g/dL")];
  const male = buildHealthScreeningReportData({ ...patient, gender: "Male" }, records, "2026-09-25");
  const female = buildHealthScreeningReportData({ ...patient, gender: "Female" }, records, "2026-09-25");
  assert.equal(male.laboratoryResults[0].tone, "mild-moderate");
  assert.equal(female.laboratoryResults[0].tone, "normal");
  assert.equal(male.laboratoryResults[0].basis, male.laboratoryResults[0].basis);

  // A paediatric DOB is classified against the paediatric interval, not the adult one.
  const child = buildHealthScreeningReportData({ ...patient, dob: "2018-01-01" }, [record("Hemoglobin", 11.2, "g/dL")], "2026-09-25");
  assert.equal(child.laboratoryResults[0].tone, "normal");
  assert.equal(child.patient.age, 8);
});

test("demo rows are classified by the same rules; demo-only analytes are neutral", () => {
  const rows = demoReportData().laboratoryResults;
  const byTest = (name: string) => rows.find((r) => r.test === name);
  assert.equal(byTest("Hemoglobin (Hb)")?.tone, "normal");
  assert.equal(byTest("Fasting Blood Sugar (FBS)")?.tone, "normal");
  assert.equal(byTest("Post-Prandial Blood Sugar (PPBS)")?.tone, "normal");
  assert.equal(byTest("Bone Density (T Score)")?.tone, "mild-moderate");
  assert.equal(byTest("Bone Density (T Score)")?.interpretation, "Osteopenia");
  assert.equal(byTest("Blood Pressure")?.tone, "mild-moderate");
  assert.equal(byTest("Blood Pressure")?.interpretation, "Stage 1 hypertension range");
  assert.equal(byTest("Forced Expiratory Volume (FEV1)")?.tone, "neutral");
  assert.equal(byTest("Target Weight")?.tone, "neutral");
  for (const name of [
    "Total Cholesterol (TC)",
    "Triglycerides (TG)",
    "HDL Cholesterol",
    "LDL Cholesterol",
    "Serum Creatinine",
    "Uric Acid",
    "Vitamin D (25-OH)",
  ]) {
    assert.equal(byTest(name)?.tone, "neutral", name);
    assert.equal(byTest(name)?.interpretation, "Not classified", name);
  }
});

/* ------------------------------------------------------------------ *
 * Regression guards: nothing silently omitted, one classification
 * ------------------------------------------------------------------ */

const repoFile = (relative: string): string =>
  readFileSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", relative), "utf8");

test("every test type the station can record is accounted for by the report", () => {
  const stationSource = repoFile("app/station/page.tsx");
  const block = stationSource.slice(stationSource.indexOf("const TEST_TYPES"));
  const stationTypes = [...block.matchAll(/value:\s*"([^"]+)"/g)].map((m) => m[1]);
  assert.ok(stationTypes.length >= 10, `expected the station test list, found ${stationTypes.length}`);

  const known = new Set<string>([...REPORT_LAB_TEST_IDS, REPORT_BP_TEST_ID, "Counseling", "Systolic", "Diastolic"]);
  for (const type of stationTypes) {
    assert.ok(known.has(type), `station test "${type}" has no report row and no classification`);
  }
  // And nothing is classified that the station cannot record.
  for (const id of [...REPORT_LAB_TEST_IDS, REPORT_BP_TEST_ID]) {
    assert.ok(
      stationTypes.includes(id) || id === REPORT_BP_TEST_ID,
      `report row "${id}" is not a station test type`,
    );
  }
});

test("every reportable id is explicitly handled: no silent neutral fall-through", () => {
  // A plausible measured value must never quietly land on NEUTRAL because
  // nobody wrote a rule for it. FEV and Target Weight are the only laboratory
  // rows allowed to stay neutral, and only because their stored data cannot
  // support a threshold.
  const mayBeNeutral = new Set(["FEV", "Target Weight", ...REPORT_DEMOGRAPHIC_VITAL_TEST_IDS]);
  // One physiologically plausible probe value per test, in its stored unit.
  const probe: Record<string, number> = {
    Hemoglobin: 13.5,
    RBG: 95,
    FBS: 92,
    PPBS: 130,
    OGTT: 120,
    HbA1c: 5.4,
    "Heart Rate": 76,
    "Bone Density (T Score)": -0.4,
    [REPORT_BP_TEST_ID]: 118,
  };
  for (const id of [...REPORT_LAB_TEST_IDS, REPORT_BP_TEST_ID]) {
    if (mayBeNeutral.has(id)) continue;
    const classification = classifyClinicalResult({
      testId: id,
      value: probe[id],
      secondaryValue: 78,
      sex: "male",
      ageYears: 30,
    });
    assert.notEqual(classification.tone, "neutral", `${id} fell through to neutral for a plausible value`);
    assert.match(classification.basis, /\S/, `${id} produced an empty basis`);
  }
  // The two documented exceptions state why, by name.
  assert.match(classifyClinicalResult({ testId: "FEV", value: 3.1 }).basis, /FEV/);
  assert.match(classifyClinicalResult({ testId: "Target Weight", value: 70 }).basis, /Target Weight|weight/i);
});

test("vitals are never offered as laboratory tests and never classified", () => {
  assert.deepEqual([...REPORT_DEMOGRAPHIC_VITAL_TEST_IDS], ["Temperature", "SpO2"]);
  for (const id of REPORT_DEMOGRAPHIC_VITAL_TEST_IDS) {
    assert.equal(classifyClinicalResult({ testId: id, value: 98 }).tone, "neutral", id);
    assert.equal(classifyClinicalResult({ testId: id, value: 36.8 }).tone, "neutral", id);
  }
  const rows = buildHealthScreeningReportData(patient, [record("Temperature", 98, "°C"), record("SpO2", 99, "%")], "2026-09-25");
  assert.equal(rows.laboratoryResults.length, 0);
  assert.equal(rows.patient.temperature, "98 °C");
  assert.equal(rows.patient.spo2, "99 %");
  assert.equal(
    getAvailableReportTests([record("Temperature", 98, "°C"), record("SpO2", 99, "%")]).length,
    0,
  );
});

test("the QR online report and the print/PDF page share one classification layer", () => {
  // Both surfaces must build rows with the same function and render the same
  // component, so a colour can never be decided twice or differently.
  for (const page of ["app/report/[token]/page.tsx", "app/report/print/page.tsx"]) {
    const source = repoFile(page);
    assert.match(source, /buildHealthScreeningReportData\(/, `${page} does not use the shared report builder`);
    assert.match(source, /PatientHealthScreeningReport/, `${page} does not render the shared report component`);
  }
  // The PDF is a print of that same page, not a second implementation.
  assert.match(repoFile("app/api/report-pdf/route.ts"), /\/report\/print\?token=/);
  // Selection travels in the signed token, so a PDF honours the same rows.
  assert.match(repoFile("app/api/report-pdf/route.ts"), /payload\.includedTests/);
});

test("a report row's tone is a pure function of the stored value and the patient", () => {
  const records = [
    record("Hemoglobin", 11.4, "g/dL"),
    record("FBS", 118, "mg/dL"),
    record("HbA1c", 6.1, "%"),
    record("PPBS", 160, "mg/dL"),
    record("OGTT", 190, "mg/dL"),
    record("RBG", 205, "mg/dL"),
    record("Heart Rate", 104, "/min"),
    record("Systolic", 182, null),
    record("Diastolic", 121, null),
  ];
  const first = buildHealthScreeningReportData(patient, records, "2026-09-25").laboratoryResults;
  const second = buildHealthScreeningReportData(patient, records, "2026-09-25").laboratoryResults;
  assert.deepEqual(first, second, "the same stored data must always produce the same rows");
  const byTest = (name: string) => first.find((r) => r.test === name);
  // Every interpretation below is one a pharmacist can act on, and none of them
  // claims a diagnosis.
  assert.equal(byTest("Hemoglobin (Hb)")?.tone, "mild-moderate");
  assert.equal(byTest("Hemoglobin (Hb)")?.interpretation, "Mild anemia");
  assert.equal(byTest("Fasting Blood Sugar (FBS)")?.interpretation, "Prediabetes range");
  assert.equal(byTest("Glycated Hemoglobin (HbA1c)")?.interpretation, "Prediabetes range");
  assert.equal(byTest("Post-Prandial Blood Sugar (PPBS)")?.interpretation, "Impaired glucose tolerance");
  assert.equal(byTest("Oral Glucose Tolerance Test (OGTT)")?.tone, "mild-moderate");
  assert.equal(byTest("Random Blood Glucose (RBS)")?.interpretation, "Diabetes-range (confirm)");
  assert.equal(byTest("Heart Rate")?.tone, "abnormal");
  assert.equal(byTest("Blood Pressure")?.interpretation, "Severe hypertension range");
  for (const row of first) {
    assert.doesNotMatch(row.interpretation || "", /diagnos(is|ed|tic) of/i, row.test);
  }
});

/* ------------------------------------------------------------------ *
 * Printed-legibility guards
 *
 * Colour is the only cue carrying a result, so the four tones must stay
 * readable on the paper the report actually prints on, and the standing
 * note must not cost a second page.
 * ------------------------------------------------------------------ */

const reportCss = (): string => repoFile("components/reports/report.css");

const cssToken = (css: string, name: string): string => {
  const match = css.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`));
  assert.ok(match, `--${name} is not defined in report.css`);
  return match[1].toLowerCase();
};

const relativeLuminance = (hex: string): number => {
  const channel = (offset: number) => {
    const c = parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
};

const contrastRatio = (a: string, b: string): number => {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

test("every clinical tone meets WCAG AA on the printed table background", () => {
  const css = reportCss();
  // The result value is 10.5pt bold and the interpretation 8.5pt, so neither
  // reaches the 14pt-bold "large text" exemption: 4.5:1 is required.
  const tableBackground = cssToken(css, "report-white");
  const toneTokens: Array<[ClinicalTone, string]> = [
    ["normal", "report-status-normal"],
    ["mild-moderate", "report-status-low"],
    ["abnormal", "report-status-high"],
    ["neutral", "report-status-neutral"],
  ];
  for (const [toneName, tokenName] of toneTokens) {
    // The class the component actually prints must be the token being measured.
    assert.match(
      css,
      new RegExp(`\\.${clinicalToneClass(toneName)}\\s*\\{[^}]*color:\\s*var\\(--${tokenName}\\)`),
      `${clinicalToneClass(toneName)} does not use --${tokenName}`,
    );
    const ratio = contrastRatio(cssToken(css, tokenName), tableBackground);
    assert.ok(
      ratio >= 4.5,
      `--${tokenName} (${cssToken(css, tokenName)}) is ${ratio.toFixed(2)}:1 on ${tableBackground}, below the 4.5:1 minimum`,
    );
  }
});

test("the standing safety note is no longer printed anywhere in the report", () => {
  // The footer disclaimer was removed from the printed sheet. The non-diagnosis
  // framing now lives only in each result's own `basis` sentence, so nothing may
  // reintroduce the old shared footnote into any report surface.
  const surfaces = [
    "components/reports/ReportFooter.tsx",
    "components/reports/ReportLaboratoryResults.tsx",
    "components/reports/PatientHealthScreeningReport.tsx",
  ];
  for (const file of surfaces) {
    assert.doesNotMatch(
      repoFile(file),
      /rp-footer-note|Colours follow published screening thresholds/i,
      `${file} still prints the retired standing safety note`,
    );
  }

  // The retired constant must not linger as dead code either.
  for (const file of [
    "lib/reports/clinical-classification.ts",
    "lib/reports/patient-report-data.ts",
  ]) {
    assert.doesNotMatch(
      repoFile(file),
      /CLINICAL_INTERPRETATION_NOTE/,
      `${file} still declares the retired CLINICAL_INTERPRETATION_NOTE`,
    );
  }
});

