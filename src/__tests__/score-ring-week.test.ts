import { describe, expect, it } from "vitest";
import {
  calorieRingRatio,
  equivalentExerciseMinutes,
  scoreRingWeek,
  startOfWeekMonday,
  toDateKey,
  todayRingProgress,
} from "@/lib/weight-management/score-ring-week";

describe("scoreRingWeek", () => {
  it("marks weigh-in, calories close, exercise overflow, and meds from existing logs", () => {
    const monday = startOfWeekMonday(new Date("2026-08-31T10:00:00"));
    const mon = new Date(monday);
    const tue = new Date(monday);
    tue.setDate(monday.getDate() + 1);

    const week = scoreRingWeek(
      {
        weights: [{ measuredAt: mon }],
        meals: [
          { loggedAt: mon, calories: 700 },
          { loggedAt: mon, calories: 900 },
        ],
        exercises: [{ loggedAt: mon, durationMinutes: 40 }],
        doses: [{ scheduledAt: mon, takenAt: mon }],
      },
      { dailyCalorieGoal: 1800, dailyExerciseMin: 30, weeklyTargetLoss: 0.5 },
      new Date(tue)
    );

    const mondayScore = week.days[0];
    expect(mondayScore.weight).toBe(1);
    expect(mondayScore.meds).toBe(1);
    expect(mondayScore.caloriesClosed).toBe(true);
    expect(mondayScore.exercise).toBe(40);
    expect(week.days[1].isToday).toBe(true);
    expect(toDateKey(monday)).toBe(week.weekStart);
  });

  it("does not close calories with one meal or when over budget", () => {
    const monday = startOfWeekMonday(new Date("2026-08-31T10:00:00"));
    const week = scoreRingWeek(
      {
        weights: [],
        meals: [{ loggedAt: monday, calories: 2000 }],
        exercises: [],
        doses: [{ scheduledAt: monday, takenAt: null }],
      },
      { dailyCalorieGoal: 1800, dailyExerciseMin: 30 },
      monday
    );

    expect(week.days[0].caloriesClosed).toBe(false);
    expect(week.days[0].caloriesOver).toBe(true);
    expect(week.days[0].medsDue).toBe(true);
    expect(week.days[0].meds).toBe(0);
  });

  it("closes the calorie ring when under budget with two meals, even if far below the cap", () => {
    const monday = startOfWeekMonday(new Date("2026-08-31T10:00:00"));
    const week = scoreRingWeek(
      {
        weights: [],
        meals: [
          { loggedAt: monday, calories: 400 },
          { loggedAt: monday, calories: 485 },
        ],
        exercises: [],
        doses: [],
      },
      { dailyCalorieGoal: 2222, dailyExerciseMin: 25 },
      monday
    );

    const today = week.days[0];
    expect(today.calories).toBe(885);
    expect(today.caloriesClosed).toBe(true);
    expect(calorieRingRatio(today)).toBeCloseTo(885 / 2222);
  });

  it("wraps the calorie ring past the daily budget", () => {
    const monday = startOfWeekMonday(new Date("2026-08-31T10:00:00"));
    const week = scoreRingWeek(
      {
        weights: [],
        meals: [
          { loggedAt: monday, calories: 1800 },
          { loggedAt: monday, calories: 900 },
        ],
        exercises: [],
        doses: [],
      },
      { dailyCalorieGoal: 1800, dailyExerciseMin: 25 },
      monday
    );

    expect(week.days[0].caloriesOver).toBe(true);
    expect(calorieRingRatio(week.days[0])).toBeCloseTo(1.5);
  });

  it("does not close the calorie ring on one meal under budget", () => {
    const monday = startOfWeekMonday(new Date("2026-08-31T10:00:00"));
    const week = scoreRingWeek(
      {
        weights: [],
        meals: [{ loggedAt: monday, calories: 885 }],
        exercises: [],
        doses: [],
      },
      { dailyCalorieGoal: 2222, dailyExerciseMin: 25 },
      monday
    );

    expect(week.days[0].caloriesClosed).toBe(false);
    expect(calorieRingRatio(week.days[0])).toBeCloseTo(885 / 2222);
  });

  it("weights exercise minutes by intensity against a moderate daily goal", () => {
    const monday = startOfWeekMonday(new Date("2026-08-31T10:00:00"));
    const week = scoreRingWeek(
      {
        weights: [],
        meals: [],
        exercises: [
          { loggedAt: monday, durationMinutes: 10, intensity: "LIGHT" },
          { loggedAt: monday, durationMinutes: 10, intensity: "VIGOROUS" },
        ],
        doses: [],
      },
      { dailyCalorieGoal: 1800, dailyExerciseMin: 25 },
      monday
    );

    const today = week.days[0];
    expect(today.exerciseClockMin).toBe(20);
    expect(today.exercise).toBe(25);
    expect(today.exercise).toBe(today.exerciseGoal);
  });

  it("counts 10 minutes at maximum as 25 moderate minutes", () => {
    expect(equivalentExerciseMinutes(10, "MAXIMUM")).toBe(25);
    expect(equivalentExerciseMinutes(10, "MODERATE")).toBe(10);
    expect(equivalentExerciseMinutes(10, null)).toBe(10);
  });
});

describe("todayRingProgress", () => {
  it("averages today's calorie, exercise, weigh-in, and meds rings", () => {
    const monday = startOfWeekMonday(new Date("2026-08-31T10:00:00"));
    const week = scoreRingWeek(
      {
        weights: [{ measuredAt: monday }],
        meals: [
          { loggedAt: monday, calories: 900 },
          { loggedAt: monday, calories: 900 },
        ],
        exercises: [{ loggedAt: monday, durationMinutes: 15 }],
        doses: [{ scheduledAt: monday, takenAt: monday }],
      },
      { dailyCalorieGoal: 1800, dailyExerciseMin: 30 },
      monday
    );

    expect(todayRingProgress(week.days[0])).toEqual({
      completed: 3,
      total: 4,
      percent: 88,
    });
  });

  it("omits meds when none are due", () => {
    const monday = startOfWeekMonday(new Date("2026-08-31T10:00:00"));
    const week = scoreRingWeek(
      {
        weights: [],
        meals: [],
        exercises: [],
        doses: [],
      },
      { dailyCalorieGoal: 1800, dailyExerciseMin: 30 },
      monday
    );

    expect(todayRingProgress(week.days[0])).toEqual({
      completed: 0,
      total: 3,
      percent: 0,
    });
  });
});
