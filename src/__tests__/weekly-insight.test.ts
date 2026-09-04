import { describe, expect, it } from "vitest";
import { summariseMedicationForInsight } from "@/lib/program/dose-insight";
import {
  buildFriendlyFallbackInsight,
  buildPreActivationInsight,
  buildWeeklyInsightPrompts,
  isProgramReadyForWeeklyInsight,
} from "@/lib/program/weekly-insight";

describe("weekly insight activation guard", () => {
  it("is ready only after the member is ACTIVE and the program has started", () => {
    expect(
      isProgramReadyForWeeklyInsight({
        journeyStatus: "APPROVED",
        programActive: true,
        startedAt: "2026-09-03T00:00:00.000Z",
      })
    ).toBe(false);
    expect(
      isProgramReadyForWeeklyInsight({
        journeyStatus: "ACTIVE",
        programActive: false,
        startedAt: "2026-09-03T00:00:00.000Z",
      })
    ).toBe(false);
    expect(
      isProgramReadyForWeeklyInsight({
        journeyStatus: "ACTIVE",
        programActive: true,
        startedAt: "2026-09-10T00:00:00.000Z",
        now: new Date("2026-09-04T00:00:00.000Z"),
      })
    ).toBe(false);
    expect(
      isProgramReadyForWeeklyInsight({
        journeyStatus: "ACTIVE",
        programActive: true,
        startedAt: "2026-09-03T00:00:00.000Z",
        now: new Date("2026-09-04T00:00:00.000Z"),
      })
    ).toBe(true);
  });

  it("says the program has not started yet instead of reviewing a fake week", () => {
    const insight = buildPreActivationInsight("Red");
    expect(insight.preActivation).toBe(true);
    expect(insight.summary).toContain("has not started yet");
    expect(insight.summary).toContain("Red");
    expect(insight.focusArea).toBe("Wait for program activation");
  });
});

describe("medication insight for weekly dosing", () => {
  const weeklyDoses = [
    { scheduledAt: "2026-09-10T00:00:00.000Z", takenAt: null, skipped: false },
    { scheduledAt: "2026-09-17T00:00:00.000Z", takenAt: null, skipped: false },
    { scheduledAt: "2026-09-24T00:00:00.000Z", takenAt: null, skipped: false },
  ];

  it("does not treat upcoming weekly doses as missed daily medication", () => {
    const insight = summariseMedicationForInsight({
      medicationName: "OZE",
      dosage: "0.5mg",
      frequency: "Once weekly",
      doses: weeklyDoses,
      now: new Date("2026-09-04T02:00:00.000Z"),
    });
    expect(insight.status).toBe("not_due_yet");
    expect(insight.adherencePct).toBeNull();
    expect(insight.dueCount).toBe(0);
    expect(insight.coachNote).toContain("Once weekly");
    expect(insight.coachNote).toMatch(/not due yet/i);
    expect(insight.coachNote).toMatch(/not a daily medication/i);
  });

  it("counts adherence only after a weekly dose is actually due", () => {
    const insight = summariseMedicationForInsight({
      medicationName: "OZE",
      dosage: "0.5mg",
      frequency: "Once weekly",
      doses: weeklyDoses,
      now: new Date("2026-09-11T02:00:00.000Z"),
    });
    expect(insight.status).toBe("overdue");
    expect(insight.dueCount).toBe(1);
    expect(insight.adherencePct).toBe(0);
  });

  it("asks the model to write like a person and respect weekly dates", () => {
    const note = summariseMedicationForInsight({
      medicationName: "OZE",
      dosage: "0.5mg",
      frequency: "Once weekly",
      doses: weeklyDoses,
      now: new Date("2026-09-04T02:00:00.000Z"),
    }).coachNote;
    const { systemPrompt, userPrompt } = buildWeeklyInsightPrompts({
      memberName: "Red",
      programWeek: 0,
      phase: "INDUCTION",
      medicationNote: note,
      doseStatus: "not_due_yet",
      weightLogs: 2,
      weightChangeKg: -1,
      mealLogs: 16,
      exerciseSessions: 2,
      exerciseMinutes: 45,
      sideEffectReports: 0,
    });
    expect(systemPrompt).toMatch(/never treat medication as daily/i);
    expect(systemPrompt).not.toMatch(/adherence is low/i);
    expect(userPrompt).toContain("not due yet");
    expect(userPrompt).not.toMatch(/Dose adherence:/);

    const fallback = buildFriendlyFallbackInsight("Red", 0, {
      memberName: "Red",
      medicationNote: note,
      doseStatus: "not_due_yet",
      weightLogs: 2,
      weightChangeKg: -1,
      mealLogs: 16,
      exerciseSessions: 2,
      exerciseMinutes: 45,
      sideEffectReports: 0,
    });
    expect(fallback.summary).toMatch(/Hey Red/);
    expect(fallback.focusArea).toMatch(/first dose/i);
  });
});
