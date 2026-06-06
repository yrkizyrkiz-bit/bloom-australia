/** Parse prescription frequency into dose interval days. */
export function parseDoseIntervalDays(frequency: string): number {
  const f = frequency.toLowerCase();
  if (f.includes("week") || f.includes("weekly")) return 7;
  if (f.includes("fortnight") || f.includes("2 week")) return 14;
  if (f.includes("month")) return 28;
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
    d.setDate(d.getDate() + i * intervalDays);
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
