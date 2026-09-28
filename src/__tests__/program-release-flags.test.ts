import { describe, expect, it } from "vitest";
import { getProgramCardsForGender } from "@/lib/programs/catalog";
import {
  isHiddenVitalityProgram,
  isHiddenWomensPortalArea,
  VITALITY_PROGRAM_RELEASED,
  WOMENS_PCOS_FERTILITY_RELEASED,
} from "@/lib/programs/release-flags";

describe("vitality release flag", () => {
  it("hides men's vitality and menopause care cards until a later release", () => {
    expect(VITALITY_PROGRAM_RELEASED).toBe(false);
    expect(isHiddenVitalityProgram("MENS_HEALTH_VITALITY")).toBe(true);
    expect(isHiddenVitalityProgram("WOMENS_HEALTH_VITALITY")).toBe(true);
    expect(isHiddenVitalityProgram("WOMENS_HEALTH_SEXUAL")).toBe(false);
    expect(isHiddenVitalityProgram("HAIR_LOSS")).toBe(false);
  });

  it("shows women's wellness on the female programs hub without menopause care", () => {
    const maleCards = getProgramCardsForGender("male");
    const femaleCards = getProgramCardsForGender("female");

    expect(maleCards.map((card) => card.key)).not.toContain("MENS_HEALTH_VITALITY");
    expect(femaleCards.map((card) => card.key)).not.toContain("WOMENS_HEALTH_VITALITY");
    expect(femaleCards.map((card) => card.key)).toContain("WOMENS_HEALTH_SEXUAL");
    expect(femaleCards.find((c) => c.key === "WOMENS_HEALTH_SEXUAL")?.label).toBe(
      "Women's Wellness"
    );
    expect(maleCards.map((card) => card.key)).toContain("HAIR_LOSS");
    expect(maleCards.map((card) => card.key)).toContain("MENS_HEALTH_SEXUAL");
  });
});

describe("women's portal PCOS / fertility release flag", () => {
  it("hides PCOS, Fertility, and Hormone Health portal areas for v2", () => {
    expect(WOMENS_PCOS_FERTILITY_RELEASED).toBe(false);
    expect(isHiddenWomensPortalArea("pcos")).toBe(true);
    expect(isHiddenWomensPortalArea("fertility")).toBe(true);
    expect(isHiddenWomensPortalArea("hormones")).toBe(true);
    expect(isHiddenWomensPortalArea("menopause")).toBe(false);
  });
});
