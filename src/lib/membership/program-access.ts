import type { DerivedMembershipEntitlements } from "@/lib/membership/entitlements";
import type { ProgramKey } from "@/lib/membership/keys";

/** Member has an active (or pending-results) program entitlement. */
export function isProgramEntitled(
  membership: DerivedMembershipEntitlements | undefined,
  programKey: ProgramKey
): boolean {
  const program = membership?.programs?.[programKey];
  if (!program?.hasEntitlement || program.status === "INACTIVE") return false;
  const state = program.state ?? "locked_upgrade";
  return state === "ready" || state === "partial" || state === "pending_results";
}
