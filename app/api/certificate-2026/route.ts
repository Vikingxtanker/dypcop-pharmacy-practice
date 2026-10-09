import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getOrCreateCertificate } from "@/lib/certificates/certificate-2026";
import { buildCertificateViewUrl } from "@/lib/certificates/certificate-token";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let body: { participantId?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const participantId = typeof body.participantId === "string" ? body.participantId.trim() : "";
  if (!participantId) {
    return NextResponse.json({ error: "participantId is required" }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Validate participant exists (server-side). Browser must never supply certificate fields.
  const { data: participant, error: participantError } = await supabase
    .from("participants2026")
    .select("id, name, phone, prefix")
    .eq("id", participantId)
    .maybeSingle();

  if (participantError || !participant) {
    return NextResponse.json({ error: "Participant not found" }, { status: 404 });
  }

  try {
    const cert = await getOrCreateCertificate(participantId);
    // The signed verification URL is built server-side; the signing secret
    // never reaches the browser. Callers use this as the QR payload.
    const verifyUrl = buildCertificateViewUrl(cert.certificate_id);
    return NextResponse.json({
      ok: true,
      certificate: {
        certificate_id: cert.certificate_id,
        participant_id: cert.participant_id,
        issued_at: cert.issued_at,
        status: cert.status,
      },
      verifyUrl,
      participant: {
        name: participant.name,
        phone: participant.phone,
        prefix: participant.prefix,
      },
    });
  } catch (error) {
    console.error("certificate-2026 issuance failed", error);
    return NextResponse.json({ error: "Failed to issue certificate" }, { status: 500 });
  }
}