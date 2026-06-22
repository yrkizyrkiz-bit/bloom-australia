import type { DerivedMembershipEntitlements } from "@/lib/membership/entitlements";

/** Member has Organ Care scope (active, pending results, or partial coverage). */
export function isOrganCareEntitled(
  membership: DerivedMembershipEntitlements | undefined
): boolean {
  const scope = membership?.scopes?.ORGAN_CARE;
  if (!scope?.hasEntitlement || scope.status === "INACTIVE") return false;
  const state = scope.state ?? "locked_upgrade";
  return state === "ready" || state === "partial" || state === "pending_results";
}
