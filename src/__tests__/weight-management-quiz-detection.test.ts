import { describe, it, expect } from "vitest";
import {
  isWeightManagementQuizData,
  resolveLegacyHairSurveyData,
  resolveWeightManagementQuizData,
} from "@/lib/quiz-assessment";

describe("weight management quiz detection", () => {
  it("rejects hair funnel intake as weight management quiz", () => {
    expect(
      isWeightManagementQuizData({
        programType: "HAIR_LOSS",
        firstName: "Zico",
        hairConcern: "thinning",
      })
    ).toBe(false);
  });

  it("accepts weight management intake with quiz answers", () => {
    expect(
      isWeightManagementQuizData({
        programType: "WEIGHT_MANAGEMENT",
        motivations: ["Improve energy"],
        currentWeight: "92",
      })
    ).toBe(true);
  });

  it("resolves WM quiz from WeightManagementIntake only when quiz-shaped", () => {
    expect(
      resolveWeightManagementQuizData({
        wmIntakeQuizData: { motivations: ["Lose weight"] },
        programMemberProgram: "HAIR_LOSS",
        programMemberIntake: { programType: "HAIR_LOSS", firstName: "Zico" },
      })
    ).toEqual({ motivations: ["Lose weight"] });
  });

  it("does not resolve hair program member intake as WM quiz", () => {
    expect(
      resolveWeightManagementQuizData({
        wmIntakeQuizData: null,
        programMemberProgram: "HAIR_LOSS",
        programMemberIntake: {
          programType: "HAIR_LOSS",
          firstName: "Zico",
          email: "test@example.com",
        },
      })
    ).toBeNull();
  });

  it("resolves legacy hair survey data only for hair programs", () => {
    expect(
      resolveLegacyHairSurveyData({
        programMemberProgram: "HAIR_LOSS",
        programMemberIntake: { programType: "HAIR_LOSS", hairConcern: "thinning" },
      })
    ).toEqual({ programType: "HAIR_LOSS", hairConcern: "thinning" });

    expect(
      resolveLegacyHairSurveyData({
        programMemberProgram: "MENS_HEALTH",
        programMemberIntake: { programType: "MENS_HEALTH", category: "vitality" },
      })
    ).toBeNull();
  });
});
