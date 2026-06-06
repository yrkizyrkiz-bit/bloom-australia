/**
 * Portal lifecycle — single source of truth for member-facing UI gating.
 * Derived from journeyStatus (and related flags) on the server.
 */

export type PortalMode =
  | "PRE_PROGRAM"
  | "ACTIVATING"
  | "ACTIVE_PROGRAM"
  | "DECLINED"
  | "INACTIVE";

export type PortalFeatures = {
  /** Weight charts, goals, check-ins, track weight */
  weightProgress: boolean;
  /** Full treatment management UI */
  weightTreatmentFull: boolean;
  /** Biomarker results / monitoring views */
  biomarkerResults: boolean;
  /** Meal planner, recipes (engagement pre-activation) */
  mealPlanning: boolean;
};

export type PortalPrograms = {
  weightManagement: boolean;
};

export interface PortalContextPayload {
  portalMode: PortalMode;
  journeyStatus: string;
  stageDescription: string;
  isActive: boolean;
  isApproved: boolean;
  hasPassword: boolean;
  programs: PortalPrograms;
  features: PortalFeatures;
}

const ACTIVE_JOURNEY_STATUSES = ["ONBOARDING_COMPLETE", "ACTIVE"] as const;

const ACTIVATING_STATUSES = [
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
] as const;

const APPROVED_STATUSES = [...ACTIVATING_STATUSES, ...ACTIVE_JOURNEY_STATUSES] as const;

const DECLINED_STATUSES = ["DECLINED", "REFUND_PENDING", "REFUNDED"] as const;

const STAGE_DESCRIPTIONS: Record<string, string> = {
  LEAD: "Starting your health journey",
  CONSENTED: "Consent received",
  SURVEY_COMPLETED: "Health assessment complete",
  CONSULTATION_BOOKING_STARTED: "Booking your consultation",
  CONSULTATION_BOOKED: "Consultation booked",
  CONSULTATION_PAID: "Payment received — awaiting consultation",
  PRE_TRIAGE_PENDING: "Care team reviewing your details",
  PRE_TRIAGE_COMPLETE: "Ready for doctor consultation",
  AWAITING_DOCTOR_CALL: "Doctor will call at your scheduled time",
  CONSULT_COMPLETED: "Consultation complete — awaiting decision",
  AWAITING_DOCTOR_DECISION: "Doctor reviewing your case",
  APPROVED_PENDING_TESTS: "Program approved — blood tests ordered for monitoring",
  TESTS_ORDERED: "Program approved — blood tests being arranged",
  AWAITING_TESTS: "Program approved — awaiting test results",
  RESULTS_RECEIVED: "Test results received — under review",
  FINAL_DOCTOR_REVIEW: "Doctor reviewing your test results",
  APPROVED: "Doctor approved — preparing your program",
  DECLINED: "Program not suitable at this time",
  REFUND_PENDING: "Refund is being processed",
  REFUNDED: "Refund has been processed",
  SCRIPT_WRITTEN: "Prescription written",
  PHARMACY_PENDING: "Pharmacy preparing your treatment",
  DISPENSING: "Treatment being dispensed",
  SHIPPED: "Treatment dispatched",
  DELIVERED: "Treatment delivered",
  ONBOARDING_PENDING: "Complete your onboarding steps",
  ONBOARDING_COMPLETE: "Onboarding complete",
  ACTIVE: "Program active",
  PAUSED: "Program paused",
  CANCELLED: "Program cancelled",
};

/** Routes that require an active weight program (tracking unlocked). */
export const WEIGHT_PROGRESS_PATHS = [
  "/dashboard/weight-management/progress",
  "/dashboard/weight-management/track",
  "/dashboard/weight-management/goals",
  "/dashboard/weight-management/check-in",
] as const;

export function isWeightProgressPath(pathname: string): boolean {
  return WEIGHT_PROGRESS_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
}

/** Weight program home after checkout — shows journey timeline + welcome banner. */
export const WM_POST_CHECKOUT_PATH =
  "/dashboard/weight-management?onboarding=post-checkout";

/** Append safe redirect to magic login URL so activation lands on WM home. */
export function buildPortalActivationMagicLink(magicLink: string): string {
  const separator = magicLink.includes("?") ? "&" : "?";
  return `${magicLink}${separator}redirect=${encodeURIComponent(WM_POST_CHECKOUT_PATH)}`;
}

export function derivePortalContext(input: {
  journeyStatus?: string | null;
  approvalStatus?: string | null;
  passwordHash?: string | null;
  subscriptionTier?: string | null;
  hasPaidWeightIntake?: boolean;
}): PortalContextPayload {
  const journeyStatus = input.journeyStatus || "LEAD";
  const hasPassword = Boolean(input.passwordHash);
  const isApproved =
    APPROVED_STATUSES.includes(journeyStatus as (typeof APPROVED_STATUSES)[number]) ||
    input.approvalStatus === "APPROVED" ||
    input.approvalStatus === "APPROVED_WITH_TESTS";
  const isActive = ACTIVE_JOURNEY_STATUSES.includes(
    journeyStatus as (typeof ACTIVE_JOURNEY_STATUSES)[number]
  );

  let portalMode: PortalMode = "PRE_PROGRAM";
  if (DECLINED_STATUSES.includes(journeyStatus as (typeof DECLINED_STATUSES)[number])) {
    portalMode = "DECLINED";
  } else if (journeyStatus === "CANCELLED" || journeyStatus === "PAUSED") {
    portalMode = "INACTIVE";
  } else if (isActive) {
    portalMode = "ACTIVE_PROGRAM";
  } else if (
    ACTIVATING_STATUSES.includes(journeyStatus as (typeof ACTIVATING_STATUSES)[number])
  ) {
    portalMode = "ACTIVATING";
  } else if (
    input.hasPaidWeightIntake ||
    journeyStatus === "CONSULTATION_PAID" ||
    journeyStatus === "CONSULTATION_BOOKED" ||
    journeyStatus === "AWAITING_DOCTOR_CALL"
  ) {
    portalMode = "PRE_PROGRAM";
  }

  const hasWeightProgram =
    input.subscriptionTier === "weight_management" ||
    input.hasPaidWeightIntake ||
    journeyStatus !== "LEAD";

  const features: PortalFeatures = {
    weightProgress: isActive,
    weightTreatmentFull: isActive || portalMode === "ACTIVATING",
    biomarkerResults: isApproved,
    mealPlanning: portalMode === "PRE_PROGRAM" || portalMode === "ACTIVATING" || isActive,
  };

  return {
    portalMode,
    journeyStatus,
    stageDescription:
      STAGE_DESCRIPTIONS[journeyStatus] || "We're preparing your program",
    isActive,
    isApproved,
    hasPassword,
    programs: {
      weightManagement: hasWeightProgram,
    },
    features,
  };
}
