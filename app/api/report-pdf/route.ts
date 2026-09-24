import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { istDayRangeUtc } from "@/lib/utils";
import { buildHealthScreeningReportData, type ScreeningTestRecord } from "@/lib/reports/patient-report-data";
import { resolveReportAssets } from "@/lib/reports/report-assets";
import { buildHealthScreeningReportPdf } from "@/lib/reports/pdfmake-report";
import { getReportOrigin, redeemReportToken } from "@/lib/reports/report-token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

function sanitizeFilenamePart(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "report";
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token")?.trim() || "";
  if (!token) {
    return NextResponse.json({ error: "token is required" }, { status: 400 });
  }

  const payload = redeemReportToken(token);
  if (!payload || !DATE_KEY_RE.test(payload.dateKey)) {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 404 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  );

  const { data: patient, error: patientError } = await supabase
    .from("patients")
    .select("*")
    .eq("id", payload.patientId)
    .maybeSingle();
  if (patientError || !patient) {
    return NextResponse.json({ error: "Patient not found" }, { status: 404 });
  }

  const { start, end } = istDayRangeUtc(payload.dateKey);
  const { data: records } = await supabase
    .from("patient_tests")
    .select("*")
    .eq("patient_id", patient.id)
    .gte("created_at", start)
    .lt("created_at", end)
    .order("created_at", { ascending: false });

  const data = buildHealthScreeningReportData(
    patient,
    (records || []) as ScreeningTestRecord[],
    payload.dateKey,
  );
  data.onlineReportUrl = `${getReportOrigin()}/report/${token}`;

  const assets = await resolveReportAssets(data);
  const pdf = await buildHealthScreeningReportPdf(data, assets);

  const filename = `health-screening-report-${sanitizeFilenamePart(patient.id)}-${payload.dateKey}.pdf`;

  return new NextResponse(new Uint8Array(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": String(pdf.byteLength),
      "Cache-Control": "no-store",
    },
  });
}
