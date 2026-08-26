/**
 * Public marketing for unified Organ & Metabolic Care, all organs, one annual membership.
 * Checkout amounts are resolved from the billing catalog (Admin → Membership Pricing).
 */

import { ORGAN_CARE_UPSELL_META } from "@/lib/programs/offers";

/** Default when catalog row is missing, matches sanative_membership YEARLY ($365). */
export const ORGAN_CARE_DEFAULT_ANNUAL_AUD = 365;

export const ORGAN_CARE_PUBLIC_OFFER = {
  name: ORGAN_CARE_UPSELL_META.name,
  tagline: "Heart, liver, kidney, thyroid, hormones & metabolic health: one membership",
  priceAud: ORGAN_CARE_DEFAULT_ANNUAL_AUD,
  priceLabel: `$${ORGAN_CARE_DEFAULT_ANNUAL_AUD}/year`,
  billingNote: "All organs included · billed annually",
  checkoutPath: "/membership/checkout",
  joinPath: "/join",
  includes: [
    "Heart, liver, kidney & metabolic dashboards",
    "Thyroid and hormone health insights",
    "Biological Clock tracking in your portal",
    "Care team support and follow-up",
  ],
  organsIncluded: ["Heart", "Liver", "Kidney", "Thyroid", "Hormones", "Metabolic"],
} as const;

export const ORGAN_CARE_CHECKOUT_DESCRIPTION =
  "Organ & Metabolic Care: annual (all organs included)";

/** localStorage key, quiz funnels stash contact details for membership checkout prefill */
export const ORGAN_CARE_CHECKOUT_PREFILL_KEY = "organCareCheckoutPrefill";

export type OrganCareCheckoutPrefill = {
  source: string;
  userId?: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: string;
  postcode?: string;
};
