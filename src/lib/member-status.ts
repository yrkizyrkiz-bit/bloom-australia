export const PORTAL_MEMBER_STATUSES = [
  "POTENTIAL_MEMBER",
  "MEMBER",
  "CANCELLED",
] as const;

export type PortalMemberStatus = (typeof PORTAL_MEMBER_STATUSES)[number];

export const MEMBER_STATUS_LABELS: Record<PortalMemberStatus, string> = {
  POTENTIAL_MEMBER: "Potential Member",
  MEMBER: "Member",
  CANCELLED: "Cancelled",
};

export const MEMBER_STATUS_BADGE_STYLES: Record<PortalMemberStatus, string> = {
  POTENTIAL_MEMBER: "bg-amber-500/10 text-amber-700 border-amber-500/30",
  MEMBER: "bg-green-500/10 text-green-700 border-green-500/30",
  CANCELLED: "bg-red-500/10 text-red-700 border-red-500/30",
};

export const PAID_JOURNEY_STATUSES = [
  "CONSULTATION_PAID",
  "PRE_TRIAGE_PENDING",
  "PRE_TRIAGE_COMPLETE",
  "AWAITING_DOCTOR_CALL",
  "CONSULT_COMPLETED",
  "AWAITING_DOCTOR_DECISION",
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
  "PAUSED",
] as const;

export function formatMemberStatus(status: string | null | undefined): string {
  if (!status) return MEMBER_STATUS_LABELS.POTENTIAL_MEMBER;
  if (status in MEMBER_STATUS_LABELS) {
    return MEMBER_STATUS_LABELS[status as PortalMemberStatus];
  }
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function isPortalMemberStatus(value: string): value is PortalMemberStatus {
  return PORTAL_MEMBER_STATUSES.includes(value as PortalMemberStatus);
}

export function derivePortalMemberStatus(input: {
  subscriptionStatus?: string | null;
  journeyStatus?: string | null;
  hasConfirmedBooking?: boolean;
}): PortalMemberStatus {
  if (
    input.subscriptionStatus === "CANCELLED" ||
    input.journeyStatus === "CANCELLED"
  ) {
    return "CANCELLED";
  }

  if (
    input.subscriptionStatus === "ACTIVE" ||
    input.hasConfirmedBooking ||
    (input.journeyStatus &&
      PAID_JOURNEY_STATUSES.includes(
        input.journeyStatus as (typeof PAID_JOURNEY_STATUSES)[number]
      ))
  ) {
    return "MEMBER";
  }

  return "POTENTIAL_MEMBER";
}
