import type { DerivedMembershipEntitlements } from "@/lib/membership/entitlements";
import type { ProgramKey } from "@/lib/membership/keys";

/** Member has purchased / been granted this program (ignores biomarker readiness). */
export function hasProgramMembership(
  membership: DerivedMembershipEntitlements | undefined,
  programKey: ProgramKey
): boolean {
  const program = membership?.programs?.[programKey];
  if (!program?.hasEntitlement || program.status === "INACTIVE") return false;
  return program.state !== "inactive";
}

/** Member has an active (or pending-results) program entitlement. */
export function isProgramEntitled(
  membership: DerivedMembershipEntitlements | undefined,
  programKey: ProgramKey
): boolean {
  if (!hasProgramMembership(membership, programKey)) return false;
  const state = membership!.programs![programKey].state ?? "locked_upgrade";
  return state === "ready" || state === "partial" || state === "pending_results";
}
