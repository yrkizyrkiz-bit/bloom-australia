/** Stripe PaymentIntent statuses that Payment Element may initialise with. */
export const STRIPE_PAYABLE_INTENT_STATUSES = [
  "requires_payment_method",
  "requires_confirmation",
  "requires_action",
  "processing",
] as const;

export type StripePayableIntentStatus = (typeof STRIPE_PAYABLE_INTENT_STATUSES)[number];

export function stripePaymentIntentCanInitializeElements(status: string | null | undefined): boolean {
  return STRIPE_PAYABLE_INTENT_STATUSES.includes(status as StripePayableIntentStatus);
}

export function stripePaymentIntentIsSucceeded(status: string | null | undefined): boolean {
  return status === "succeeded";
}

export function isStripeTerminalElementsError(message: string | null | undefined): boolean {
  if (!message) return false;
  return /PaymentIntent is in a terminal state/i.test(message);
}

export function consentStorageKey(userId: string): string {
  return `sanative_funnel_consent_${userId}`;
}
