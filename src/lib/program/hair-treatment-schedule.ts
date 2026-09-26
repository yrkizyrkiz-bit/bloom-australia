import { getCalendarDateKey, parseDoseIntervalDays } from "@/lib/program/dose-schedule";
import { parseUtcDateOnly } from "@/lib/program/member-schedule";

export const HAIR_MAX_SCHEDULE_DAYS = 90;
export const HAIR_DEFAULT_SUPPLY_DAYS = 28;

const HAIR_FREQUENCY_LABELS: Record<string, string> = {
  once_daily: "Once daily",
  twice_daily: "Twice daily",
  once_weekly: "Once weekly",
  every_other_day: "Every other day",
  as_needed: "As needed",
};

function normalizeHairFrequency(frequency: string): string {
  return frequency.toLowerCase().replace(/[_-]+/g, " ").trim();
}

export function isDoctorCompletedHairPrescription(rx: {
  category?: string | null;
  status?: string | null;
}): boolean {
  return rx.category === "HAIR_LOSS" && rx.status === "ACTIVE";
}

export function hairDosesPerDay(frequency: string): number {
  const f = normalizeHairFrequency(frequency);
  if (/\btwice\b|\btwo times\b|\b2x\b|\b2 times\b/.test(f)) return 2;
  if (/\bthree times\b|\bthrice\b|\b3x\b/.test(f)) return 3;
  return 1;
}

export function parseHairDoseIntervalDays(frequency: string): number {
  const f = normalizeHairFrequency(frequency);
  if (!f || f.includes("as needed") || f.includes("prn")) return 1;
  const interval = parseDoseIntervalDays(f);
  if (interval === 7 && !/week/.test(f)) return 1;
  return interval;
}

export function formatHairFrequencyLabel(frequency: string): string {
  const key = frequency.toLowerCase().replace(/[\s-]+/g, "_");
  return HAIR_FREQUENCY_LABELS[key] || frequency.replace(/_/g, " ");
}

export function formatHairDoseLine(input: {
  strength?: string | null;
  dosage?: string | null;
  frequency?: string | null;
}): string {
  const frequency = input.frequency ? formatHairFrequencyLabel(input.frequency) : "";
  const parts = [input.strength, input.dosage, frequency]
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part));
  return parts.filter((part, index) => {
    const lower = part.toLowerCase();
    return parts.findIndex((other) => other.toLowerCase() === lower) === index;
  }).join(" · ");
}

export function generateHairDoseDates(
  firstDose: Date,
  frequency: string,
  supplyDays: number
): Date[] {
  const days = Math.min(HAIR_MAX_SCHEDULE_DAYS, Math.max(1, supplyDays));
  const perDay = hairDosesPerDay(frequency);
  const intervalDays = perDay > 1 ? 1 : parseHairDoseIntervalDays(frequency);
  const dates: Date[] = [];

  if (perDay > 1) {
    for (let day = 0; day < days; day++) {
      for (let slot = 0; slot < perDay; slot++) {
        const date = new Date(firstDose);
        date.setUTCDate(date.getUTCDate() + day);
        date.setUTCHours(slot * Math.floor(24 / perDay), 0, 0, 0);
        dates.push(date);
      }
    }
    return dates;
  }

  for (let i = 0; i < days; i++) {
    const date = new Date(firstDose);
    date.setUTCDate(date.getUTCDate() + i * intervalDays);
    dates.push(date);
  }
  return dates;
}

export function selectUpcomingHairDoses<
  T extends { scheduledAt: Date; takenAt?: Date | null; skipped?: boolean },
>(doses: T[], now = new Date(), limit = 8): T[] {
  const startOfToday = parseUtcDateOnly(getCalendarDateKey(now)) ?? now;
  return [...doses]
    .filter(
      (dose) => !dose.takenAt && !dose.skipped && dose.scheduledAt >= startOfToday
    )
    .sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime())
    .slice(0, limit);
}

export function hairDoseScheduleNeedsRepair(
  frequency: string,
  firstDose: Date,
  supplyDays: number,
  scheduledAts: Date[]
): boolean {
  const expected = generateHairDoseDates(firstDose, frequency, supplyDays);
  if (expected.length !== scheduledAts.length) return true;
  const actual = [...scheduledAts].sort((a, b) => a.getTime() - b.getTime());
  return expected.some((date, index) => date.getTime() !== actual[index]?.getTime());
}

export function parseHairFirstDoseDate(value: string): Date | null {
  return parseUtcDateOnly(value);
}
