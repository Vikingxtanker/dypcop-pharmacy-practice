import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { redeemReportToken } from "@/lib/reports/report-token";
import { renderReportPdf } from "@/lib/reports/report-browser";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

function sanitizeFilenamePart(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "report";
}

function resolvePrintOrigin(request: NextRequest): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return configured.replace(/\/+$/, "");
  const proto = request.headers.get("x-forwarded-proto") || "http";
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  if (host) return `${proto}://${host}`;
  const deployment = process.env.VERCEL_URL;
  if (deployment) return `https://${deployment.replace(/^https?:\/\//, "").replace(/\/+$/, "")}`;
  return request.nextUrl.origin;
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
    .select("id")
    .eq("id", payload.patientId)
    .maybeSingle();
  if (patientError || !patient) {
    return NextResponse.json({ error: "Patient not found" }, { status: 404 });
  }

  const printUrl = `${resolvePrintOrigin(request)}/report/print?token=${encodeURIComponent(token)}&pdf=1`;

  let pdf: Uint8Array;
  try {
    pdf = await renderReportPdf(printUrl);
  } catch (error) {
    console.error("report-pdf: Chromium render failed", error);
    return NextResponse.json({ error: "Failed to generate the report. Please try again." }, { status: 500 });
  }

  const pdfBody = new Uint8Array(pdf);

  const filename = `health-screening-report-${sanitizeFilenamePart(payload.patientId)}-${payload.dateKey}.pdf`;

  return new NextResponse(pdfBody, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": String(pdfBody.byteLength),
      "Cache-Control": "no-store",
    },
  });
}