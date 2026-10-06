import {
  getPublicConsultProgram,
  type UnifiedCheckoutProgramSlug,
} from "@/lib/funnel/public-consult-programs";

/** Annual Sanative Membership, current public funnel checkout. */
export const SANATIVE_MEMBERSHIP_CENTS = 36500;

export function isSanativeMembershipPaymentMetadata(
  metadata?: Record<string, string> | null
): boolean {
  return (metadata?.purchaseType || "").trim() === "sanative_membership";
}

/** Fallback only — prefer per-program ongoing amounts from resolveFirstMonthCheckoutCharge. */
const NON_WM_ONGOING_CENTS = 24000;

export type CheckoutProgramType =
  | "weight_management"
  | "hair_loss"
  | "mens_health"
  | "womens_health";

export type ResolvedCheckoutCharge = {
  amountCents: number;
  currency: "aud";
  planName: string;
  selectedPlan: string;
  effectivePlanId: string;
  ongoingAmountCents: number;
  discountCents: number;
  stripePriceId?: string;
  stripeOngoingPriceId?: string;
};

function normalizePlanId(planId: string): string {
  return planId.trim().toLowerCase();
}

export function isPrecisionPlanId(planId: string): boolean {
  const id = normalizePlanId(planId);
  return id === "precision" || id === "sanative_precision_first_month";
}

export function isAllowedCheckoutPlanId(planId: string): boolean {
  const id = normalizePlanId(planId);
  return (
    id === "core" ||
    id === "precision" ||
    id === "sanative_core_first_month" ||
    id === "sanative_precision_first_month"
  );
}

/** Server-owned first-month charge, never trust client-sent amounts. */
export function resolveFirstMonthCheckoutCharge(
  programType: CheckoutProgramType,
  planId: string
): ResolvedCheckoutCharge | null {
  if (!isAllowedCheckoutPlanId(planId)) {
    return null;
  }

  // Public clinical funnels charge Sanative Membership ($365/yr). Legacy Core/Precision SKUs retired.
  if (programType === "weight_management") {
    return {
      amountCents: SANATIVE_MEMBERSHIP_CENTS,
      currency: "aud",
      planName: "Sanative Membership",
      selectedPlan: "membership",
      effectivePlanId: "sanative_membership",
      ongoingAmountCents: 36000,
      discountCents: 0,
      stripePriceId: process.env.STRIPE_MEMBERSHIP_PRICE_ID,
    };
  }

  const slug = programType as UnifiedCheckoutProgramSlug;
  const program = getPublicConsultProgram(slug);
  if (program.isWeightManagement) {
    return null;
  }

  const ongoingByProgram: Record<string, number> = {
    hair_loss: 9000,
    mens_health: 24000,
    womens_health: 24000,
  };

  return {
    amountCents: SANATIVE_MEMBERSHIP_CENTS,
    currency: "aud",
    planName: "Sanative Membership",
    selectedPlan: program.slug,
    effectivePlanId: "sanative_membership",
    ongoingAmountCents: ongoingByProgram[program.slug] ?? NON_WM_ONGOING_CENTS,
    discountCents: 0,
  };
}

export function expectedFirstMonthCentsForConsultProgram(
  consultProgram: { isWeightManagement: boolean; firstMonthAud: number },
  _selectedPlan: string | null | undefined
): number {
  // Public entry is always Sanative Membership; consultProgram.firstMonthAud is 365.
  return consultProgram.firstMonthAud * 100 || SANATIVE_MEMBERSHIP_CENTS;
}

/** Amount the doctor-approval / booking verifier should accept for this PI. */
export function expectedVerifiedPaymentCents(params: {
  metadata?: Record<string, string> | null;
  consultProgram: { isWeightManagement: boolean; firstMonthAud: number };
  selectedPlan?: string | null;
}): number {
  if (isSanativeMembershipPaymentMetadata(params.metadata)) {
    return SANATIVE_MEMBERSHIP_CENTS;
  }
  return expectedFirstMonthCentsForConsultProgram(
    params.consultProgram,
    params.selectedPlan
  );
}

export function normalizeWmSelectedPlan(
  selectedPlan: string | null | undefined
): "CORE" | "PRECISION" {
  return isPrecisionPlanId(selectedPlan || "core") ? "PRECISION" : "CORE";
}

export function paymentMetadataMatchesSelectedPlan(
  metadata: Record<string, string>,
  selectedPlan: "CORE" | "PRECISION"
): boolean {
  const metaPlan = (metadata.selectedPlan || metadata.planId || "").toLowerCase();
  if (!metaPlan) {
    return selectedPlan === "CORE";
  }
  const nonWmProgramSlugs = ["mens_health", "womens_health", "hair_loss"];
  if (nonWmProgramSlugs.some((slug) => metaPlan === slug || metaPlan.includes(slug))) {
    return true;
  }
  const metaIsPrecision = metaPlan.includes("precision");
  return selectedPlan === "PRECISION" ? metaIsPrecision : !metaIsPrecision;
}
