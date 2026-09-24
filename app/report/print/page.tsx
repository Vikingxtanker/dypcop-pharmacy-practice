import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { istDayRangeUtc } from "@/lib/utils";
import { PatientHealthScreeningReport } from "@/components/reports/PatientHealthScreeningReport";
import { resolveReportAssets } from "@/lib/reports/report-assets";
import { buildHealthScreeningReportData, type ScreeningTestRecord } from "@/lib/reports/patient-report-data";
import { getReportOrigin, redeemReportToken } from "@/lib/reports/report-token";
import AutoPrint from "./auto-print";
import ReportReadySignal from "./report-ready";
import "@/components/reports/report.css";

export const dynamic = "force-dynamic";

interface PrintPageProps {
  searchParams?: Promise<{ token?: string }>;
}

export default async function PrintReportPage({ searchParams }: PrintPageProps) {
  const params = searchParams ? await searchParams : {};
  const token = params.token?.trim() || "";
  const payload = token ? redeemReportToken(token) : null;
  if (!payload) notFound();

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  );
  const { data: patient } = await supabase.from("patients").select("*").eq("id", payload.patientId).maybeSingle();
  if (!patient) notFound();

  const { start, end } = istDayRangeUtc(payload.dateKey);
  const { data: records } = await supabase
    .from("patient_tests")
    .select("*")
    .eq("patient_id", patient.id)
    .gte("created_at", start)
    .lt("created_at", end)
    .order("created_at", { ascending: false });

  const data = buildHealthScreeningReportData(patient, (records || []) as ScreeningTestRecord[], payload.dateKey, payload.includedTests);
  data.onlineReportUrl = `${getReportOrigin()}/report/${token}`;
  const assets = await resolveReportAssets(data);

  return (
    <>
      <AutoPrint />
      <ReportReadySignal />
      <main className="rp-pdf-shell">
        <PatientHealthScreeningReport data={data} assets={assets} />
      </main>
    </>
  );
}