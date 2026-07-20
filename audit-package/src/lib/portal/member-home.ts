import type { PortalContextPayload } from "@/lib/portal-context";
import { PROGRAM_CARDS } from "@/lib/programs/catalog";
import { isProgramEntitled } from "@/lib/membership/program-access";
import type { ProgramKey } from "@/lib/membership/keys";
import type { DerivedMembershipEntitlements } from "@/lib/membership/entitlements";
import { isOrganCareEntitled } from "@/lib/membership/organ-care-access";

/** Program grid — default member home for portal upsells and pre-lab members. */
export const MEMBER_PROGRAMS_HOME = "/dashboard/programs";

/** Classic biomarker overview — members with approved lab results. */
export const MEMBER_HEALTH_OVERVIEW = "/dashboard";

/** Priority when a member has multiple active programs. */
const PRIMARY_PROGRAM_PRIORITY: ProgramKey[] = [
  "WEIGHT_MANAGEMENT",
  "HAIR_LOSS",
  "MENS_HEALTH_SEXUAL",
  "MENS_HEALTH_VITALITY",
  "WOMENS_HEALTH_SEXUAL",
  "WOMENS_HEALTH_VITALITY",
];

export function getPrimaryEnrolledProgramKey(
  membership: DerivedMembershipEntitlements | undefined
): ProgramKey | null {
  if (!membership) return null;
  for (const key of PRIMARY_PROGRAM_PRIORITY) {
    if (isProgramEntitled(membership, key)) return key;
  }
  return null;
}

export function resolveProgramDashboardRoute(programKey: ProgramKey): string {
  return PROGRAM_CARDS.find((card) => card.key === programKey)?.dashboardRoute ?? MEMBER_PROGRAMS_HOME;
}

export function memberHasClassicHealthDashboard(
  portal: PortalContextPayload | null | undefined
): boolean {
  const membership = portal?.membership;
  if (!membership) return false;

  const biomarkersEntitled = Boolean(
    membership.scopes?.BIOLOGICAL_CLOCK?.hasEntitlement &&
      membership.scopes.BIOLOGICAL_CLOCK.status !== "INACTIVE"
  );
  const organCareEntitled = isOrganCareEntitled(membership);

  return biomarkersEntitled && organCareEntitled;
}

/** Back navigation from program shells — classic overview vs programs hub. */
export function resolveMemberBackPath(
  portal: PortalContextPayload | null | undefined
): string {
  if (memberHasClassicHealthDashboard(portal)) {
    return MEMBER_HEALTH_OVERVIEW;
  }
  return MEMBER_PROGRAMS_HOME;
}

export function resolveMemberHomePath(
  portal: PortalContextPayload | null | undefined
): string {
  if (portal?.features.biomarkerResults) {
    return MEMBER_HEALTH_OVERVIEW;
  }

  return MEMBER_PROGRAMS_HOME;
}

export function memberHasHealthOverview(
  portal: PortalContextPayload | null | undefined
): boolean {
  return Boolean(portal?.features.biomarkerResults);
}
