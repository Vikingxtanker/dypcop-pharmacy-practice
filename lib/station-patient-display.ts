export interface PatientClinicalInfo {
  height?: number | string | null;
  weight?: number | string | null;
  bmi?: number | string | null;
  past_medical?: string | null;
  past_medication?: string | null;
}

export function displayNumber(v: number | string | null | undefined): string | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "string" ? parseFloat(v) : v;
  if (!Number.isFinite(n)) return null;
  return String(n);
}

export function displayHistory(v: string | null | undefined): string {
  const t = v?.trim();
  return t ? t : "None recorded";
}

export function formatMeasurementLine(p: PatientClinicalInfo): string {
  const h = displayNumber(p.height) ?? "—";
  const w = displayNumber(p.weight) ?? "—";
  const b = displayNumber(p.bmi) ?? "—";
  return `Height: ${h} cm | Weight: ${w} kg | BMI: ${b} kg/m²`;
}