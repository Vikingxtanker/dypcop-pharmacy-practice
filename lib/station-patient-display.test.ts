import { test } from "node:test";
import assert from "node:assert/strict";
import {
  displayNumber,
  displayHistory,
  formatMeasurementLine,
} from "./station-patient-display.ts";

test("complete patient renders height, weight, BMI and both histories", () => {
  const p = {
    height: 165,
    weight: 58,
    bmi: 21.3,
    past_medical: "Hypertension, Asthma",
    past_medication: "Amlodipine 5 mg, Budesonide inhaler",
  };
  assert.equal(formatMeasurementLine(p), "Height: 165 cm | Weight: 58 kg | BMI: 21.3 kg/m²");
  assert.equal(displayHistory(p.past_medical), "Hypertension, Asthma");
  assert.equal(displayHistory(p.past_medication), "Amlodipine 5 mg, Budesonide inhaler");
});

test("no medical history shows 'None recorded'", () => {
  assert.equal(displayHistory(null), "None recorded");
  assert.equal(displayHistory(undefined), "None recorded");
  assert.equal(displayHistory(""), "None recorded");
  assert.equal(displayHistory("   "), "None recorded");
});

test("no medication history shows 'None recorded'", () => {
  assert.equal(displayHistory(null), "None recorded");
  assert.equal(displayHistory(""), "None recorded");
});

test("missing height renders a dash", () => {
  assert.match(formatMeasurementLine({ height: null }), /Height: —/);
  assert.match(formatMeasurementLine({}), /Height: —/);
});

test("missing weight renders a dash", () => {
  assert.match(formatMeasurementLine({ weight: null }), /Weight: —/);
  assert.match(formatMeasurementLine({}), /Weight: —/);
});

test("missing BMI renders a dash", () => {
  assert.match(formatMeasurementLine({ bmi: null }), /BMI: —/);
  assert.match(formatMeasurementLine({}), /BMI: —/);
});

test("undefined, null and NaN measurement values never render literally", () => {
  assert.equal(displayNumber(undefined), null);
  assert.equal(displayNumber(null), null);
  assert.equal(displayNumber(""), null);
  assert.equal(displayNumber(NaN), null);
  assert.equal(displayNumber("abc"), null);
  const line = formatMeasurementLine({ height: undefined, weight: NaN, bmi: null });
  assert.equal(line, "Height: — cm | Weight: — kg | BMI: — kg/m²");
});

test("long medical history is preserved without clipping or truncation", () => {
  const longHistory =
    "Diabetes mellitus type 2, Hypertension, Ischaemic heart disease, " +
    "Chronic obstructive pulmonary disease, Asthma, Hypothyroidism, " +
    "Chronic kidney disease stage 3, Osteoarthritis, " +
    "Recurrent urinary tract infections, Anaemia of chronic disease";
  const shown = displayHistory(`  ${longHistory}  `);
  assert.equal(shown, longHistory);
  assert.ok(shown.length > 200, "long history must not be shortened");
  assert.equal(shown.includes("Recurrent urinary tract infections"), true);
});

test("long medication history is preserved without clipping or truncation", () => {
  const longMeds =
    "Amlodipine 5 mg once daily, Metformin 500 mg twice daily, " +
    "Atorvastatin 20 mg at bedtime, Budesonide inhaler 200 mcg twice daily, " +
    "Levothyroxine 50 mcg every morning, Ramipril 5 mg once daily, " +
    "Aspirin 75 mg once daily, Hydrochlorothiazide 12.5 mg once daily";
  assert.equal(displayHistory(longMeds), longMeds);
  assert.ok(longMeds.length > 150, "long medication list must not be shortened");
});

test("values updated through Patient Information Review are the values rendered", () => {
  const updated = {
    height: 158.5,
    weight: 52.3,
    bmi: 20.8,
    past_medical: "Hypertension (diagnosed 2024), Asthma",
    past_medication: "Amlodipine 5 mg, Salbutamol as needed",
  };
  assert.equal(formatMeasurementLine(updated), "Height: 158.5 cm | Weight: 52.3 kg | BMI: 20.8 kg/m²");
  assert.equal(displayHistory(updated.past_medical), "Hypertension (diagnosed 2024), Asthma");
  assert.equal(displayHistory(updated.past_medication), "Amlodipine 5 mg, Salbutamol as needed");
});

test("null history falls back to 'None recorded' while a real value is never altered", () => {
  assert.equal(displayHistory(null), "None recorded");
  const value = "Type 2 diabetes with retinopathy;\nChronic kidney disease";
  assert.equal(displayHistory(value), value);
});