/** Australia/Sydney helpers — single source of truth for booking + admin calendars */

export const SYDNEY_TZ = "Australia/Sydney";

export interface SydneyYmd {
  year: number;
  /** 0-indexed month */
  month: number;
  day: number;
}

function toDate(date: Date | string): Date {
  return typeof date === "string" ? new Date(date) : date;
}

/** Sydney calendar date (YYYY-MM-DD) for a UTC instant */
export function getSydneyYmd(date: Date | string): SydneyYmd {
  const iso = toDate(date).toLocaleDateString("en-CA", { timeZone: SYDNEY_TZ });
  const [yearStr, monthStr, dayStr] = iso.split("-");
  return {
    year: parseInt(yearStr, 10),
    month: parseInt(monthStr, 10) - 1,
    day: parseInt(dayStr, 10),
  };
}

export function sydneyYmdToKey(ymd: SydneyYmd): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${ymd.year}-${pad(ymd.month + 1)}-${pad(ymd.day)}`;
}

export function getSydneyDateKey(date: Date | string): string {
  return sydneyYmdToKey(getSydneyYmd(date));
}

/** Add calendar days in Sydney (DST-safe via noon anchor) */
export function addSydneyDays(ymd: SydneyYmd, days: number): SydneyYmd {
  const anchor = sydneyLocalToUtc(ymd.year, ymd.month, ymd.day, 12, 0);
  const shifted = new Date(anchor.getTime() + days * 24 * 60 * 60 * 1000);
  return getSydneyYmd(shifted);
}

/**
 * Wall-clock time in Sydney → UTC Date.
 * month is 0-indexed (JS convention).
 */
export function sydneyLocalToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number
): Date {
  let utc = new Date(Date.UTC(year, month, day, hour - 11, minute, 0, 0));

  const formatter = new Intl.DateTimeFormat("en-AU", {
    timeZone: SYDNEY_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  for (let attempt = 0; attempt < 6; attempt++) {
    const parts = formatter.formatToParts(utc);
    const read = (type: Intl.DateTimeFormatPartTypes) =>
      parseInt(parts.find((p) => p.type === type)?.value || "0", 10);

    const y = read("year");
    const m = read("month") - 1;
    const d = read("day");
    const h = read("hour");
    const min = read("minute");

    if (y === year && m === month && d === day && h === hour && min === minute) {
      return utc;
    }

    const desired = Date.UTC(year, month, day, hour, minute);
    const actual = Date.UTC(y, m, d, h, min);
    utc = new Date(utc.getTime() + (desired - actual));
  }

  return utc;
}

export function getSydneyOffset(date: Date | string): string {
  const d = toDate(date);
  const formatter = new Intl.DateTimeFormat("en-AU", {
    timeZone: SYDNEY_TZ,
    timeZoneName: "shortOffset",
  });
  const parts = formatter.formatToParts(d);
  const offsetPart = parts.find((p) => p.type === "timeZoneName");
  if (offsetPart?.value) {
    const match = offsetPart.value.match(/GMT([+-])(\d+)(?::(\d+))?/);
    if (match) {
      const sign = match[1];
      const hours = match[2].padStart(2, "0");
      const mins = match[3] ? match[3].padStart(2, "0") : "00";
      return `${sign}${hours}:${mins}`;
    }
  }
  return "+10:00";
}

export function toSydneyISO(date: Date | string): string {
  const d = toDate(date);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: SYDNEY_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(d);

  const read = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "00";

  const offset = getSydneyOffset(d);
  return `${read("year")}-${read("month")}-${read("day")}T${read("hour")}:${read("minute")}:${read("second")}${offset}`;
}

export function getSydneyDayOfWeek(date: Date | string): number {
  const weekday = toDate(date).toLocaleDateString("en-US", {
    timeZone: SYDNEY_TZ,
    weekday: "short",
  });
  const dayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return dayMap[weekday] ?? 0;
}

export function formatSydneyTime(
  date: Date | string,
  options?: Intl.DateTimeFormatOptions
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("en-AU", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: SYDNEY_TZ,
    ...options,
  });
}

export function formatSydneyDate(
  date: Date | string,
  options?: Intl.DateTimeFormatOptions
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-AU", {
    timeZone: SYDNEY_TZ,
    ...options,
  });
}

export function isSameSydneyDay(a: Date | string, b: Date | string): boolean {
  return getSydneyDateKey(new Date(a)) === getSydneyDateKey(new Date(b));
}

/** Monday 00:00 Sydney of the week containing `anchor` (Sydney calendar) */
export function getSydneyWeekStart(anchor: Date | string): Date {
  const ymd = getSydneyYmd(anchor);
  const noon = sydneyLocalToUtc(ymd.year, ymd.month, ymd.day, 12, 0);
  const dow = getSydneyDayOfWeek(noon);
  const daysFromMonday = dow === 0 ? 6 : dow - 1;
  const monday = addSydneyDays(ymd, -daysFromMonday);
  return sydneyLocalToUtc(monday.year, monday.month, monday.day, 0, 0);
}

export function getSydneyWeekEnd(weekStart: Date | string): Date {
  const start = toDate(weekStart);
  const endYmd = addSydneyDays(getSydneyYmd(start), 7);
  return sydneyLocalToUtc(endYmd.year, endYmd.month, endYmd.day, 0, 0);
}
