import { describe, it, expect } from "vitest";
import {
  groupPortalQuizSubmissionsByProgram,
  resolveQuizAssessmentProgramTabs,
} from "@/lib/portal-quiz-display";

describe("quiz assessment tab grouping", () => {
  it("groups multiple attempts per program with newest first", () => {
    const grouped = groupPortalQuizSubmissionsByProgram([
      {
        id: "1",
        programKey: "MENS_HEALTH_SEXUAL",
        submittedAt: "2026-01-01T10:00:00.000Z",
      },
      {
        id: "2",
        programKey: "MENS_HEALTH_SEXUAL",
        submittedAt: "2026-06-01T10:00:00.000Z",
      },
    ]);

    const attempts = grouped.get("MENS_HEALTH_SEXUAL");
    expect(attempts?.map((a) => a.id)).toEqual(["2", "1"]);
  });

  it("builds program tabs from assessment and portal submissions", () => {
    const tabs = resolveQuizAssessmentProgramTabs({
      portalSubmissions: [
        { id: "a", programKey: "ORGAN_CARE", submittedAt: "2026-06-01T10:00:00.000Z" },
      ],
      hasWeightManagementAssessment: true,
      hasHairLegacyQuestionnaire: false,
    });

    expect(tabs).toContain("WEIGHT_MANAGEMENT");
    expect(tabs).toContain("ORGAN_CARE");
    expect(tabs.indexOf("WEIGHT_MANAGEMENT")).toBeLessThan(tabs.indexOf("ORGAN_CARE"));
  });

  it("does not duplicate WEIGHT_MANAGEMENT when legacy assessment and portal quiz exist", () => {
    const tabs = resolveQuizAssessmentProgramTabs({
      portalSubmissions: [
        {
          id: "wm",
          programKey: "WEIGHT_MANAGEMENT",
          submittedAt: "2026-06-01T10:00:00.000Z",
        },
      ],
      hasWeightManagementAssessment: true,
      hasHairLegacyQuestionnaire: false,
    });

    expect(tabs.filter((key) => key === "WEIGHT_MANAGEMENT")).toHaveLength(1);
  });
});
