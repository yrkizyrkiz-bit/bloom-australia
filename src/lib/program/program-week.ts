import { startOfWeekMonday, toDateKey } from "@/lib/weight-management/score-ring-week";

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const SHORT_START_DAYS = 3;

function atLocalMidnight(value: Date) {
  const d = new Date(value);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(start: Date, days: number): Date {
  const next = atLocalMidnight(start);
  next.setDate(next.getDate() + days);
  return next;
}

/** Inclusive days left in the Mon–Sun week, including the start day. */
export function daysLeftInMondayWeek(at: Date): number {
  const day = atLocalMidnight(at).getDay();
  return day === 0 ? 1 : 8 - day;
}

/** Friday / Saturday / Sunday starts are a stub week 0. */
export function isShortProgramStartWeek(programStart: Date): boolean {
  return daysLeftInMondayWeek(programStart) <= SHORT_START_DAYS;
}

/** Monday that begins week 1 (the first full-enough Mon–Sun week). */
export function week1Monday(programStart: Date): Date {
  const monday = startOfWeekMonday(programStart);
  return isShortProgramStartWeek(programStart) ? addDays(monday, 7) : monday;
}

/**
 * Program week on a Monday–Sunday calendar.
 * Starts with only 3 days left (Fri–Sun) → week 0 until the next Monday.
 * Otherwise the start week is week 1.
 */
export function programCalendarWeek(programStart: Date | string, now = new Date()): number {
  const start = programStart instanceof Date ? programStart : new Date(programStart);
  if (Number.isNaN(start.getTime())) return 0;

  const firstWeek1 = week1Monday(start);
  const nowMonday = startOfWeekMonday(now);
  const startMidnight = atLocalMidnight(start);
  const nowMidnight = atLocalMidnight(now);

  if (nowMidnight < startMidnight) return 0;
  if (nowMonday.getTime() < firstWeek1.getTime()) return 0;

  const weeks =
    Math.round((atLocalMidnight(nowMonday).getTime() - atLocalMidnight(firstWeek1).getTime()) / (7 * MS_PER_DAY));
  return 1 + Math.max(0, weeks);
}

export function programWeekLabel(week: number): string {
  if (week <= 0) return "Week 0 (getting-started days — not a full week)";
  return `Week ${week}`;
}

export function mondayWeekKey(at: Date | string): string {
  return toDateKey(startOfWeekMonday(at instanceof Date ? at : new Date(at)));
}

export function weeklyAveragesFromWeightLogs(
  logs: Array<{ measuredAt: Date | string; weight: number }>
): Array<{ week: string; avgWeight: number; minWeight: number; maxWeight: number }> {
  const weightsByWeek: Record<string, number[]> = {};
  for (const log of logs) {
    const key = mondayWeekKey(log.measuredAt);
    if (!weightsByWeek[key]) weightsByWeek[key] = [];
    weightsByWeek[key].push(log.weight);
  }
  return Object.entries(weightsByWeek)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, weights]) => ({
      week,
      avgWeight: Math.round((weights.reduce((sum, value) => sum + value, 0) / weights.length) * 10) / 10,
      minWeight: Math.min(...weights),
      maxWeight: Math.max(...weights),
    }));
}
