import { describe, expect, it } from "vitest";
import {
  calculateQuizTargetWeightKg,
  defaultPlanTargetDate,
  parsePlanDate,
  resolveQuizTargetWeightKg,
} from "@/lib/weight-management/quiz-goal-defaults";
import { overlayGoalWithActivePlan } from "@/lib/weight-management/apply-weight-plan";

describe("calculateQuizTargetWeightKg", () => {
  it("uses the quiz midpoints for each goal band", () => {
    expect(calculateQuizTargetWeightKg(100, "1-10")).toBe(94.5);
    expect(calculateQuizTargetWeightKg(100, "10-25")).toBe(82.5);
    expect(calculateQuizTargetWeightKg(100, "25+")).toBe(70);
    expect(calculateQuizTargetWeightKg(100, "unsure")).toBe(85);
  });

  it("returns null without a current weight", () => {
    expect(calculateQuizTargetWeightKg(null, "10-25")).toBeNull();
  });
});

describe("resolveQuizTargetWeightKg", () => {
  it("prefers the stored quiz target", () => {
    expect(
      resolveQuizTargetWeightKg({
        storedTargetWeight: "82.5",
        currentWeight: 100,
        weightLossGoal: "1-10",
      })
    ).toBe(82.5);
  });

  it("falls back to the quiz calculation", () => {
    expect(
      resolveQuizTargetWeightKg({
        currentWeight: 90,
        weightLossGoal: "10-25",
      })
    ).toBe(72.5);
  });
});

describe("defaultPlanTargetDate", () => {
  it("is six calendar months later", () => {
    expect(defaultPlanTargetDate(new Date(2026, 2, 15))).toBe("2026-09-15");
  });
});

describe("parsePlanDate", () => {
  it("keeps a date-only value on the calendar day", () => {
    const parsed = parsePlanDate("2027-03-02");
    expect(parsed?.getFullYear()).toBe(2027);
    expect(parsed?.getMonth()).toBe(2);
    expect(parsed?.getDate()).toBe(2);
  });
});

describe("overlayGoalWithActivePlan", () => {
  it("uses the doctor plan date on the in-progress goal", () => {
    const overlaid = overlayGoalWithActivePlan(
      {
        status: "IN_PROGRESS",
        startWeight: 120,
        targetWeight: 85,
        targetDate: new Date("2027-08-31"),
        weeklyTargetLoss: 0.5,
      },
      {
        startWeight: 120,
        targetWeight: 85,
        targetDate: new Date(2027, 2, 2),
        weeklyTargetLoss: 0.6,
      }
    );
    expect(overlaid.targetDate).toEqual(new Date(2027, 2, 2));
    expect(overlaid.weeklyTargetLoss).toBe(0.6);
  });
});
