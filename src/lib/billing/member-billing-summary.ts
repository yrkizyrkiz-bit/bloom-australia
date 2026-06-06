import { prisma } from "@/lib/prisma";
import {
  billingIntervalLabel,
  billingIntervalShort,
  billingModelsAvailable,
  ensureBillingCatalog,
  findProductByPlanTier,
  resolvePlanTierFromStrings,
} from "./catalog";
import { syncLegacyMembershipFromMemberSub } from "./sync-subscription";
import type { BillingInterval } from "@prisma/client";

export type MemberBillingSummary = {
  program: string;
  programLabel: string;
  selectedPlan: "CORE" | "PRECISION" | null;
  planLabel: string;
  firstMonth: {
    status: "paid" | "pending" | "unpaid";
    amountAud: number | null;
    paidAt: string | null;
  };
  recurring: {
    status: "active" | "pending_approval" | "inactive" | "cancelled" | "past_due";
    label: string;
    amountAud: number | null;
    billingInterval: BillingInterval | null;
    billingLabel: string | null;
    nextBillingDate: string | null;
    paidTill: string | null;
  };
  subscription: {
    id: string | null;
    status: string | null;
    stripeSubscriptionId: string | null;
    stripeCustomerId: string | null;
    productSlug: string | null;
    productName: string | null;
    billingPriceId: string | null;
    currentPeriodStart: string | null;
    currentPeriodEnd: string | null;
    activatedAt: string | null;
  } | null;
  availableCadences: Array<{
    billingPriceId: string;
    billingInterval: BillingInterval;
    label: string;
    amountAud: number;
    stripePriceId: string | null;
  }>;
  history: Array<{
    id: string;
    changeType: string;
    fromLabel: string | null;
    toLabel: string;
    effectiveAt: string;
    changedBy: string | null;
  }>;
  journeyStatus: string;
  journeyLabel: string;
};

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
  "SCRIPT_WRITTEN",
  "PHARMACY_PENDING",
  "DISPENSING",
  "SHIPPED",
  "DELIVERED",
  "ONBOARDING_PENDING",
  "ONBOARDING_COMPLETE",
  "ACTIVE",
]);

function getPlanLabel(tier: "CORE" | "PRECISION" | null): string {
  if (tier === "PRECISION") return "Sanative Precision";
  if (tier === "CORE") return "Sanative Core";
  return "Weight Management Program";
}

export async function getMemberBillingSummary(
  userId: string,
  stageDescription?: string
): Promise<MemberBillingSummary | null> {
  await ensureBillingCatalog();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      journeyStatus: true,
      subscriptionTier: true,
      subscriptionStatus: true,
      weightManagementIntakes: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          selectedPlan: true,
          paymentStatus: true,
          paymentAmount: true,
          paidAt: true,
        },
      },
      consultationBookings: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { selectedPlan: true },
      },
      membershipSubscription: true,
      invoices: {
        where: { status: "PAID" },
        orderBy: { paidAt: "desc" },
        take: 5,
      },
    },
  });

  if (!user) return null;

  const intake = user.weightManagementIntakes[0];
  const booking = user.consultationBookings[0];
  const planTier = resolvePlanTierFromStrings({
    selectedPlan: intake?.selectedPlan ?? booking?.selectedPlan,
    subscriptionTier: user.subscriptionTier,
  });

  if (user.membershipSubscription?.stripeSubscriptionId && billingModelsAvailable()) {
    const { backfillFromLegacyMembership } = await import("./sync-subscription");
    await backfillFromLegacyMembership(userId).catch(console.error);
  }

  const memberSub = billingModelsAvailable()
      ? await prisma.memberSubscription.findFirst({
          where: { userId, product: { program: "WEIGHT_MANAGEMENT" } },
          include: {
            product: true,
            billingPrice: true,
            history: {
              orderBy: { effectiveAt: "desc" },
              take: 10,
              include: {
                fromBillingPrice: { include: { product: true } },
                toBillingPrice: { include: { product: true } },
              },
            },
          },
        })
      : null;

  const product = planTier ? await findProductByPlanTier(planTier) : null;

  const firstMonthInvoice = user.invoices.find((inv) =>
    inv.description?.toLowerCase().includes("first month") ||
    inv.description?.toLowerCase().includes("weight management")
  ) || user.invoices[0];

  const firstMonthPaid =
    intake?.paymentStatus === "PAID" ||
    !!firstMonthInvoice ||
    PAID_JOURNEY.has(user.journeyStatus);

  const firstMonthAmount =
    intake?.paymentAmount != null
      ? intake.paymentAmount / 100
      : firstMonthInvoice?.amount ?? null;

  const firstMonthPaidAt =
    intake?.paidAt?.toISOString() ?? firstMonthInvoice?.paidAt?.toISOString() ?? null;

  let recurringStatus: MemberBillingSummary["recurring"]["status"] = "inactive";
  let recurringLabel = "Not started";
  let recurringAmount: number | null = product?.billingPrices.find(
    (p) => p.isDefault
  )?.amountCents
    ? (product!.billingPrices.find((p) => p.isDefault)!.amountCents / 100)
    : planTier === "PRECISION"
      ? 499
      : 349;

  let billingInterval: BillingInterval | null = "MONTHLY";
  let billingLabel: string | null = "Monthly";
  let nextBilling: string | null = null;
  let paidTill: string | null = null;

  if (memberSub?.billingPrice && memberSub.stripeSubscriptionId) {
    if (memberSub.status === "ACTIVE") {
      recurringStatus = "active";
      recurringLabel = `Active — billed ${billingIntervalLabel(memberSub.billingPrice.billingInterval).toLowerCase()}`;
    } else if (memberSub.status === "PAST_DUE") {
      recurringStatus = "past_due";
      recurringLabel = "Payment past due";
    } else if (memberSub.status === "CANCELLED") {
      recurringStatus = "cancelled";
      recurringLabel = "Cancelled";
    }
    recurringAmount = memberSub.billingPrice.amountCents / 100;
    billingInterval = memberSub.billingPrice.billingInterval;
    billingLabel = memberSub.billingPrice.label || billingIntervalLabel(billingInterval);
    nextBilling = memberSub.currentPeriodEnd?.toISOString() ?? null;
    paidTill = nextBilling;
  } else if (memberSub?.status === "CANCELLED") {
    recurringStatus = "cancelled";
    recurringLabel = "Cancelled";
  } else if (APPROVED_JOURNEY.has(user.journeyStatus)) {
    recurringStatus = "pending_approval";
    recurringLabel = "Recurring billing starts after doctor approval / welcome call";
  } else if (firstMonthPaid) {
    recurringStatus = "pending_approval";
    recurringLabel = "Begins after doctor approval (if clinically suitable)";
  }

  const availableCadences = (product?.billingPrices || [])
    .filter((p) => !p.isFirstMonth && p.billingInterval !== "ONE_TIME")
    .map((p) => ({
      billingPriceId: p.id,
      billingInterval: p.billingInterval,
      label: p.label || billingIntervalLabel(p.billingInterval),
      amountAud: p.amountCents / 100,
      stripePriceId: p.stripePriceId,
    }));

  const history = (memberSub?.history || []).map((h) => ({
    id: h.id,
    changeType: h.changeType,
    fromLabel: h.fromBillingPrice
      ? `${h.fromBillingPrice.product.name} — ${h.fromBillingPrice.label || billingIntervalLabel(h.fromBillingPrice.billingInterval)}`
      : h.fromPlanTier
        ? getPlanLabel(h.fromPlanTier as "CORE" | "PRECISION")
        : null,
    toLabel: h.toBillingPrice
      ? `${h.toBillingPrice.product.name} — ${h.toBillingPrice.label || billingIntervalLabel(h.toBillingPrice.billingInterval)}`
      : getPlanLabel((h.toPlanTier as "CORE" | "PRECISION") || planTier),
    effectiveAt: h.effectiveAt.toISOString(),
    changedBy: h.changedBy,
  }));

  return {
    program: planTier || intake ? "weight_management" : "other",
    programLabel: planTier || intake ? "Weight Management" : "Sanative Health",
    selectedPlan: planTier,
    planLabel: memberSub?.product.name || getPlanLabel(planTier),
    firstMonth: {
      status: firstMonthPaid
        ? "paid"
        : intake?.paymentStatus === "UNPAID"
          ? "unpaid"
          : "pending",
      amountAud: firstMonthAmount ?? (planTier === "PRECISION" ? 399 : planTier === "CORE" ? 249 : null),
      paidAt: firstMonthPaidAt,
    },
    recurring: {
      status: recurringStatus,
      label: recurringLabel,
      amountAud: recurringAmount,
      billingInterval,
      billingLabel,
      nextBillingDate: nextBilling,
      paidTill,
    },
    subscription: memberSub
      ? {
          id: memberSub.id,
          status: memberSub.status,
          stripeSubscriptionId: memberSub.stripeSubscriptionId,
          stripeCustomerId: memberSub.stripeCustomerId,
          productSlug: memberSub.product.slug,
          productName: memberSub.product.name,
          billingPriceId: memberSub.billingPriceId,
          currentPeriodStart: memberSub.currentPeriodStart?.toISOString() ?? null,
          currentPeriodEnd: memberSub.currentPeriodEnd?.toISOString() ?? null,
          activatedAt: memberSub.activatedAt?.toISOString() ?? null,
        }
      : null,
    availableCadences,
    history,
    journeyStatus: user.journeyStatus,
    journeyLabel: stageDescription || user.journeyStatus,
  };
}

export function billingSummaryToMembershipSummary(
  summary: MemberBillingSummary
) {
  return {
    program: summary.program === "weight_management" ? "weight_management" as const : "other" as const,
    programLabel: summary.programLabel,
    planLabel: summary.planLabel,
    planTier: summary.selectedPlan,
    firstMonth: summary.firstMonth,
    recurring: {
      status: summary.recurring.status === "past_due" ? "inactive" as const : summary.recurring.status,
      label: summary.recurring.label,
      amountAud: summary.recurring.amountAud,
      billingCycle: summary.recurring.billingInterval
        ? billingIntervalShort(summary.recurring.billingInterval)
        : null,
      nextBillingDate: summary.recurring.nextBillingDate,
    },
    journeyStatus: summary.journeyStatus,
    journeyLabel: summary.journeyLabel,
    consultation: null as { scheduledAt: string; doctorName: string | null } | null,
    paidTill: summary.recurring.paidTill,
    billingLabel: summary.recurring.billingLabel,
    availableCadences: summary.availableCadences,
    history: summary.history,
  };
}
