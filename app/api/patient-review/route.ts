import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { prepareReviewSubmission } from "@/lib/patient-review";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const prepared = prepareReviewSubmission(body);
  if (!prepared.ok) {
    return NextResponse.json({ error: prepared.error }, { status: 400 });
  }
  const { submission } = prepared;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  );

  // RLS-scoped lookup: a patient hidden from the calling role is indistinguishable
  // from a nonexistent one, so cross-organization updates stay impossible.
  const { data: patient, error: patientError } = await supabase
    .from("patients")
    .select("id")
    .eq("id", submission.patientId)
    .maybeSingle();

  if (patientError || !patient) {
    return NextResponse.json({ error: "Patient not found" }, { status: 404 });
  }

  // Atomic server-side mutation. The RPC recomputes nothing itself but records the
  // server-derived BMI and authoritative timestamp in a single transaction; RLS
  // still applies because the function is SECURITY INVOKER.
  const { data, error } = await supabase.rpc("record_patient_review", {
    p_patient_id: submission.patientId,
    p_height_cm: submission.heightCm,
    p_weight_kg: submission.weightKg,
    p_bmi: submission.bmi,
    p_past_medical: submission.pastMedical,
    p_past_medication: submission.pastMedication,
  });

  if (error) {
    console.error("patient-review: record_patient_review failed", error);
    return NextResponse.json({ error: "Failed to save the patient review. No changes were written." }, { status: 500 });
  }

  const record = Array.isArray(data) ? data[0] : data;
  return NextResponse.json({
    ok: true,
    patientId: submission.patientId,
    bmi: submission.bmi,
    savedFields: {
      height: submission.heightCm !== null,
      weight: submission.weightKg !== null,
      bmi: submission.bmi !== null,
    },
    updatedAt: record?.updated_at ?? null,
  });
}