import { readFile } from "node:fs/promises";
import path from "node:path";
import { createReportQrDataUri } from "./report-qr";
import type { PatientHealthScreeningReportData } from "./patient-report-data";

export interface ReportAssets {
  logoSrc: string;
  qrSrc: string | null;
}

let cachedLogoDataUri: string | null = null;

const detectImageMime = (bytes: Buffer): string => {
  if (bytes[0] === 0x89 && bytes[1] === 0x50) return "image/png";
  if (bytes[0] === 0xff && bytes[1] === 0xd8) return "image/jpeg";
  return "image/jpeg";
};

export async function loadLogoDataUri(): Promise<string> {
  if (cachedLogoDataUri) return cachedLogoDataUri;
  const candidate = path.join(process.cwd(), "public", "assets", "DYP_LOGO_RED.jpg");
  try {
    const bytes = await readFile(candidate);
    cachedLogoDataUri = `data:${detectImageMime(bytes)};base64,${bytes.toString("base64")}`;
    return cachedLogoDataUri;
  } catch {
    // fall through to network fetch below
  }
  const origin = (process.env.NEXT_PUBLIC_SITE_URL || "https://dypcoppharmacypractice.in").replace(/\/+$/, "");
  const res = await fetch(`${origin}/assets/DYP_LOGO_RED.jpg`);
  if (!res.ok) throw new Error("Could not load DYP_LOGO_RED.jpg for the report");
  const bytes = Buffer.from(await res.arrayBuffer());
  cachedLogoDataUri = `data:${detectImageMime(bytes)};base64,${bytes.toString("base64")}`;
  return cachedLogoDataUri;
}

export async function resolveReportAssets(
  data: PatientHealthScreeningReportData,
): Promise<ReportAssets> {
  const [logoSrc, qrSrc] = await Promise.all([
    loadLogoDataUri(),
    data.onlineReportUrl ? createReportQrDataUri({ url: data.onlineReportUrl }) : Promise.resolve(null),
  ]);
  return { logoSrc, qrSrc };
}