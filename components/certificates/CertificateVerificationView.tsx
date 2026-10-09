import MainNavbar from "@/components/layout/MainNavbar";
import Footer from "@/components/layout/Footer";
import type { CertificateVerificationResult } from "@/lib/certificates/verify-certificate-2026";

interface CertificateVerificationViewProps {
  result: CertificateVerificationResult;
  /** Set when a signed view link failed signature/payload validation. */
  invalidLink?: boolean;
}

function formatIssuedDate(issuedAt: string | null): string {
  if (!issuedAt) return "—";
  const date = new Date(issuedAt);
  if (Number.isNaN(date.getTime())) return issuedAt;
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function DetailRow({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="mb-3">
      <div className="small text-uppercase text-muted">{label}</div>
      <div className={`fw-semibold${tone ? ` ${tone}` : ""}`}>{value}</div>
    </div>
  );
}

export default function CertificateVerificationView({ result, invalidLink = false }: CertificateVerificationViewProps) {
  const isValid = result.outcome === "valid";
  const isRevoked = result.outcome === "revoked";
  const notFound = !invalidLink && result.outcome === "not_found";
  const unableToVerify = invalidLink || result.outcome === "data_inconsistent" || result.outcome === "server_error";

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
                      <DetailRow label="Participant" value={result.participantName || "—"} />
                      <DetailRow label="Certificate ID" value={result.certificateId || "—"} />
                      <DetailRow label="Event" value="Health Check-up Camp 2026" />
                      <DetailRow label="Issued" value={formatIssuedDate(result.issuedAt)} />
                      <DetailRow label="Status" value="VALID" tone="text-success" />
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
                      <DetailRow label="Participant" value={result.participantName || "—"} />
                      <DetailRow label="Certificate ID" value={result.certificateId || "—"} />
                      <DetailRow label="Event" value="Health Check-up Camp 2026" />
                      <DetailRow label="Issued" value={formatIssuedDate(result.issuedAt)} />
                      <DetailRow label="Status" value="REVOKED" tone="text-danger" />
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
                      <DetailRow label="Certificate ID" value={result.certificateId || "—"} />
                      <p className="text-muted small mt-3">
                        Please check the Certificate ID or scan the QR code from the original certificate.
                      </p>
                    </div>
                  </>
                )}

                {unableToVerify && (
                  <>
                    <div className="text-center mb-4">
                      <div className="display-4 text-secondary mb-2">!</div>
                      <h4 className="fw-bold text-secondary">Unable to verify</h4>
                      <p className="text-muted mt-2">
                        {invalidLink
                          ? "This verification link is invalid or has been altered. Please scan the QR code from the original certificate."
                          : "Unable to verify this certificate right now. Please try again later."}
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
