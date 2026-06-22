import { normalizeProgramKey } from "@/lib/membership/keys";

export type WeightAccessSignals = {
  subscriptionTier?: string | null;
  memberProgram?: { isActive?: boolean | null } | null;
  weightIntakePaymentStatus?: string | null;
  hasPaidWeightIntake?: boolean;
  journeyStatus?: string | null;
  programMembers?: Array<{ program?: string | null; membershipStatus?: string | null }>;
  memberSubscriptions?: Array<{
    status?: string | null;
    product?: {
      slug?: string | null;
      name?: string | null;
      program?: string | null;
      planTier?: string | null;
    } | null;
  }>;
};

/** Journey statuses where weight funnel payment is complete and program access should be granted. */
export const PAID_WEIGHT_JOURNEY_STATUSES = new Set([
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

/** True when legacy signals indicate an explicit weight-management enrolment. */
export function hasWeightProgramContext(input: WeightAccessSignals): boolean {
  if (normalizeProgramKey(input.subscriptionTier) === "WEIGHT_MANAGEMENT") return true;
  if (input.memberProgram?.isActive) return true;
  if (input.weightIntakePaymentStatus === "PAID") return true;
  if (input.hasPaidWeightIntake) return true;
  if (
    input.programMembers?.some(
      (pm) => normalizeProgramKey(pm.program) === "WEIGHT_MANAGEMENT"
    )
  ) {
    return true;
  }
  if (
    input.memberSubscriptions?.some((sub) => {
      const text = [
        sub.product?.slug,
        sub.product?.name,
        sub.product?.program,
        sub.product?.planTier,
      ]
        .filter(Boolean)
        .join(" ");
      return normalizeProgramKey(text) === "WEIGHT_MANAGEMENT";
    })
  ) {
    return true;
  }
  return false;
}

export function isWeightJourneyPaid(input: WeightAccessSignals): boolean {
  return (
    hasWeightProgramContext(input) &&
    Boolean(input.journeyStatus && PAID_WEIGHT_JOURNEY_STATUSES.has(input.journeyStatus))
  );
}
