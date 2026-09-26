import { describe, expect, it } from "vitest";
import { getProgramCardsForGender } from "@/lib/programs/catalog";
import {
  isHiddenVitalityProgram,
  VITALITY_PROGRAM_RELEASED,
} from "@/lib/programs/release-flags";

describe("vitality release flag", () => {
  it("hides men's and women's vitality until the later release", () => {
    expect(VITALITY_PROGRAM_RELEASED).toBe(false);
    expect(isHiddenVitalityProgram("MENS_HEALTH_VITALITY")).toBe(true);
    expect(isHiddenVitalityProgram("WOMENS_HEALTH_VITALITY")).toBe(true);
    expect(isHiddenVitalityProgram("HAIR_LOSS")).toBe(false);
  });

  it("omits vitality cards from the member programs hub", () => {
    const maleCards = getProgramCardsForGender("male");
    const femaleCards = getProgramCardsForGender("female");

    expect(maleCards.map((card) => card.key)).not.toContain("MENS_HEALTH_VITALITY");
    expect(femaleCards.map((card) => card.key)).not.toContain("WOMENS_HEALTH_VITALITY");
    expect(maleCards.map((card) => card.key)).toContain("HAIR_LOSS");
    expect(maleCards.map((card) => card.key)).toContain("MENS_HEALTH_SEXUAL");
  });
});
