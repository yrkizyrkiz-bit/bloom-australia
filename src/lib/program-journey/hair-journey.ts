import { CheckCircle2, Phone, Sparkles } from "lucide-react";
import type { JourneyTimelineStep } from "@/lib/program-journey/timeline";
import { resolvePublicConsultProgramFromBookingNotes } from "@/lib/funnel/public-consult-programs";
import { normalizeProgramKey } from "@/lib/membership/keys";

export const HAIR_LOSS_JOURNEY_STEPS: JourneyTimelineStep[] = [
  {
    key: "payment",
    label: "Payment received",
    description: "Your hair health payment has been received",
    icon: CheckCircle2,
  },
  {
    key: "consultation",
    label: "Doctor assessment",
    description: "Your doctor will review your hair health at the scheduled time",
    icon: Phone,
  },
  {
    key: "approved",
    label: "Treatment program approved",
    description: "Your doctor has approved your hair treatment program",
    icon: CheckCircle2,
  },
  {
    key: "active",
    label: "Program active",
    description: "Your hair health program is active",
    icon: Sparkles,
  },
];

export type HairJourneyCanonicalStatus =
  | "CONSULTATION_PAID"
  | "AWAITING_DOCTOR_CALL"
  | "APPROVED"
  | "ACTIVE";

export type HairJourneySignals = {
  journeyStatus?: string | null;
  approvalStatus?: string | null;
  programMemberStatus?: string | null;
  hasUpcomingBooking?: boolean;
  consultCompleted?: boolean;
  hasHairPrescription?: boolean;
  hasActiveTreatment?: boolean;
  /**
   * True only when this account has no competing clinical programs that share
   * user-level journey/approval fields (weight management, men's sexual health).
   * When false, approval must come from Hair Loss–specific signals.
   */
  hairOnly?: boolean;
};

const HAIR_ACTIVE_STATUSES = new Set(["ACTIVE", "ONBOARDING_COMPLETE", "DELIVERED"]);

const HAIR_APPROVED_STATUSES = new Set([
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

const HAIR_DOCTOR_STATUSES = new Set([
  "CONSULTATION_BOOKED",
  "PRE_TRIAGE_COMPLETE",
  "AWAITING_DOCTOR_CALL",
  "CONSULT_COMPLETED",
  "AWAITING_DOCTOR_DECISION",
]);

const HAIR_STATUS_TO_STEP: Record<string, number> = {
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

export function resolveHairJourneyStatus(
  signals: HairJourneySignals
): HairJourneyCanonicalStatus {
  const status = signals.journeyStatus || "";
  const hairOnly = signals.hairOnly === true;

  if (signals.hasActiveTreatment) return "ACTIVE";
  if (signals.programMemberStatus === "ACTIVE" && signals.hasHairPrescription) {
    return "ACTIVE";
  }
  if (
    hairOnly &&
    signals.programMemberStatus === "ACTIVE" &&
    (signals.approvalStatus === "APPROVED" || HAIR_ACTIVE_STATUSES.has(status))
  ) {
    return "ACTIVE";
  }

  if (signals.hasHairPrescription) return "APPROVED";
  if (hairOnly && (signals.approvalStatus === "APPROVED" || HAIR_APPROVED_STATUSES.has(status))) {
    return "APPROVED";
  }

  if (signals.hasUpcomingBooking || signals.consultCompleted) {
    return "AWAITING_DOCTOR_CALL";
  }
  if (hairOnly && HAIR_DOCTOR_STATUSES.has(status)) {
    return "AWAITING_DOCTOR_CALL";
  }

  return "CONSULTATION_PAID";
}

export function getHairJourneyStageDescription(
  status: HairJourneyCanonicalStatus | string
): string {
  switch (status) {
    case "ACTIVE":
      return "Program active";
    case "APPROVED":
      return "Treatment program approved";
    case "AWAITING_DOCTOR_CALL":
      return "Doctor assessment";
    default:
      return "Payment received";
  }
}

export function getHairTimelineProgress(
  journeyStatus: string
): { currentStep: number; steps: JourneyTimelineStep[] } {
  return {
    currentStep: HAIR_STATUS_TO_STEP[journeyStatus] ?? 0,
    steps: HAIR_LOSS_JOURNEY_STEPS,
  };
}

export function resolveHairApprovalUserJourney(input: {
  hasWeightManagementEnrollment: boolean;
  hasSexualHealthEnrollment?: boolean;
}): { journeyStatus?: "ACTIVE" } {
  if (input.hasWeightManagementEnrollment || input.hasSexualHealthEnrollment) return {};
  return { journeyStatus: "ACTIVE" };
}

/**
 * True only when Hair is enrolled and no competing clinical program is present
 * via ProgramMember or ACTIVE/PENDING PROGRAM entitlements.
 */
export function resolveHairOnlyEnrollment(input: {
  hasHairProgramMember: boolean;
  hasWeightProgramMember?: boolean;
  hasSexualProgramMember?: boolean;
  entitlementKeys?: Array<string | null | undefined>;
}): boolean {
  if (!input.hasHairProgramMember) return false;

  const keys = (input.entitlementKeys || [])
    .map((key) => normalizeProgramKey(key))
    .filter((key): key is NonNullable<typeof key> => Boolean(key));

  const hasWeight =
    Boolean(input.hasWeightProgramMember) || keys.includes("WEIGHT_MANAGEMENT");
  const hasSexual =
    Boolean(input.hasSexualProgramMember) ||
    keys.includes("MENS_HEALTH_SEXUAL") ||
    keys.includes("MENS_HEALTH_VITALITY");

  return !hasWeight && !hasSexual;
}

/**
 * Never attribute another program's consult to Hair. Prefer hair-tagged bookings;
 * only fall back to a generic open booking when the member is truly hair-only and
 * booking notes do not resolve to a different public consult program.
 */
export function resolveHairPortalBooking<T extends { notes?: string | null }>(input: {
  hairNoteBooking: T | null | undefined;
  openBooking: T | null | undefined;
  hairOnly: boolean;
  isHairMember: boolean;
}): T | null {
  if (input.hairNoteBooking) return input.hairNoteBooking;
  if (!input.hairOnly || !input.isHairMember || !input.openBooking) return null;

  const resolved = resolvePublicConsultProgramFromBookingNotes(input.openBooking.notes);
  if (resolved && resolved.slug !== "hair_loss") return null;

  return input.openBooking;
}
