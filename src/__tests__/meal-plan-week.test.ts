import { describe, expect, it } from "vitest";
import {
  localDateKey,
  mealPlanStorageKey,
  mealPlanWeekStats,
  parseWeekStartParam,
  programWeekProgress,
  startOfWeekSunday,
  weekDatesFromSunday,
} from "@/lib/weight-management/meal-plan-week";

describe("meal-plan-week", () => {
  it("parses a calendar week start as UTC midnight of that date", () => {
    const week = parseWeekStartParam("2026-08-30");
    expect(week.toISOString()).toBe("2026-08-30T00:00:00.000Z");
  });

  it("scopes local cache per user", () => {
    expect(mealPlanStorageKey("user-red")).toBe("wm-meal-plan:user-red");
    expect(mealPlanStorageKey("user-pepsi")).not.toBe(mealPlanStorageKey("user-red"));
  });

  it("builds seven local days from Sunday", () => {
    const sunday = startOfWeekSunday(new Date(2026, 7, 31, 15, 0, 0));
    const days = weekDatesFromSunday(sunday);
    expect(days).toHaveLength(7);
    expect(days[0].getDay()).toBe(0);
    expect(days[6].getDay()).toBe(6);
    expect(localDateKey(days[0])).toBe(localDateKey(sunday));
  });

  it("averages calories only across days that have meals", () => {
    const sunday = startOfWeekSunday(new Date(2026, 7, 30));
    const days = weekDatesFromSunday(sunday);
    const wed = localDateKey(days[3]);
    const thu = localDateKey(days[4]);
    const stats = mealPlanWeekStats(days, {
      [wed]: { meals: [{ recipe: { calories: 400 } }, { recipe: { calories: 600 } }] },
      [thu]: { meals: [{ recipe: { calories: 800 } }] },
    });
    expect(stats.daysPlanned).toBe(2);
    expect(stats.totalCalories).toBe(1800);
    expect(stats.avgCalories).toBe(900);
  });

  it("returns week 4 of a 12 week program", () => {
    const start = new Date(2026, 7, 2);
    const end = new Date(2026, 9, 18);
    const week4 = startOfWeekSunday(new Date(2026, 7, 23));
    expect(programWeekProgress(week4, start, end)).toEqual({ weekNumber: 4, totalWeeks: 12 });
  });
});
