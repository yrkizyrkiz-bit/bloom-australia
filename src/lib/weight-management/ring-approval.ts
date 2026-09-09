const APPROVED_JOURNEY_STATUSES = [
  "APPROVED",
  "APPROVED_PENDING_TESTS",
  "TESTS_ORDERED",
  "AWAITING_TESTS",
  "RESULTS_RECEIVED",
  "FINAL_DOCTOR_REVIEW",
  "SCRIPT_WRITTEN",
  "PHARMACY_PENDING",
  "DISPENSING",
  "SHIPPED",
  "DELIVERED",
  "ONBOARDING_PENDING",
  "ONBOARDING_COMPLETE",
  "ACTIVE",
];

export function isWeightManagementApproved(
  journeyStatus?: string | null,
  approvalStatus?: string | null
) {
  return (
    APPROVED_JOURNEY_STATUSES.includes(journeyStatus || "") ||
    approvalStatus === "APPROVED" ||
    approvalStatus === "APPROVED_WITH_TESTS"
  );
}
