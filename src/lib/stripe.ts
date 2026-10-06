import Stripe from "stripe";

// Lazy-loaded Stripe instance to avoid build-time errors
let _stripe: Stripe | null = null;

export function getStripe(): Stripe | null {
  if (_stripe) return _stripe;

  const apiKey = process.env.STRIPE_SECRET_KEY;
  if (!apiKey) return null;

  _stripe = new Stripe(apiKey, { typescript: true });
  return _stripe;
}
