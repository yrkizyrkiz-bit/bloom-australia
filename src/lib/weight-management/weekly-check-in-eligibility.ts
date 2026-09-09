import { startOfWeekMonday, toDateKey } from "@/lib/weight-management/score-ring-week";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function atLocalMidnight(value: Date) {
  const d = new Date(value);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(start: Date, days: number): Date {
  const next = new Date(start);
  next.setDate(start.getDate() + days);
  return next;
}

/** Inclusive calendar days from start through end (local midnights). */
export function inclusiveDayCount(start: Date, end: Date) {
  const a = atLocalMidnight(start).getTime();
  const b = atLocalMidnight(end).getTime();
  if (b < a) return 0;
  return Math.floor((b - a) / MS_PER_DAY) + 1;
}

/** Saturday or Sunday — when we ask “How was your week?” */
export function isWeekendEndOfWeek(now = new Date()) {
  const day = now.getDay();
  return day === 0 || day === 6;
}

/**
 * How many days of this Mon–Sun week the member was on the program.
 * Joining Saturday of a Mon–Sun week → 2 days.
 */
export function daysOnProgramInWeek(programStart: Date, weekStart: Date, now = new Date()) {
  const start = atLocalMidnight(programStart);
  const weekBegin = atLocalMidnight(weekStart);
  const weekEnd = addDays(weekBegin, 6);
  const today = atLocalMidnight(now);
  const overlapStart = start > weekBegin ? start : weekBegin;
  const overlapEnd = today < weekEnd ? today : weekEnd;
  return inclusiveDayCount(overlapStart, overlapEnd);
}

/** 1-based program week from the Monday of the member's start week. */
export function programWeekNumber(programStart: Date, now = new Date()) {
  const startWeek = startOfWeekMonday(programStart);
  const nowWeek = startOfWeekMonday(now);
  const weeks =
    Math.round((atLocalMidnight(nowWeek).getTime() - atLocalMidnight(startWeek).getTime()) / (7 * MS_PER_DAY)) +
    1;
  return Math.max(1, weeks);
}

export function alreadyCheckedInThisWeek(
  lastCheckInAt: Date | string | null | undefined,
  now = new Date()
) {
  if (!lastCheckInAt) return false;
  const checked = typeof lastCheckInAt === "string" ? new Date(lastCheckInAt) : lastCheckInAt;
  if (Number.isNaN(checked.getTime())) return false;
  return toDateKey(startOfWeekMonday(checked)) === toDateKey(startOfWeekMonday(now));
}

/**
 * Show “How was your week?” only at weekend, after enough program time:
 * - end of week 2+, or
 * - end of week 1 if the member had more than 3 days in that week.
 */
export function shouldPromptWeeklyCheckIn(input: {
  programStart: Date | string | null | undefined;
  lastCheckInAt?: Date | string | null;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  if (!input.programStart) return false;
  const programStart =
    typeof input.programStart === "string" ? new Date(input.programStart) : input.programStart;
  if (Number.isNaN(programStart.getTime())) return false;
  if (!isWeekendEndOfWeek(now)) return false;
  if (alreadyCheckedInThisWeek(input.lastCheckInAt, now)) return false;

  const week = programWeekNumber(programStart, now);
  if (week >= 2) return true;

  const weekStart = startOfWeekMonday(programStart);
  return daysOnProgramInWeek(programStart, weekStart, now) > 3;
}
