import { describe, expect, it } from "vitest";
import {
  areClinicalAnswersComplete,
  emptyWeightManagementClinicalAnswers,
  getWeightManagementClinicalQuestions,
  isWeightManagementClinicalHistoryComplete,
  resolveWeightManagementClinicalStatus,
  toggleClinicalExclusiveOption,
} from "@/lib/programs/quizzes/weight-management-clinical-quiz";

describe("weight management clinical assessment", () => {
  it("hides pregnancy options for male members", () => {
    const serious = getWeightManagementClinicalQuestions("male").find(
      (question) => question.id === "seriousConditions"
    );
    expect(serious?.options.some((option) => option.toLowerCase().includes("pregnancy"))).toBe(
      false
    );
  });

  it("treats exclusive none as a single selection", () => {
    expect(toggleClinicalExclusiveOption(["Insulin"], "None of the above", "None of the above")).toEqual([
      "None of the above",
    ]);
    expect(
      toggleClinicalExclusiveOption(["None of the above"], "Insulin", "None of the above")
    ).toEqual(["Insulin"]);
  });

  it("marks history complete when all clinical fields are answered or a completion timestamp exists", () => {
    expect(isWeightManagementClinicalHistoryComplete({})).toBe(false);
    expect(
      isWeightManagementClinicalHistoryComplete({
        clinicalHistoryCompletedAt: "2026-08-26T00:00:00.000Z",
      })
    ).toBe(true);

    const complete = emptyWeightManagementClinicalAnswers();
    complete.metabolicConditions = ["None of these apply"];
    complete.digestiveConditions = ["None of these apply"];
    complete.cardiovascularConditions = ["None of these apply"];
    complete.mentalHealthConditions = ["None of these apply"];
    complete.seriousConditions = ["None of these apply"];
    complete.currentMedications = ["None of the above"];
    expect(areClinicalAnswersComplete(complete)).toBe(true);
    expect(isWeightManagementClinicalHistoryComplete(complete)).toBe(true);
  });

  it("returns deferred until the assessment is completed", () => {
    expect(
      resolveWeightManagementClinicalStatus({
        clinicalHistoryDeferredAt: "2026-08-26T00:00:00.000Z",
      })
    ).toBe("deferred");
    expect(
      resolveWeightManagementClinicalStatus({
        clinicalHistoryDeferredAt: "2026-08-26T00:00:00.000Z",
        clinicalHistoryCompletedAt: "2026-08-26T01:00:00.000Z",
        metabolicConditions: ["None of these apply"],
        digestiveConditions: ["None of these apply"],
        cardiovascularConditions: ["None of these apply"],
        mentalHealthConditions: ["None of these apply"],
        seriousConditions: ["None of these apply"],
        currentMedications: ["None of the above"],
      })
    ).toBe("complete");
  });
});
