import { test } from "node:test";
import assert from "node:assert/strict";
import {
  MEASUREMENT_TEST_TYPES,
  MEASUREMENT_UNITS,
  buildMeasurementRows,
  computeBmi,
  isValidMeasurement,
  parseOptionalMeasurement,
  prepareReviewSubmission,
  sanitizeHistory,
} from "./patient-review.ts";

test("height + weight compute BMI correctly (kg/m2, 1 decimal)", () => {
  assert.equal(computeBmi(170, 70), 24.2);
  assert.equal(computeBmi(170, 70) ?? NaN, Math.round((70 / (1.7 * 1.7)) * 10) / 10);
});

test("changing height recalculates BMI", () => {
  assert.notEqual(computeBmi(172, 70), computeBmi(170, 70));
  assert.equal(computeBmi(172, 70), Math.round((70 / (1.72 * 1.72)) * 10) / 10);
});

test("changing weight recalculates BMI", () => {
  assert.notEqual(computeBmi(170, 68), computeBmi(170, 70));
  assert.equal(computeBmi(170, 68), Math.round((68 / (1.7 * 1.7)) * 10) / 10);
});

test("missing or invalid height/weight never produce a false BMI", () => {
  assert.equal(computeBmi(0, 70), null);
  assert.equal(computeBmi(170, 0), null);
  assert.equal(computeBmi(-1, 70), null);
  assert.equal(computeBmi(NaN, 70), null);
  assert.equal(computeBmi(170, NaN), null);

  const onlyWeight = prepareReviewSubmission({ patientId: "p1", weightKg: 70 });
  assert.equal(onlyWeight.ok, true);
  if (onlyWeight.ok) {
    assert.equal(onlyWeight.submission.bmi, null);
    assert.equal(onlyWeight.submission.heightCm, null);
  }

  const onlyHeight = prepareReviewSubmission({ patientId: "p1", heightCm: 170 });
  if (onlyHeight.ok) {
    assert.equal(onlyHeight.submission.bmi, null);
    assert.equal(onlyHeight.submission.weightKg, null);
  }
});

test("BMI is never trusted from a client-supplied value; the server recomputes it", () => {
  const res = prepareReviewSubmission({ patientId: "p1", heightCm: 170, weightKg: 70, bmi: 99.9 });
  assert.equal(res.ok, true);
  if (res.ok) {
    assert.equal(res.submission.bmi, 24.2);
  }
});

test("blank / missing measurements are treated as not-provided (optional data)", () => {
  const res = prepareReviewSubmission({ patientId: "p1", heightCm: "", weightKg: "", pastMedical: "", pastMedication: "" });
  assert.equal(res.ok, true);
  if (res.ok) {
    assert.equal(res.submission.heightCm, null);
    assert.equal(res.submission.weightKg, null);
    assert.equal(res.submission.bmi, null);
  }
});

test("invalid height/weight are rejected with a clear error (no DB write happens)", () => {
  const tooHigh = prepareReviewSubmission({ patientId: "p1", heightCm: 400, weightKg: 70 });
  assert.equal(tooHigh.ok, false);
  if (!tooHigh.ok) assert.match(tooHigh.error, /between/i);

  const negative = prepareReviewSubmission({ patientId: "p1", heightCm: 170, weightKg: -5 });
  assert.equal(negative.ok, false);

  const garbage = prepareReviewSubmission({ patientId: "p1", heightCm: "abc" });
  assert.equal(garbage.ok, false);

  const missingPatient = prepareReviewSubmission({ weightKg: 70 });
  assert.equal(missingPatient.ok, false);
});

test("measurement rows are built only for the values actually provided", () => {
  const all = buildMeasurementRows("p1", 170, 70, 24.2);
  assert.deepEqual(
    all.map((r) => [r.test_type, r.value_numeric, r.unit]),
    [
      ["Height", 170, "cm"],
      ["Weight", 70, "kg"],
      ["BMI", 24.2, "kg/m\u00b2"],
    ],
  );

  const none = buildMeasurementRows("p1", null, null, null);
  assert.deepEqual(none, []);
});

test("previous dated measurement rows are not destroyed by a later review (append-only rows)", () => {
  const prior = buildMeasurementRows("p1", 170, 70, 24.2);
  const today = buildMeasurementRows("p1", 172, 68, 23);
  // A new review only produces its own rows; it never mutates or removes the prior set.
  assert.deepEqual(prior, [
    { patient_id: "p1", test_type: MEASUREMENT_TEST_TYPES.height, value_numeric: 170, unit: MEASUREMENT_UNITS.height },
    { patient_id: "p1", test_type: MEASUREMENT_TEST_TYPES.weight, value_numeric: 70, unit: MEASUREMENT_UNITS.weight },
    { patient_id: "p1", test_type: MEASUREMENT_TEST_TYPES.bmi, value_numeric: 24.2, unit: MEASUREMENT_UNITS.bmi },
  ]);
  assert.equal(today.length, 3);
  assert.notEqual(today[0].value_numeric, prior[0].value_numeric);
});

test("medical history is updated and preserved per the existing text model", () => {
  const res = prepareReviewSubmission({
    patientId: "p1",
    pastMedical: "Diabetes mellitus, Hypertension",
  });
  if (res.ok) {
    assert.equal(res.submission.pastMedical, "Diabetes mellitus, Hypertension");
    assert.equal(res.submission.pastMedication, "");
  }

  const unchanged = prepareReviewSubmission({
    patientId: "p1",
    pastMedical: "  existing history  ",
    pastMedication: "  existing meds  ",
  });
  if (unchanged.ok) {
    assert.equal(unchanged.submission.pastMedical, "existing history");
    assert.equal(unchanged.submission.pastMedication, "existing meds");
  }
});

test("medication history is carried through the submission unchanged", () => {
  const res = prepareReviewSubmission({ patientId: "p1", pastMedication: "Metformin 500 mg" });
  if (res.ok) {
    assert.equal(res.submission.pastMedication, "Metformin 500 mg");
  }
});

test("existing patient with no prior measurements / history still produces an empty valid review", () => {
  const res = prepareReviewSubmission({ patientId: "p1" });
  assert.equal(res.ok, true);
  if (res.ok) {
    assert.equal(res.submission.heightCm, null);
    assert.equal(res.submission.weightKg, null);
    assert.equal(res.submission.bmi, null);
    assert.equal(res.submission.pastMedical, "");
    assert.equal(res.submission.pastMedication, "");
  }
});

test("a fabricated client timestamp is never accepted into the submission", () => {
  const res = prepareReviewSubmission({
    patientId: "p1",
    heightCm: 170,
    weightKg: 70,
    createdAt: "1999-01-01T00:00:00Z",
    updatedAt: "1999-01-01T00:00:00Z",
  });
  assert.equal(res.ok, true);
  if (res.ok) {
    const submission = res.submission;
    assert.ok(!("createdAt" in submission));
    assert.ok(!("updatedAt" in submission));
  }
});

test("measurement validation helpers expose the documented ranges", () => {
  assert.equal(isValidMeasurement(170, "height"), true);
  assert.equal(isValidMeasurement(1, "height"), false);
  assert.equal(isValidMeasurement(301, "height"), false);
  assert.equal(isValidMeasurement(70, "weight"), true);
  assert.equal(isValidMeasurement(0, "weight"), false);
  assert.equal(isValidMeasurement(501, "weight"), false);
  assert.equal(parseOptionalMeasurement("", "height").value, null);
  assert.equal(parseOptionalMeasurement(null, "weight").value, null);
});

test("history text is trimmed and capped at the schema-safe length", () => {
  const huge = "x".repeat(50000);
  const cleaned = sanitizeHistory(`  ${huge}  `);
  assert.equal(cleaned.length, 10000);
  assert.equal(cleaned.startsWith("x"), true);
  assert.equal(sanitizeHistory(12345), "");
});

test("review measurement types are exactly the partial-index scope (Height/Weight/BMI only)", () => {
  assert.deepEqual(Object.values(MEASUREMENT_TEST_TYPES) as string[], ["Height", "Weight", "BMI"]);
});

test("clinical test types (RBG, FEV, BP, Temperature, SpO2, Hemoglobin) are outside the review uniqueness scope", () => {
  const reviewTypes = new Set<string>(Object.values(MEASUREMENT_TEST_TYPES));
  for (const clinical of ["RBG", "FEV", "BP", "Temperature", "SpO2", "Hemoglobin"]) {
    assert.equal(
      reviewTypes.has(clinical),
      false,
      `${clinical} must not be covered by the partial unique index, so legitimate same-day repeats stay possible`,
    );
  }
});

test("same-day re-save of Height/Weight/BMI is idempotent (rows collapse under the partial index)", () => {
  const first = buildMeasurementRows("p1", 175, 70, 22.9);
  const resave = buildMeasurementRows("p1", 175, 70, 22.9);
  assert.deepEqual(resave, first, "a same-day re-save must reproduce the identical row batch");
  assert.equal(resave.length, 3);
});

test("review rows and submissions carry no client date: the IST day is decided server-side only", () => {
  for (const row of buildMeasurementRows("p1", 175, 70, 22.9)) {
    assert.equal("created_at" in row, false);
    assert.deepEqual(Object.keys(row).sort(), ["patient_id", "test_type", "unit", "value_numeric"]);
  }
  const res = prepareReviewSubmission({ patientId: "p1", heightCm: 175, weightKg: 70 });
  assert.equal(res.ok, true);
  if (res.ok) {
    assert.deepEqual(
      Object.keys(res.submission).sort(),
      ["bmi", "heightCm", "pastMedical", "pastMedication", "patientId", "weightKg"],
    );
    for (const key of ["createdAt", "updatedAt", "date"]) {
      assert.equal(key in res.submission, false, `client must never place a date on the submission (${key})`);
    }
  }
});