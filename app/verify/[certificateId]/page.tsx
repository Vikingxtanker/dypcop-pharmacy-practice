import { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import MainNavbar from "@/components/layout/MainNavbar";
import Footer from "@/components/layout/Footer";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://dypcoppharmacypractice.in";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface CertificateRecord {
  certificate_id: string;
  participant_id: string;
  issued_at: string;
  status: string;
}

interface ParticipantRecord {
  id: string;
  name: string;
  prefix: string | null;
}

interface VerificationData {
  found: boolean;
  status?: string;
  certificateId?: string;
  issuedAt?: string;
  participantName?: string;
  error?: "not_found" | "data_inconsistent" | "server_error";
}

function formatParticipantName(name: string, prefix: string | null): string {
  const trimmedName = name.trim();
  const trimmedPrefix = prefix?.trim();
  if (trimmedPrefix) {
    return `${trimmedPrefix} ${trimmedName}`.trim();
  }
  return trimmedName;
}

function formatIssuedDate(issuedAt: string): string {
  try {
    const date = new Date(issuedAt);
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return issuedAt;
  }
}

async function fetchVerificationData(certificateId: string): Promise<VerificationData> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  if (!supabaseUrl || !supabaseKey) {
    return { found: false, error: "server_error" };
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: cert, error: certError } = await supabase
    .from("certificates2026")
    .select("id, certificate_id, participant_id, issued_at, status")
    .eq("certificate_id", certificateId)
    .maybeSingle();

  if (certError) {
    console.error("certificate-2026 verify: cert lookup failed", certError);
    return { found: false, error: "server_error" };
  }

  if (!cert) {
    return { found: false, error: "not_found", certificateId };
  }

  const certificate = cert as CertificateRecord;

  const { data: participant, error: partError } = await supabase
    .from("participants2026")
    .select("name, prefix")
    .eq("id", certificate.participant_id)
    .maybeSingle();

  if (partError) {
    console.error("certificate-2026 verify: participant lookup failed", partError);
    return { found: false, error: "server_error" };
  }

  if (!participant) {
    console.error("certificate-2026 verify: participant missing for certificate", {
      certificate_id: certificate.certificate_id,
    });
    return { found: false, error: "data_inconsistent", certificateId };
  }

  const p = participant as Pick<ParticipantRecord, "name" | "prefix">;
  const participantName = formatParticipantName(p.name, p.prefix);

  return {
    found: true,
    status: certificate.status,
    certificateId: certificate.certificate_id,
    issuedAt: certificate.issued_at,
    participantName,
  };
}

export async function generateMetadata({
  params,
}: {
  params: { certificateId: string };
}): Promise<Metadata> {
  const certificateId = params.certificateId;
  const title = "Certificate Verification | D.Y. Patil College of Pharmacy";
  const description = "Official certificate verification for D.Y. Patil College of Pharmacy certificates.";

  return {
    title,
    description,
    robots: {
      index: false,
      follow: false,
    },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/certificate-2026/verify/${certificateId}`,
      type: "website",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function CertificateVerifyPage({
  params,
}: {
  params: { certificateId: string };
}) {
  const certificateId = params.certificateId;
  const data = await fetchVerificationData(certificateId);

  const isValid = data.found && data.status === "valid";
  const isRevoked = data.found && data.status === "revoked";
  const notFound = !data.found || data.error === "not_found" || data.error === "data_inconsistent";

  return (
    <>
      <MainNavbar />
      <main className="flex-fill mt-5 pt-5">
        <div className="container py-5">
          <div className="row justify-content-center">
            <div className="col-lg-7 col-md-9">
              <div className="text-center mb-4">
                <h3 className="fw-bold">D.Y. Patil College of Pharmacy</h3>
                <h4 className="mt-2">Certificate Verification</h4>
              </div>
              <div className="bg-white p-4 p-md-5 shadow rounded">
                {isValid && (
                  <>
                    <div className="text-center mb-4">
                      <div className="display-4 text-success mb-2">✓</div>
                      <h4 className="fw-bold text-success">Certificate Verified</h4>
                      <p className="text-muted mt-2">
                        This certificate is recognized as valid by the issuing institution.
                      </p>
                    </div>
                    <div className="mt-4">
                      <div className="mb-3">
                        <div className="small text-uppercase text-muted">Participant</div>
                        <div className="fw-semibold fs-5">{data.participantName}</div>
                      </div>
                      <div className="mb-3">
                        <div className="small text-uppercase text-muted">Certificate ID</div>
                        <div className="fw-semibold">{data.certificateId}</div>
                      </div>
                      <div className="mb-3">
                        <div className="small text-uppercase text-muted">Event</div>
                        <div className="fw-semibold">Health Check-up Camp 2026</div>
                      </div>
                      <div className="mb-3">
                        <div className="small text-uppercase text-muted">Issued</div>
                        <div className="fw-semibold">{formatIssuedDate(data.issuedAt || "")}</div>
                      </div>
                      <div className="mb-3">
                        <div className="small text-uppercase text-muted">Status</div>
                        <div className="fw-semibold text-success">VALID</div>
                      </div>
                    </div>
                  </>
                )}

                {isRevoked && (
                  <>
                    <div className="text-center mb-4">
                      <div className="display-4 text-danger mb-2">✕</div>
                      <h4 className="fw-bold text-danger">Certificate Revoked</h4>
                      <p className="text-muted mt-2">
                        This certificate was previously issued but is no longer valid.
                      </p>
                    </div>
                    <div className="mt-4">
                      <div className="mb-3">
                        <div className="small text-uppercase text-muted">Participant</div>
                        <div className="fw-semibold">{data.participantName}</div>
                      </div>
                      <div className="mb-3">
                        <div className="small text-uppercase text-muted">Certificate ID</div>
                        <div className="fw-semibold">{data.certificateId}</div>
                      </div>
                      <div className="mb-3">
                        <div className="small text-uppercase text-muted">Status</div>
                        <div className="fw-semibold text-danger">REVOKED</div>
                      </div>
                    </div>
                  </>
                )}

                {notFound && (
                  <>
                    <div className="text-center mb-4">
                      <div className="display-4 text-warning mb-2">✕</div>
                      <h4 className="fw-bold text-warning">Certificate Not Found</h4>
                      <p className="text-muted mt-2">
                        We could not find a certificate with this Certificate ID.
                      </p>
                    </div>
                    <div className="mt-4">
                      <div className="mb-3">
                        <div className="small text-uppercase text-muted">Certificate ID</div>
                        <div className="fw-semibold">{certificateId}</div>
                      </div>
                      <p className="text-muted small mt-3">
                        Please check the Certificate ID or scan the QR code from the original certificate.
                      </p>
                    </div>
                  </>
                )}

                {data.error === "server_error" && !notFound && !isValid && !isRevoked && (
                  <>
                    <div className="text-center mb-4">
                      <div className="display-4 text-secondary mb-2">!</div>
                      <h4 className="fw-bold text-secondary">Unable to verify</h4>
                      <p className="text-muted mt-2">
                        Unable to verify this certificate right now. Please try again later.
                      </p>
                    </div>
                  </>
                )}
              </div>
              <div className="text-center mt-4 text-muted small">Official Certificate Verification</div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}