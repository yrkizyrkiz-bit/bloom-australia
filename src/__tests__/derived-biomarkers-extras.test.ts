import { describe, expect, it } from "vitest";
import { tryCalculatePhenotypicAgeYears } from "@/lib/biological-age";
import {
  getTierDisplayMarkerCounts,
  shouldShowPortalMarkerCard,
} from "@/lib/biomarkers/panel-biomarker-display";
import { BIOMARKER_SUBSCRIPTION_PLANS } from "@/lib/biomarkers/public-subscription-panels";
import { interpretDerivedScore } from "@/lib/derived-biomarker-interpretations";
import { deriveBiomarkersForEpisode } from "@/lib/derived-biomarkers";

const essentialInputs = [
  { biomarkerId: "total_cholesterol", value: 5.2 },
  { biomarkerId: "hdl_cholesterol", value: 1.3 },
  { biomarkerId: "ldl_cholesterol", value: 3.2 },
  { biomarkerId: "triglycerides", value: 1.4 },
  { biomarkerId: "glucose", value: 5.2 },
  { biomarkerId: "insulin", value: 8 },
  { biomarkerId: "uric_acid", value: 0.36 },
  { biomarkerId: "ast", value: 28 },
  { biomarkerId: "alt", value: 25 },
  { biomarkerId: "platelets", value: 250 },
  { biomarkerId: "neutrophils", value: 4.0 },
  { biomarkerId: "lymphocytes", value: 2.0 },
  { biomarkerId: "monocytes", value: 0.5 },
  { biomarkerId: "calcium", value: 2.3 },
  { biomarkerId: "albumin", value: 42 },
  { biomarkerId: "bilirubin_total", value: 12 },
  { biomarkerId: "sodium", value: 140 },
  { biomarkerId: "bun", value: 5.0 },
  { biomarkerId: "mcv", value: 90 },
  { biomarkerId: "rbc", value: 4.5 },
  { biomarkerId: "creatinine", value: 80 },
  { biomarkerId: "uacr", value: 1.2 },
  { biomarkerId: "tsh", value: 1.8 },
  { biomarkerId: "free_t4", value: 15 },
  { biomarkerId: "free_t3", value: 4.5 },
  { biomarkerId: "crp", value: 0.8 },
  { biomarkerId: "lymphocyte_percent", value: 30 },
  { biomarkerId: "rdw", value: 13 },
  { biomarkerId: "alp", value: 70 },
  { biomarkerId: "wbc", value: 6.5 },
];

function valueOf(
  derived: ReturnType<typeof deriveBiomarkersForEpisode>,
  id: string
): number | undefined {
  return derived.find((item) => item.biomarkerId === id)?.value;
}

describe("essential extra derived biomarkers", () => {
  const derived = deriveBiomarkersForEpisode(essentialInputs, {
    gender: "male",
    ageYears: 45,
  });

  it("calculates remnant cholesterol as TC − HDL − LDL", () => {
    expect(valueOf(derived, "remnant_cholesterol")).toBeCloseTo(0.7, 2);
    expect(interpretDerivedScore("remnant_cholesterol", 0.7)?.label).toBe("Optimal");
    expect(interpretDerivedScore("remnant_cholesterol", 0.85)?.label).toBe("Elevated");
  });

  it("calculates HOMA-B from fasting insulin and glucose", () => {
    expect(valueOf(derived, "homa_b")).toBeCloseTo((20 * 8) / (5.2 - 3.5), 1);
    expect(interpretDerivedScore("homa_b", 94)?.label).toBe("Adequate");
  });

  it("calculates FIB-4 from age, AST, ALT and platelets", () => {
    const expected = (45 * 28) / (250 * Math.sqrt(25));
    expect(valueOf(derived, "fib4")).toBeCloseTo(expected, 2);
    expect(interpretDerivedScore("fib4", 0.5)?.label).toBe("Low fibrosis risk");
  });

  it("calculates Mentzer index as MCV / RBC", () => {
    expect(valueOf(derived, "mentzer_index")).toBeCloseTo(20, 1);
    expect(interpretDerivedScore("mentzer_index", 20)?.label).toBe("Iron-deficiency pattern");
  });

  it("scores KDIGO from calculated eGFR plus UACR", () => {
    expect(valueOf(derived, "egfr")).toBeGreaterThan(60);
    expect(valueOf(derived, "kdigo_risk")).toBe(1);
    expect(interpretDerivedScore("kdigo_risk", 1)?.label).toBe("Low risk");
  });

  it("calculates PhenoAge and age acceleration when all 9 cores plus CRP are present", () => {
    const pheno = valueOf(derived, "phenotypic_age");
    const accel = valueOf(derived, "age_acceleration");
    expect(pheno).toBeGreaterThan(18);
    expect(accel).toBeDefined();
    expect(accel).toBeCloseTo((pheno ?? 0) - 45, 1);
  });

  it("skips PhenoAge when CRP is missing", () => {
    const withoutCrp = deriveBiomarkersForEpisode(
      essentialInputs.filter((item) => item.biomarkerId !== "crp"),
      { gender: "male", ageYears: 45 }
    );
    expect(valueOf(withoutCrp, "phenotypic_age")).toBeUndefined();
    expect(valueOf(withoutCrp, "age_acceleration")).toBeUndefined();
    expect(
      tryCalculatePhenotypicAgeYears(45, {
        albumin: 42,
        creatinine: 80,
        glucose: 5.2,
        lymphocytePercent: 30,
        mcv: 90,
        rdw: 13,
        alp: 70,
        wbc: 6.5,
      })
    ).toBeNull();
  });

  it("calculates free T3/T4 ratio from free T3 and free T4", () => {
    expect(valueOf(derived, "free_t3_t4_ratio")).toBeCloseTo(4.5 / 15, 3);
    expect(interpretDerivedScore("free_t3_t4_ratio", 0.3)?.label).toBe("Typical");
    expect(interpretDerivedScore("free_t3_t4_ratio", 0.2)?.label).toBe("Low conversion");
  });

  it("calculates bilirubin/albumin ratio from total bilirubin and albumin", () => {
    expect(valueOf(derived, "bilirubin_albumin_ratio")).toBeCloseTo(12 / 42, 2);
    expect(interpretDerivedScore("bilirubin_albumin_ratio", 0.29)?.label).toBe("Optimal");
    expect(interpretDerivedScore("bilirubin_albumin_ratio", 0.6)?.label).toBe("Elevated");
  });

  it("labels QUICKI, SII and corrected calcium with Superpower-style bands", () => {
    expect(valueOf(derived, "quicki")).toBeGreaterThan(0.3);
    expect(valueOf(derived, "sii")).toBe(500);
    expect(valueOf(derived, "corrected_calcium")).toBeCloseTo(2.26, 2);
    expect(interpretDerivedScore("sii", 500)?.label).toBe("Low inflammation");
    expect(interpretDerivedScore("sii", 750)?.label).toBe("Moderate");
    expect(interpretDerivedScore("corrected_calcium", 2.26)?.label).toBe("Optimal");
  });
});

describe("essential panel tally", () => {
  it("keeps marketed Essential counts in sync with Function-style display", () => {
    const counts = getTierDisplayMarkerCounts("essential");
    const plan = BIOMARKER_SUBSCRIPTION_PLANS.find((item) => item.id === "essential");
    expect(counts).toEqual({ total: 92, measurable: 46, derived: 46 });
    expect(plan?.markerCount).toBe(92);
    expect(plan?.measurableCount).toBe(46);
  });
});

describe("portal marker card visibility", () => {
  it("always shows Essential markers, with or without results", () => {
    expect(shouldShowPortalMarkerCard("tsh", false)).toBe(true);
    expect(shouldShowPortalMarkerCard("crp", false)).toBe(true);
    expect(shouldShowPortalMarkerCard("homa_ir", false)).toBe(true);
    expect(shouldShowPortalMarkerCard("active_b12", false)).toBe(true);
  });

  it("hides Advanced extras until a result exists", () => {
    expect(shouldShowPortalMarkerCard("testosterone_total", false)).toBe(false);
    expect(shouldShowPortalMarkerCard("cortisol", false)).toBe(false);
    expect(shouldShowPortalMarkerCard("estradiol", false)).toBe(false);
    expect(shouldShowPortalMarkerCard("vitamin_d", false)).toBe(false);
    expect(shouldShowPortalMarkerCard("testosterone_total", true)).toBe(true);
    expect(shouldShowPortalMarkerCard("vitamin_d", true)).toBe(true);
  });
});
