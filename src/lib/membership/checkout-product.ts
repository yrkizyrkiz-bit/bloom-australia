import { getSanativeMembershipPricing } from "@/lib/portal/sanative-membership";
import { loadLiverBiomarkerInsightsPricing } from "@/lib/portal/liver-biomarker-insights";
import {
  LIVER_BIOMARKER_INSIGHTS_PRODUCT_SLUG,
  isLiverBiomarkerInsightsCheckout,
  type CheckoutProductQuery,
} from "@/lib/membership/checkout-product-select";

export {
  LIVER_BIOMARKER_INSIGHTS_PRODUCT_SLUG,
  LIVER_HEALTH_CHECK_ITEM_NAME,
  LIVER_QUIZ_RESULT_BUTTON,
  MEMBERSHIP_PURCHASE_ITEM_NAME,
  isLiverBiomarkerInsightsCheckout,
  membershipCheckoutDisplayFallback,
  membershipPurchaseAnalytics,
} from "@/lib/membership/checkout-product-select";

export type {
  CheckoutProductQuery,
  MembershipPurchaseAnalytics,
} from "@/lib/membership/checkout-product-select";

export type MembershipCheckoutOffer = {
  slug: string;
  purchaseType: string;
  productName: string;
  amountCents: number;
  amountAud: number;
  priceLabel: string;
  intervalLabel: string;
  autoRenew: boolean;
  productId: string | null;
  billingPriceId: string | null;
};

function formatAud(amountAud: number): string {
  return `$${amountAud % 1 === 0 ? amountAud.toFixed(0) : amountAud.toFixed(2)}`;
}

/** Resolve the catalog offer for membership checkout from query/body selectors. */
export async function resolveMembershipCheckoutOffer(
  input: CheckoutProductQuery
): Promise<MembershipCheckoutOffer> {
  if (isLiverBiomarkerInsightsCheckout(input)) {
    const pricing = await loadLiverBiomarkerInsightsPricing();
    return {
      slug: LIVER_BIOMARKER_INSIGHTS_PRODUCT_SLUG,
      purchaseType: LIVER_BIOMARKER_INSIGHTS_PRODUCT_SLUG,
      productName: pricing.productName,
      amountCents: pricing.amountCents,
      amountAud: pricing.amountAud,
      priceLabel: formatAud(pricing.amountAud),
      intervalLabel: pricing.intervalLabel,
      autoRenew: false,
      productId: pricing.productId,
      billingPriceId: pricing.billingPriceId,
    };
  }

  const pricing = await getSanativeMembershipPricing();
  return {
    slug: "sanative_membership",
    purchaseType: "sanative_membership",
    productName: pricing.productName,
    amountCents: pricing.amountCents,
    amountAud: pricing.amountAud,
    priceLabel: pricing.priceLabel,
    intervalLabel: "Annual",
    autoRenew: true,
    productId: pricing.productId,
    billingPriceId: pricing.billingPriceId,
  };
}
