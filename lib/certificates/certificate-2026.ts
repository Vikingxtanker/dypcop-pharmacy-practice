import { randomBytes } from "node:crypto";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

export const CERTIFICATE_PREFIX = "HC26";

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

/**
 * Generate a secure certificate ID in format HC26-XXXXXXXX
 * X represents 8 random alphanumeric characters (uppercase)
 */
export function generateCertificateId(): string {
  const bytes = randomBytes(4);
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += chars[bytes[i] & 0x1f];
  }
  // Ensure we use all 8 chars from random
  if (result.length < 8) {
    const extra = randomBytes(8);
    for (let i = result.length; i < 8; i++) {
      result += chars[extra[i] & 0x1f];
    }
  }
  return `${CERTIFICATE_PREFIX}-${result.slice(0, 8)}`;
}

/**
 * Get or create certificate for a participant
 * One persistent certificate per participant - reuses existing if found
 */
export async function getOrCreateCertificate(participantId: string): Promise<CertificateRecord> {
  const supabase = createSupabaseAdminClient();

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
    return existing as CertificateRecord;
  }

  // Create new certificate with unique ID
  let certificateId = generateCertificateId();
  let retries = 0;
  const maxRetries = 5;

  while (retries < maxRetries) {
    try {
      const { data, error } = await supabase
        .from("certificates2026")
        .insert({
          certificate_id: certificateId,
          participant_id: participantId,
          status: "valid",
        })
        .select()
        .single();

      if (error) {
        // If duplicate key on certificate_id, generate new one and retry
        if (error.code === "23505" && error.message.includes("certificate_id")) {
          certificateId = generateCertificateId();
          retries++;
          continue;
        }
        throw error;
      }
      return data as CertificateRecord;
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      if (error?.code === "23505" && error?.message?.includes("certificate_id")) {
        certificateId = generateCertificateId();
        retries++;
        continue;
      }
      throw err;
    }
  }

  throw new Error("Failed to generate unique certificate ID after retries");
}