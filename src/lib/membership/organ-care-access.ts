import type { DerivedMembershipEntitlements } from "@/lib/membership/entitlements";

function scopeActive(
  membership: DerivedMembershipEntitlements | undefined,
  key: "ORGAN_CARE" | "BIOLOGICAL_CLOCK" | "MEMBERSHIP"
): boolean {
  const scope = membership?.scopes?.[key];
  if (!scope?.hasEntitlement || scope.status === "INACTIVE") return false;
  return scope.state !== "inactive";
}

/**
 * Organ Care is included with biomarkers and Sanative Membership — not a
 * standalone subscription. Legacy ORGAN_CARE-only grants still unlock access.
 */
export function isOrganCareEntitled(
  membership: DerivedMembershipEntitlements | undefined
): boolean {
  return (
    scopeActive(membership, "ORGAN_CARE") ||
    scopeActive(membership, "BIOLOGICAL_CLOCK") ||
    scopeActive(membership, "MEMBERSHIP")
  );
}
