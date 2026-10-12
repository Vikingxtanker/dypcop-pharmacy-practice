import { generateCertificateId } from "./certificate-id";

export { CERTIFICATE_PREFIX, generateCertificateId } from "./certificate-id";

export interface CertificateRecord {
  id: string;
  certificate_id: string;
  participant_id: string;
  issued_at: string;
  status: string;
}

export interface CertificateWithParticipant extends CertificateRecord {
  participant_name?: string;
  participant_phone?: string | null;
  participant_prefix?: string | null;
}

export interface CertificateDbError {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
}

interface MaybeSingleResult<T> {
  data: T | null;
  error: CertificateDbError | null;
}

interface CertificateSelectQuery<T> {
  eq(column: string, value: string): CertificateSelectQuery<T>;
  maybeSingle(): Promise<MaybeSingleResult<T>>;
}

interface CertificateInsertQuery<T> {
  select(): { single(): Promise<MaybeSingleResult<T>> };
}

interface CertificateTable<T> {
  select(columns: string): CertificateSelectQuery<T>;
  insert(values: Record<string, unknown>): CertificateInsertQuery<T>;
}

/**
 * Minimal structural view of the Supabase client used for issuance. Keeping it
 * narrow lets tests inject a fake database without a network or credentials.
 */
export interface CertificateDb {
  from(table: string): CertificateTable<CertificateRecord>;
}

export type CertificateDbFactory = () => Promise<CertificateDb>;

async function defaultCertificateDbFactory(): Promise<CertificateDb> {
  const { createSupabaseAdminClient } = await import("@/lib/supabase-admin");
  return createSupabaseAdminClient() as unknown as CertificateDb;
}

/** A Postgres unique-violation on the certificate_id column. */
function isCertificateIdCollision(error: CertificateDbError | null | undefined): boolean {
  return error?.code === "23505" && (error.message?.includes("certificate_id") ?? false);
}

/**
 * Get or create certificate for a participant.
 * One persistent certificate per participant - reuses existing if found.
 *
 * Collisions on the generated certificate_id are retried with a fresh random
 * ID; the database is the source of truth, so a real duplicate (or any other
 * error) still fails loudly.
 */
export async function getOrCreateCertificate(
  participantId: string,
  createDb: CertificateDbFactory = defaultCertificateDbFactory,
  maxRetries = 5,
): Promise<CertificateRecord> {
  const supabase = await createDb();

  // Try to find existing certificate for this participant
  const { data: existing, error: findError } = await supabase
    .from("certificates2026")
    .select("*")
    .eq("participant_id", participantId)
    .maybeSingle();

  if (findError && findError.code !== "PGRST116") {
    throw findError;
  }

  if (existing) {
    return existing;
  }

  // Create new certificate, retrying with a fresh ID on unique collisions.
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const certificateId = generateCertificateId();
    const { data, error } = await supabase
      .from("certificates2026")
      .insert({
        certificate_id: certificateId,
        participant_id: participantId,
        status: "valid",
      })
      .select()
      .single();

    if (!error) {
      return data as CertificateRecord;
    }

    if (!isCertificateIdCollision(error)) {
      throw error;
    }
  }

  throw new Error("Failed to generate unique certificate ID after retries");
}
