/** Human-readable membership labels for account settings & portal UI */

export type MembershipSummary = {
  program: "weight_management" | "biomarker" | "other";
  programLabel: string;
  planLabel: string;
  planTier: "CORE" | "PRECISION" | null;
  firstMonth: {
    status: "paid" | "pending" | "unpaid";
    amountAud: number | null;
    paidAt: string | null;
  };
  recurring: {
    status: "active" | "pending_approval" | "inactive" | "cancelled";
    label: string;
    amountAud: number | null;
    billingCycle: string | null;
    nextBillingDate: string | null;
  };
  journeyStatus: string;
  journeyLabel: string;
  consultation: {
    scheduledAt: string;
    doctorName: string | null;
  } | null;
};

const PLAN_PRICES = {
  CORE: { firstMonth: 249, ongoing: 349 },
  PRECISION: { firstMonth: 399, ongoing: 499 },
} as const;

export function resolvePlanTier(input: {
  selectedPlan?: string | null;
  subscriptionTier?: string | null;
}): "CORE" | "PRECISION" | null {
  const raw = (
    input.selectedPlan ||
    input.subscriptionTier ||
    ""
  ).toUpperCase();
  if (raw.includes("PRECISION")) return "PRECISION";
  if (raw.includes("CORE")) return "CORE";
  return null;
}

export function getPlanLabel(tier: "CORE" | "PRECISION" | null): string {
  if (tier === "PRECISION") return "Sanative Precision";
  if (tier === "CORE") return "Sanative Core";
  return "Weight Management Program";
}

export function formatAud(amount: number | null | undefined): string {
  if (amount == null) return "—";
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function centsToAud(cents: number | null | undefined): number | null {
  if (cents == null) return null;
  return cents / 100;
}

export function getDefaultOngoingPrice(tier: "CORE" | "PRECISION" | null): number {
  if (tier === "PRECISION") return PLAN_PRICES.PRECISION.ongoing;
  return PLAN_PRICES.CORE.ongoing;
}

export function getDefaultFirstMonthPrice(tier: "CORE" | "PRECISION" | null): number {
  if (tier === "PRECISION") return PLAN_PRICES.PRECISION.firstMonth;
  return PLAN_PRICES.CORE.firstMonth;
}

const PAID_JOURNEY = new Set([
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

const APPROVED_JOURNEY = new Set([
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
]);

export function buildMembershipSummary(input: {
  journeyStatus: string;
  stageDescription?: string;
  subscriptionTier?: string | null;
  subscriptionStatus?: string | null;
  selectedPlan?: string | null;
  paymentStatus?: string | null;
  paymentAmountCents?: number | null;
  paidAt?: Date | null;
  membership?: {
    status: string;
    planName: string;
    amount: number;
    billingCycle: string;
    currentPeriodEnd: Date | null;
    stripeSubscriptionId: string | null;
  } | null;
  consultation?: {
    scheduledAt: Date;
    doctorName: string | null;
  } | null;
}): MembershipSummary {
  const tier = resolvePlanTier({
    selectedPlan: input.selectedPlan,
    subscriptionTier: input.subscriptionTier,
  });
  const isWeight =
    input.subscriptionTier?.includes("weight") ||
    input.selectedPlan != null ||
    PAID_JOURNEY.has(input.journeyStatus);

  const firstMonthPaid =
    input.paymentStatus === "PAID" ||
    PAID_JOURNEY.has(input.journeyStatus);

  const firstMonthAmount =
    centsToAud(input.paymentAmountCents) ??
    (firstMonthPaid ? getDefaultFirstMonthPrice(tier) : null);

  let recurringStatus: MembershipSummary["recurring"]["status"] = "pending_approval";
  let recurringLabel = "Starts after your doctor approves your program";
  let recurringAmount: number | null = getDefaultOngoingPrice(tier);
  let nextBilling: string | null = null;
  let billingCycle: string | null = "monthly";

  const sub = input.membership;
  if (sub?.stripeSubscriptionId && sub.status === "ACTIVE") {
    recurringStatus = "active";
    recurringLabel = "Active — billed monthly";
    recurringAmount = sub.amount;
    billingCycle = sub.billingCycle;
    nextBilling = sub.currentPeriodEnd?.toISOString() ?? null;
  } else if (sub?.status === "CANCELLED") {
    recurringStatus = "cancelled";
    recurringLabel = "Cancelled";
  } else if (APPROVED_JOURNEY.has(input.journeyStatus)) {
    recurringStatus = "pending_approval";
    recurringLabel = "Your care team will activate monthly billing after onboarding";
  } else if (firstMonthPaid) {
    recurringStatus = "pending_approval";
    recurringLabel = "Begins after doctor approval (if clinically suitable)";
  } else {
    recurringStatus = "inactive";
    recurringLabel = "Not started";
    recurringAmount = null;
  }

  return {
    program: isWeight ? "weight_management" : "other",
    programLabel: isWeight ? "Weight Management" : "Sanative Health",
    planLabel: getPlanLabel(tier),
    planTier: tier,
    firstMonth: {
      status: firstMonthPaid ? "paid" : input.paymentStatus === "UNPAID" ? "unpaid" : "pending",
      amountAud: firstMonthAmount,
      paidAt: input.paidAt?.toISOString() ?? null,
    },
    recurring: {
      status: recurringStatus,
      label: recurringLabel,
      amountAud: recurringAmount,
      billingCycle,
      nextBillingDate: nextBilling,
    },
    journeyStatus: input.journeyStatus,
    journeyLabel: input.stageDescription || input.journeyStatus,
    consultation: input.consultation
      ? {
          scheduledAt: input.consultation.scheduledAt.toISOString(),
          doctorName: input.consultation.doctorName,
        }
      : null,
  };
}
