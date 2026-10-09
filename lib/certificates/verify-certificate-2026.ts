export type CertificateVerificationOutcome =
  | "valid"
  | "revoked"
  | "not_found"
  | "data_inconsistent"
  | "server_error";

export interface CertificateVerificationResult {
  outcome: CertificateVerificationOutcome;
  certificateId: string | null;
  participantName: string | null;
  issuedAt: string | null;
  status: string | null;
}

interface QueryResult {
  data: unknown;
  error: { code?: string; message?: string; details?: string; hint?: string } | null;
}

interface QueryBuilder {
  select(columns: string): QueryBuilder;
  eq(column: string, value: string): QueryBuilder;
  maybeSingle(): Promise<QueryResult>;
}

/**
 * Minimal structural view of the Supabase client used by this service.
 * Keeping it narrow lets tests inject a fake database without any network.
 */
export interface CertificateVerificationDb {
  from(table: string): QueryBuilder;
}

export interface VerifyCertificate2026Options {
  db?: CertificateVerificationDb;
}

const SUPPORTED_STATUSES = new Set(["valid", "revoked"]);

function formatParticipantName(name: string, prefix: string | null): string {
  const trimmedName = typeof name === "string" ? name.trim() : "";
  const trimmedPrefix = typeof prefix === "string" ? prefix.trim() : "";
  return trimmedPrefix ? `${trimmedPrefix} ${trimmedName}`.trim() : trimmedName;
}

function serverError(certificateId: string | null): CertificateVerificationResult {
  return { outcome: "server_error", certificateId, participantName: null, issuedAt: null, status: null };
}

/**
 * Resolve the current, server-side status of a certificate by its exact
 * certificate_id. The database is always the source of truth: a signed URL
 * proves origin only, never validity.
 *
 * Lookup sequence:
 *  1. certificates2026 by exact certificate_id (DB error != missing record)
 *  2. participants2026 by id = participant_id (DB error != missing participant)
 *  3. map the known statuses; unknown values fail safely as data_inconsistent
 */
export async function verifyCertificate2026(
  certificateId: string,
  options: VerifyCertificate2026Options = {},
): Promise<CertificateVerificationResult> {
  const normalizedId = typeof certificateId === "string" ? certificateId.trim() : "";
  if (!normalizedId) {
    return { outcome: "not_found", certificateId: null, participantName: null, issuedAt: null, status: null };
  }

  let db = options.db;
  if (!db) {
    try {
      const { createSupabaseAdminClient } = await import("@/lib/supabase-admin");
      db = createSupabaseAdminClient() as unknown as CertificateVerificationDb;
    } catch (error) {
      console.error("[certificate-verify-2026] admin client unavailable", error);
      return serverError(normalizedId);
    }
  }

  const { data: cert, error: certError } = await db
    .from("certificates2026")
    .select("certificate_id, participant_id, issued_at, status")
    .eq("certificate_id", normalizedId)
    .maybeSingle();

  if (certError) {
    console.error("[certificate-verify-2026] certificate lookup failed", {
      code: certError.code,
      message: certError.message,
    });
    return serverError(normalizedId);
  }

  if (!cert) {
    return { outcome: "not_found", certificateId: normalizedId, participantName: null, issuedAt: null, status: null };
  }

  const certificate = cert as {
    certificate_id: string;
    participant_id: string;
    issued_at: string;
    status: string;
  };

  const { data: participant, error: participantError } = await db
    .from("participants2026")
    .select("name, prefix")
    .eq("id", certificate.participant_id)
    .maybeSingle();

  if (participantError) {
    console.error("[certificate-verify-2026] participant lookup failed", {
      code: participantError.code,
      message: participantError.message,
    });
    return serverError(certificate.certificate_id);
  }

  if (!participant) {
    console.error("[certificate-verify-2026] participant missing for certificate", {
      certificate_id: certificate.certificate_id,
    });
    return {
      outcome: "data_inconsistent",
      certificateId: certificate.certificate_id,
      participantName: null,
      issuedAt: certificate.issued_at,
      status: certificate.status,
    };
  }

  const p = participant as { name: string; prefix: string | null };
  const participantName = formatParticipantName(p.name, p.prefix);
  const status = typeof certificate.status === "string" ? certificate.status.trim().toLowerCase() : "";

  if (!SUPPORTED_STATUSES.has(status)) {
    console.error("[certificate-verify-2026] unsupported status", {
      certificate_id: certificate.certificate_id,
      status: certificate.status,
    });
    return {
      outcome: "data_inconsistent",
      certificateId: certificate.certificate_id,
      participantName,
      issuedAt: certificate.issued_at,
      status: certificate.status,
    };
  }

  return {
    outcome: status === "valid" ? "valid" : "revoked",
    certificateId: certificate.certificate_id,
    participantName,
    issuedAt: certificate.issued_at,
    status: certificate.status,
  };
}
