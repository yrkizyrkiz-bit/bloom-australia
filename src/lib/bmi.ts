/** Round a finite number to one decimal place. */
export function roundToOneDecimal(value: number): number {
  return Math.round((value + Number.EPSILON) * 10) / 10;
}

function toPositiveNumber(value: unknown): number | null {
  const n =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number.parseFloat(value)
        : NaN;
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

function heightToMetres(heightCmOrM: number): number | null {
  if (heightCmOrM >= 50 && heightCmOrM <= 300) return heightCmOrM / 100;
  if (heightCmOrM >= 1.2 && heightCmOrM <= 2.5) return heightCmOrM;
  return null;
}

/** Round a stored BMI to one decimal. Returns null when the value is not a positive number. */
export function roundBmi(bmi: unknown): number | null {
  const n = toPositiveNumber(bmi);
  if (n == null) return null;
  return roundToOneDecimal(n);
}

/**
 * BMI from weight (kg) and height (cm, or metres if the value is clearly in that range).
 * Always rounded to one decimal.
 */
export function calculateBmi(weightKg: unknown, heightCm: unknown): number | null {
  const weight = toPositiveNumber(weightKg);
  const height = toPositiveNumber(heightCm);
  if (weight == null || height == null) return null;
  const heightM = heightToMetres(height);
  if (heightM == null) return null;
  return roundToOneDecimal(weight / (heightM * heightM));
}

/** Prefer a fresh calculation from weight/height; otherwise round a stored BMI. */
export function resolveBmi(options: {
  storedBmi?: unknown;
  weightKg?: unknown;
  heightCm?: unknown;
}): number | null {
  const calculated = calculateBmi(options.weightKg, options.heightCm);
  if (calculated != null) return calculated;
  return roundBmi(options.storedBmi);
}

export function formatBmi(bmi: unknown): string {
  const rounded = roundBmi(bmi);
  return rounded == null ? "N/A" : rounded.toFixed(1);
}
