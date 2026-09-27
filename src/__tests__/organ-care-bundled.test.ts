import { describe, expect, it } from "bun:test";
import { isOrganCareEntitled } from "@/lib/membership/organ-care-access";
import type { DerivedMembershipEntitlements } from "@/lib/membership/entitlements";
import { panelIncludesOrganCare } from "@/lib/biomarkers/public-checkout-tier-map";
import { ORGAN_CARE_CARD } from "@/lib/programs/catalog";

function scope(
  key: "ORGAN_CARE" | "BIOLOGICAL_CLOCK" | "MEMBERSHIP",
  overrides: Partial<DerivedMembershipEntitlements["scopes"][typeof key]> = {}
): DerivedMembershipEntitlements["scopes"][typeof key] {
  return {
    key,
    label: key,
    state: "ready",
    hasEntitlement: true,
    status: "ACTIVE",
    ...overrides,
  };
}

describe("organ care bundled with biomarkers", () => {
  it("unlocks organ care from biological clock alone", () => {
    const membership = {
      scopes: { BIOLOGICAL_CLOCK: scope("BIOLOGICAL_CLOCK") },
    } as DerivedMembershipEntitlements;
    expect(isOrganCareEntitled(membership)).toBe(true);
  });

  it("unlocks organ care from membership alone", () => {
    const membership = {
      scopes: { MEMBERSHIP: scope("MEMBERSHIP") },
    } as DerivedMembershipEntitlements;
    expect(isOrganCareEntitled(membership)).toBe(true);
  });

  it("keeps legacy organ-only grants working", () => {
    const membership = {
      scopes: { ORGAN_CARE: scope("ORGAN_CARE") },
    } as DerivedMembershipEntitlements;
    expect(isOrganCareEntitled(membership)).toBe(true);
  });

  it("does not unlock without biomarkers, membership, or organ grant", () => {
    expect(isOrganCareEntitled(undefined)).toBe(false);
    expect(
      isOrganCareEntitled({ scopes: {} } as DerivedMembershipEntitlements)
    ).toBe(false);
  });

  it("always includes organ care with panel grants", () => {
    expect(panelIncludesOrganCare("essential")).toBe(true);
    expect(panelIncludesOrganCare("advanced", { sourceProgram: "hair_loss" })).toBe(true);
  });

  it("routes organ quiz upsell to biomarkers", () => {
    expect(ORGAN_CARE_CARD.quizRoute).toBe("/dashboard/biomarkers/quiz");
  });
});
