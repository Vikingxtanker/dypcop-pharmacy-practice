import { formatScreeningDate } from "../utils.ts";
import { calculateAgeFromDob } from "../age.ts";
import {
  classifyBoneDensityTScore,
  classifyBloodPressure,
  classifyClinicalResult,
  classifyUnclassifiable,
  parseBloodPressure,
  toClinicalSex,
  type ClinicalClassification,
  type ClinicalContext,
  type ClinicalTone,
  type ReportStatus,
} from "./clinical-classification.ts";

/**
 * The clinical classification lives in ./clinical-classification.ts and is the
 * only place a threshold or a colour is decided. These re-exports keep the
 * historical import path (`@/lib/reports/patient-report-data`) working for
 * existing callers, station code and report tokens.
 */
export {
  CLINICAL_INTERPRETATION_NOTE,
  boneDensityStatus,
  classifyBoneDensityTScore,
  clinicalToneClass,
  clinicalToneLabel,
  resultStatusClass,
  resultStatusLabel,
  resultStatusTone,
} from "./clinical-classification.ts";
export type {
  BoneDensityTScoreCategory,
  ClinicalClassification,
  ClinicalContext,
  ClinicalSex,
  ClinicalTone,
  ReportStatus,
} from "./clinical-classification.ts";

/** @deprecated Kept as an alias of {@link ClinicalTone} for backwards compatibility. */
export type ReportVisualTone = ClinicalTone;

export interface LaboratoryResultRow {
  test: string;
  result?: string;
  unit?: string;
  normalRange?: string;
  /** Legacy status derived from the clinical tone (kept for token/caller compatibility). */
  status?: ReportStatus;
  /** Clinical tone; the only thing colour is derived from. */
  tone?: ClinicalTone;
  /** Short plain-text interpretation rendered next to the value, e.g. "Stage 1 hypertension range". */
  interpretation?: string;
  /** Full clinical sentence (what was decided and on what basis) used for assistive technology. */
  basis?: string;
}

export interface PatientHealthScreeningReportDemographics {
  name: string;
  phone?: string;
  patientId?: string;
  age?: number | string;
  gender?: string;
  bmi?: number | string;
  /** Vital measurements recorded on the screening day (latest record per type). */
  temperature?: string;
  spo2?: string;
  date: string;
  address?: string;
}

export interface PatientHealthScreeningReportData {
  patient: PatientHealthScreeningReportDemographics;
  laboratoryResults: LaboratoryResultRow[];
  counselingPoints: string[];
  reportId: string;
  onlineReportUrl?: string;
}

export interface PatientReportRow {
  id: string;
  name: string;
  /** DOB is the authoritative source for the report age. */
  dob?: string | null;
  /** Compatibility/cache field; NOT used to derive the report age. */
  age?: number | string | null;
  gender?: string | null;
  phone?: string | null;
  mobile?: string | null;
  address?: string | null;
  bmi?: number | string | null;
}

export interface ScreeningTestRecord {
  id?: string;
  patient_id?: string;
  test_type: string;
  value_numeric?: number | null;
  value_text?: string | null;
  unit?: string | null;
  created_at: string;
}

/** One selectable test option for the report (canonical id + existing report label). */
export interface ReportTestOption {
  id: string;
  label: string;
}

interface LabColumn {
  type: string;
  label: string;
  unitKey?: "unit";
  /**
   * "demographic" measurements are vital signs: they are extracted into the
   * Demographics section instead of becoming selectable/rendered laboratory rows.
   * The canonical id stays in REPORT_LAB_TEST_IDS so legacy tokens keep working.
   */
  section?: "demographic";
}

const LAB_TABLE: LabColumn[] = [
  { type: "Hemoglobin", label: "Hemoglobin (Hb)" },
  { type: "RBG", label: "Random Blood Glucose (RBS)" },
  { type: "FBS", label: "Fasting Blood Sugar (FBS)" },
  { type: "PPBS", label: "Post-Prandial Blood Sugar (PPBS)" },
  { type: "OGTT", label: "Oral Glucose Tolerance Test (OGTT)" },
  { type: "HbA1c", label: "Glycated Hemoglobin (HbA1c)" },
  { type: "Heart Rate", label: "Heart Rate" },
  { type: "Temperature", label: "Body Temperature", section: "demographic" },
  { type: "SpO2", label: "Oxygen Saturation (SpO\u2082)", section: "demographic" },
  { type: "Target Weight", label: "Target Weight" },
  { type: "FEV", label: "Forced Expiratory Volume (FEV1)" },
  { type: "Bone Density (T Score)", label: "Bone Density (T Score)" },
];

/**
 * Canonical ids of the single-measurement report rows, in report display order.
 * Includes the demographic vitals so legacy report tokens that name them still
 * validate; they are never rendered as laboratory rows (see buildLabRows).
 */
export const REPORT_LAB_TEST_IDS: readonly string[] = LAB_TABLE.map((col) => col.type);

/** Canonical ids displayed in the Demographics section rather than as laboratory rows. */
export const REPORT_DEMOGRAPHIC_VITAL_TEST_IDS: readonly string[] = LAB_TABLE
  .filter((col) => col.section === "demographic")
  .map((col) => col.type);

/** Demographics field each demographic vital is shown under. */
const DEMOGRAPHIC_VITAL_FIELD: Record<string, "temperature" | "spo2"> = {
  Temperature: "temperature",
  SpO2: "spo2",
};

/** Unit used for a demographic vital when the stored record carries none. */
const DEMOGRAPHIC_VITAL_UNIT: Record<string, string> = {
  Temperature: "\u00b0C",
  SpO2: "%",
};

/** Canonical id of the composite Blood Pressure report row (Systolic/Diastolic pair or a BP record). */
export const REPORT_BP_TEST_ID = "BP";

const REPORTABLE_TEST_ID_SET = new Set<string>([...REPORT_LAB_TEST_IDS, REPORT_BP_TEST_ID]);

/**
 * Displayed reference intervals. Preserved from the existing report wording
 * except where it contradicted the centralized classification: Blood Pressure
 * now states the 2017 ACC/AHA categories, and HbA1c now calls the 5.7-6.4%
 * band prediabetes, so the printed range and the colour can never disagree.
 * Wording is kept as short as the original report so the laboratory table
 * stays inside one A4 page.
 */
export const NORMAL_RANGES: Record<string, string> = {
  Hemoglobin: "Women: 12\u201316 \u00b7 Men: 13\u201318 g/dL\nChildren: 11\u201314 g/dL\nPregnant: 11\u201314 g/dL",
  RBG: "70\u2013110 mg/dL",
  FBS: "Normal: 70\u2013100 mg/dL\nPrediabetes: 100\u2013125 mg/dL\nDiabetes: \u2265126 mg/dL",
  PPBS: "Normal: <140 mg/dL\nDiabetes range: \u2265200 mg/dL",
  OGTT: "Normal: <140 mg/dL after 2 h glucose load",
  HbA1c: "Prediabetes: 5.7\u20136.4%\nDiabetes: \u22656.5%",
  "Heart Rate": "60\u2013100 beats/min",
  Temperature: "36.5\u201337.5 \u00b0C",
  SpO2: "94\u2013100%",
  "Target Weight": "Per clinician assessment",
  FEV: "Standard chart / clinician assessment",
  BP: "Normal: <120/<80 mmHg (ACC/AHA 2017)\nElevated: 120\u2013129 and <80 mmHg\nStage 1: 130\u2013139 or 80\u201389 mmHg\nStage 2: \u2265140 or \u226590 mmHg",
};

/** Canonical report id / station test type for the Bone Density (T Score) test. */
export const BONE_DENSITY_TEST_ID = "Bone Density (T Score)";

/** Reference wording for the Bone Density (T Score) test, as displayed in the report. */
export const BONE_DENSITY_REFERENCE_TEXT =
  "Normal: T score \u2265 -1.0\nOsteopenia: T score below -1.0 to -2.5\nOsteoporosis: T score below -2.5";

/** Parses a stored numeric result, tolerating the loose numeric strings the station can hold. */
const numericValue = (value?: number | string | null): number | null => {
  if (value === undefined || value === null || value === "") return null;
  // parseFloat keeps a leading minus sign (a T score of "-2.6" must stay negative)
  // and still reads values such as "36.8 °C" or "138/86".
  const n = typeof value === "number" ? value : parseFloat(String(value).trim());
  return Number.isNaN(n) ? null : n;
};

/** Copies a classification onto a report row: tone, legacy status and both text layers. */
const applyClassification = (classification: ClinicalClassification) => ({
  tone: classification.tone,
  status: classification.status,
  interpretation: classification.label,
  basis: classification.basis,
});

/**
 * Legacy entry point kept for backwards compatibility. It now delegates to the
 * centralized classifier, so there is exactly one set of thresholds in the
 * application. `context` is optional; when the caller has the patient to hand
 * (see buildLabRows) it is passed so sex/age-specific rules can apply.
 */
export const inferTestStatus = (
  type: string,
  value?: number | string | null,
  context?: ClinicalContext,
): ReportStatus =>
  classifyClinicalResult({ testId: type, value: numericValue(value), ...(context || {}) }).status;

/** Legacy entry point for the composite Blood Pressure row; delegates to the classifier. */
export const inferBpStatus = (combined: string, context?: ClinicalContext): ReportStatus => {
  const parsed = parseBloodPressure(combined);
  return classifyClinicalResult({
    testId: "BP",
    value: parsed ? parsed.systolic : null,
    secondaryValue: parsed ? parsed.diastolic : null,
    ...(context || {}),
  }).status;
};

const latestByType = (records: ScreeningTestRecord[]): Map<string, ScreeningTestRecord> => {
  const map = new Map<string, ScreeningTestRecord>();
  for (const rec of records) {
    if (!map.has(rec.test_type)) map.set(rec.test_type, rec);
  }
  return map;
};

const displayValue = (rec: ScreeningTestRecord): string => {
  const num = rec.value_numeric;
  const txt = rec.value_text;
  if (num !== null && num !== undefined && txt === null && rec.test_type !== "Counseling") {
    const cleaned = String(num);
    if (cleaned.length < 6 && Number.isInteger(num)) return String(num);
    const parsed = parseFloat(cleaned);
    if (!Number.isNaN(parsed)) return Number.isInteger(parsed) ? String(parsed) : String(Math.round(parsed * 100) / 100);
  }
  if (txt !== null && txt !== undefined && txt !== "") return txt;
  if (num !== null && num !== undefined) return String(num);
  return "";
};

/**
 * Extracts the demographic vital measurements (Temperature, SpO2) from the day's
 * records, formatted with the unit the station stored. These are vital signs, not
 * laboratory tests, so they never depend on the laboratory test selection and are
 * never rendered as laboratory rows. The same latestByType/displayValue pair that
 * feeds the laboratory rows is used, so a vital keeps reporting exactly the reading
 * it reported while it was still a laboratory row.
 */
function buildDemographicVitals(
  records: ScreeningTestRecord[],
): Pick<PatientHealthScreeningReportDemographics, "temperature" | "spo2"> {
  const latest = latestByType(records);
  const vitals: Partial<Pick<PatientHealthScreeningReportDemographics, "temperature" | "spo2">> = {};
  for (const type of REPORT_DEMOGRAPHIC_VITAL_TEST_IDS) {
    const rec = latest.get(type);
    const field = DEMOGRAPHIC_VITAL_FIELD[type];
    if (!rec || !field) continue;
    const value = displayValue(rec);
    if (!value) continue;
    const unit = (rec.unit || DEMOGRAPHIC_VITAL_UNIT[type] || "").trim();
    const alreadyUnit = unit !== "" && value.toLowerCase().endsWith(unit.toLowerCase());
    vitals[field] = unit && !alreadyUnit ? `${value} ${unit}` : value;
  }
  return vitals as Pick<PatientHealthScreeningReportDemographics, "temperature" | "spo2">;
}

/**
 * Builds the reportable Laboratory Results rows (and their canonical ids) for the
 * day's screening records. Latest-per-type wins; Systolic/Diastolic pairing or a BP
 * record collapses to the single "Blood Pressure" row. Demographic vitals
 * (Temperature, SpO2) are skipped here — they belong to the Demographics section.
 * This is the single source of truth for both the checkbox options and the rows
 * rendered in the report.
 *
 * Every row's tone, status and text come from the centralized classifier, using
 * the patient's sex and DOB-derived age where a test needs them.
 */
function buildLabRows(
  records: ScreeningTestRecord[],
  context: ClinicalContext = {},
): Array<{ id: string; row: LaboratoryResultRow }> {
  const latest = latestByType(records);
  const rows: Array<{ id: string; row: LaboratoryResultRow }> = [];

  for (const col of LAB_TABLE) {
    if (col.section === "demographic") continue;
    const rec = latest.get(col.type);
    if (!rec) continue;
    const value = displayValue(rec);
    const unit = rec.unit || "";
    if (!value && rec.test_type !== "Counseling") continue;
    const numeric = numericValue(rec.value_numeric ?? rec.value_text);
    if (col.type === BONE_DENSITY_TEST_ID) {
      const classification = classifyClinicalResult({ testId: col.type, value: numeric, ...context });
      const category = numeric !== null ? classifyBoneDensityTScore(numeric) : null;
      rows.push({
        id: col.type,
        row: {
          test: col.label,
          result: value ? (unit ? `${value} ${unit}` : value) : "N/A",
          unit,
          normalRange: category ? `${category}\n${BONE_DENSITY_REFERENCE_TEXT}` : BONE_DENSITY_REFERENCE_TEXT,
          ...applyClassification(classification),
        },
      });
      continue;
    }
    const classification = classifyClinicalResult({ testId: col.type, value: numeric, ...context });
    rows.push({
      id: col.type,
      row: {
        test: col.label,
        result: value ? (unit ? `${value} ${unit}` : value) : "N/A",
        unit,
        normalRange: NORMAL_RANGES[col.type],
        ...applyClassification(classification),
      },
    });
  }

  const sys = latest.get("Systolic");
  const dia = latest.get("Diastolic");
  const bpRec = latest.get("BP");
  if (sys || dia) {
    const sVal = sys ? displayValue(sys) : "N/A";
    const dVal = dia ? displayValue(dia) : "N/A";
    const label = `${sVal}/${dVal}`;
    const parsed = parseBloodPressure(label);
    rows.push({
      id: REPORT_BP_TEST_ID,
      row: {
        test: "Blood Pressure",
        result: `${label} mmHg`,
        unit: "mmHg",
        normalRange: NORMAL_RANGES.BP,
        ...applyClassification(
          classifyClinicalResult({
            testId: REPORT_BP_TEST_ID,
            value: parsed?.systolic ?? null,
            secondaryValue: parsed?.diastolic ?? null,
            ...context,
          }),
        ),
      },
    });
  } else if (bpRec) {
    const label = bpRec.value_text || displayValue(bpRec);
    const parsed = parseBloodPressure(label);
    rows.push({
      id: REPORT_BP_TEST_ID,
      row: {
        test: "Blood Pressure",
        result: label ? `${label} mmHg` : "N/A",
        unit: "mmHg",
        normalRange: NORMAL_RANGES.BP,
        ...applyClassification(
          classifyClinicalResult({
            testId: REPORT_BP_TEST_ID,
            value: parsed?.systolic ?? null,
            secondaryValue: parsed?.diastolic ?? null,
            ...context,
          }),
        ),
      },
    });
  }

  return rows;
}

export const isTestIncluded = (id: string, includedTests?: readonly string[]): boolean =>
  includedTests === undefined || includedTests.includes(id);

/** Reportable test checkboxes present for a patient/date's records (one per report row). */
export function getAvailableReportTests(records: ScreeningTestRecord[]): ReportTestOption[] {
  return buildLabRows(records).map(({ id, row }) => ({ id, label: row.test }));
}

/**
 * Validates untrusted client input against the known reportable test ids.
 * Returns null when the value is not a string array; otherwise returns the
 * deduplicated list of known ids (unknown strings are ignored). A null result
 * means the value is invalid — it is treated as "include all" only when the
 * value was not supplied at all by the caller.
 */
export function normalizeIncludedTests(value: unknown): string[] | null {
  if (value === undefined || value === null) return null;
  if (!Array.isArray(value)) return null;
  const seen = new Set<string>();
  const normalized: string[] = [];
  for (const entry of value) {
    if (typeof entry !== "string") return null;
    const id = entry.trim();
    if (!REPORTABLE_TEST_ID_SET.has(id) || seen.has(id)) continue;
    seen.add(id);
    normalized.push(id);
  }
  return normalized;
}

export function buildHealthScreeningReportData(
  patientRow: PatientReportRow,
  records: ScreeningTestRecord[],
  dateKey: string,
  includedTests?: readonly string[],
): PatientHealthScreeningReportData {
  const latest = latestByType(records);

  // Age is always re-derived from DOB against the screening date (dateKey, IST).
  // The stored `patients.age` column is never trusted — it goes stale after a
  // birthday, and a historical report must not change just because the patient
  // had a birthday after their screening. The same age and the recorded sex are
  // handed to the clinical classifier, which only uses them for tests that
  // genuinely need them (hemoglobin) and refuses to guess when they are missing.
  const reportedAge = calculateAgeFromDob(patientRow.dob, dateKey);
  const clinicalContext: ClinicalContext = { sex: toClinicalSex(patientRow.gender), ageYears: reportedAge };

  const laboratoryResults = buildLabRows(records, clinicalContext)
    .filter(({ id }) => isTestIncluded(id, includedTests))
    .map(({ row }) => row);

  const counselingRec = latest.get("Counseling");
  const rawCounseling = counselingRec
    ? counselingRec.value_text || (counselingRec.value_numeric != null ? String(counselingRec.value_numeric) : "")
    : "";
  const counselingPoints = rawCounseling
    .split(/\r?\n/)
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  if (counselingRec && counselingPoints.length === 0 && rawCounseling.trim()) {
    counselingPoints.push(rawCounseling.trim());
  }

  const phone = patientRow.phone || patientRow.mobile || undefined;
  const bmi = patientRow.bmi !== undefined && patientRow.bmi !== null ? String(patientRow.bmi) : undefined;
  const vitals = buildDemographicVitals(records);

  return {
    patient: {
      name: patientRow.name || "Unknown",
      phone,
      patientId: patientRow.id,
      age: reportedAge !== null ? reportedAge : undefined,
      gender: patientRow.gender || undefined,
      bmi,
      temperature: vitals.temperature,
      spo2: vitals.spo2,
      date: dateKey ? formatScreeningDate(dateKey) : "",
      address: patientRow.address || undefined,
    },
    laboratoryResults,
    counselingPoints,
    reportId: `${patientRow.id}-${dateKey}`,
  };
}

const DEMO_COUNSELING = [
  "Maintain a balanced diet with adequate vegetables, fruits, whole grains and protein every day.",
  "Limit excessive salt, highly processed foods, sugary beverages and foods high in saturated fat to keep your blood pressure and glucose in range.",
  "Maintain regular physical activity appropriate for your age and overall health status such as brisk walking for at least 30 minutes on most days of the week.",
  "Monitor blood pressure periodically at home and discuss elevated readings promptly with a qualified clinician.",
  "Maintain adequate hydration and follow routine preventive health screening at recommended intervals.",
  "Keep your HbA1c within target range and adhere to prescribed medication schedules without skipping doses.",
  "If you smoke or use tobacco products, discuss structured cessation support with the pharmacy team.",
  "Record any adverse drug reactions or unusual symptoms in your health diary and report them during your next consultation.",
  "Ensure follow-up that your fasting and post-prandial blood sugar remain in their respective target ranges.",
  "Review your kidney function and uric acid values periodically, especially if you take long-term medication.",
  "Maintain a healthy body weight; a gradual reduction of even five to ten percent of body weight improves cardiovascular risk profile.",
  "Contact the Department of Pharmacy Practice at the college for medication counselling and health screening reminders, and do not share your report access QR code with others.",
];

/** Neutral row fields for a value this application has no verified threshold for. */
const unclassified = () =>
  applyClassification(
    classifyUnclassifiable(
      "The station has no test type for this analyte, so it is never measured or reported for a real patient and no clinical threshold has been verified for it in this application.",
    ),
  );

/**
 * Demo-only analytes. The station has no test_type for any of them, so the
 * report builder never emits these rows for a real patient and no clinical
 * threshold has been verified for them here. They are deliberately left
 * unclassified (neutral) rather than being given a colour that no source in
 * this application supports.
 */
const DEMO_EXTRA_ROWS: LaboratoryResultRow[] = [
  { test: "Total Cholesterol (TC)", result: "178 mg/dL", normalRange: "Desirable: <200 mg/dL\nBorderline: 200\u2013239 mg/dL", ...unclassified() },
  { test: "Triglycerides (TG)", result: "132 mg/dL", normalRange: "Normal: <150 mg/dL\nBorderline: 150\u2013199 mg/dL", ...unclassified() },
  { test: "HDL Cholesterol", result: "45 mg/dL", normalRange: "Men: >40 mg/dL\nWomen: >50 mg/dL", ...unclassified() },
  { test: "LDL Cholesterol", result: "96 mg/dL", normalRange: "Optimal: <100 mg/dL\nNear optimal: 100\u2013129 mg/dL", ...unclassified() },
  { test: "Serum Creatinine", result: "0.9 mg/dL", normalRange: "Women: 0.5\u20131.1 mg/dL\nMen: 0.6\u20131.3 mg/dL", ...unclassified() },
  { test: "Uric Acid", result: "5.8 mg/dL", normalRange: "Women: 2.4\u20136.0 mg/dL\nMen: 3.4\u20137.0 mg/dL", ...unclassified() },
  { test: "Vitamin D (25-OH)", result: "31 ng/mL", normalRange: "Deficient: <20 ng/mL\nInsufficient: 20\u201329 ng/mL\nSufficient: 30\u2013100 ng/mL", ...unclassified() },
];

/** Builds a demo row through the same classifier the real report uses. */
const demoRow = (
  testId: string,
  test: string,
  result: string,
  value: number | null,
  unit: string,
  context: ClinicalContext,
  extra: Partial<LaboratoryResultRow> = {},
): LaboratoryResultRow => ({
  test,
  result,
  unit,
  normalRange: NORMAL_RANGES[testId],
  ...applyClassification(classifyClinicalResult({ testId, value, ...context })),
  ...extra,
});

const DEMO_CONTEXT: ClinicalContext = { sex: "male", ageYears: 24 };

export const demoReportData = (): PatientHealthScreeningReportData => {
  const laboratory: LaboratoryResultRow[] = [
    demoRow("Hemoglobin", "Hemoglobin (Hb)", "14.2 g/dL", 14.2, "g/dL", DEMO_CONTEXT),
    demoRow("RBG", "Random Blood Glucose (RBS)", "96 mg/dL", 96, "mg/dL", DEMO_CONTEXT),
    demoRow("FBS", "Fasting Blood Sugar (FBS)", "88 mg/dL", 88, "mg/dL", DEMO_CONTEXT),
    demoRow("PPBS", "Post-Prandial Blood Sugar (PPBS)", "122 mg/dL", 122, "mg/dL", DEMO_CONTEXT),
    demoRow("OGTT", "Oral Glucose Tolerance Test (OGTT)", "132 mg/dL", 132, "mg/dL", DEMO_CONTEXT),
    demoRow("HbA1c", "Glycated Hemoglobin (HbA1c)", "5.4 %", 5.4, "%", DEMO_CONTEXT),
    demoRow("Heart Rate", "Heart Rate", "74 /min", 74, "/min", DEMO_CONTEXT),
    demoRow("Target Weight", "Target Weight", "72 kg", 72, "kg", DEMO_CONTEXT),
    demoRow("FEV", "Forced Expiratory Volume (FEV1)", "3.1 L", 3.1, "L", DEMO_CONTEXT),
    demoRow("Bone Density (T Score)", "Bone Density (T Score)", "-1.8 T Score", -1.8, "T Score", DEMO_CONTEXT, {
      normalRange: `Osteopenia\n${BONE_DENSITY_REFERENCE_TEXT}`,
    }),
    {
      test: "Blood Pressure",
      result: "138/86 mmHg",
      unit: "mmHg",
      normalRange: NORMAL_RANGES.BP,
      ...applyClassification(classifyBloodPressure(138, 86)),
    },
    ...DEMO_EXTRA_ROWS,
  ];

  return {
    patient: {
      name: "Aarav Sharma",
      phone: "9876543210",
      patientId: "HSC-P-00127",
      age: 24,
      gender: "Male",
      bmi: "23.45",
      temperature: "36.8 \u00b0C",
      spo2: "98 %",
      date: "25 September 2026",
      address: "Pradhikaran, Nigdi, Pune, Maharashtra",
    },
    laboratoryResults: laboratory,
    counselingPoints: DEMO_COUNSELING,
    reportId: "HSC-P-00127-2026-09-25",
    onlineReportUrl: "https://dypcoppharmacypractice.in/report/demo-HSC-P-00127",
  };
};