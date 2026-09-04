/** Local calendar YYYY-MM-DD (not UTC). */
export function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Sunday 00:00 local of the week that contains `from`. */
export function startOfWeekSunday(from = new Date()): Date {
  const date = new Date(from);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - date.getDay());
  return date;
}

export function addDays(start: Date, days: number): Date {
  const next = new Date(start);
  next.setDate(start.getDate() + days);
  return next;
}

export function weekDatesFromSunday(sunday: Date): Date[] {
  const start = startOfWeekSunday(sunday);
  return Array.from({ length: 7 }, (_, index) => addDays(start, index));
}

/**
 * Persist week starts as a calendar date at UTC midnight so userId+weekStart
 * is the same in AEST and on Netlify UTC.
 */
export function parseWeekStartParam(raw?: string | null): Date {
  if (raw && /^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const [year, month, day] = raw.split("-").map(Number);
    return new Date(Date.UTC(year, month - 1, day));
  }
  const localSunday = startOfWeekSunday();
  return parseWeekStartParam(localDateKey(localSunday));
}

export function mealPlanStorageKey(userId: string): string {
  return `wm-meal-plan:${userId}`;
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export function dayHasPlannedMeals(
  meals: { recipe?: { calories?: number } }[] | undefined
): boolean {
  return Boolean(meals && meals.length > 0);
}

/** Average daily calories across days that have at least one planned meal. */
export function mealPlanWeekStats(
  weekDates: Date[],
  mealPlan: Record<string, { meals?: { recipe?: { calories?: number } }[] }>
): { daysPlanned: number; avgCalories: number; totalCalories: number } {
  let totalCalories = 0;
  let daysPlanned = 0;
  for (const date of weekDates) {
    const meals = mealPlan[localDateKey(date)]?.meals ?? [];
    if (!dayHasPlannedMeals(meals)) continue;
    daysPlanned += 1;
    totalCalories += meals.reduce((sum, meal) => sum + (meal.recipe?.calories ?? 0), 0);
  }
  return {
    daysPlanned,
    totalCalories,
    avgCalories: daysPlanned > 0 ? Math.round(totalCalories / daysPlanned) : 0,
  };
}

/**
 * 1-based week of `weekSunday` in the member's program, plus total weeks
 * from program start through the goal/target date.
 */
export function programWeekProgress(
  weekSunday: Date,
  programStart: Date,
  programEnd: Date
): { weekNumber: number; totalWeeks: number } {
  const startSunday = startOfWeekSunday(programStart);
  const endSunday = startOfWeekSunday(programEnd);
  const totalWeeks = Math.max(
    1,
    Math.round((endSunday.getTime() - startSunday.getTime()) / WEEK_MS) + 1
  );
  const rawWeek =
    Math.floor((startOfWeekSunday(weekSunday).getTime() - startSunday.getTime()) / WEEK_MS) + 1;
  return {
    weekNumber: Math.min(Math.max(rawWeek, 1), totalWeeks),
    totalWeeks,
  };
}
