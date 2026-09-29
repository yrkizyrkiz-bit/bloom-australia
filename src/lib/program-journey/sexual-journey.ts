import { CheckCircle2, Heart, Phone } from "lucide-react";
import type { JourneyTimelineStep } from "@/lib/program-journey/timeline";
import { resolvePublicConsultProgramFromBookingNotes } from "@/lib/funnel/public-consult-programs";

export const MENS_SEXUAL_JOURNEY_STEPS: JourneyTimelineStep[] = [
  {
    key: "payment",
    label: "Payment received",
    description: "Your Sexual Health membership payment has been received",
    icon: CheckCircle2,
  },
  {
    key: "consultation",
    label: "Doctor assessment",
    description: "Your doctor will review your concerns at the scheduled time",
    icon: Phone,
  },
  {
    key: "approved",
    label: "Treatment plan approved",
    description: "Your doctor has approved your erectile dysfunction treatment",
    icon: CheckCircle2,
  },
  {
    key: "active",
    label: "Program active",
    description: "Your Sexual Health program is active",
    icon: Heart,
  },
];

export type SexualJourneyCanonicalStatus =
  | "CONSULTATION_PAID"
  | "AWAITING_DOCTOR_CALL"
  | "APPROVED"
  | "ACTIVE";

export type SexualJourneySignals = {
  journeyStatus?: string | null;
  approvalStatus?: string | null;
  programMemberStatus?: string | null;
  hasUpcomingBooking?: boolean;
  consultCompleted?: boolean;
  hasSexualPrescription?: boolean;
  hasActiveTreatment?: boolean;
  /**
   * True only when this account has no competing clinical programs that share
   * user-level journey/approval fields (weight management, hair loss).
   * When false, approval must come from Sexual Health–specific signals.
   */
  sexualOnly?: boolean;
};

const SEXUAL_ACTIVE_STATUSES = new Set(["ACTIVE", "ONBOARDING_COMPLETE", "DELIVERED"]);

const SEXUAL_APPROVED_STATUSES = new Set([
  "APPROVED",
  "APPROVED_PENDING_TESTS",
  "NO_TREATMENT",
  "SCRIPT_DRAFT",
  "SCRIPT_WRITTEN",
  "SCRIPT_SENT_TO_PHARMACY",
  "PHARMACY_PENDING",
  "DISPENSING",
  "SHIPPED",
  "ONBOARDING_PENDING",
]);

const SEXUAL_DOCTOR_STATUSES = new Set([
  "CONSULTATION_BOOKED",
  "PRE_TRIAGE_COMPLETE",
  "AWAITING_DOCTOR_CALL",
  "CONSULT_COMPLETED",
  "AWAITING_DOCTOR_DECISION",
  "PRE_TRIAGE_PENDING",
]);

const SEXUAL_STATUS_TO_STEP: Record<string, number> = {
  LEAD: 0,
  CONSENTED: 0,
  SURVEY_COMPLETED: 0,
  CONSULTATION_BOOKING_STARTED: 0,
  CONSULTATION_PAID: 0,
  PRE_TRIAGE_PENDING: 0,
  CONSULTATION_BOOKED: 1,
  PRE_TRIAGE_COMPLETE: 1,
  AWAITING_DOCTOR_CALL: 1,
  CONSULT_COMPLETED: 1,
  AWAITING_DOCTOR_DECISION: 1,
  APPROVED: 2,
  APPROVED_PENDING_TESTS: 2,
  NO_TREATMENT: 2,
  SCRIPT_DRAFT: 2,
  SCRIPT_WRITTEN: 2,
  SCRIPT_SENT_TO_PHARMACY: 2,
  PHARMACY_PENDING: 2,
  DISPENSING: 2,
  SHIPPED: 2,
  ONBOARDING_PENDING: 2,
  DELIVERED: 3,
  ONBOARDING_COMPLETE: 3,
  ACTIVE: 3,
};

export function resolveSexualJourneyStatus(
  signals: SexualJourneySignals
): SexualJourneyCanonicalStatus {
  const status = signals.journeyStatus || "";
  const sexualOnly = signals.sexualOnly === true;

  if (signals.hasActiveTreatment) return "ACTIVE";
  if (signals.programMemberStatus === "ACTIVE" && signals.hasSexualPrescription) {
    return "ACTIVE";
  }
  if (
    sexualOnly &&
    signals.programMemberStatus === "ACTIVE" &&
    (signals.approvalStatus === "APPROVED" || SEXUAL_ACTIVE_STATUSES.has(status))
  ) {
    return "ACTIVE";
  }

  if (signals.hasSexualPrescription) return "APPROVED";
  if (
    sexualOnly &&
    (signals.approvalStatus === "APPROVED" || SEXUAL_APPROVED_STATUSES.has(status))
  ) {
    return "APPROVED";
  }

  if (signals.hasUpcomingBooking || signals.consultCompleted) {
    return "AWAITING_DOCTOR_CALL";
  }
  if (sexualOnly && SEXUAL_DOCTOR_STATUSES.has(status)) {
    return "AWAITING_DOCTOR_CALL";
  }

  return "CONSULTATION_PAID";
}

export function getSexualJourneyStageDescription(
  status: SexualJourneyCanonicalStatus | string
): string {
  switch (status) {
    case "ACTIVE":
      return "Program active";
    case "APPROVED":
      return "Treatment plan approved";
    case "AWAITING_DOCTOR_CALL":
      return "Doctor assessment";
    default:
      return "Payment received";
  }
}

export function getSexualTimelineProgress(
  journeyStatus: string
): { currentStep: number; steps: JourneyTimelineStep[] } {
  return {
    currentStep: SEXUAL_STATUS_TO_STEP[journeyStatus] ?? 0,
    steps: MENS_SEXUAL_JOURNEY_STEPS,
  };
}

export function resolveSexualApprovalUserJourney(input: {
  hasWeightManagementEnrollment: boolean;
  hasHairLossEnrollment?: boolean;
}): { journeyStatus?: "ACTIVE" } {
  if (input.hasWeightManagementEnrollment || input.hasHairLossEnrollment) return {};
  return { journeyStatus: "ACTIVE" };
}

/** Match Sexual Health portal bookings, including men's public funnel notes. */
export function isMensSexualHealthBookingNotes(notes?: string | null): boolean {
  if (resolvePublicConsultProgramFromBookingNotes(notes)?.slug === "mens_health") {
    return true;
  }
  const n = (notes || "").toLowerCase();
  return (
    n.includes("sexual health") ||
    n.includes("erectile") ||
    n.includes("mens_health_sexual") ||
    n.includes("mens health") ||
    n.includes("men's health") ||
    n.includes("mens_health")
  );
}

export function pickMensSexualHealthBooking<T extends { notes?: string | null }>(
  candidates: T[]
): T | null {
  return candidates.find((row) => isMensSexualHealthBookingNotes(row.notes)) ?? null;
}
