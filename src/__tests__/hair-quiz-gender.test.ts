import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { getPublicFunnelQuizSteps } from "@/lib/programs/quizzes/public-funnel-quizzes";
import {
  hairOptionsForSex,
  HAIR_MEDICAL_CONDITIONS,
  HAIR_OTHER_CONCERNS,
} from "@/lib/programs/quizzes/hair-assessment-options";

function optionLabels(programGender: "male" | "female", stepId: string): string {
  const steps = getPublicFunnelQuizSteps("HAIR_LOSS", programGender) ?? [];
  const step = steps.find((item) => item.id === stepId);
  return (step?.options ?? []).map((option) => option.label).join(" | ");
}

describe("hair quiz is tailored by sex", () => {
  it("keeps female-only medical and follow-up questions off the male path", () => {
    const labels = optionLabels("male", "medicalConditions");
    expect(labels).toContain("Prostate concerns or PSA monitoring");
    expect(labels).toContain("Taking testosterone or anabolic steroids");
    expect(labels).not.toContain("PCOS");
    expect(labels).not.toContain("Heavy or irregular periods");
    expect(labels).not.toContain("Menopause or perimenopause symptoms");

    const steps = getPublicFunnelQuizSteps("HAIR_LOSS", "male") ?? [];
    expect(steps.some((step) => step.id === "pregnancyStatus")).toBe(false);
    expect(optionLabels("male", "otherConcerns")).toContain("Men's sexual health");
    expect(optionLabels("male", "otherConcerns")).not.toContain("Periods, PCOS or menopause support");
    expect(optionLabels("male", "hairStage")).toContain("Noticeable recession");
    expect(optionLabels("male", "hairStage")).not.toContain("Part line slightly wider than before");
  });

  it("keeps male-only medical questions off the female path", () => {
    const labels = optionLabels("female", "medicalConditions");
    expect(labels).toContain("PCOS");
    expect(labels).toContain("Heavy or irregular periods");
    expect(labels).not.toContain("Prostate concerns or PSA monitoring");
    expect(labels).not.toContain("Taking testosterone or anabolic steroids");

    const steps = getPublicFunnelQuizSteps("HAIR_LOSS", "female") ?? [];
    expect(steps.some((step) => step.id === "pregnancyStatus")).toBe(true);
    expect(optionLabels("female", "otherConcerns")).toContain("Periods, PCOS or menopause support");
    expect(optionLabels("female", "otherConcerns")).not.toContain("Men's sexual health");
    expect(optionLabels("female", "hairStage")).toContain("Early thinning");
    expect(optionLabels("female", "hairStage")).toContain("Noticeable thinning");
    expect(optionLabels("female", "hairStage")).not.toContain("Noticeable recession");
  });

  it("hides sex-specific options until sex is known", () => {
    const medical = hairOptionsForSex(HAIR_MEDICAL_CONDITIONS, "").map((item) => item.label);
    const concerns = hairOptionsForSex(HAIR_OTHER_CONCERNS, "").map((item) => item.label);
    expect(medical).not.toContain("PCOS");
    expect(medical).not.toContain("Prostate concerns or PSA monitoring");
    expect(concerns).not.toContain("Men's sexual health");
    expect(concerns).not.toContain("Periods, PCOS or menopause support");
  });
});

describe("hair public funnel no longer asks for postcode mid-quiz", () => {
  it("removes the Almost there postcode step from the hair assessment", () => {
    const page = readFileSync(
      join(process.cwd(), "src/app/(public)/hair-assessment/page.tsx"),
      "utf8"
    );
    expect(page).not.toContain("Almost there! Your postcode?");
    expect(page).not.toContain("renderPostcode");
  });
});
