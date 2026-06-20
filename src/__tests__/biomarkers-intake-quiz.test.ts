import { describe, expect, it } from "vitest";
import { deriveBiomarkersQuizResult, getBiomarkersQuizQuestions } from "@/lib/programs/quizzes/biomarkers-intake-quiz";
import {
  BIOMARKERS_QUIZ_RESUME_THRESHOLD,
  canResumeBiomarkersQuiz,
  getBiomarkersQuizProgressPercent,
} from "@/lib/programs/quizzes/biomarkers-quiz-storage";

describe("biomarkers intake quiz", () => {
  it("has 9 questions across health categories", () => {
    const male = getBiomarkersQuizQuestions("male");
    const female = getBiomarkersQuizQuestions("female");
    expect(male).toHaveLength(9);
    expect(female).toHaveLength(9);
    expect(male.map((q) => q.sectionId)).toContain("heart");
    expect(male.map((q) => q.sectionId)).toContain("kidney");
  });

  it("uses gender-specific metabolic and hormone options", () => {
    const male = getBiomarkersQuizQuestions("male");
    const female = getBiomarkersQuizQuestions("female");
    const maleMetabolic = male.find((q) => q.id === "metabolicRisk");
    const femaleMetabolic = female.find((q) => q.id === "metabolicRisk");
    expect(maleMetabolic?.options.some((o) => o.id === "low-t-metabolic")).toBe(true);
    expect(femaleMetabolic?.options.some((o) => o.id === "pcos")).toBe(true);
    expect(maleMetabolic?.options.some((o) => o.id === "pcos")).toBe(false);

    const maleHormones = male.find((q) => q.id === "hormoneConcerns");
    expect(maleHormones?.prompt).toContain("testosterone");
    const femaleHormones = female.find((q) => q.id === "hormoneConcerns");
    expect(femaleHormones?.prompt).toContain("menopause");
  });

  it("asks clinical sex when profile gender is unknown", () => {
    const unknown = getBiomarkersQuizQuestions("other");
    expect(unknown).toHaveLength(1);
    expect(unknown[0]?.id).toBe("clinicalSex");
    const after = getBiomarkersQuizQuestions("other", { clinicalSex: "female" });
    expect(after).toHaveLength(9);
  });

  it("maps cardiovascular risk to lipid indications", () => {
    const result = deriveBiomarkersQuizResult(
      {
        primaryGoal: "prevention",
        heartRisk: "hypertension",
        metabolicRisk: "none",
        thyroidSymptoms: "none",
        hormoneConcerns: "none",
        liverRisk: "none",
        kidneyRisk: "none",
        nutrientsInflammation: "none",
        lastBloods: "never",
      },
      "male"
    );
    expect(result.sections.some((s) => s.sectionId === "heart")).toBe(true);
    expect(result.hasMedicareEligibleIndications).toBe(true);
    expect(result.doctorSummary).toContain("MBS");
  });

  it("collects flags from multiple selections on one question", () => {
    const result = deriveBiomarkersQuizResult(
      {
        primaryGoal: "prevention",
        heartRisk: "hypertension,smoker",
        metabolicRisk: "diabetes-family,weight-waist",
        thyroidSymptoms: "none",
        hormoneConcerns: "none",
        liverRisk: "none",
        kidneyRisk: "none",
        nutrientsInflammation: "none",
        lastBloods: "never",
      },
      "male"
    );
    expect(result.sections.some((s) => s.sectionId === "heart")).toBe(true);
    expect(result.sections.some((s) => s.sectionId === "metabolic")).toBe(true);
  });

  it("marks multi-select category questions as allowMultiple", () => {
    const questions = getBiomarkersQuizQuestions("male");
    expect(questions.find((q) => q.id === "heartRisk")?.allowMultiple).toBe(true);
    expect(questions.find((q) => q.id === "primaryGoal")?.allowMultiple).toBe(false);
    expect(questions.find((q) => q.id === "lastBloods")?.allowMultiple).toBe(false);
  });

  it("includes biological age baseline when goal is ageing", () => {
    const result = deriveBiomarkersQuizResult(
      {
        primaryGoal: "biological-age",
        heartRisk: "none",
        metabolicRisk: "none",
        thyroidSymptoms: "none",
        hormoneConcerns: "none",
        liverRisk: "none",
        kidneyRisk: "none",
        nutrientsInflammation: "none",
        lastBloods: "never",
      },
      "female"
    );
    expect(result.suggestedPanel).toBe("comprehensive");
    expect(result.sections.length).toBeGreaterThan(0);
  });
});

describe("biomarkers quiz resume", () => {
  const totalProgressSteps = 10; // 9 questions + review

  it("does not offer resume at or below 25%", () => {
    expect(
      canResumeBiomarkersQuiz({ version: 1, stepIndex: 1, answers: {}, updatedAt: "", completed: false }, totalProgressSteps)
    ).toBe(false);
    expect(getBiomarkersQuizProgressPercent({ version: 1, stepIndex: 1, answers: {}, updatedAt: "", completed: false }, totalProgressSteps)).toBe(20);
  });

  it("offers resume above 25%", () => {
    const progress = { version: 1 as const, stepIndex: 2, answers: { primaryGoal: "prevention" }, updatedAt: "", completed: false };
    expect(getBiomarkersQuizProgressPercent(progress, totalProgressSteps)).toBe(30);
    expect(canResumeBiomarkersQuiz(progress, totalProgressSteps)).toBe(true);
    expect(BIOMARKERS_QUIZ_RESUME_THRESHOLD).toBe(0.25);
  });
});
