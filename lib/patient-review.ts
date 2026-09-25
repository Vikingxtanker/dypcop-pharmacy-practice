export type MeasurementKind = "height" | "weight";

export interface MeasurementRange {
  min: number;
  max: number;
}

export const MEASUREMENT_RANGES: Record<MeasurementKind, MeasurementRange> = {
  height: { min: 50, max: 300 },
  weight: { min: 1, max: 500 },
};

export const HISTORY_MAX_LENGTH = 10000;

/** Canonical dated-measurement test types stored in the existing patient_tests table. */
export const MEASUREMENT_TEST_TYPES = {
  height: "Height",
  weight: "Weight",
  bmi: "BMI",
} as const;

export const MEASUREMENT_UNITS = {
  height: "cm",
  weight: "kg",
  bmi: "kg/m\u00b2",
} as const;

export interface MeasurementRow {
  patient_id: string;
  test_type: string;
  value_numeric: number;
  unit: string;
}

export function isValidMeasurement(value: number, kind: MeasurementKind): boolean {
  if (!Number.isFinite(value)) return false;
  const { min, max } = MEASUREMENT_RANGES[kind];
  return value >= min && value <= max;
}

/**
 * Parses an optional client-supplied measurement. Empty, null, or undefined are
 * treated as "not provided" (null). Invalid or out-of-range values carry an
 * error so the server never records a misleading measurement.
 */
export function parseOptionalMeasurement(
  value: unknown,
  kind: MeasurementKind,
): { value: number | null; error?: string } {
  if (value === undefined || value === null || value === "") return { value: null };
  if (typeof value !== "string" && typeof value !== "number") {
    return { value: null, error: `Invalid ${kind} value.` };
  }
  const trimmed = typeof value === "string" ? value.trim() : String(value);
  if (trimmed === "") return { value: null };
  const num = typeof value === "number" ? value : parseFloat(trimmed);
  if (!Number.isFinite(num)) {
    return { value: null, error: `Invalid ${kind} value.` };
  }
  if (!isValidMeasurement(num, kind)) {
    const { min, max } = MEASUREMENT_RANGES[kind];
    const label = kind === "height" ? "Height" : "Weight";
    return {
      value: null,
      error: `${label} must be between ${min} and ${max} ${MEASUREMENT_UNITS[kind]}.`,
    };
  }
  return { value: num };
}

export function sanitizeHistory(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, HISTORY_MAX_LENGTH);
}

/**
 * BMI = weight_kg / (height_m)^2, rounded to one decimal to match the existing
 * registration convention (register page uses bmi.toFixed(1)). Returns null
 * when either input is missing or invalid so no false BMI is ever produced.
 */
export function computeBmi(heightCm: number, weightKg: number): number | null {
  if (!Number.isFinite(heightCm) || !Number.isFinite(weightKg)) return null;
  if (heightCm <= 0 || weightKg <= 0) return null;
  const heightM = heightCm / 100;
  const raw = weightKg / (heightM * heightM);
  return Math.round(raw * 10) / 10;
}

export interface ReviewSubmission {
  patientId: string;
  heightCm: number | null;
  weightKg: number | null;
  bmi: number | null;
  pastMedical: string;
  pastMedication: string;
}

/**
 * Validates an untrusted client submission and recomputes the BMI server-side.
 * A client-supplied BMI is deliberately ignored — BMI is always derived from the
 * submitted height and weight, and only when both are present.
 */
export function prepareReviewSubmission(
  body: Record<string, unknown>,
): { ok: true; submission: ReviewSubmission } | { ok: false; error: string } {
  const patientId = typeof body.patientId === "string" ? body.patientId.trim() : "";
  if (!patientId) return { ok: false, error: "patientId is required." };

  const height = parseOptionalMeasurement(body.heightCm, "height");
  if (height.error) return { ok: false, error: height.error };

  const weight = parseOptionalMeasurement(body.weightKg, "weight");
  if (weight.error) return { ok: false, error: weight.error };

  const bmi = height.value !== null && weight.value !== null ? computeBmi(height.value, weight.value) : null;

  return {
    ok: true,
    submission: {
      patientId,
      heightCm: height.value,
      weightKg: weight.value,
      bmi,
      pastMedical: sanitizeHistory(body.pastMedical),
      pastMedication: sanitizeHistory(body.pastMedication),
    },
  };
}

/** Builds the patient_tests rows for today's dated measurements (only for provided values). */
export function buildMeasurementRows(
  patientId: string,
  heightCm: number | null,
  weightKg: number | null,
  bmi: number | null,
): MeasurementRow[] {
  const rows: MeasurementRow[] = [];
  if (heightCm !== null) {
    rows.push({ patient_id: patientId, test_type: MEASUREMENT_TEST_TYPES.height, value_numeric: heightCm, unit: MEASUREMENT_UNITS.height });
  }
  if (weightKg !== null) {
    rows.push({ patient_id: patientId, test_type: MEASUREMENT_TEST_TYPES.weight, value_numeric: weightKg, unit: MEASUREMENT_UNITS.weight });
  }
  if (bmi !== null) {
    rows.push({ patient_id: patientId, test_type: MEASUREMENT_TEST_TYPES.bmi, value_numeric: bmi, unit: MEASUREMENT_UNITS.bmi });
  }
  return rows;
}