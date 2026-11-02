/** Liver quiz RESULTS button — the only public CTA that sells the $79 product. */
export const LIVER_QUIZ_RESULT_BUTTON = "liver_quiz_result";

export const LIVER_BIOMARKER_INSIGHTS_PRODUCT_SLUG = "liver_biomarker_insights";

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
 * Never keyed by `source=fatty_liver` — other liver CTAs share that source.
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
