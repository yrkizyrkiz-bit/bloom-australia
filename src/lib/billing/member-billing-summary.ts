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
import {
  isProgramKey,
  normalizeProgramKey,
  PROGRAM_LABELS,
  SCOPE_LABELS,
  type ProgramKey,
} from "@/lib/membership/keys";
import { getLatestPortalQuizSubmissions } from "@/lib/portal-quiz-submissions";
import {
  evaluateSubscriptionAccess,
  resolveInvoiceForBilling,
  resolveLatestPaidTill,
  type BillableScopeKey,
  type BillingInvoiceRow,
  type SubscriptionAccessStatus,
} from "./paid-till";

export type BillingModel = "program_first_month" | "annual_subscription";

export type MemberBillingSummary = {
  program: string;
  programLabel: string;
  billingModel: BillingModel;
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
  subscriptionAccess: SubscriptionAccessStatus;
};

export type MemberBillingOverview = {
  programs: MemberBillingSummary[];
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

const PROGRAM_BILLING_PRIORITY: ProgramKey[] = [
  "WEIGHT_MANAGEMENT",
  "HAIR_LOSS",
  "MENS_HEALTH_SEXUAL",
  "MENS_HEALTH_VITALITY",
  "WOMENS_HEALTH_SEXUAL",
  "WOMENS_HEALTH_VITALITY",
];

const SCOPE_SLUG: Record<BillableScopeKey, string> = {
  BIOLOGICAL_CLOCK: "biological_clock",
  ORGAN_CARE: "organ_care",
};

const SCOPE_BILLING_PRIORITY: BillableScopeKey[] = ["BIOLOGICAL_CLOCK", "ORGAN_CARE"];

type InvoiceRow = BillingInvoiceRow;

function getPlanLabel(tier: "CORE" | "PRECISION" | null): string {
  if (tier === "PRECISION") return "Sanative Precision";
  if (tier === "CORE") return "Sanative Core";
  return "Program";
}

function programSlugFromKey(key: ProgramKey): string {
  return PROGRAM_SLUG[key];
}

export function programSlugFromProgramKey(key: ProgramKey): string {
  return PROGRAM_SLUG[key];
}

export function getBillingSummaryBySlug(
  overview: MemberBillingOverview,
  slug: string
): MemberBillingSummary | undefined {
  return overview.programs.find((program) => program.program === slug);
}

function parseBiomarkerTierFromNotes(notes: string | null | undefined): string | null {
  if (!notes) return null;
  const match = notes.match(/Biomarkers subscription \((\w+)\)/i);
  return match?.[1]?.toLowerCase() ?? null;
}

function organCareIsMonthly(notes: string | null | undefined): boolean {
  return (notes || "").toLowerCase().includes("monthly");
}

function parseRecurringAmountFromPriceLabel(priceLabel: string | null | undefined): number | null {
  if (!priceLabel) return null;
  const match = priceLabel.match(/then\s+\$([\d.]+)/i);
  return match ? parseFloat(match[1]) : null;
}

function parsePriceLabelFromEntitlementNotes(notes: string | null | undefined): string | null {
  if (!notes) return null;
  const match = notes.match(/\(([^)]+)\)/);
  return match?.[1]?.split(" · ")[0]?.trim() ?? null;
}

function sortProgramKeys(keys: ProgramKey[]): ProgramKey[] {
  return [...keys].sort(
    (a, b) => PROGRAM_BILLING_PRIORITY.indexOf(a) - PROGRAM_BILLING_PRIORITY.indexOf(b)
  );
}

function discoverScopeBillingKeys(input: {
  scopeEntitlements: Array<{ key: string; status: string }>;
  memberSubs: Array<{ product: { program: string } }>;
  legacyMembership?: { planName: string | null } | null;
}): BillableScopeKey[] {
  const keys = new Set<BillableScopeKey>();

  for (const entitlement of input.scopeEntitlements) {
    if (entitlement.status === "INACTIVE") continue;
    if (entitlement.key === "BIOLOGICAL_CLOCK" || entitlement.key === "ORGAN_CARE") {
      keys.add(entitlement.key);
    }
  }

  for (const sub of input.memberSubs) {
    if (sub.product.program === "BIOLOGICAL_CLOCK") keys.add("BIOLOGICAL_CLOCK");
    if (sub.product.program === "ORGAN_CARE") keys.add("ORGAN_CARE");
  }

  if (input.legacyMembership?.planName?.toLowerCase().includes("organ")) {
    keys.add("ORGAN_CARE");
  }

  return SCOPE_BILLING_PRIORITY.filter((key) => keys.has(key));
}

function discoverBillingProgramKeys(input: {
  programMembers: Array<{ program?: string | null }>;
  entitlements: Array<{ key: string; status: string }>;
  memberSubs: Array<{ product: { program: string } }>;
  hasWeightIntake: boolean;
}): ProgramKey[] {
  const keys = new Set<ProgramKey>();

  for (const pm of input.programMembers) {
    const key = normalizeProgramKey(pm.program);
    if (key) keys.add(key);
  }

  for (const entitlement of input.entitlements) {
    if (entitlement.status === "INACTIVE") continue;
    if (isProgramKey(entitlement.key)) keys.add(entitlement.key);
  }

  for (const sub of input.memberSubs) {
    if (isProgramKey(sub.product.program)) keys.add(sub.product.program);
  }

  if (input.hasWeightIntake) {
    keys.add("WEIGHT_MANAGEMENT");
  }

  return sortProgramKeys(Array.from(keys));
}

function resolvePlanTierForProgram(
  programKey: ProgramKey,
  input: {
    subscriptionTier?: string | null;
    programMember?: { intakeData?: unknown } | null;
    weightIntake?: { selectedPlan?: string | null } | null;
  }
): "CORE" | "PRECISION" | null {
  if (programKey !== "WEIGHT_MANAGEMENT") return null;

  return resolvePlanTierFromStrings({
    selectedPlan:
      (input.programMember?.intakeData as { selectedPlan?: string } | null)?.selectedPlan ??
      input.weightIntake?.selectedPlan,
    subscriptionTier: input.subscriptionTier,
  });
}

type BillingBuildContext = {
  user: {
    journeyStatus: string;
    subscriptionTier: string | null;
    invoices: InvoiceRow[];
  };
  intake?: {
    selectedPlan?: string | null;
    paymentStatus?: string | null;
    paymentAmount?: number | null;
    paidAt?: Date | null;
  } | null;
  programMembers: Array<{ program?: string | null; intakeData?: unknown }>;
  programEntitlements: Array<{ key: string; status: string; source: string | null; notes: string | null }>;
  scopeEntitlements: Array<{ key: string; status: string; source: string | null; notes: string | null }>;
  legacyMembership?: {
    amount: number | null;
    billingCycle: string | null;
    status: string;
    startDate: Date | null;
    currentPeriodEnd: Date | null;
    stripeCustomerId: string | null;
    stripeSubscriptionId: string | null;
    planName: string | null;
  } | null;
  memberSubs: Array<{
    status: string;
    stripeSubscriptionId: string | null;
    stripeCustomerId: string | null;
    billingPriceId: string | null;
    currentPeriodStart: Date | null;
    currentPeriodEnd: Date | null;
    activatedAt: Date | null;
    createdAt: Date;
    id: string;
    product: { program: string; slug: string; name: string; planTier: string | null };
    billingPrice: {
      amountCents: number;
      billingInterval: BillingInterval;
      label: string | null;
    } | null;
    history: Array<{
      id: string;
      changeType: string;
      fromPlanTier: string | null;
      toPlanTier: string | null;
      effectiveAt: Date;
      changedBy: string | null;
      fromBillingPrice: {
        label: string | null;
        billingInterval: BillingInterval;
        product: { name: string };
      } | null;
      toBillingPrice: {
        label: string | null;
        billingInterval: BillingInterval;
        product: { name: string };
      } | null;
    }>;
  }>;
  portalQuizzes: Array<{
    programKey: string;
    result: unknown;
  }>;
  stageDescription?: string;
};

function pickMemberSubForScope(
  memberSubs: BillingBuildContext["memberSubs"],
  scopeKey: BillableScopeKey
) {
  return memberSubs
    .filter((sub) => sub.product.program === scopeKey)
    .sort(
      (a, b) =>
        (b.activatedAt?.getTime() ?? b.createdAt.getTime()) -
        (a.activatedAt?.getTime() ?? a.createdAt.getTime())
    )[0];
}

async function buildProgramBillingSummary(
  ctx: BillingBuildContext,
  programKey: ProgramKey
): Promise<MemberBillingSummary> {
  const programSlug = programSlugFromKey(programKey);
  const programLabel = PROGRAM_LABELS[programKey];
  const programMember = ctx.programMembers.find(
    (pm) => normalizeProgramKey(pm.program) === programKey
  );
  const entitlement = ctx.programEntitlements.find(
    (e) => e.key === programKey && e.status !== "INACTIVE"
  );
  const memberSub = ctx.memberSubs.find((sub) => sub.product.program === programKey) ?? null;
  const portalQuiz = ctx.portalQuizzes.find((q) => q.programKey === programKey);
  const quizResult = (portalQuiz?.result ?? null) as { priceLabel?: string } | null;
  const entitlementPriceLabel = parsePriceLabelFromEntitlementNotes(entitlement?.notes);
  const priceLabel = quizResult?.priceLabel ?? entitlementPriceLabel;

  const planTier = resolvePlanTierForProgram(programKey, {
    subscriptionTier: ctx.user.subscriptionTier,
    programMember,
    weightIntake: ctx.intake,
  });

  const product =
    programKey === "WEIGHT_MANAGEMENT" && planTier
      ? await findProductByPlanTier(planTier)
      : await findProductByProgram(programKey);

  const defaultRecurring = product?.billingPrices.find(
    (p) => p.isDefault && !p.isFirstMonth && p.billingInterval !== "ONE_TIME"
  );
  const firstMonthCatalog = product?.billingPrices.find((p) => p.isFirstMonth);

  const programInvoice = resolveInvoiceForBilling(ctx.user.invoices, entitlement, {
    programKey,
  });

  const isPortalPurchase = entitlement?.source === "PORTAL_PURCHASE";

  const firstMonthPaid =
    (programKey === "WEIGHT_MANAGEMENT" && ctx.intake?.paymentStatus === "PAID") ||
    !!programInvoice ||
    (isPortalPurchase && entitlement?.status === "ACTIVE") ||
    (!isPortalPurchase &&
      !!programMember &&
      PAID_JOURNEY.has(ctx.user.journeyStatus));

  const firstMonthAmount =
    programKey === "WEIGHT_MANAGEMENT" && ctx.intake?.paymentAmount != null
      ? ctx.intake.paymentAmount / 100
      : programInvoice?.amount ??
        (firstMonthCatalog ? firstMonthCatalog.amountCents / 100 : null);

  const firstMonthPaidAt =
    (programKey === "WEIGHT_MANAGEMENT" ? ctx.intake?.paidAt?.toISOString() : null) ??
    programInvoice?.paidAt?.toISOString() ??
    null;

  let recurringStatus: MemberBillingSummary["recurring"]["status"] = "inactive";
  let recurringLabel = "Not started";
  let recurringAmount: number | null =
    parseRecurringAmountFromPriceLabel(priceLabel) ??
    (defaultRecurring ? defaultRecurring.amountCents / 100 : null) ??
    (planTier === "PRECISION"
      ? 499
      : programKey === "WEIGHT_MANAGEMENT"
        ? 349
        : null);

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
  } else if (isPortalPurchase && firstMonthPaid) {
    recurringStatus = "pending_approval";
    recurringLabel = "Recurring billing starts after doctor approval / welcome call";
  } else if (APPROVED_JOURNEY.has(ctx.user.journeyStatus)) {
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

  const planLabel =
    memberSub?.product.name ||
    product?.name ||
    (planTier ? getPlanLabel(planTier) : programLabel);

  const resolvedInterval = billingInterval ?? "MONTHLY";
  const paidTillDate = resolveLatestPaidTill({
    billingInterval: resolvedInterval,
    invoices: ctx.user.invoices,
    entitlement,
    matchers: { programKey },
    stripePeriodEnd: memberSub?.currentPeriodEnd,
    intakePaidAt:
      programKey === "WEIGHT_MANAGEMENT" && ctx.intake?.paymentStatus === "PAID"
        ? ctx.intake.paidAt ?? null
        : null,
  });
  paidTill = paidTillDate?.toISOString() ?? paidTill;
  nextBilling = paidTill ?? nextBilling;

  const subscriptionAccess = evaluateSubscriptionAccess({
    paidTill: paidTillDate,
    recurringStatus,
    memberSubStatus: memberSub?.status,
    firstMonthPaid,
    programLabel,
  });

  return {
    program: programSlug,
    programLabel,
    billingModel: "program_first_month",
    selectedPlan: planTier,
    planLabel,
    firstMonth: {
      status: firstMonthPaid
        ? "paid"
        : ctx.intake?.paymentStatus === "UNPAID" && programKey === "WEIGHT_MANAGEMENT"
          ? "unpaid"
          : "pending",
      amountAud:
        firstMonthAmount ??
        (planTier === "PRECISION"
          ? 399
          : planTier === "CORE"
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
    journeyStatus: ctx.user.journeyStatus,
    journeyLabel: ctx.stageDescription || ctx.user.journeyStatus,
    subscriptionAccess,
  };
}

async function buildScopeBillingSummary(
  ctx: BillingBuildContext,
  scopeKey: BillableScopeKey
): Promise<MemberBillingSummary> {
  const programSlug = SCOPE_SLUG[scopeKey];
  const programLabel =
    scopeKey === "ORGAN_CARE" ? "Organ & Metabolic Care" : SCOPE_LABELS.BIOLOGICAL_CLOCK;
  const entitlement = ctx.scopeEntitlements.find(
    (e) => e.key === scopeKey && e.status !== "INACTIVE"
  );
  const memberSub = pickMemberSubForScope(ctx.memberSubs, scopeKey) ?? null;
  const biomarkerTier =
    memberSub?.product.planTier ??
    parseBiomarkerTierFromNotes(entitlement?.notes) ??
    null;

  const product =
    scopeKey === "BIOLOGICAL_CLOCK"
      ? await findProductByProgram("BIOLOGICAL_CLOCK", biomarkerTier)
      : await findProductByProgram("ORGAN_CARE");

  const preferMonthlyOrgan =
    scopeKey === "ORGAN_CARE" &&
    (memberSub?.billingPrice?.billingInterval === "MONTHLY" ||
      organCareIsMonthly(entitlement?.notes));

  const defaultRecurring =
    memberSub?.billingPrice ??
    product?.billingPrices.find(
      (p) =>
        p.isDefault &&
        !p.isFirstMonth &&
        (scopeKey === "ORGAN_CARE"
          ? preferMonthlyOrgan
            ? p.billingInterval === "MONTHLY"
            : p.billingInterval === "YEARLY"
          : p.billingInterval === "YEARLY")
    ) ??
    product?.billingPrices.find(
      (p) => !p.isFirstMonth && p.billingInterval !== "ONE_TIME"
    );

  const scopedInvoice = resolveInvoiceForBilling(ctx.user.invoices, entitlement, {
    scopeKey,
  });

  const legacyOrgan =
    scopeKey === "ORGAN_CARE" && !memberSub ? ctx.legacyMembership : null;

  const annualAmount =
    memberSub?.billingPrice?.amountCents != null
      ? memberSub.billingPrice.amountCents / 100
      : legacyOrgan?.amount != null
        ? legacyOrgan.amount
        : defaultRecurring
          ? defaultRecurring.amountCents / 100
          : scopedInvoice?.amount ?? null;

  const isPaid =
    !!scopedInvoice ||
    memberSub?.status === "ACTIVE" ||
    legacyOrgan?.status === "ACTIVE" ||
    (entitlement?.status === "ACTIVE" &&
      (entitlement.source === "PORTAL_PURCHASE" || entitlement.source === "SUBSCRIPTION"));

  const paidAt =
    scopedInvoice?.paidAt?.toISOString() ??
    memberSub?.activatedAt?.toISOString() ??
    legacyOrgan?.startDate?.toISOString() ??
    null;

  let recurringStatus: MemberBillingSummary["recurring"]["status"] = "inactive";
  let recurringLabel = "Not started";
  const billingInterval: BillingInterval =
    memberSub?.billingPrice?.billingInterval ??
    (legacyOrgan?.billingCycle === "monthly" ? "MONTHLY" : "YEARLY") ??
    defaultRecurring?.billingInterval ??
    "YEARLY";
  const billingLabel =
    memberSub?.billingPrice?.label ??
    defaultRecurring?.label ??
    billingIntervalLabel(billingInterval);

  let nextBilling: string | null =
    memberSub?.currentPeriodEnd?.toISOString() ??
    legacyOrgan?.currentPeriodEnd?.toISOString() ??
    null;
  let paidTill: string | null = nextBilling;

  if (memberSub?.status === "ACTIVE" || legacyOrgan?.status === "ACTIVE") {
    recurringStatus = "active";
    recurringLabel =
      billingInterval === "YEARLY"
        ? "Active — billed annually"
        : `Active — billed ${billingIntervalLabel(billingInterval).toLowerCase()}`;
  } else if (memberSub?.status === "PAST_DUE") {
    recurringStatus = "past_due";
    recurringLabel = "Payment past due";
  } else if (memberSub?.status === "CANCELLED") {
    recurringStatus = "cancelled";
    recurringLabel = "Cancelled";
  } else if (isPaid) {
    recurringStatus = "active";
    recurringLabel =
      billingInterval === "YEARLY"
        ? "Active — annual membership"
        : "Active — membership";
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
      : null,
    toLabel: h.toBillingPrice
      ? `${h.toBillingPrice.product.name} — ${h.toBillingPrice.label || billingIntervalLabel(h.toBillingPrice.billingInterval)}`
      : product?.name || programLabel,
    effectiveAt: h.effectiveAt.toISOString(),
    changedBy: h.changedBy,
  }));

  const planLabel = memberSub?.product.name || product?.name || programLabel;

  const paidTillDate = resolveLatestPaidTill({
    billingInterval,
    invoices: ctx.user.invoices,
    entitlement,
    matchers: { scopeKey },
    stripePeriodEnd: memberSub?.currentPeriodEnd,
    legacyPeriodEnd: legacyOrgan?.currentPeriodEnd,
  });
  paidTill = paidTillDate?.toISOString() ?? paidTill;
  nextBilling = paidTill ?? nextBilling;

  const subscriptionAccess = evaluateSubscriptionAccess({
    paidTill: paidTillDate,
    recurringStatus,
    memberSubStatus: memberSub?.status ?? legacyOrgan?.status,
    firstMonthPaid: isPaid,
    programLabel,
  });

  return {
    program: programSlug,
    programLabel,
    billingModel: "annual_subscription",
    selectedPlan: null,
    planLabel,
    firstMonth: {
      status: isPaid ? "paid" : "pending",
      amountAud: annualAmount,
      paidAt,
    },
    recurring: {
      status: recurringStatus,
      label: recurringLabel,
      amountAud: annualAmount,
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
      : legacyOrgan
        ? {
            id: null,
            status: legacyOrgan.status,
            stripeSubscriptionId: legacyOrgan.stripeSubscriptionId,
            stripeCustomerId: legacyOrgan.stripeCustomerId,
            productSlug: "organ_care",
            productName: legacyOrgan.planName || "Organ & Metabolic Care",
            billingPriceId: null,
            currentPeriodStart: legacyOrgan.startDate?.toISOString() ?? null,
            currentPeriodEnd: legacyOrgan.currentPeriodEnd?.toISOString() ?? null,
            activatedAt: legacyOrgan.startDate?.toISOString() ?? null,
          }
        : null,
    availableCadences,
    history,
    journeyStatus: ctx.user.journeyStatus,
    journeyLabel: ctx.stageDescription || ctx.user.journeyStatus,
    subscriptionAccess,
  };
}

function emptyBillingSummary(
  journeyStatus: string,
  journeyLabel: string
): MemberBillingSummary {
  return {
    program: "other",
    programLabel: "Sanative Health",
    billingModel: "program_first_month",
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
    journeyStatus,
    journeyLabel,
    subscriptionAccess: {
      isActive: false,
      isExpired: true,
      expiresAt: null,
      message: "No active subscription on this account.",
    },
  };
}

export async function getMemberBillingOverview(
  userId: string,
  stageDescription?: string
): Promise<MemberBillingOverview> {
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
        take: 20,
        select: {
          stripeId: true,
          description: true,
          amount: true,
          paidAt: true,
        },
      },
    },
  });

  if (!user) {
    return {
      programs: [],
      journeyStatus: "LEAD",
      journeyLabel: stageDescription || "LEAD",
    };
  }

  const journeyLabel = stageDescription || user.journeyStatus;

  const [programMembers, allEntitlements, portalQuizzes] = await Promise.all([
    prisma.programMember.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      select: { program: true, intakeData: true, membershipStatus: true },
    }),
    prisma.entitlement.findMany({
      where: { userId, type: { in: ["PROGRAM", "SCOPE"] } },
      select: { key: true, status: true, source: true, notes: true, type: true },
    }),
    getLatestPortalQuizSubmissions(userId).catch(() => []),
  ]);

  const programEntitlements = allEntitlements.filter((e) => e.type === "PROGRAM");
  const scopeEntitlements = allEntitlements.filter((e) => e.type === "SCOPE");

  const intake = user.weightManagementIntakes[0];

  if (user.membershipSubscription?.stripeSubscriptionId && billingModelsAvailable()) {
    const { backfillFromLegacyMembership } = await import("./sync-subscription");
    await backfillFromLegacyMembership(userId).catch(console.error);
  }

  const memberSubs = billingModelsAvailable()
    ? await prisma.memberSubscription.findMany({
        where: { userId },
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
    : [];

  const programKeys = discoverBillingProgramKeys({
    programMembers,
    entitlements: programEntitlements,
    memberSubs,
    hasWeightIntake: !!intake,
  });

  const scopeKeys = discoverScopeBillingKeys({
    scopeEntitlements,
    memberSubs,
    legacyMembership: user.membershipSubscription,
  });

  if (programKeys.length === 0 && scopeKeys.length === 0) {
    return {
      programs: [],
      journeyStatus: user.journeyStatus,
      journeyLabel,
    };
  }

  const ctx: BillingBuildContext = {
    user,
    intake,
    programMembers,
    programEntitlements,
    scopeEntitlements,
    legacyMembership: user.membershipSubscription,
    memberSubs,
    portalQuizzes,
    stageDescription,
  };

  const [clinicalPrograms, scopePrograms] = await Promise.all([
    Promise.all(programKeys.map((programKey) => buildProgramBillingSummary(ctx, programKey))),
    Promise.all(scopeKeys.map((scopeKey) => buildScopeBillingSummary(ctx, scopeKey))),
  ]);

  return {
    programs: [...clinicalPrograms, ...scopePrograms],
    journeyStatus: user.journeyStatus,
    journeyLabel,
  };
}

export async function getMemberBillingSummary(
  userId: string,
  stageDescription?: string
): Promise<MemberBillingSummary | null> {
  const overview = await getMemberBillingOverview(userId, stageDescription);
  if (overview.programs.length === 0) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { journeyStatus: true },
    });
    if (!user) return null;
    return emptyBillingSummary(user.journeyStatus, stageDescription || user.journeyStatus);
  }
  return overview.programs[0];
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

export function billingSummaryToAdminSubscription(
  summary: MemberBillingSummary,
  membershipSubscription?: {
    id: string;
    amount: number | null;
    billingCycle: string | null;
    status: string;
    startDate: Date | null;
    currentPeriodEnd: Date | null;
    cancelledAt: Date | null;
    stripeCustomerId: string | null;
    stripeSubscriptionId: string | null;
  } | null
) {
  return {
    program: summary.program,
    programLabel: summary.programLabel,
    billingModel: summary.billingModel,
    id: summary.subscription?.id || membershipSubscription?.id || null,
    planName: summary.planLabel,
    amount: summary.recurring.amountAud ?? membershipSubscription?.amount ?? null,
    currency: "AUD",
    billingCycle:
      summary.recurring.billingInterval?.toLowerCase() ||
      membershipSubscription?.billingCycle ||
      "monthly",
    status:
      summary.subscription?.status ||
      (summary.firstMonth.status === "paid" && summary.recurring.status === "pending_approval"
        ? "PENDING_APPROVAL"
        : membershipSubscription?.status || "INACTIVE"),
    startDate:
      summary.subscription?.currentPeriodStart ||
      membershipSubscription?.startDate?.toISOString() ||
      null,
    currentPeriodEnd:
      summary.recurring.paidTill || membershipSubscription?.currentPeriodEnd?.toISOString() || null,
    cancelledAt: membershipSubscription?.cancelledAt?.toISOString() || null,
    stripeCustomerId:
      summary.subscription?.stripeCustomerId ||
      membershipSubscription?.stripeCustomerId ||
      null,
    stripeSubscriptionId:
      summary.subscription?.stripeSubscriptionId ||
      membershipSubscription?.stripeSubscriptionId ||
      null,
    selectedPlan: summary.selectedPlan,
    firstMonth: summary.firstMonth,
    recurring: summary.recurring,
    availableCadences: summary.availableCadences,
    history: summary.history,
  };
}
