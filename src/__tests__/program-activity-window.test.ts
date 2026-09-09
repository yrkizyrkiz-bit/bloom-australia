import { describe, expect, it } from "vitest";
import {
  daysOnProgramInWindow,
  programActivityWindowStart,
  resolveProgramCommencement,
} from "@/lib/program/program-activity-window";
import { buildEarlyProgramWelcomeInsight, buildWeeklyInsightPrompts } from "@/lib/program/weekly-insight";
import { scoreRingWeek } from "@/lib/weight-management/score-ring-week";

describe("program activity window", () => {
  it("uses the later of program and goal start, not an earlier membership date", () => {
    const start = resolveProgramCommencement({
      membershipStartedAt: "2026-08-01T00:00:00.000Z",
      programStartedAt: "2026-09-05T00:00:00.000Z",
      goalStartedAt: "2026-09-04T00:00:00.000Z",
    });
    expect(start?.toISOString().slice(0, 10)).toBe("2026-09-05");
  });

  it("clips the rolling week to Saturday when the program starts Saturday", () => {
    const windowStart = programActivityWindowStart({
      programStartedAt: new Date(2026, 8, 5), // Sat
      now: new Date(2026, 8, 5, 18),
      lookbackDays: 7,
    });
    expect(windowStart.getFullYear()).toBe(2026);
    expect(windowStart.getMonth()).toBe(8);
    expect(windowStart.getDate()).toBe(5);
  });

  it("counts days on program from commencement", () => {
    expect(daysOnProgramInWindow(new Date(2026, 8, 5), new Date(2026, 8, 5))).toBe(1);
    expect(daysOnProgramInWindow(new Date(2026, 8, 5), new Date(2026, 8, 6))).toBe(2);
  });
});

describe("early-week AI copy", () => {
  it("welcomes a mid-week starter without missed-day language", () => {
    const { systemPrompt, userPrompt } = buildWeeklyInsightPrompts({
      memberName: "Maria",
      programWeek: 0,
      phase: "INDUCTION",
      planTier: "CORE",
      programStartedAt: "2026-09-05T00:00:00.000Z",
      daysOnProgram: 1,
      weightLogs: 0,
      weightChangeKg: null,
      mealLogs: 0,
      exerciseSessions: 0,
      exerciseMinutes: 0,
      sideEffectReports: 0,
      doseStatus: "not_due_yet",
    });
    expect(systemPrompt).toMatch(/Only judge days on or after/i);
    expect(systemPrompt).toMatch(/encourage daily rings/i);
    expect(userPrompt).toMatch(/welcome them as George/i);
    expect(userPrompt).toMatch(/activities, calories, and meds/i);

    const welcome = buildEarlyProgramWelcomeInsight({
      memberName: "Maria",
      programWeek: 0,
      planTier: "CORE",
      phase: "INDUCTION",
      medicationName: "OZE",
      dosage: "0.25mg",
      weeklyTargetLossKg: 0.5,
    });
    expect(welcome.summary).toMatch(/Welcome, Maria/i);
    expect(welcome.summary).toMatch(/I'm George/i);
    expect(welcome.bullets.join(" ")).toMatch(/first week/i);
    expect(welcome.bullets.join(" ")).toMatch(/rings/i);
    expect(welcome.bullets.join(" ")).toMatch(/0\.5 kg average loss per week/i);
    expect(welcome.bullets.join(" ")).not.toMatch(/missed/i);
    expect(welcome.encouragement).toMatch(/let's do this/i);
    expect(welcome.focusArea).toMatch(/rings/i);
  });
});

describe("ring week before program start", () => {
  it("treats Mon–Fri as not due when the member starts Saturday", () => {
    const week = scoreRingWeek(
      { weights: [], meals: [], exercises: [], doses: [] },
      { dailyCalorieGoal: 1800, dailyExerciseMin: 30 },
      new Date(2026, 8, 5, 15), // Sat 5 Sep 2026
      { programStartedAt: new Date(2026, 8, 5) }
    );
    const beforeStart = week.days.filter((d) => d.date < "2026-09-05");
    expect(beforeStart.length).toBeGreaterThan(0);
    expect(beforeStart.every((d) => d.isFuture)).toBe(true);
    const saturday = week.days.find((d) => d.date === "2026-09-05");
    expect(saturday?.isFuture).toBe(false);
    expect(saturday?.isToday).toBe(true);
  });
});
