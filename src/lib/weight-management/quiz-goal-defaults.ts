/** Same midpoints the public weight-management quiz uses for the draft goal. */
const QUIZ_LOSS_KG: Record<string, number> = {
  "1-10": 5.5,
  "10-25": 17.5,
  "25+": 30,
};

function parseKg(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : parseFloat(String(value));
  return Number.isFinite(n) && n > 0 ? n : null;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/** Recreate the quiz projection target from current weight + goal band. */
export function calculateQuizTargetWeightKg(
  currentWeight: unknown,
  weightLossGoal?: string | null
): number | null {
  const current = parseKg(currentWeight);
  if (!current) return null;

  const goal = (weightLossGoal || "").trim();
  let target = current * 0.87;
  if (goal === "unsure") target = current * 0.85;
  else if (goal in QUIZ_LOSS_KG) target = current - QUIZ_LOSS_KG[goal]!;

  return round1(Math.max(target, current * 0.7));
}

/** Prefer the weight stored on the quiz, otherwise the same calculation the quiz uses. */
export function resolveQuizTargetWeightKg(input: {
  storedTargetWeight?: unknown;
  currentWeight?: unknown;
  weightLossGoal?: string | null;
}): number | null {
  const stored = parseKg(input.storedTargetWeight);
  if (stored) return round1(stored);
  return calculateQuizTargetWeightKg(input.currentWeight, input.weightLossGoal);
}

/** YYYY-MM-DD, six calendar months from `from` (local date). */
export function defaultPlanTargetDate(from: Date = new Date()): string {
  const d = new Date(from.getFullYear(), from.getMonth() + 6, from.getDate());
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/** Date-only strings stay on the calendar day the doctor picked. */
export function parsePlanDate(value: string | Date | null | undefined): Date | null {
  if (value == null || value === "") return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const isoDay = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value));
  if (isoDay) {
    const parsed = new Date(Number(isoDay[1]), Number(isoDay[2]) - 1, Number(isoDay[3]));
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}
