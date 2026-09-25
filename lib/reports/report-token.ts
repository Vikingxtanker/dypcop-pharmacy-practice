import { createHmac, timingSafeEqual } from "node:crypto";
import { normalizeIncludedTests } from "./patient-report-data.ts";

const DEV_FALLBACK_SECRET = "dyp-health-screening-report-dev-secret";

const getSecret = (): string => process.env.REPORT_TOKEN_SECRET || DEV_FALLBACK_SECRET;

export interface ReportTokenPayload {
  patientId: string;
  dateKey: string;
  /** Canonical reportable test ids; omitted/undefined means "include all". */
  includedTests?: string[];
}

export function mintReportToken(payload: ReportTokenPayload): string {
  const encodedPayload = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = createHmac("sha256", getSecret()).update(encodedPayload).digest().subarray(0, 16);
  return `${encodedPayload}.${signature.toString("base64url")}`;
}

export function redeemReportToken(token: string): ReportTokenPayload | null {
  if (!token || token.length > 4096) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [encodedPayload, encodedSignature] = parts;
  if (!encodedPayload || !encodedSignature) return null;
  try {
    const expected = createHmac("sha256", getSecret()).update(encodedPayload).digest().subarray(0, 16);
    const provided = Buffer.from(encodedSignature, "base64url");
    if (provided.length !== expected.length || !timingSafeEqual(expected, provided)) return null;
    const parsed: unknown = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
    if (typeof parsed !== "object" || parsed === null) return null;
    const candidate = parsed as Record<string, unknown>;
    if (typeof candidate.patientId !== "string" || typeof candidate.dateKey !== "string") return null;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(candidate.dateKey)) return null;
    if (!candidate.patientId.trim() || candidate.patientId.length > 128) return null;
    const payload: ReportTokenPayload = {
      patientId: candidate.patientId,
      dateKey: candidate.dateKey,
    };
    if ("includedTests" in candidate) {
      const normalized = normalizeIncludedTests(candidate.includedTests);
      if (normalized === null) return null;
      payload.includedTests = normalized;
    }
    return payload;
  } catch {
    return null;
  }
}

export function getReportOrigin(fallbackOrigin?: string): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  const origin = configured || fallbackOrigin || "https://dypcoppharmacypractice.in";
  return origin.replace(/\/+$/, "");
}

export function buildReportUrl(payload: ReportTokenPayload, fallbackOrigin?: string): string {
  return `${getReportOrigin(fallbackOrigin)}/report/${mintReportToken(payload)}`;
}