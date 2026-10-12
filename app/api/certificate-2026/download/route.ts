import { NextRequest, NextResponse } from "next/server";
import { markCertificateDownloaded } from "@/lib/certificates/certificate-download";

export const runtime = "nodejs";

/**
 * Server-side certificate download tracking.
 *
 * Marks an existing certificate as downloaded. This runs on the server so the
 * service-role key never reaches the browser, and it can only ever flip the
 * `downloaded` column to true for the exact certificate_id it is given. The
 * request is validated (shape + existing certificate id format) and the row
 * must exist; arbitrary fields/records cannot be modified.
 */
export async function POST(request: NextRequest) {
  let body: { certificateId?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const certificateId = typeof body.certificateId === "string" ? body.certificateId.trim() : "";
  const outcome = await markCertificateDownloaded(certificateId);

  switch (outcome) {
    case "marked":
    case "already_downloaded":
      return NextResponse.json({ ok: true, downloaded: true });
    case "invalid_id":
      return NextResponse.json({ error: "Invalid certificateId" }, { status: 400 });
    case "not_found":
      return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
    case "server_error":
    default:
      return NextResponse.json({ error: "Failed to record download" }, { status: 500 });
  }
}
