import { istDayRangeUtc } from "../utils.ts";
import { supabase } from "../supabase.ts";
import { buildHealthScreeningReportData, type ScreeningTestRecord } from "./patient-report-data.ts";
import { buildEditorSessions, pickBestSession, type EditorSession } from "./editor-demo.ts";

export interface LoadedEditorDemo {
  data: ReturnType<typeof buildHealthScreeningReportData>;
  session: EditorSession | null;
}

/**
 * Loads the most useful screening session for a patient demo source: the IST day
 * with the most distinct reportable test types. Uses the shared anon client and
 * the same report-building function as the online report pages. When a patient
 * has no sessions at all, returns an empty report with a hint.
 */
export async function loadPatientEditorDemo(patientId: string): Promise<LoadedEditorDemo> {
  const { data: patient } = await supabase
    .from("patients")
    .select("*")
    .eq("id", patientId)
    .maybeSingle();

  if (!patient) {
    throw new Error(`Patient "${patientId}" was not found.`);
  }

  const { data: history } = await supabase
    .from("patient_tests")
    .select("test_type, created_at")
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false });

  const sessions = buildEditorSessions((history || []) as { test_type: string; created_at: string }[]);
  const session = pickBestSession(sessions);

  if (!session) {
    const todayKey = "";
    return {
      data: buildHealthScreeningReportData(patient, [], todayKey),
      session: null,
    };
  }

  const { start, end } = istDayRangeUtc(session.dateKey);
  const { data: records } = await supabase
    .from("patient_tests")
    .select("*")
    .eq("patient_id", patientId)
    .gte("created_at", start)
    .lt("created_at", end)
    .order("created_at", { ascending: false });

  const data = buildHealthScreeningReportData(patient, (records || []) as ScreeningTestRecord[], session.dateKey);
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  data.onlineReportUrl = `${origin}/station/report-preview?patientId=${encodeURIComponent(patientId)}&dateKey=${session.dateKey}`;
  return { data, session };
}