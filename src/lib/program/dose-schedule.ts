/** Australian calendar day for dose scheduling (member-facing). */
export const DOSE_SCHEDULE_TIMEZONE = "Australia/Sydney";

export function getCalendarDateKey(
  date: Date,
  timeZone = DOSE_SCHEDULE_TIMEZONE
): string {
  return date.toLocaleDateString("en-CA", { timeZone });
}

/** True when today (AU) is on or after the scheduled dose day. */
export function canLogDoseScheduledFor(
  scheduledAt: Date | string,
  now = new Date()
): boolean {
  const scheduled = new Date(scheduledAt);
  return getCalendarDateKey(now) >= getCalendarDateKey(scheduled);
}

export function formatNextDoseDateLong(scheduledAt: Date | string): string {
  return new Date(scheduledAt).toLocaleDateString("en-AU", {
    timeZone: DOSE_SCHEDULE_TIMEZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatNextDoseDateShort(scheduledAt: Date | string): string {
  return new Date(scheduledAt).toLocaleDateString("en-AU", {
    timeZone: DOSE_SCHEDULE_TIMEZONE,
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

/** Parse prescription frequency into dose interval days. */
export function parseDoseIntervalDays(frequency: string): number {
  const f = frequency.toLowerCase();
  if (f.includes("fortnight") || f.includes("2 week") || f.includes("two week")) return 14;
  if (f.includes("week") || f.includes("weekly")) return 7;
  if (f.includes("month")) return 28;
  if (f.includes("other day") || f.includes("every other")) return 2;
  if (f.includes("daily") || f.includes("day") || f.includes("once a day")) return 1;
  return 7;
}

export function generateDoseDates(
  startDate: Date,
  intervalDays: number,
  count: number
): Date[] {
  const dates: Date[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(startDate);
    d.setUTCDate(d.getUTCDate() + i * intervalDays);
    dates.push(d);
  }
  return dates;
}

/** Start of calendar day in UTC (for task scheduling). */
export function startOfDayUTC(date: Date): Date {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}
