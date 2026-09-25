import { istDateKey } from "../utils.ts";
import { createReportQrDataUri } from "./report-qr.ts";
import {
  REPORT_BP_TEST_ID,
  REPORT_LAB_TEST_IDS,
  demoReportData,
  type PatientHealthScreeningReportData,
} from "./patient-report-data.ts";

/** Sibling record types that collapse to a single reportable type (BP). */
const STATION_PAIRED_TYPES = new Set(["Systolic", "Diastolic"]);

const REPORTABLE_IDS = new Set<string>([...REPORT_LAB_TEST_IDS, REPORT_BP_TEST_ID]);

const normalizeTestType = (t: string): string => (STATION_PAIRED_TYPES.has(t) ? REPORT_BP_TEST_ID : t);

export interface EditorSession {
  dateKey: string;
  /** Distinct reportable test types for that IST day (what the report rows show). */
  testCount: number;
  /** Total raw test records (including duplicates and non-reportable rows). */
  recordCount: number;
}

/**
 * Groups raw test records into IST-day sessions and counts the reportable types
 * per day. Mirrors the existing patient-report session logic (Systolic/Diastolic
 * collapse to Blood Pressure; keyed on the IST calendar date).
 */
export function buildEditorSessions(records: readonly { created_at: string; test_type: string }[]): EditorSession[] {
  const byDay = new Map<string, Set<string>>();
  const recordCount = new Map<string, number>();
  for (const rec of records) {
    const key = istDateKey(rec.created_at);
    if (!key) continue;
    if (!byDay.has(key)) byDay.set(key, new Set());
    const normalized = normalizeTestType(rec.test_type);
    if (REPORTABLE_IDS.has(normalized)) byDay.get(key)!.add(normalized);
    recordCount.set(key, (recordCount.get(key) || 0) + 1);
  }
  return Array.from(byDay.entries())
    .filter(([, types]) => types.size > 0)
    .map(([dateKey, types]) => ({
      dateKey,
      testCount: types.size,
      recordCount: recordCount.get(dateKey) || 0,
    }))
    .sort((a, b) => (a.dateKey < b.dateKey ? 1 : -1));
}

/**
 * Chooses the most useful demo session for a patient: the day with the most
 * distinct reportable test types (ties break to the most recent).
 */
export function pickBestSession(sessions: readonly EditorSession[]): EditorSession | null {
  if (!sessions.length) return null;
  return sessions.reduce((best, current) => {
    if (current.testCount > best.testCount) return current;
    if (current.testCount === best.testCount && current.dateKey > best.dateKey) return current;
    return best;
  });
}

export interface EditorDemoSource {
  id: string;
  label: string;
  kind: "builtin" | "patient";
  patientId?: string;
  note?: string;
}

/** Selectable demo sources: three built-in fixtures plus the three known patients. */
export const EDITOR_DEMO_SOURCES: EditorDemoSource[] = [
  { id: "builtin-demo", label: "Built-in Demo (rich, single page)", kind: "builtin" },
  { id: "builtin-long", label: "Built-in Demo — long counseling (multi-page)", kind: "builtin", note: "Stresses page overflow" },
  { id: "builtin-nocounsel", label: "Built-in Demo — no counseling section", kind: "builtin" },
  { id: "kum413", label: "kum413 — Kumkum Bhenwal", kind: "patient", patientId: "kum413" },
  { id: "sal576", label: "sal576 — Saloni Bhenwal", kind: "patient", patientId: "sal576" },
  { id: "dip407", label: "dip407 — Dipak Narayan Shirke", kind: "patient", patientId: "dip407" },
];

const LONG_COUNSELING_POINTS: string[] = [
  "Maintain a balanced diet with an adequate serving of vegetables, fruits, whole grains, pulses and lean protein every single day.",
  "Limit excessive salt, highly processed foods, sugary beverages and foods high in saturated fat to keep your blood pressure and glucose readings stable.",
  "Maintain regular physical activity appropriate for your age and overall health status, such as brisk walking for at least thirty minutes on most days of the week.",
  "Monitor your blood pressure periodically at home and discuss any elevated or persistently low readings promptly with a qualified clinician.",
  "Maintain adequate hydration throughout the day and follow routine preventive health screening at the recommended intervals for your age group.",
  "Keep your HbA1c within the target range and adhere strictly to your prescribed medication schedules without skipping any doses.",
  "If you smoke or use tobacco products, discuss structured cessation support with the pharmacy team during your next visit to the department.",
  "Record any adverse drug reactions or unusual symptoms in your health diary and report them at your next consultation without delay.",
  "Ensure a follow-up that your fasting and post-prandial blood sugar values remain within their respective target ranges on repeat testing.",
  "Review your kidney function and uric acid values periodically, especially if you take long-term medication for blood pressure or diabetes.",
  "Maintain a healthy body weight; even a gradual reduction of five to ten percent of body weight meaningfully improves your cardiovascular risk profile.",
  "Contact the Department of Pharmacy Practice at the college for medication counselling and health screening reminders; do not share your report access QR code.",
  "Take oral iron supplements only as prescribed and pair them with vitamin C rich foods to improve absorption; report any gastrointestinal discomfort promptly.",
  "Practise portion control during meals and avoid skipping breakfast, which can lead to reactive overeating and erratic blood sugar levels.",
  "Limit caffeine and alcohol intake, especially in the evening, to protect your sleep quality and to avoid interfering with your blood pressure control.",
  "Wear appropriate footwear and maintain foot care routines, particularly if you have diabetes, and inspect your feet daily for any cuts or blisters.",
  "Keep your vaccination schedule up to date, including the annual influenza and pneumococcal vaccines, and discuss boosting with your clinician.",
  "Manage stress with breathing exercises, adequate rest and a consistent sleep schedule, as chronic stress is known to raise blood pressure and glucose.",
  "Bring a list of all medicines you currently take, including over-the-counter products and supplements, to every consultation for a medication review.",
  "Return for a repeat screening in three to six months so that trends in your values can be evaluated rather than relying on a single reading.",
  "Ask the pharmacist about proper storage of your medicines, expiry date checks, and the correct timing of doses relative to meals.",
  "If any new symptom such as chest pain, breathlessness, severe headache or unusual bleeding occurs, seek urgent medical attention immediately.",
  "Use only the medicines prescribed for you and never share them with others, as doses are individualised based on your body weight and clinical condition.",
  "Keep a copy of this health screening report for future reference and share it with your treating clinician so that management decisions are well informed.",
];

/** Built-in fixtures derived from the stock demo data (no database access). */
export function builtinDemoData(sourceId: string): PatientHealthScreeningReportData {
  const base = demoReportData();
  switch (sourceId) {
    case "builtin-long": {
      return { ...base, counselingPoints: LONG_COUNSELING_POINTS, reportId: `${base.reportId}-long` };
    }
    case "builtin-nocounsel": {
      return { ...base, counselingPoints: [], reportId: `${base.reportId}-nocounsel` };
    }
    case "builtin-demo":
    default: {
      return base;
    }
  }
}

/** Client-safe report assets: public logo file + QR generated in-browser. */
export interface EditorReportAssets {
  logoSrc: string;
  qrSrc: string | null;
}

export async function createEditorAssets(data: PatientHealthScreeningReportData): Promise<EditorReportAssets> {
  const qrSrc = data.onlineReportUrl ? await createReportQrDataUri({ url: data.onlineReportUrl }) : null;
  return { logoSrc: "/assets/DYP_LOGO_RED.jpg", qrSrc };
}