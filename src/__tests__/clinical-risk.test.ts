import { describe, expect, it } from "vitest";
import { resolveClinicalRisk } from "@/lib/triage/clinical-risk";

describe("resolveClinicalRisk", () => {
  it("treats a typical hair, men's, or women's intake as routine even when triageScore is 80–90", () => {
    expect(
      resolveClinicalRisk({
        quizData: {
          gender: "female",
          pregnancyStatus: "No",
          medicalConditions: ["None of these apply to me"],
        },
      }).level
    ).toBe("LOW");

    expect(
      resolveClinicalRisk({
        quizData: {
          concern: "erectile-dysfunction",
          takingNitrates: "no",
          medicalConditions: ["None of these apply to me"],
        },
      })
    ).toEqual({ level: "LOW", reasons: [] });
  });

  it("surfaces nitrates as a high-risk reason for men's sexual health", () => {
    const risk = resolveClinicalRisk({
      quizData: { takingNitrates: "yes", medicalConditions: [] },
    });
    expect(risk.level).toBe("HIGH");
    expect(risk.reasons[0]).toMatch(/nitrates/i);
  });

  it("surfaces pregnancy as a high-risk reason for hair", () => {
    const risk = resolveClinicalRisk({
      quizData: { pregnancyStatus: "Yes" },
    });
    expect(risk.level).toBe("HIGH");
    expect(risk.reasons[0]).toMatch(/pregnant/i);
  });

  it("surfaces women's high-risk medical history", () => {
    const risk = resolveClinicalRisk({
      quizData: { medicalConditions: ["Breast cancer history"] },
    });
    expect(risk.level).toBe("HIGH");
    expect(risk.reasons).toContain("Breast cancer history");
  });
});
