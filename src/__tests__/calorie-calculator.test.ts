import { describe, expect, it } from "vitest";
import {
  activityBandFromSessionsPerWeek,
  ageFromDateOfBirth,
  calculateCaloriePlan,
  estimateBodyFatPercent,
  katchMcArdleBmr,
  mifflinStJeorBmr,
  sexFromGender,
} from "@/lib/weight-management/calorie-calculator";

describe("sexFromGender", () => {
  it("maps female labels", () => {
    expect(sexFromGender("FEMALE")).toBe("female");
    expect(sexFromGender("woman")).toBe("female");
  });

  it("defaults other values to male for Mifflin", () => {
    expect(sexFromGender("MALE")).toBe("male");
    expect(sexFromGender("OTHER")).toBe("male");
  });
});

describe("ageFromDateOfBirth", () => {
  it("returns years from an ISO date", () => {
    expect(ageFromDateOfBirth("1990-01-15")).toBeGreaterThanOrEqual(35);
  });

  it("returns null for invalid dates", () => {
    expect(ageFromDateOfBirth("not-a-date")).toBeNull();
  });
});

describe("activityBandFromSessionsPerWeek", () => {
  it("maps session counts to calculator.net bands", () => {
    expect(activityBandFromSessionsPerWeek(0)).toBe("sedentary");
    expect(activityBandFromSessionsPerWeek(2)).toBe("light");
    expect(activityBandFromSessionsPerWeek(4)).toBe("moderate");
    expect(activityBandFromSessionsPerWeek(6)).toBe("active");
    expect(activityBandFromSessionsPerWeek(7)).toBe("very_active");
  });
});

describe("mifflinStJeorBmr", () => {
  it("matches the published male equation", () => {
    expect(mifflinStJeorBmr({ age: 40, sex: "male", heightCm: 178, weightKg: 95 })).toBe(1868);
  });

  it("matches the published female equation", () => {
    expect(mifflinStJeorBmr({ age: 40, sex: "female", heightCm: 165, weightKg: 80 })).toBe(1470);
  });
});

describe("estimateBodyFatPercent / Katch-McArdle", () => {
  it("estimates RFM from height and waist", () => {
    expect(estimateBodyFatPercent("male", 178, 102)).toBe(29.1);
  });

  it("uses Katch-McArdle when fat percent is known", () => {
    expect(katchMcArdleBmr(95, 29.1)).toBe(1825);
  });
});

describe("calculateCaloriePlan", () => {
  it("returns an editable daily budget under TDEE", () => {
    const plan = calculateCaloriePlan({
      age: 40,
      sex: "male",
      heightCm: 178,
      weightKg: 95,
      waistCm: 102,
      activityBand: "light",
      weeklyTargetLossKg: 0.5,
    });
    expect(plan.formula).toBe("katch_mcardle");
    expect(plan.tdee).toBeGreaterThan(plan.dailyCalorieGoal);
    expect(plan.dailyCalorieGoal).toBeGreaterThanOrEqual(1500);
    expect(plan.dailyExerciseMin).toBe(25);
    expect(plan.weeklyTargetLossKg).toBe(0.5);
  });

  it("caps weekly loss at 1 kg and keeps a calorie floor", () => {
    const plan = calculateCaloriePlan({
      age: 70,
      sex: "female",
      heightCm: 155,
      weightKg: 62,
      activityBand: "sedentary",
      weeklyTargetLossKg: 2,
    });
    expect(plan.weeklyTargetLossKg).toBe(1);
    expect(plan.dailyCalorieGoal).toBeGreaterThanOrEqual(1200);
  });
});
