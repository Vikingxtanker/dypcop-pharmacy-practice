import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { mintReportToken } from "@/lib/reports/report-token";
import { normalizeIncludedTests } from "@/lib/reports/patient-report-data";

export const runtime = "nodejs";

const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function POST(request: NextRequest) {
  let body: { patientId?: unknown; dateKey?: unknown; includedTests?: unknown };
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

  let includedTests: string[] | null = null;
  if (body.includedTests !== undefined) {
    includedTests = normalizeIncludedTests(body.includedTests);
    if (includedTests === null) {
      return NextResponse.json({ error: "includedTests must be an array of known test identifiers" }, { status: 400 });
    }
    if (includedTests.length === 0) {
      return NextResponse.json({ error: "Select at least one test to generate the report." }, { status: 400 });
    }
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  );
  const { data: patient, error: patientError } = await supabase
    .from("patients")
    .select("id")
    .eq("id", patientId)
    .maybeSingle();

  if (patientError || !patient) {
    return NextResponse.json({ error: "Patient not found" }, { status: 404 });
  }

  const token = mintReportToken(includedTests ? { patientId, dateKey, includedTests } : { patientId, dateKey });
  return NextResponse.json({ token });
}