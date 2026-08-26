import {
  getPublicConsultProgram,
  type UnifiedCheckoutProgramSlug,
} from "@/lib/funnel/public-consult-programs";
import { WEIGHT_MANAGEMENT_PRICES } from "@/lib/stripe";

export const WM_CORE_FIRST_MONTH_CENTS = WEIGHT_MANAGEMENT_PRICES.core.firstMonth.amount;
export const WM_PRECISION_FIRST_MONTH_CENTS = WEIGHT_MANAGEMENT_PRICES.precision.firstMonth.amount;

const NON_WM_ONGOING_CENTS = 7900; // $79/mo, men's / women's / hair public funnel pricing

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

  if (programType === "weight_management") {
    const precision = isPrecisionPlanId(planId);
    const wm = precision
      ? WEIGHT_MANAGEMENT_PRICES.precision
      : WEIGHT_MANAGEMENT_PRICES.core;
    const selectedPlan = precision ? "precision" : "core";
    const effectivePlanId = precision
      ? "sanative_precision_first_month"
      : "sanative_core_first_month";

    return {
      amountCents: wm.firstMonth.amount,
      currency: "aud",
      planName: wm.firstMonth.name.replace(" - First Month", ""),
      selectedPlan,
      effectivePlanId,
      ongoingAmountCents: wm.monthly.amount,
      discountCents: wm.firstMonth.discount ?? 0,
      stripePriceId: process.env[
        precision
          ? "STRIPE_WM_PRECISION_FIRST_MONTH_PRICE_ID"
          : "STRIPE_WM_CORE_FIRST_MONTH_PRICE_ID"
      ],
      stripeOngoingPriceId: process.env[
        precision ? "STRIPE_WM_PRECISION_MONTHLY_PRICE_ID" : "STRIPE_WM_CORE_MONTHLY_PRICE_ID"
      ],
    };
  }

  const slug = programType as UnifiedCheckoutProgramSlug;
  const program = getPublicConsultProgram(slug);
  if (program.isWeightManagement) {
    return null;
  }

  return {
    amountCents: program.firstMonthAud * 100,
    currency: "aud",
    planName: program.label,
    selectedPlan: program.slug,
    effectivePlanId: program.slug,
    ongoingAmountCents: NON_WM_ONGOING_CENTS,
    discountCents: 3000,
  };
}

export function expectedFirstMonthCentsForConsultProgram(
  consultProgram: { isWeightManagement: boolean; firstMonthAud: number },
  selectedPlan: string | null | undefined
): number {
  if (consultProgram.isWeightManagement) {
    return isPrecisionPlanId(selectedPlan || "core")
      ? WM_PRECISION_FIRST_MONTH_CENTS
      : WM_CORE_FIRST_MONTH_CENTS;
  }
  return consultProgram.firstMonthAud * 100;
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
