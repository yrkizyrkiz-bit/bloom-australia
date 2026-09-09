import { describe, expect, it } from "vitest";
import { calculateKdmBiologicalAge } from "@/lib/biological-age-kdm";

/** Tianna Zekry labs (2026-09-03), AU units */
const TIANNA = {
  chronologicalAge: 20,
  sex: "female" as const,
  totalCholesterol: 3.4,
  hba1c: 5.7,
  albumin: 51,
  creatinine: 77,
  crp: 3,
  alp: 66,
  bun: 3.9,
};

describe("biological-age-kdm", () => {
  it("scores Tianna near chronological age (not PhenoAge ~35)", () => {
    const result = calculateKdmBiologicalAge(TIANNA);
    expect(result.biomarkersUsed).toBe(7);
    expect(result.biologicalAge).toBeCloseTo(20.8, 1);
    expect(result.ageAcceleration).toBeCloseTo(0.8, 1);
    expect(result.biologicalAge).toBeLessThan(25);
  });

  it("returns ~chronological age when markers match age-expected values", () => {
    // Female NHANES expected markers at age 40 from baked slopes (spot check stability)
    const result = calculateKdmBiologicalAge({
      chronologicalAge: 40,
      sex: "female",
      totalCholesterol: (146.34952433877507 + 1.3147915158570156 * 40) / 38.67,
      hba1c: 4.449792928334947 + 0.022953616902608585 * 40,
      albumin: (4.157074783337938 + -0.002187196803035441 * 40) * 10,
      creatinine: (0.5844741806686873 + 0.0032543828523632717 * 40) * 88.4,
      crp: (Math.exp(0.30328932692716326 + 0.0011775995601857742 * 40) - 1) * 10,
      alp: 54.95837586679219 + 0.629927313420123 * 40,
      bun: (6.193569618960992 + 0.14484356956869238 * 40) / 2.801,
    });
    expect(result.biologicalAge).toBeCloseTo(40, 0);
  });
});
