import { prisma } from "@/lib/prisma";
import {
  billingIntervalLabel,
  billingIntervalShort,
  billingModelsAvailable,
  ensureBillingCatalog,
  findProductByPlanTier,
  findProductByProgram,
  resolvePlanTierFromStrings,
} from "./catalog";
import { syncLegacyMembershipFromMemberSub } from "./sync-subscription";
import type { BillingInterval } from "@prisma/client";
import { normalizeProgramKey, PROGRAM_LABELS, type ProgramKey } from "@/lib/membership/keys";

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

const PROGRAM_SLUG: Record<ProgramKey, string> = {
  WEIGHT_MANAGEMENT: "weight_management",
  HAIR_LOSS: "hair_loss",
  MENS_HEALTH_VITALITY: "mens_health_vitality",
  MENS_HEALTH_SEXUAL: "mens_health_sexual",
  WOMENS_HEALTH_VITALITY: "womens_health_vitality",
  WOMENS_HEALTH_SEXUAL: "womens_health_sexual",
};

const BILLING_PROGRAMS = new Set(Object.values(PROGRAM_SLUG));

function getPlanLabel(tier: "CORE" | "PRECISION" | null): string {
  if (tier === "PRECISION") return "Sanative Precision";
  if (tier === "CORE") return "Sanative Core";
  return "Program";
}

function programSlugFromKey(key: ProgramKey): string {
  return PROGRAM_SLUG[key];
}

function invoiceMatchesProgram(description: string | null | undefined, programKey: ProgramKey): boolean {
  const text = (description || "").toLowerCase();
  if (!text) return false;

  switch (programKey) {
    case "HAIR_LOSS":
      return text.includes("hair");
    case "WEIGHT_MANAGEMENT":
      return (
        text.includes("weight") ||
        text.includes("sanative core") ||
        text.includes("sanative precision")
      );
    case "MENS_HEALTH_VITALITY":
      return text.includes("vitality") && text.includes("men");
    case "MENS_HEALTH_SEXUAL":
      return text.includes("sexual") && text.includes("men");
    case "WOMENS_HEALTH_VITALITY":
      return text.includes("vitality") && text.includes("women");
    case "WOMENS_HEALTH_SEXUAL":
      return text.includes("sexual") && text.includes("women");
    default:
      return false;
  }
}

type ResolvedBillingProgram = {
  programKey: ProgramKey;
  programSlug: string;
  programLabel: string;
  planTier: "CORE" | "PRECISION" | null;
};

function resolveBillingProgram(input: {
  subscriptionTier?: string | null;
  programMembers: Array<{ program?: string | null; intakeData?: unknown }>;
  weightIntake?: {
    selectedPlan?: string | null;
    paymentStatus?: string | null;
  } | null;
}): ResolvedBillingProgram | null {
  const programMember = input.programMembers[0];
  const memberProgramKey = normalizeProgramKey(programMember?.program);
  if (memberProgramKey) {
    const planTier =
      memberProgramKey === "WEIGHT_MANAGEMENT"
        ? resolvePlanTierFromStrings({
            selectedPlan:
              (programMember?.intakeData as { selectedPlan?: string } | null)?.selectedPlan ??
              input.weightIntake?.selectedPlan,
            subscriptionTier: input.subscriptionTier,
          })
        : null;

    return {
      programKey: memberProgramKey,
      programSlug: programSlugFromKey(memberProgramKey),
      programLabel: PROGRAM_LABELS[memberProgramKey],
      planTier,
    };
  }

  const tierProgramKey = normalizeProgramKey(input.subscriptionTier);
  if (tierProgramKey) {
    const planTier =
      tierProgramKey === "WEIGHT_MANAGEMENT"
        ? resolvePlanTierFromStrings({
            selectedPlan: input.weightIntake?.selectedPlan,
            subscriptionTier: input.subscriptionTier,
          })
        : null;

    return {
      programKey: tierProgramKey,
      programSlug: programSlugFromKey(tierProgramKey),
      programLabel: PROGRAM_LABELS[tierProgramKey],
      planTier,
    };
  }

  if (input.weightIntake) {
    const planTier = resolvePlanTierFromStrings({
      selectedPlan: input.weightIntake.selectedPlan,
      subscriptionTier: input.subscriptionTier,
    });

    return {
      programKey: "WEIGHT_MANAGEMENT",
      programSlug: "weight_management",
      programLabel: PROGRAM_LABELS.WEIGHT_MANAGEMENT,
      planTier,
    };
  }

  return null;
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
      membershipSubscription: true,
      invoices: {
        where: { status: "PAID" },
        orderBy: { paidAt: "desc" },
        take: 10,
      },
    },
  });

  if (!user) return null;

  const programMembers = await prisma.programMember.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 1,
    select: { program: true, intakeData: true, membershipStatus: true },
  });

  const intake = user.weightManagementIntakes[0];
  const resolved = resolveBillingProgram({
    subscriptionTier: user.subscriptionTier,
    programMembers,
    weightIntake: intake,
  });

  if (!resolved) {
    return {
      program: "other",
      programLabel: "Sanative Health",
      selectedPlan: null,
      planLabel: "No active program",
      firstMonth: { status: "pending", amountAud: null, paidAt: null },
      recurring: {
        status: "inactive",
        label: "Not started",
        amountAud: null,
        billingInterval: null,
        billingLabel: null,
        nextBillingDate: null,
        paidTill: null,
      },
      subscription: null,
      availableCadences: [],
      history: [],
      journeyStatus: user.journeyStatus,
      journeyLabel: stageDescription || user.journeyStatus,
    };
  }

  if (user.membershipSubscription?.stripeSubscriptionId && billingModelsAvailable()) {
    const { backfillFromLegacyMembership } = await import("./sync-subscription");
    await backfillFromLegacyMembership(userId).catch(console.error);
  }

  const memberSub = billingModelsAvailable()
    ? await prisma.memberSubscription.findFirst({
        where: { userId, product: { program: resolved.programKey } },
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

  const product =
    resolved.programKey === "WEIGHT_MANAGEMENT" && resolved.planTier
      ? await findProductByPlanTier(resolved.planTier)
      : await findProductByProgram(resolved.programKey);

  const defaultRecurring = product?.billingPrices.find(
    (p) => p.isDefault && !p.isFirstMonth && p.billingInterval !== "ONE_TIME"
  );
  const firstMonthCatalog = product?.billingPrices.find((p) => p.isFirstMonth);

  const programInvoice = user.invoices.find((inv) =>
    invoiceMatchesProgram(inv.description, resolved.programKey)
  );

  const firstMonthPaid =
    (resolved.programKey === "WEIGHT_MANAGEMENT" && intake?.paymentStatus === "PAID") ||
    !!programInvoice ||
    (PAID_JOURNEY.has(user.journeyStatus) && programMembers.length > 0);

  const firstMonthAmount =
    resolved.programKey === "WEIGHT_MANAGEMENT" && intake?.paymentAmount != null
      ? intake.paymentAmount / 100
      : programInvoice?.amount ??
        (firstMonthCatalog ? firstMonthCatalog.amountCents / 100 : null);

  const firstMonthPaidAt =
    (resolved.programKey === "WEIGHT_MANAGEMENT" ? intake?.paidAt?.toISOString() : null) ??
    programInvoice?.paidAt?.toISOString() ??
    null;

  let recurringStatus: MemberBillingSummary["recurring"]["status"] = "inactive";
  let recurringLabel = "Not started";
  let recurringAmount: number | null = defaultRecurring
    ? defaultRecurring.amountCents / 100
    : resolved.planTier === "PRECISION"
      ? 499
      : resolved.programKey === "WEIGHT_MANAGEMENT"
        ? 349
        : null;

  let billingInterval: BillingInterval | null = defaultRecurring?.billingInterval ?? "MONTHLY";
  let billingLabel: string | null = defaultRecurring
    ? defaultRecurring.label || billingIntervalLabel(defaultRecurring.billingInterval)
    : "Monthly";
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
      : getPlanLabel((h.toPlanTier as "CORE" | "PRECISION") || resolved.planTier),
    effectiveAt: h.effectiveAt.toISOString(),
    changedBy: h.changedBy,
  }));

  const planLabel =
    memberSub?.product.name ||
    product?.name ||
    (resolved.planTier ? getPlanLabel(resolved.planTier) : resolved.programLabel);

  return {
    program: resolved.programSlug,
    programLabel: resolved.programLabel,
    selectedPlan: resolved.planTier,
    planLabel,
    firstMonth: {
      status: firstMonthPaid
        ? "paid"
        : intake?.paymentStatus === "UNPAID"
          ? "unpaid"
          : "pending",
      amountAud:
        firstMonthAmount ??
        (resolved.planTier === "PRECISION"
          ? 399
          : resolved.planTier === "CORE"
            ? 249
            : firstMonthCatalog
              ? firstMonthCatalog.amountCents / 100
              : null),
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

export function billingSummaryToMembershipSummary(summary: MemberBillingSummary) {
  return {
    program: BILLING_PROGRAMS.has(summary.program)
      ? (summary.program as typeof summary.program)
      : ("other" as const),
    programLabel: summary.programLabel,
    planLabel: summary.planLabel,
    planTier: summary.selectedPlan,
    firstMonth: summary.firstMonth,
    recurring: {
      status:
        summary.recurring.status === "past_due"
          ? ("inactive" as const)
          : summary.recurring.status,
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
