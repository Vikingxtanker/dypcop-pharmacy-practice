import { formatScreeningDate } from "../utils.ts";
import { calculateAgeFromDob } from "../age.ts";

export type ReportStatus = "normal" | "high" | "low" | "info";

/** Visual tone derived from the existing clinical status (single source of truth). */
export type ReportVisualTone = "normal" | "low" | "high" | "neutral";

const STATUS_TO_TONE: Record<ReportStatus, ReportVisualTone> = {
  normal: "normal",
  low: "low",
  high: "high",
  info: "neutral",
};

export const resultStatusTone = (status?: ReportStatus): ReportVisualTone =>
  status ? STATUS_TO_TONE[status] : "neutral";

/** Semantic CSS class applied to the result value cell (colors live in report.css). */
export const resultStatusClass = (status?: ReportStatus): string =>
  `rp-result--${resultStatusTone(status)}`;

/** Accessible plain-text phrase describing the result relative to its normal range. */
export const resultStatusLabel = (status?: ReportStatus): string => {
  switch (resultStatusTone(status)) {
    case "normal":
      return "within normal range";
    case "low":
      return "below normal range";
    case "high":
      return "above normal range";
    default:
      return "unclassified status";
  }
};

export interface LaboratoryResultRow {
  test: string;
  result?: string;
  unit?: string;
  normalRange?: string;
  status?: ReportStatus;
  /** Human-readable clinical interpretation (e.g. "Osteoporosis"), when meaningful over the status phrase. */
  interpretation?: string;
}

export interface PatientHealthScreeningReportDemographics {
  name: string;
  phone?: string;
  patientId?: string;
  age?: number | string;
  gender?: string;
  bmi?: number | string;
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
}

const LAB_TABLE: LabColumn[] = [
  { type: "Hemoglobin", label: "Hemoglobin (Hb)" },
  { type: "RBG", label: "Random Blood Glucose (RBS)" },
  { type: "FBS", label: "Fasting Blood Sugar (FBS)" },
  { type: "PPBS", label: "Post-Prandial Blood Sugar (PPBS)" },
  { type: "OGTT", label: "Oral Glucose Tolerance Test (OGTT)" },
  { type: "HbA1c", label: "Glycated Hemoglobin (HbA1c)" },
  { type: "Heart Rate", label: "Heart Rate" },
  { type: "Temperature", label: "Body Temperature" },
  { type: "SpO2", label: "Oxygen Saturation (SpO\u2082)" },
  { type: "Target Weight", label: "Target Weight" },
  { type: "FEV", label: "Forced Expiratory Volume (FEV1)" },
  { type: "Bone Density (T Score)", label: "Bone Density (T Score)" },
];

/** Canonical ids of the single-measurement report rows, in report display order. */
export const REPORT_LAB_TEST_IDS: readonly string[] = LAB_TABLE.map((col) => col.type);

/** Canonical id of the composite Blood Pressure report row (Systolic/Diastolic pair or a BP record). */
export const REPORT_BP_TEST_ID = "BP";

const REPORTABLE_TEST_ID_SET = new Set<string>([...REPORT_LAB_TEST_IDS, REPORT_BP_TEST_ID]);

export const NORMAL_RANGES: Record<string, string> = {
  Hemoglobin: "Women: 12\u201316 g/dL\nMen: 13\u201318 g/dL\nChildren: 11\u201314 g/dL\nPregnant: 11\u201314 g/dL",
  RBG: "70\u2013110 mg/dL",
  FBS: "Normal: 70\u2013100 mg/dL\nPrediabetes: 100\u2013125 mg/dL\nDiabetes: \u2265126 mg/dL",
  PPBS: "Normal: <140 mg/dL\nPost-meal: up to 180 mg/dL",
  OGTT: "Normal: <140 mg/dL after 2 h glucose load",
  HbA1c: "Normal: <5.7%\nPrediabetes: 5.7\u20136.4%\nDiabetes: \u22656.5%",
  "Heart Rate": "60\u2013100 beats/min",
  Temperature: "36.5\u201337.5 \u00b0C",
  SpO2: "94\u2013100%",
  "Target Weight": "Per clinician assessment",
  FEV: "Standard chart / clinician assessment",
  BP: "Normal: <120/80 mmHg\nPre-HTN: 120\u2013139/80\u201389 mmHg\nStage 1 HTN: 140\u2013159/90\u201399 mmHg\nStage 2 HTN: \u2265160/\u2265100 mmHg",
};

/** Canonical report id / station test type for the Bone Density (T Score) test. */
export const BONE_DENSITY_TEST_ID = "Bone Density (T Score)";

/** Reference wording for the Bone Density (T Score) test, as displayed in the report. */
export const BONE_DENSITY_REFERENCE_TEXT =
  "Normal: T score upto -1\nOsteopenia: T score between -1.1 to -2.5\nOsteoporosis: T score above -2.5";

/** WHO Bone Mineral Density categories derived from the T Score. */
export type BoneDensityTScoreCategory = "Normal" | "Osteopenia" | "Osteoporosis";

/**
 * Classifies a T Score into the clinical category. Boundaries are inclusive to
 * avoid value gaps: Normal at T = -1.0 and above, Osteopenia between -2.5 and
 * -1.0, Osteoporosis below -2.5.
 */
export const classifyBoneDensityTScore = (value: number): BoneDensityTScoreCategory => {
  if (value >= -1) return "Normal";
  if (value >= -2.5) return "Osteopenia";
  return "Osteoporosis";
};

/** Report status color for the Bone Density (T Score) row. */
export const boneDensityStatus = (value: number | null | undefined): ReportStatus => {
  if (value === undefined || value === null || !Number.isFinite(value)) return "info";
  if (value >= -1) return "normal";
  if (value >= -2.5) return "low";
  return "high";
};

export const inferTestStatus = (type: string, value?: number | string | null): ReportStatus => {
  if (value === undefined || value === null || value === "") return "info";
  const v = typeof value === "number" ? value : parseFloat(String(value).replace(/[^0-9.]/g, ""));
  if (Number.isNaN(v)) return "info";

  switch (type) {
    case "Hemoglobin":
      return v >= 18 ? "high" : v < 11 ? "low" : "normal";
    case "FBS":
      return v >= 126 ? "high" : v <= 70 ? "low" : "normal";
    case "RBG":
      return v >= 200 ? "high" : "normal";
    case "PPBS":
      return v >= 180 ? "high" : "normal";
    case "OGTT":
      return v >= 200 ? "high" : "normal";
    case "HbA1c":
      return v >= 6.5 ? "high" : "normal";
    case "Heart Rate":
      return v > 100 ? "high" : v < 60 ? "low" : "normal";
    case "Temperature":
      return v > 37.5 ? "high" : v < 36 ? "low" : "normal";
    case "SpO2":
      return v < 94 ? "low" : "normal";
    default:
      return "info";
  }
};

export const inferBpStatus = (combined: string): ReportStatus => {
  const [sysRaw, diaRaw] = combined.split("/");
  const sys = parseFloat(sysRaw);
  const dia = parseFloat(diaRaw);
  if (Number.isNaN(sys) || Number.isNaN(dia)) return "info";
  if (sys >= 140 || dia >= 90) return "high";
  if (sys <= 90 || dia <= 60) return "low";
  if (sys >= 120 || dia >= 80) return "info";
  return "normal";
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
 * Builds the reportable Laboratory Results rows (and their canonical ids) for the
 * day's screening records. Latest-per-type wins; Systolic/Diastolic pairing or a BP
 * record collapses to the single "Blood Pressure" row. This is the single source of
 * truth for both the checkbox options and the rows rendered in the report.
 */
function buildLabRows(records: ScreeningTestRecord[]): Array<{ id: string; row: LaboratoryResultRow }> {
  const latest = latestByType(records);
  const rows: Array<{ id: string; row: LaboratoryResultRow }> = [];

  for (const col of LAB_TABLE) {
    const rec = latest.get(col.type);
    if (!rec) continue;
    const value = displayValue(rec);
    const unit = rec.unit || "";
    if (!value && rec.test_type !== "Counseling") continue;
    if (col.type === BONE_DENSITY_TEST_ID) {
      const raw = rec.value_numeric ?? (rec.value_text ? parseFloat(String(rec.value_text)) : Number.NaN);
      const hasNumeric = raw !== undefined && raw !== null && Number.isFinite(Number(raw));
      const category = hasNumeric ? classifyBoneDensityTScore(Number(raw)) : null;
      rows.push({
        id: col.type,
        row: {
          test: col.label,
          result: value ? (unit ? `${value} ${unit}` : value) : "N/A",
          unit,
          normalRange: hasNumeric ? `${category}\n${BONE_DENSITY_REFERENCE_TEXT}` : BONE_DENSITY_REFERENCE_TEXT,
          status: boneDensityStatus(hasNumeric ? Number(raw) : null),
          interpretation: category ?? undefined,
        },
      });
      continue;
    }
    rows.push({
      id: col.type,
      row: {
        test: col.label,
        result: value ? (unit ? `${value} ${unit}` : value) : "N/A",
        unit,
        normalRange: NORMAL_RANGES[col.type],
        status: inferTestStatus(col.type, rec.value_numeric ?? (rec.value_text ? value : null)),
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
    rows.push({
      id: REPORT_BP_TEST_ID,
      row: {
        test: "Blood Pressure",
        result: `${label} mmHg`,
        unit: "mmHg",
        normalRange: NORMAL_RANGES.BP,
        status: inferBpStatus(label),
      },
    });
  } else if (bpRec) {
    const label = bpRec.value_text || displayValue(bpRec);
    rows.push({
      id: REPORT_BP_TEST_ID,
      row: {
        test: "Blood Pressure",
        result: label ? `${label} mmHg` : "N/A",
        unit: "mmHg",
        normalRange: NORMAL_RANGES.BP,
        status: inferBpStatus(label),
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

  const laboratoryResults = buildLabRows(records)
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

  // Age is always re-derived from DOB against the screening date (dateKey, IST).
  // The stored `patients.age` column is never trusted — it goes stale after a
  // birthday, and a historical report must not change just because the patient
  // had a birthday after their screening.
  const reportedAge = calculateAgeFromDob(patientRow.dob, dateKey);

  return {
    patient: {
      name: patientRow.name || "Unknown",
      phone,
      patientId: patientRow.id,
      age: reportedAge !== null ? reportedAge : undefined,
      gender: patientRow.gender || undefined,
      bmi,
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

const DEMO_EXTRA_ROWS: LaboratoryResultRow[] = [
  { test: "Total Cholesterol (TC)", result: "178 mg/dL", normalRange: "Desirable: <200 mg/dL\nBorderline: 200\u2013239 mg/dL", status: "normal" },
  { test: "Triglycerides (TG)", result: "132 mg/dL", normalRange: "Normal: <150 mg/dL\nBorderline: 150\u2013199 mg/dL", status: "normal" },
  { test: "HDL Cholesterol", result: "45 mg/dL", normalRange: "Men: >40 mg/dL\nWomen: >50 mg/dL", status: "normal" },
  { test: "LDL Cholesterol", result: "96 mg/dL", normalRange: "Optimal: <100 mg/dL\nNear optimal: 100\u2013129 mg/dL", status: "normal" },
  { test: "Serum Creatinine", result: "0.9 mg/dL", normalRange: "Women: 0.5\u20131.1 mg/dL\nMen: 0.6\u20131.3 mg/dL", status: "normal" },
  { test: "Uric Acid", result: "5.8 mg/dL", normalRange: "Women: 2.4\u20136.0 mg/dL\nMen: 3.4\u20137.0 mg/dL", status: "normal" },
  { test: "Vitamin D (25-OH)", result: "31 ng/mL", normalRange: "Deficient: <20 ng/mL\nInsufficient: 20\u201329 ng/mL\nSufficient: 30\u2013100 ng/mL", status: "info" },
];

export const demoReportData = (): PatientHealthScreeningReportData => {
  const laboratory: LaboratoryResultRow[] = [
    { test: "Hemoglobin (Hb)", result: "14.2 g/dL", unit: "g/dL", normalRange: NORMAL_RANGES.Hemoglobin, status: "normal" },
    { test: "Random Blood Glucose (RBS)", result: "96 mg/dL", unit: "mg/dL", normalRange: NORMAL_RANGES.RBG, status: "normal" },
    { test: "Fasting Blood Sugar (FBS)", result: "88 mg/dL", unit: "mg/dL", normalRange: NORMAL_RANGES.FBS, status: "normal" },
    { test: "Post-Prandial Blood Sugar (PPBS)", result: "122 mg/dL", unit: "mg/dL", normalRange: NORMAL_RANGES.PPBS, status: "normal" },
    { test: "Oral Glucose Tolerance Test (OGTT)", result: "132 mg/dL", unit: "mg/dL", normalRange: NORMAL_RANGES.OGTT, status: "normal" },
    { test: "Glycated Hemoglobin (HbA1c)", result: "5.4 %", unit: "%", normalRange: NORMAL_RANGES.HbA1c, status: "normal" },
    { test: "Heart Rate", result: "74 /min", unit: "/min", normalRange: NORMAL_RANGES["Heart Rate"], status: "normal" },
    { test: "Body Temperature", result: "36.8 \u00b0C", unit: "\u00b0C", normalRange: NORMAL_RANGES.Temperature, status: "normal" },
    { test: "Oxygen Saturation (SpO\u2082)", result: "98 %", unit: "%", normalRange: NORMAL_RANGES.SpO2, status: "normal" },
    { test: "Target Weight", result: "72 kg", unit: "kg", normalRange: NORMAL_RANGES["Target Weight"], status: "info" },
    { test: "Forced Expiratory Volume (FEV1)", result: "3.1 L", unit: "L", normalRange: NORMAL_RANGES.FEV, status: "info" },
    { test: "Bone Density (T Score)", result: "-1.8 T Score", unit: "T Score", normalRange: `Osteopenia\n${BONE_DENSITY_REFERENCE_TEXT}`, status: "low", interpretation: "Osteopenia" },
    { test: "Blood Pressure", result: "138/86 mmHg", unit: "mmHg", normalRange: NORMAL_RANGES.BP, status: "info" },
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
      date: "25 September 2026",
      address: "Pradhikaran, Nigdi, Pune, Maharashtra",
    },
    laboratoryResults: laboratory,
    counselingPoints: DEMO_COUNSELING,
    reportId: "HSC-P-00127-2026-09-25",
    onlineReportUrl: "https://dypcoppharmacypractice.in/report/demo-HSC-P-00127",
  };
};