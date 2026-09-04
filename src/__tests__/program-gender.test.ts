import { describe, expect, it } from "vitest";
import {
  genderForIntakeProgram,
  genderForPublicConsultSlug,
  genderForSubscriptionTier,
  resolveDisplayedGender,
} from "@/lib/funnel/program-gender";

describe("program gender", () => {
  it("does not treat hair loss as male-only", () => {
    expect(genderForPublicConsultSlug("hair_loss")).toBeNull();
    expect(genderForSubscriptionTier("hair_loss")).toBeNull();
    expect(genderForIntakeProgram("HAIR_LOSS", "female")).toBe("FEMALE");
    expect(genderForIntakeProgram("HAIR_LOSS", "male")).toBe("MALE");
  });

  it("still infers sex from men's and women's programs", () => {
    expect(genderForPublicConsultSlug("mens_health")).toBe("MALE");
    expect(genderForPublicConsultSlug("womens_health")).toBe("FEMALE");
    expect(genderForIntakeProgram("MENS_HEALTH", "female")).toBe("MALE");
    expect(genderForIntakeProgram("WOMENS_HEALTH", "male")).toBe("FEMALE");
  });

  it("prefers quiz-collected sex over a stored hair-loss male default", () => {
    expect(
      resolveDisplayedGender({ stored: "MALE", quizGender: "female" })
    ).toBe("FEMALE");
  });
});
