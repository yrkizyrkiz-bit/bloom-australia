/**
 * Unit tests for the persisted membership entitlement layer:
 * - canonical key normalization
 * - biomarker readiness rules
 * - pure signal -> desired-entitlement reconciliation
 * - end-to-end membership derivation
 *
 * All pure functions: no DB or network.
 */

import { describe, it, expect } from "vitest";
import {
  normalizeProgramKey,
  normalizeScopeKey,
  PROGRAM_TO_ESSENTIAL_SLUG,
} from "@/lib/membership/keys";
import {
  assessBiologicalClockReadiness,
  assessHealthScoreReadiness,
  assessOrganAreaReadiness,
  getMarkerCoverage,
  normalizeBiomarkerId,
  BIOLOGICAL_CLOCK_CORE_MARKERS,
  type BiomarkerResultSummary,
} from "@/lib/membership/biomarker-readiness";
import {
  computeDesiredEntitlements,
  type DesiredEntitlement,
} from "@/lib/membership/entitlement-service";
import {
  deriveMembershipEntitlements,
  type EntitlementRecord,
} from "@/lib/membership/entitlements";

function results(...ids: string[]): BiomarkerResultSummary[] {
  return ids.map((biomarkerId) => ({ biomarkerId, testedAt: new Date() }));
}

function find(desired: DesiredEntitlement[], type: string, key: string) {
  return desired.find((d) => d.type === type && d.key === key);
}

const ALL_CLOCK = [...BIOLOGICAL_CLOCK_CORE_MARKERS];

describe("normalizeProgramKey", () => {
  it("maps legacy tiers to canonical program keys", () => {
    expect(normalizeProgramKey("weight_management")).toBe("WEIGHT_MANAGEMENT");
    expect(normalizeProgramKey("hair_loss")).toBe("HAIR_LOSS");
    expect(normalizeProgramKey("fatty_liver")).toBe("WEIGHT_MANAGEMENT");
    expect(normalizeProgramKey("sanative_core")).toBe("WEIGHT_MANAGEMENT");
  });

  it("defaults gendered programs to Vitality and detects sexual focus", () => {
    expect(normalizeProgramKey("mens_health")).toBe("MENS_HEALTH_VITALITY");
    expect(normalizeProgramKey("MENS_HEALTH")).toBe("MENS_HEALTH_VITALITY");
    expect(normalizeProgramKey("mens_health_sexual")).toBe("MENS_HEALTH_SEXUAL");
    expect(normalizeProgramKey("womens_health")).toBe("WOMENS_HEALTH_VITALITY");
    expect(normalizeProgramKey("womens health sexual")).toBe("WOMENS_HEALTH_SEXUAL");
  });

  it("returns null for non-program strings", () => {
    expect(normalizeProgramKey("organ_care")).toBeNull();
    expect(normalizeProgramKey("")).toBeNull();
  });

  it("every program maps to an essential panel", () => {
    expect(PROGRAM_TO_ESSENTIAL_SLUG.MENS_HEALTH_SEXUAL).toBe("MENS_HEALTH");
    expect(PROGRAM_TO_ESSENTIAL_SLUG.WOMENS_HEALTH_VITALITY).toBe("WOMENS_HEALTH");
  });
});

describe("normalizeScopeKey", () => {
  it("maps scope-ish strings to canonical scope keys", () => {
    expect(normalizeScopeKey("complete health")).toBe("COMPLETE_HEALTH");
    expect(normalizeScopeKey("biological clock")).toBe("BIOLOGICAL_CLOCK");
    expect(normalizeScopeKey("organ care")).toBe("ORGAN_CARE");
    expect(normalizeScopeKey("liver")).toBe("ORGAN_CARE");
    expect(normalizeScopeKey("health_score")).toBe("HEALTH_SCORE");
  });

  it("returns null for program-only strings", () => {
    expect(normalizeScopeKey("weight_management")).toBeNull();
  });
});

describe("biomarker readiness", () => {
  it("normalizes and computes coverage", () => {
    const coverage = getMarkerCoverage(["alp", "albumin", "ggt"], results("alkaline_phosphatase", "albumin"));
    expect(coverage.availableCount).toBe(2);
    expect(coverage.missing).toEqual(["ggt"]);
    expect(normalizeBiomarkerId("LDL")).toBe("ldl_cholesterol");
  });

  it("biological clock ready only with all 9 core markers + entitlement", () => {
    expect(assessBiologicalClockReadiness({ hasEntitlement: true, results: results(...ALL_CLOCK) }).state).toBe("ready");
    expect(assessBiologicalClockReadiness({ hasEntitlement: false, results: results(...ALL_CLOCK) }).state).toBe("locked_upgrade");
    expect(assessBiologicalClockReadiness({ hasEntitlement: true, results: results("albumin", "glucose") }).state).toBe("partial");
  });

  it("organ liver readiness", () => {
    expect(assessOrganAreaReadiness({ area: "liver", hasEntitlement: true, results: results("alt", "ast", "ggt", "alp", "albumin") }).state).toBe("ready");
    expect(assessOrganAreaReadiness({ area: "liver", hasEntitlement: true, results: results("albumin") }).state).toBe("partial");
  });

  it("health score requires >=4 categories incl heart/metabolic + entitlement", () => {
    const markers = results(
      "alt", "ast", "ggt", "alp", "albumin",
      "creatinine", "egfr", "bun",
      "ldl_cholesterol", "hdl_cholesterol", "triglycerides", "glucose",
      "hba1c", "sodium", "potassium"
    );
    expect(assessHealthScoreReadiness({ hasEntitlement: true, results: markers }).state).toBe("ready");
    expect(assessHealthScoreReadiness({ hasEntitlement: false, results: markers }).state).toBe("locked_upgrade");
  });
});

describe("computeDesiredEntitlements", () => {
  it("weight-only tier grants weight program + program essential, nothing else", () => {
    const desired = computeDesiredEntitlements({
      subscriptionTier: "weight_management",
      subscriptionStatus: "ACTIVE",
    });
    expect(find(desired, "PROGRAM", "WEIGHT_MANAGEMENT")?.status).toBe("ACTIVE");
    expect(find(desired, "SCOPE", "PROGRAM_ESSENTIAL")?.status).toBe("ACTIVE");
    expect(find(desired, "SCOPE", "ORGAN_CARE")).toBeUndefined();
    expect(find(desired, "SCOPE", "BIOLOGICAL_CLOCK")).toBeUndefined();
  });

  it("paid weight journey grants active weight program despite inactive subscription", () => {
    const desired = computeDesiredEntitlements({
      subscriptionTier: "weight_management",
      subscriptionStatus: "INACTIVE",
      journeyStatus: "AWAITING_DOCTOR_DECISION",
      weightIntakePaymentStatus: "PAID",
    });
    expect(find(desired, "PROGRAM", "WEIGHT_MANAGEMENT")?.status).toBe("ACTIVE");
  });

  it("complete health subscription expands into component scopes", () => {
    const desired = computeDesiredEntitlements({
      memberSubscriptions: [
        { status: "ACTIVE", product: { slug: "complete-health", name: "Complete Health Panel", program: "COMPLETE_HEALTH", planTier: null } },
      ],
    });
    expect(find(desired, "SCOPE", "COMPLETE_HEALTH")?.status).toBe("ACTIVE");
    expect(find(desired, "SCOPE", "ORGAN_CARE")?.status).toBe("ACTIVE");
    expect(find(desired, "SCOPE", "BIOLOGICAL_CLOCK")?.status).toBe("ACTIVE");
    expect(find(desired, "SCOPE", "HEALTH_SCORE")?.status).toBe("ACTIVE");
  });

  it("program member maps men's health to vitality focus when no concern", () => {
    const desired = computeDesiredEntitlements({
      programMembers: [{ program: "MENS_HEALTH", membershipStatus: "ACTIVE" }],
    });
    expect(find(desired, "PROGRAM", "MENS_HEALTH_VITALITY")?.status).toBe("ACTIVE");
  });

  it("program member maps men's health PE concern to sexual health focus", () => {
    const desired = computeDesiredEntitlements({
      subscriptionTier: "mens_health",
      subscriptionStatus: "INACTIVE",
      programMembers: [
        {
          program: "MENS_HEALTH",
          membershipStatus: "PENDING",
          intakeData: {
            canonicalProgramKey: "MENS_HEALTH_SEXUAL",
            concern: "premature-ejaculation",
          },
        },
      ],
    });
    expect(find(desired, "PROGRAM", "MENS_HEALTH_SEXUAL")?.status).toBe("PENDING");
    expect(find(desired, "PROGRAM", "MENS_HEALTH_VITALITY")).toBeUndefined();
  });

  it("hair-only member does not receive weight management entitlement", () => {
    const desired = computeDesiredEntitlements({
      subscriptionTier: "hair_loss",
      subscriptionStatus: "ACTIVE",
      journeyStatus: "AWAITING_DOCTOR_DECISION",
      programMembers: [{ program: "HAIR_LOSS", membershipStatus: "ACTIVE" }],
    });
    expect(find(desired, "PROGRAM", "HAIR_LOSS")?.status).toBe("ACTIVE");
    expect(find(desired, "PROGRAM", "WEIGHT_MANAGEMENT")).toBeUndefined();
  });

  it("cancelled subscription tier yields inactive program", () => {
    const desired = computeDesiredEntitlements({
      subscriptionTier: "weight_management",
      subscriptionStatus: "CANCELLED",
    });
    expect(find(desired, "PROGRAM", "WEIGHT_MANAGEMENT")?.status).toBe("INACTIVE");
  });

  it("keeps the strongest status across multiple sources", () => {
    const desired = computeDesiredEntitlements({
      subscriptionTier: "weight_management",
      subscriptionStatus: "CANCELLED",
      memberProgram: { isActive: true },
    });
    expect(find(desired, "PROGRAM", "WEIGHT_MANAGEMENT")?.status).toBe("ACTIVE");
  });
});

describe("deriveMembershipEntitlements", () => {
  it("weight-only member: program ready, whole-body scopes locked", () => {
    const entitlements: EntitlementRecord[] = [
      { type: "PROGRAM", key: "WEIGHT_MANAGEMENT", status: "ACTIVE" },
      { type: "SCOPE", key: "PROGRAM_ESSENTIAL", status: "ACTIVE" },
    ];
    const derived = deriveMembershipEntitlements({
      entitlements,
      gender: "male",
      biomarkerResults: results("glucose", "hba1c", "triglycerides", "hdl_cholesterol"),
    });
    expect(["ready", "partial"]).toContain(derived.programs.WEIGHT_MANAGEMENT.state);
    expect(derived.programs.MENS_HEALTH_VITALITY.state).toBe("locked_upgrade");
    expect(derived.scopes.ORGAN_CARE.state).toBe("locked_upgrade");
    expect(derived.scopes.BIOLOGICAL_CLOCK.state).toBe("locked_upgrade");
    const ids = derived.upgradeOpportunities.map((o) => o.key);
    expect(ids).toContain("ORGAN_CARE");
    expect(ids).toContain("BIOLOGICAL_CLOCK");
  });

  it("complete-health member: biological clock ready with all markers", () => {
    const entitlements: EntitlementRecord[] = [
      { type: "SCOPE", key: "COMPLETE_HEALTH", status: "ACTIVE" },
      { type: "SCOPE", key: "ORGAN_CARE", status: "ACTIVE" },
      { type: "SCOPE", key: "BIOLOGICAL_CLOCK", status: "ACTIVE" },
      { type: "SCOPE", key: "HEALTH_SCORE", status: "ACTIVE" },
    ];
    const derived = deriveMembershipEntitlements({
      entitlements,
      gender: "female",
      biomarkerResults: results(...ALL_CLOCK),
    });
    expect(derived.biologicalClock.state).toBe("ready");
    expect(derived.scopes.COMPLETE_HEALTH.state).toBe("ready");
    expect(derived.programs.WEIGHT_MANAGEMENT.state).toBe("locked_upgrade");
  });

  it("inactive entitlement renders inactive state", () => {
    const derived = deriveMembershipEntitlements({
      entitlements: [{ type: "PROGRAM", key: "WEIGHT_MANAGEMENT", status: "INACTIVE" }],
      gender: "male",
      biomarkerResults: results("glucose", "hba1c", "triglycerides"),
    });
    expect(derived.programs.WEIGHT_MANAGEMENT.state).toBe("inactive");
  });
});
