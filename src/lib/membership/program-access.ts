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

/**
 * Member has subscription/grant access to this program.
 * Biomarker readiness (pending_results / partial) does not gate access.
 */
export function isProgramEntitled(
  membership: DerivedMembershipEntitlements | undefined,
  programKey: ProgramKey
): boolean {
  return hasProgramMembership(membership, programKey);
}
