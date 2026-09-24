import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { istDayRangeUtc } from "@/lib/utils";
import { PatientHealthScreeningReport } from "@/components/reports/PatientHealthScreeningReport";
import { resolveReportAssets } from "@/lib/reports/report-assets";
import { buildHealthScreeningReportData, type ScreeningTestRecord } from "@/lib/reports/patient-report-data";
import { buildReportUrl } from "@/lib/reports/report-token";
import "@/components/reports/report.css";

export const dynamic = "force-dynamic";

const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

interface PrintPageProps {
  searchParams?: Promise<{ patientId?: string; dateKey?: string }>;
}

export default async function PrintReportPage({ searchParams }: PrintPageProps) {
  const params = searchParams ? await searchParams : {};
  const patientId = params.patientId?.trim() || "";
  const dateKey = params.dateKey?.trim() || "";
  if (!patientId || !DATE_KEY_RE.test(dateKey)) notFound();

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  );
  const { data: patient } = await supabase.from("patients").select("*").eq("id", patientId).maybeSingle();
  if (!patient) notFound();

  const { start, end } = istDayRangeUtc(dateKey);
  const { data: records } = await supabase
    .from("patient_tests")
    .select("*")
    .eq("patient_id", patient.id)
    .gte("created_at", start)
    .lt("created_at", end)
    .order("created_at", { ascending: false });

  const data = buildHealthScreeningReportData(patient, (records || []) as ScreeningTestRecord[], dateKey);
  data.onlineReportUrl = buildReportUrl({ patientId: patient.id, dateKey });
  const assets = await resolveReportAssets(data);

  return (
    <main className="rp-pdf-shell">
      <PatientHealthScreeningReport data={data} assets={assets} />
    </main>
  );
}