import { DOSE_SCHEDULE_TIMEZONE } from "@/lib/program/dose-schedule";

export const SEXUAL_CHECK_IN_TITLE = "Sexual Health Weekly Check-in";
/** @deprecated Use SEXUAL_CHECK_IN_TITLE */
export const SEXUAL_CHECKIN_NOTE_TITLE = SEXUAL_CHECK_IN_TITLE;

export const SEXUAL_CONFIDENCE_QUESTION = {
  key: "confidence",
  label: "How confident did you feel with erections this week?",
  low: "Not confident",
  high: "Very confident",
} as const;

export const SEXUAL_FEELING_QUESTIONS = [SEXUAL_CONFIDENCE_QUESTION] as const;

export const SEXUAL_SIDE_EFFECT_OPTIONS = [
  { id: "none", label: "None" },
  { id: "headache", label: "Headache" },
  { id: "flushing", label: "Flushing" },
  { id: "nasal", label: "Nasal congestion" },
  { id: "indigestion", label: "Indigestion" },
  { id: "other", label: "Other" },
] as const;

export type SexualSideEffectId = (typeof SEXUAL_SIDE_EFFECT_OPTIONS)[number]["id"];

export type SexualCheckInContent = {
  weekKey: string;
  confidence: number;
  sideEffects: SexualSideEffectId;
  notes: string | null;
  completedAt: string;
};

export function sexualWeekKey(now = new Date(), timeZone = DOSE_SCHEDULE_TIMEZONE): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).formatToParts(now);

  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const day = Number(parts.find((part) => part.type === "day")?.value);
  const weekday = parts.find((part) => part.type === "weekday")?.value || "Mon";
  const weekdayIndex = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(weekday);
  const date = new Date(Date.UTC(year, month - 1, day));
  const mondayOffset = weekdayIndex === 0 ? -6 : 1 - weekdayIndex;
  date.setUTCDate(date.getUTCDate() + mondayOffset);

  const jan1 = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.floor((date.getTime() - jan1.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

export function alreadyCheckedInSexualWeek(
  lastWeekKey: string | null | undefined,
  now = new Date()
): boolean {
  return Boolean(lastWeekKey) && lastWeekKey === sexualWeekKey(now);
}

export function clampSexualRating(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return 3;
  return Math.min(5, Math.max(1, Math.round(n)));
}

export function normalizeSexualSideEffect(value: unknown): SexualSideEffectId {
  if (typeof value === "string") {
    const match = SEXUAL_SIDE_EFFECT_OPTIONS.find((o) => o.id === value);
    if (match) return match.id;
  }
  if (Array.isArray(value)) {
    const first = value.find(
      (item): item is string =>
        typeof item === "string" && SEXUAL_SIDE_EFFECT_OPTIONS.some((o) => o.id === item)
    );
    if (first) return first as SexualSideEffectId;
  }
  return "none";
}

export function parseSexualCheckInContent(
  content: string | null | undefined
): SexualCheckInContent | null {
  if (!content) return null;
  try {
    const parsed = JSON.parse(content) as Partial<SexualCheckInContent> & {
      sideEffects?: string | string[];
    };
    if (!parsed?.weekKey) return null;
    return {
      weekKey: parsed.weekKey,
      confidence: clampSexualRating(parsed.confidence),
      sideEffects: normalizeSexualSideEffect(parsed.sideEffects),
      notes: typeof parsed.notes === "string" ? parsed.notes : null,
      completedAt:
        typeof parsed.completedAt === "string"
          ? parsed.completedAt
          : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

/** @deprecated Alias for parseSexualCheckInContent */
export const parseSexualCheckInNote = parseSexualCheckInContent;

export function serializeSexualCheckInContent(
  input: SexualCheckInContent
): string {
  return JSON.stringify({
    weekKey: input.weekKey,
    confidence: clampSexualRating(input.confidence),
    sideEffects: normalizeSexualSideEffect(input.sideEffects),
    notes: input.notes?.trim() || null,
    completedAt: input.completedAt || new Date().toISOString(),
  });
}
