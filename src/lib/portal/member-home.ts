import type { PortalContextPayload } from "@/lib/portal-context";

/** Program grid — default member home for portal upsells and pre-lab members. */
export const MEMBER_PROGRAMS_HOME = "/dashboard/programs";

/** Classic biomarker overview — members with approved lab results. */
export const MEMBER_HEALTH_OVERVIEW = "/dashboard";

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
