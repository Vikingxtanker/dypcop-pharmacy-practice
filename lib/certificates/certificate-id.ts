import { randomBytes } from "node:crypto";

export const CERTIFICATE_PREFIX = "HC26";

/** Random suffix length; keeps the historical HC26-XXXXXXXX shape. */
export const CERTIFICATE_SUFFIX_LENGTH = 8;

/**
 * Human-friendly uppercase alphanumeric alphabet (A-Z, 0-9). Every character
 * has the same probability of being drawn.
 */
export const CERTIFICATE_SUFFIX_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

/** Shape produced by `generateCertificateId` (and accepted by verification). */
export const CERTIFICATE_ID_PATTERN = /^HC26-[A-Z0-9]{8}$/;

/**
 * A cryptographically secure source of random bytes. Defaults to node:crypto's
 * `randomBytes`; injectable only so tests can pin the exact byte->character
 * mapping.
 */
export type RandomByteSource = (size: number) => Buffer;

/**
 * Largest multiple of the alphabet length that fits in a byte. Bytes at or
 * above this value are rejected and redrawn, which removes modulo bias so
 * `byte % alphabet.length` is uniform over the whole alphabet.
 */
const UNBIASED_BYTE_CEILING = 256 - (256 % CERTIFICATE_SUFFIX_ALPHABET.length);

/**
 * Generate a certificate ID in the form HC26-XXXXXXXX.
 *
 * The 8-character suffix is drawn from `node:crypto` random bytes using
 * rejection sampling over the uppercase alphanumeric alphabet. It is uniformly
 * random, has no fixed padding or trailing characters, and is never derived
 * from a timestamp, sequence number, participant id, name or phone number.
 */
export function generateCertificateId(randomSource: RandomByteSource = randomBytes): string {
  let suffix = "";
  while (suffix.length < CERTIFICATE_SUFFIX_LENGTH) {
    const bytes = randomSource(CERTIFICATE_SUFFIX_LENGTH - suffix.length);
    for (const byte of bytes) {
      if (byte >= UNBIASED_BYTE_CEILING) continue;
      suffix += CERTIFICATE_SUFFIX_ALPHABET[byte % CERTIFICATE_SUFFIX_ALPHABET.length];
      if (suffix.length === CERTIFICATE_SUFFIX_LENGTH) break;
    }
  }
  return `${CERTIFICATE_PREFIX}-${suffix}`;
}
