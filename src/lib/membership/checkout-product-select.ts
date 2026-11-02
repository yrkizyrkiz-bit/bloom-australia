/** Liver quiz RESULTS button — selects the $79 product when `product` is not set. */
export const LIVER_QUIZ_RESULT_BUTTON = "liver_quiz_result";

export const LIVER_BIOMARKER_INSIGHTS_PRODUCT_SLUG = "liver_biomarker_insights";

/** GA4 / Meta purchase item name for the $79 liver product. */
export const LIVER_HEALTH_CHECK_ITEM_NAME = "Liver Health Check";

export const MEMBERSHIP_PURCHASE_ITEM_NAME = "Sanative Membership";

export type CheckoutProductQuery = {
  product?: string | null;
  button?: string | null;
};

export type MembershipCheckoutDisplay = {
  productName: string;
  amountAud: number;
  priceLabel: string;
  intervalLabel: string;
  autoRenew: boolean;
};

/**
 * Select the $79 Liver Biomarker Insights catalog product.
 * Keyed by `product=liver_biomarker_insights` and/or `button=liver_quiz_result`.
 * Never keyed by `source=fatty_liver` — other funnels share that source without this product.
 */
export function isLiverBiomarkerInsightsCheckout(
  input: CheckoutProductQuery
): boolean {
  const product = (input.product || "").trim();
  const button = (input.button || "").trim();
  return (
    product === LIVER_BIOMARKER_INSIGHTS_PRODUCT_SLUG ||
    button === LIVER_QUIZ_RESULT_BUTTON
  );
}

export type MembershipPurchaseAnalytics = {
  value: number;
  currency: "AUD";
  content_name: string;
  content_ids: string[];
};

/** Purchase event payload for GA4 (mirrored from Meta Purchase). */
export function membershipPurchaseAnalytics(
  input: CheckoutProductQuery,
  amountAud: number
): MembershipPurchaseAnalytics {
  if (isLiverBiomarkerInsightsCheckout(input)) {
    return {
      value: amountAud,
      currency: "AUD",
      content_name: LIVER_HEALTH_CHECK_ITEM_NAME,
      content_ids: [LIVER_BIOMARKER_INSIGHTS_PRODUCT_SLUG],
    };
  }
  return {
    value: amountAud,
    currency: "AUD",
    content_name: MEMBERSHIP_PURCHASE_ITEM_NAME,
    content_ids: ["sanative_membership"],
  };
}

/** Sync display defaults so checkout does not flash $365 on the $79 path. */
export function membershipCheckoutDisplayFallback(
  input: CheckoutProductQuery
): MembershipCheckoutDisplay {
  if (isLiverBiomarkerInsightsCheckout(input)) {
    return {
      productName: "Liver Biomarker Insights",
      amountAud: 79,
      priceLabel: "$79",
      intervalLabel: "2 months Liver portal access",
      autoRenew: false,
    };
  }
  return {
    productName: "Sanative Membership",
    amountAud: 365,
    priceLabel: "$365/yr",
    intervalLabel: "Annual",
    autoRenew: true,
  };
}
