import { normalizeCertificateId } from "./certificate-token";

/**
 * Outcome of a download-tracking attempt. Mirrors the outcome-union style used
 * by the rest of the certificate server code so the API route only maps values
 * to HTTP statuses and never handles raw database errors.
 */
export type CertificateDownloadOutcome =
  | "marked"
  | "already_downloaded"
  | "not_found"
  | "invalid_id"
  | "server_error";

export interface CertificateDownloadDbError {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
}

interface DownloadRow {
  certificate_id: string;
  downloaded: boolean;
}

interface MaybeSingleResult<T> {
  data: T | null;
  error: CertificateDownloadDbError | null;
}

interface SelectQuery {
  eq(column: string, value: string): {
    maybeSingle(): Promise<MaybeSingleResult<DownloadRow>>;
  };
}

interface UpdateQuery {
  eq(column: string, value: string): Promise<{ data: unknown; error: CertificateDownloadDbError | null }>;
}

/**
 * Minimal structural view of the Supabase client used for tracking. Keeping it
 * narrow lets tests inject a fake database without a network or credentials.
 */
export interface CertificateDownloadDb {
  from(table: string): {
    select(columns: string): SelectQuery;
    update(values: { downloaded: boolean }): UpdateQuery;
  };
}

export interface MarkCertificateDownloadedOptions {
  /** Injectable database (tests). Defaults to the server-only admin client. */
  db?: CertificateDownloadDb;
}

async function defaultCertificateDownloadDb(): Promise<CertificateDownloadDb> {
  const { createSupabaseAdminClient } = await import("@/lib/supabase-admin");
  return createSupabaseAdminClient() as unknown as CertificateDownloadDb;
}

/**
 * Record a successful certificate PDF download.
 *
 * Tracked event: this is called once the browser download has been initiated
 * for a certificate PDF. It only ever sets the `downloaded` column to true on
 * the single row matching the exact certificate_id; it never resets it and
 * never touches any other column.
 *
 * The update is idempotent: if the certificate is already marked downloaded, no
 * write occurs. The row is looked up first so a nonexistent certificate is
 * reported instead of silently "succeeding".
 */
export async function markCertificateDownloaded(
  certificateId: unknown,
  options: MarkCertificateDownloadedOptions = {},
): Promise<CertificateDownloadOutcome> {
  const normalized = normalizeCertificateId(certificateId);
  if (!normalized) return "invalid_id";

  let db = options.db;
  if (!db) {
    try {
      db = await defaultCertificateDownloadDb();
    } catch (error) {
      console.error("[certificate-download] admin client unavailable", error);
      return "server_error";
    }
  }

  const { data, error } = await db
    .from("certificates2026")
    .select("certificate_id, downloaded")
    .eq("certificate_id", normalized)
    .maybeSingle();

  if (error) {
    console.error("[certificate-download] certificate lookup failed", {
      code: error.code,
      message: error.message,
    });
    return "server_error";
  }

  if (!data) return "not_found";
  if (data.downloaded) return "already_downloaded";

  const { error: updateError } = await db
    .from("certificates2026")
    .update({ downloaded: true })
    .eq("certificate_id", normalized);

  if (updateError) {
    console.error("[certificate-download] certificate update failed", {
      code: updateError.code,
      message: updateError.message,
    });
    return "server_error";
  }

  return "marked";
}
