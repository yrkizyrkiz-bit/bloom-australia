import { describe, expect, it } from "vitest";
import { calculateBiologicalAge } from "@/lib/biological-age";

/** Tianna-like panel (AU units) with full KDM + PhenoAge cores */
const TIANNA_MARKERS = {
  albumin: 51,
  creatinine: 77,
  glucose: 4.5,
  crp: 3,
  lymphocytePercent: 27,
  mcv: 68,
  rdw: 19.2,
  alp: 66,
  wbc: 10,
  hba1c: 5.7,
  total_cholesterol: 3.4,
  bun: 3.9,
  hemoglobin: 98,
  ferritin: 8,
  hdl_cholesterol: 1.2,
  ldl_cholesterol: 1.9,
  triglycerides: 0.6,
  alt: 14,
  ast: 24,
  ggt: 11,
  egfr: 90,
};

describe("biological age age-routing", () => {
  it("uses KDM for age ≤30 when blood markers are present (Tianna ≈21, not ~31)", () => {
    const result = calculateBiologicalAge({
      chronologicalAge: 20,
      gender: "female",
      biomarkers: TIANNA_MARKERS,
    });
    expect(result.biologicalAge).toBe(21);
    expect(result.ageDifference).toBe(1);
    expect(result.methodology).toMatch(/KDM/i);
    // Levine PhenoAge still populated for the existing UI field
    expect(result.phenotypicAge).toBeGreaterThan(25);
  });

  it("uses KDM at exactly age 30", () => {
    const result = calculateBiologicalAge({
      chronologicalAge: 30,
      gender: "female",
      biomarkers: TIANNA_MARKERS,
    });
    expect(result.methodology).toMatch(/KDM/i);
  });

  it("uses PhenoAge blend for age >30", () => {
    const result = calculateBiologicalAge({
      chronologicalAge: 31,
      gender: "female",
      biomarkers: TIANNA_MARKERS,
    });
    expect(result.methodology).toMatch(/Phenotypic Age \(Levine/i);
    expect(result.biologicalAge).toBeGreaterThan(25);
  });

  it("falls back to PhenoAge blend under 30 when KDM markers are incomplete", () => {
    const { total_cholesterol: _c, bun: _b, ...incomplete } = TIANNA_MARKERS;
    const result = calculateBiologicalAge({
      chronologicalAge: 20,
      gender: "female",
      biomarkers: incomplete,
    });
    expect(result.methodology).toMatch(/Phenotypic Age \(Levine/i);
    expect(result.biologicalAge).toBeGreaterThan(25);
  });
});
