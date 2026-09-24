import { createClient } from "@supabase/supabase-js";
import { istDayRangeUtc } from "@/lib/utils";
import ReportViewer from "@/components/reports/ReportViewer";
import { PatientHealthScreeningReport } from "@/components/reports/PatientHealthScreeningReport";
import { resolveReportAssets } from "@/lib/reports/report-assets";
import {
  buildHealthScreeningReportData,
  demoReportData,
  type ScreeningTestRecord,
} from "@/lib/reports/patient-report-data";
import { buildReportUrl } from "@/lib/reports/report-token";
import "@/components/reports/report.css";

export const dynamic = "force-dynamic";

interface PreviewPageProps {
  searchParams?: Promise<{ patientId?: string; dateKey?: string }>;
}

export default async function ReportPreviewPage({ searchParams }: PreviewPageProps) {
  const params = searchParams ? await searchParams : {};
  const patientId = params.patientId?.trim() || "";
  const dateKey = params.dateKey?.trim() || "";
  const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

  let data = demoReportData();
  let demo = true;

  if (patientId && DATE_KEY_RE.test(dateKey)) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
    );
    const { data: patient } = await supabase.from("patients").select("*").eq("id", patientId).maybeSingle();
    if (patient) {
      const { start, end } = istDayRangeUtc(dateKey);
      const { data: records } = await supabase
        .from("patient_tests")
        .select("*")
        .eq("patient_id", patient.id)
        .gte("created_at", start)
        .lt("created_at", end)
        .order("created_at", { ascending: false });
      data = buildHealthScreeningReportData(patient, (records || []) as ScreeningTestRecord[], dateKey);
      data.onlineReportUrl = buildReportUrl({ patientId: patient.id, dateKey });
      demo = false;
    }
  }

  const assets = await resolveReportAssets(data);

  return (
    <ReportViewer
      title={demo ? "Health Screening Report — Demo Preview" : "Health Screening Report Preview"}
      dev
      downloadTarget={demo ? undefined : { patientId, dateKey }}
    >
      <PatientHealthScreeningReport data={data} assets={assets} />
    </ReportViewer>
  );
}