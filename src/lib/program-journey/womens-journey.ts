/**
 * Journey helpers for Women's Wellness doctor approval.
 * Mirrors sexual-journey isolation: only update shared user.journeyStatus when
 * the member is not co-enrolled in weight, hair, or men's sexual programs.
 */

export function resolveWomensApprovalUserJourney(input: {
  hasWeightManagementEnrollment: boolean;
  hasHairLossEnrollment?: boolean;
  hasSexualHealthEnrollment?: boolean;
}): { journeyStatus?: "ACTIVE" } {
  if (
    input.hasWeightManagementEnrollment ||
    input.hasHairLossEnrollment ||
    input.hasSexualHealthEnrollment
  ) {
    return {};
  }
  return { journeyStatus: "ACTIVE" };
}
