import { DOSE_SCHEDULE_TIMEZONE } from "@/lib/program/dose-schedule";

export const HAIR_FEELING_QUESTIONS = [
  {
    key: "overallFeeling",
    label: "How do you feel about your hair this week?",
    low: "Discouraged",
    high: "Encouraged",
  },
  {
    key: "sheddingLevel",
    label: "How has shedding been this week?",
    low: "Heavier than usual",
    high: "Much less shedding",
  },
  {
    key: "scalpComfort",
    label: "How does your scalp feel?",
    low: "Itchy or irritated",
    high: "Calm and comfortable",
  },
  {
    key: "confidence",
    label: "How confident do you feel about your hair?",
    low: "Low",
    high: "Strong",
  },
] as const;

export const HAIR_PHOTO_ANGLES = [
  { id: "hairline", label: "Hairline" },
  { id: "crown", label: "Crown" },
  { id: "side", label: "Side / part" },
] as const;

export type HairPhotoAngle = (typeof HAIR_PHOTO_ANGLES)[number]["id"];

export type HairCheckInPhoto = {
  id: string;
  angle: HairPhotoAngle | string;
  imageData: string;
  capturedAt: string;
};

export function hairWeekKey(now = new Date(), timeZone = DOSE_SCHEDULE_TIMEZONE): string {
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

export function alreadyCheckedInHairWeek(
  lastWeekKey: string | null | undefined,
  now = new Date()
): boolean {
  return Boolean(lastWeekKey) && lastWeekKey === hairWeekKey(now);
}

export function clampHairRating(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return 3;
  return Math.min(5, Math.max(1, Math.round(n)));
}
