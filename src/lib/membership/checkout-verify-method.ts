import { isLiverBiomarkerInsightsCheckout } from "@/lib/membership/checkout-product-select";

/** Tailwind `md` / phone-vs-desktop split used by checkout verification. */
export const PHONE_VERIFY_MEDIA_QUERY = "(max-width: 767px)";

export type CheckoutVerifyMethod = "email" | "phone";

export type CheckoutVerifyQuery = {
  source?: string | null;
  product?: string | null;
  button?: string | null;
};

/** Liver membership signup: quiz $79 path and/or `source=fatty_liver`. */
export function isLiverSignupCheckout(input: CheckoutVerifyQuery): boolean {
  return (
    (input.source || "").trim() === "fatty_liver" || isLiverBiomarkerInsightsCheckout(input)
  );
}

export function isPhoneVerifyViewport(
  mediaQuery: string = PHONE_VERIFY_MEDIA_QUERY
): boolean {
  return typeof window !== "undefined" && window.matchMedia(mediaQuery).matches;
}

/**
 * Email / Mobile activation tab.
 * Liver signup always starts on Mobile (SMS). Other funnels use SMS on phone
 * viewports and stay email-first on desktop.
 */
export function defaultCheckoutVerifyMethod(input: CheckoutVerifyQuery & {
  isPhoneViewport: boolean;
}): CheckoutVerifyMethod {
  if (isLiverSignupCheckout(input) || input.isPhoneViewport) return "phone";
  return "email";
}

/** Prefill may fill fields, but must not steal the tab when SMS is the default. */
export function checkoutPrefillSelectsEmailTab(input: CheckoutVerifyQuery & {
  isPhoneViewport: boolean;
}): boolean {
  return defaultCheckoutVerifyMethod(input) === "email";
}
