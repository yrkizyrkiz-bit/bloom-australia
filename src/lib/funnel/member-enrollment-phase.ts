/** Journey statuses where checkout/payment has succeeded (or clinical path is underway). */
export const PAID_MEMBER_JOURNEY_STATUSES = new Set([
  "CONSULTATION_PAID",
  "PRE_TRIAGE_PENDING",
  "PRE_TRIAGE_COMPLETE",
  "AWAITING_DOCTOR_CALL",
  "CONSULT_COMPLETED",
  "AWAITING_DOCTOR_DECISION",
  "APPROVED_PENDING_TESTS",
  "TESTS_ORDERED",
  "AWAITING_TESTS",
  "RESULTS_RECEIVED",
  "FINAL_DOCTOR_REVIEW",
  "APPROVED",
  "SCRIPT_WRITTEN",
  "PHARMACY_PENDING",
  "DISPENSING",
  "SHIPPED",
  "DELIVERED",
  "ONBOARDING_PENDING",
  "ONBOARDING_COMPLETE",
  "ACTIVE",
]);

/** Intake / checkout started but payment not completed. */
export const PRE_PAYMENT_JOURNEY_STATUSES = new Set([
  "LEAD",
  "SURVEY_COMPLETED",
  "CONSULTATION_BOOKING_STARTED",
  "CONSULTATION_BOOKED",
]);

export function hasPaidMemberJourney(journeyStatus: string | null | undefined): boolean {
  return PAID_MEMBER_JOURNEY_STATUSES.has(journeyStatus || "");
}

export function isProspectiveEnrollment(input: {
  memberStatus?: string | null;
  journeyStatus?: string | null;
}): boolean {
  return (
    input.memberStatus === "POTENTIAL_MEMBER" &&
    !hasPaidMemberJourney(input.journeyStatus)
  );
}

export function canDiscoverBillingFromProgramIntake(
  journeyStatus: string | null | undefined
): boolean {
  return hasPaidMemberJourney(journeyStatus);
}
