import { createHmac, timingSafeEqual } from "node:crypto";

const DEV_FALLBACK_SECRET = "dyp-health-camp-2026-certificate-dev-secret";
const TOKEN_PURPOSE = "certificate-2026";
const MAX_TOKEN_LENGTH = 4096;
const CERTIFICATE_ID_PATTERN = /^[A-Z0-9]{2,12}-[A-Z0-9]{6,32}$/;
const DEFAULT_ORIGIN = "https://dypcoppharmacypractice.in";

const getSecret = (): string => process.env.CERTIFICATE_TOKEN_SECRET || DEV_FALLBACK_SECRET;

/**
 * Certificate IDs are stored uppercase and match HC26-XXXXXXXX.
 * This helper trims surrounding whitespace and enforces the expected shape so
 * malformed values never reach a database lookup or a signed payload.
 */
export function normalizeCertificateId(certificateId: unknown): string | null {
  if (typeof certificateId !== "string") return null;
  const trimmed = certificateId.trim();
  if (!trimmed || trimmed.length > 64) return null;
  if (!CERTIFICATE_ID_PATTERN.test(trimmed)) return null;
  return trimmed;
}

interface CertificateTokenPayload {
  purpose: typeof TOKEN_PURPOSE;
  certificateId: string;
}

/**
 * Mint a certificate-specific signed token.
 * The token is bound to this feature through both a dedicated signing secret
 * and an explicit purpose claim, so it can never be redeemed as a report token.
 */
export function mintCertificateToken(certificateId: string): string {
  const normalized = normalizeCertificateId(certificateId);
  if (!normalized) throw new Error("Invalid certificate id");
  const payload: CertificateTokenPayload = { purpose: TOKEN_PURPOSE, certificateId: normalized };
  const encodedPayload = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = createHmac("sha256", getSecret()).update(encodedPayload).digest();
  return `${encodedPayload}.${signature.toString("base64url")}`;
}

/**
 * Validate a certificate token and return its certificate id, or null when the
 * token is malformed, tampered, wrongly signed, or not a certificate token.
 */
export function redeemCertificateToken(token: string): { certificateId: string } | null {
  if (!token || typeof token !== "string" || token.length > MAX_TOKEN_LENGTH) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [encodedPayload, encodedSignature] = parts;
  if (!encodedPayload || !encodedSignature) return null;
  try {
    const expected = createHmac("sha256", getSecret()).update(encodedPayload).digest();
    const provided = Buffer.from(encodedSignature, "base64url");
    if (provided.length !== expected.length || !timingSafeEqual(expected, provided)) return null;
    const parsed: unknown = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
    if (typeof parsed !== "object" || parsed === null) return null;
    const candidate = parsed as Record<string, unknown>;
    if (candidate.purpose !== TOKEN_PURPOSE) return null;
    const certificateId = normalizeCertificateId(candidate.certificateId);
    if (!certificateId) return null;
    return { certificateId };
  } catch {
    return null;
  }
}

export function getCertificateOrigin(fallbackOrigin?: string): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  const origin = configured || fallbackOrigin || DEFAULT_ORIGIN;
  return origin.replace(/\/+$/, "");
}

/**
 * Canonical signed certificate-view URL:
 * https://dypcoppharmacypractice.in/certificate-2026/view/<signed-token>
 */
export function buildCertificateViewUrl(certificateId: string, fallbackOrigin?: string): string {
  return `${getCertificateOrigin(fallbackOrigin)}/certificate-2026/view/${mintCertificateToken(certificateId)}`;
}
