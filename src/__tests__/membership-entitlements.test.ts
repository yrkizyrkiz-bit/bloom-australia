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
import {
  deriveAccessMembership,
  mergeSubscriptionSignalsIntoEntitlements,
  memberSubscriptionToEntitlementStatus,
} from "@/lib/membership/subscription-access";
import { isProgramEntitled } from "@/lib/membership/program-access";

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

  it("defaults men's health to Sexual Health and detects vitality / women's focus", () => {
    expect(normalizeProgramKey("mens_health")).toBe("MENS_HEALTH_SEXUAL");
    expect(normalizeProgramKey("MENS_HEALTH")).toBe("MENS_HEALTH_SEXUAL");
    expect(normalizeProgramKey("mens_health_sexual")).toBe("MENS_HEALTH_SEXUAL");
    expect(normalizeProgramKey("mens_health_vitality")).toBe("MENS_HEALTH_VITALITY");
    expect(normalizeProgramKey("womens_health")).toBe("WOMENS_HEALTH_SEXUAL");
    expect(normalizeProgramKey("womens_health_vitality")).toBe("WOMENS_HEALTH_VITALITY");
    expect(normalizeProgramKey("womens health sexual")).toBe("WOMENS_HEALTH_SEXUAL");
    expect(normalizeProgramKey("menopause")).toBe("WOMENS_HEALTH_SEXUAL");
  });

  it("returns null for non-program strings", () => {
    expect(normalizeProgramKey("organ_care")).toBeNull();
    expect(normalizeProgramKey("")).toBeNull();
    // "sanative" fallback must not misfire for the membership product.
    expect(normalizeProgramKey("sanative_membership")).toBeNull();
    expect(normalizeProgramKey("Sanative Membership MEMBERSHIP")).toBeNull();
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
    expect(normalizeScopeKey("sanative_membership")).toBe("MEMBERSHIP");
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

  it("membership subscription grants MEMBERSHIP + essential + biological clock + organ care, not a program", () => {
    const desired = computeDesiredEntitlements({
      memberSubscriptions: [
        { status: "ACTIVE", product: { slug: "sanative_membership", name: "Sanative Membership", program: "MEMBERSHIP", planTier: null } },
      ],
    });
    expect(find(desired, "SCOPE", "MEMBERSHIP")?.status).toBe("ACTIVE");
    expect(find(desired, "SCOPE", "PROGRAM_ESSENTIAL")?.status).toBe("ACTIVE");
    expect(find(desired, "SCOPE", "BIOLOGICAL_CLOCK")?.status).toBe("ACTIVE");
    expect(find(desired, "SCOPE", "ORGAN_CARE")?.status).toBe("ACTIVE");
    expect(find(desired, "PROGRAM", "WEIGHT_MANAGEMENT")).toBeUndefined();
  });

  it("membership plus weight intake grants the included weight-management program", () => {
    const desired = computeDesiredEntitlements({
      subscriptionTier: "membership",
      subscriptionStatus: "ACTIVE",
      journeyStatus: "ACTIVE",
      hasWeightIntake: true,
      memberSubscriptions: [
        {
          status: "ACTIVE",
          product: {
            slug: "sanative_membership",
            name: "Sanative Membership",
            program: "MEMBERSHIP",
            planTier: null,
          },
        },
      ],
    });
    expect(find(desired, "SCOPE", "MEMBERSHIP")?.status).toBe("ACTIVE");
    expect(find(desired, "PROGRAM", "WEIGHT_MANAGEMENT")?.status).toBe("ACTIVE");
  });

  it("cancelled membership subscription yields inactive membership scopes", () => {
    const desired = computeDesiredEntitlements({
      memberSubscriptions: [
        { status: "CANCELLED", product: { slug: "sanative_membership", name: "Sanative Membership", program: "MEMBERSHIP", planTier: null } },
      ],
    });
    expect(find(desired, "SCOPE", "MEMBERSHIP")?.status).toBe("INACTIVE");
    expect(find(desired, "SCOPE", "PROGRAM_ESSENTIAL")?.status).toBe("INACTIVE");
    expect(find(desired, "SCOPE", "BIOLOGICAL_CLOCK")?.status).toBe("INACTIVE");
    expect(find(desired, "SCOPE", "ORGAN_CARE")?.status).toBe("INACTIVE");
  });

  it("any biomarker panel subscription includes biological clock + organ care", () => {
    const desired = computeDesiredEntitlements({
      memberSubscriptions: [
        { status: "ACTIVE", product: { slug: "biomarkers_essential", name: "Essential Biomarkers Panel", program: "BIOLOGICAL_CLOCK", planTier: "essential" } },
      ],
    });
    expect(find(desired, "SCOPE", "BIOLOGICAL_CLOCK")?.status).toBe("ACTIVE");
    expect(find(desired, "SCOPE", "ORGAN_CARE")?.status).toBe("ACTIVE");
  });

  it("ProgramMember alone does not grant program access", () => {
    const desired = computeDesiredEntitlements({
      programMembers: [{ program: "MENS_HEALTH", membershipStatus: "ACTIVE" }],
    });
    expect(find(desired, "PROGRAM", "MENS_HEALTH_VITALITY")).toBeUndefined();
    expect(find(desired, "PROGRAM", "MENS_HEALTH_SEXUAL")).toBeUndefined();
  });

  it("ProgramMember PENDING alone does not grant entitlement", () => {
    const desired = computeDesiredEntitlements({
      programMembers: [
        {
          program: "HAIR_LOSS",
          membershipStatus: "PENDING",
        },
      ],
    });
    expect(find(desired, "PROGRAM", "HAIR_LOSS")).toBeUndefined();
  });

  it("explicit mens_health_vitality tier is not overridden by a sexual ProgramMember row", () => {
    const desired = computeDesiredEntitlements({
      subscriptionTier: "mens_health_vitality",
      subscriptionStatus: "ACTIVE",
      programMembers: [
        {
          program: "MENS_HEALTH",
          membershipStatus: "ACTIVE",
          intakeData: {
            canonicalProgramKey: "MENS_HEALTH_SEXUAL",
            concern: "premature-ejaculation",
          },
        },
      ],
    });
    expect(find(desired, "PROGRAM", "MENS_HEALTH_VITALITY")?.status).toBe("ACTIVE");
    expect(find(desired, "PROGRAM", "MENS_HEALTH_SEXUAL")).toBeUndefined();
  });

  it("womens_health_vitality grants Menopause Care, not men's vitality (womens contains mens)", () => {
    const desired = computeDesiredEntitlements({
      subscriptionTier: "womens_health_vitality",
      subscriptionStatus: "ACTIVE",
    });
    expect(find(desired, "PROGRAM", "WOMENS_HEALTH_VITALITY")?.status).toBe("ACTIVE");
    expect(find(desired, "PROGRAM", "MENS_HEALTH_VITALITY")).toBeUndefined();
    expect(find(desired, "PROGRAM", "WOMENS_HEALTH_SEXUAL")).toBeUndefined();
  });

  it("bare womens_health grants Women's Wellness for the menopause funnel", () => {
    const desired = computeDesiredEntitlements({
      subscriptionTier: "womens_health",
      subscriptionStatus: "ACTIVE",
    });
    expect(find(desired, "PROGRAM", "WOMENS_HEALTH_SEXUAL")?.status).toBe("ACTIVE");
    expect(find(desired, "PROGRAM", "WOMENS_HEALTH_VITALITY")).toBeUndefined();
  });

  it("mens_health_vitality still grants men's vitality", () => {
    const desired = computeDesiredEntitlements({
      subscriptionTier: "mens_health_vitality",
      subscriptionStatus: "ACTIVE",
    });
    expect(find(desired, "PROGRAM", "MENS_HEALTH_VITALITY")?.status).toBe("ACTIVE");
    expect(find(desired, "PROGRAM", "WOMENS_HEALTH_VITALITY")).toBeUndefined();
  });

  it("hair MemberSubscription ACTIVE grants hair without weight management", () => {
    const desired = computeDesiredEntitlements({
      memberSubscriptions: [
        {
          status: "ACTIVE",
          product: {
            slug: "hair-loss",
            name: "Hair Loss",
            program: "HAIR_LOSS",
            planTier: null,
          },
        },
      ],
    });
    expect(find(desired, "PROGRAM", "HAIR_LOSS")?.status).toBe("ACTIVE");
    expect(find(desired, "PROGRAM", "WEIGHT_MANAGEMENT")).toBeUndefined();
  });

  it("past_due MemberSubscription maps to ACTIVE entitlement status", () => {
    const desired = computeDesiredEntitlements({
      memberSubscriptions: [
        {
          status: "PAST_DUE",
          product: {
            slug: "hair-loss",
            name: "Hair Loss",
            program: "HAIR_LOSS",
            planTier: null,
          },
        },
      ],
    });
    expect(find(desired, "PROGRAM", "HAIR_LOSS")?.status).toBe("ACTIVE");
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
    // Organ Care is bundled with biomarkers — never listed as a standalone upsell.
    expect(ids).not.toContain("ORGAN_CARE");
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

describe("subscription-only access", () => {
  it("Hair MemberSubscription ACTIVE + zero labs → entitled ready (not pending_results)", () => {
    const subs = [
      {
        status: "ACTIVE",
        product: { slug: "hair-loss", name: "Hair", program: "HAIR_LOSS", planTier: null },
      },
    ];
    const merged = mergeSubscriptionSignalsIntoEntitlements([], subs);
    const access = deriveAccessMembership(merged, subs);
    expect(access.programs.HAIR_LOSS.hasEntitlement).toBe(true);
    expect(access.programs.HAIR_LOSS.state).toBe("ready");
    expect(access.programs.HAIR_LOSS.status).toBe("ACTIVE");
    expect(access.programs.HAIR_LOSS.subscriptionStatus).toBe("ACTIVE");
    expect(isProgramEntitled(access, "HAIR_LOSS")).toBe(true);
  });

  it("PORTAL_PURCHASE ACTIVE without subscription row → entitled", () => {
    const access = deriveAccessMembership([
      { type: "PROGRAM", key: "WEIGHT_MANAGEMENT", status: "ACTIVE" },
    ]);
    expect(isProgramEntitled(access, "WEIGHT_MANAGEMENT")).toBe(true);
    expect(access.programs.WEIGHT_MANAGEMENT.state).toBe("ready");
  });

  it("stale PENDING entitlement is upgraded by ACTIVE MemberSubscription", () => {
    const merged = mergeSubscriptionSignalsIntoEntitlements(
      [{ type: "PROGRAM", key: "HAIR_LOSS", status: "PENDING" }],
      [
        {
          status: "ACTIVE",
          product: { program: "HAIR_LOSS", slug: "hair-loss", name: "Hair", planTier: null },
        },
      ]
    );
    expect(merged.find((e) => e.type === "PROGRAM" && e.key === "HAIR_LOSS")?.status).toBe(
      "ACTIVE"
    );
  });

  it("maps PAST_DUE subscription to ACTIVE access status", () => {
    expect(memberSubscriptionToEntitlementStatus("PAST_DUE")).toBe("ACTIVE");
    expect(memberSubscriptionToEntitlementStatus("CANCELLED")).toBe("INACTIVE");
  });

  it("PAST_DUE subscription stays entitled with payment-overdue billing status", () => {
    const subs = [
      {
        status: "PAST_DUE",
        product: { program: "HAIR_LOSS", slug: "hair-loss", name: "Hair", planTier: null },
      },
    ];
    const access = deriveAccessMembership(
      mergeSubscriptionSignalsIntoEntitlements([], subs),
      subs
    );
    expect(access.programs.HAIR_LOSS.hasEntitlement).toBe(true);
    expect(access.programs.HAIR_LOSS.status).toBe("ACTIVE");
    expect(access.programs.HAIR_LOSS.state).toBe("ready");
    expect(access.programs.HAIR_LOSS.subscriptionStatus).toBe("PAST_DUE");
    expect(isProgramEntitled(access, "HAIR_LOSS")).toBe(true);
  });

  it("cancelled subscription yields inactive / not entitled", () => {
    const access = deriveAccessMembership(
      mergeSubscriptionSignalsIntoEntitlements([], [
        {
          status: "CANCELLED",
          product: { program: "HAIR_LOSS", slug: "hair-loss", name: "Hair", planTier: null },
        },
      ]),
      [
        {
          status: "CANCELLED",
          product: { program: "HAIR_LOSS", slug: "hair-loss", name: "Hair", planTier: null },
        },
      ]
    );
    expect(access.programs.HAIR_LOSS.hasEntitlement).toBe(false);
    expect(access.programs.HAIR_LOSS.state).toBe("inactive");
    expect(access.programs.HAIR_LOSS.subscriptionStatus).toBe("INACTIVE");
    expect(isProgramEntitled(access, "HAIR_LOSS")).toBe(false);
  });
});
