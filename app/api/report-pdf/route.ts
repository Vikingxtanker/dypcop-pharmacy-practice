import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateHealthReportPdfFromUrl } from "@/lib/reports/generate-report-pdf";

export const runtime = "nodejs";

const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

const serverClient = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  );

export async function POST(request: NextRequest) {
  let body: { patientId?: unknown; dateKey?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const patientId = typeof body.patientId === "string" ? body.patientId.trim() : "";
  const dateKey = typeof body.dateKey === "string" ? body.dateKey.trim() : "";
  if (!patientId || !DATE_KEY_RE.test(dateKey)) {
    return NextResponse.json({ error: "patientId and dateKey (YYYY-MM-DD) are required" }, { status: 400 });
  }

  const supabase = serverClient();
  const { data: patient, error: patientError } = await supabase
    .from("patients")
    .select("*")
    .eq("id", patientId)
    .maybeSingle();

  if (patientError || !patient) {
    return NextResponse.json({ error: "Patient not found" }, { status: 404 });
  }

  const renderUrl = new URL("/report/print", request.nextUrl.origin);
  renderUrl.searchParams.set("patientId", patient.id);
  renderUrl.searchParams.set("dateKey", dateKey);

  try {
    const pdf = await generateHealthReportPdfFromUrl(renderUrl.toString());
    if (!pdf || pdf.length === 0) {
      throw new Error("PDF generation returned an empty buffer");
    }
    return new Response(new Blob([new Uint8Array(pdf).buffer], { type: "application/octet-stream" }), {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Length": String(pdf.length),
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[report-pdf] generation error:", err);
    return NextResponse.json({ error: "PDF generation failed" }, { status: 500 });
  }
}