import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { istDayRangeUtc } from "@/lib/utils";
import ReportViewer from "@/components/reports/ReportViewer";
import { PatientHealthScreeningReport } from "@/components/reports/PatientHealthScreeningReport";
import { resolveReportAssets } from "@/lib/reports/report-assets";
import { buildHealthScreeningReportData, type ScreeningTestRecord } from "@/lib/reports/patient-report-data";
import { redeemReportToken } from "@/lib/reports/report-token";
import "@/components/reports/report.css";

export const dynamic = "force-dynamic";

interface ReportPageProps {
  params: Promise<{ token: string }>;
}

export async function generateMetadata({ params }: ReportPageProps): Promise<Metadata> {
  const { token } = await params;
  const payload = redeemReportToken(token);
  return {
    title: payload ? "Health Screening Report Online" : "Report Not Found",
    robots: { index: false, follow: false },
  };
}

export default async function OnlineReportPage({ params }: ReportPageProps) {
  const { token } = await params;
  const payload = redeemReportToken(token);
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
  const assets = await resolveReportAssets(data);

  return (
    <ReportViewer title="Online Health Screening Report" downloadToken={token}>
      <PatientHealthScreeningReport data={data} assets={assets} />
    </ReportViewer>
  );
}