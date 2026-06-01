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

// Consultation pricing - Women's Health
export const CONSULTATION_PRICES = {
  initial: {
    amount: 14900, // $149.00 in cents
    currency: "aud",
    name: "Women's Health Consultation",
    description: "30-minute telehealth consultation with a specialist",
  },
  followUp: {
    amount: 9900, // $99.00 in cents
    currency: "aud",
    name: "Follow-up Consultation",
    description: "30-minute follow-up telehealth consultation",
  },
};

// Weight Management pricing - Core and Precision plans
export const WEIGHT_MANAGEMENT_PRICES = {
  core: {
    firstMonth: {
      amount: 24900, // $249.00 in cents
      currency: "aud",
      name: "Sanative Core - First Month",
      description: "Weight management program with doctor assessment, treatment if prescribed, and ongoing care",
      regularPrice: 34900, // $349 regular
      discount: 10000, // $100 off first month
    },
    monthly: {
      amount: 34900, // $349.00 in cents
      currency: "aud",
      name: "Sanative Core - Monthly",
      description: "Ongoing weight management program",
    },
  },
  precision: {
    firstMonth: {
      amount: 39900, // $399.00 in cents
      currency: "aud",
      name: "Sanative Precision - First Month",
      description: "Enhanced weight management program with closer clinical monitoring",
      regularPrice: 49900, // $499 regular
      discount: 10000, // $100 off first month
    },
    monthly: {
      amount: 49900, // $499.00 in cents
      currency: "aud",
      name: "Sanative Precision - Monthly",
      description: "Ongoing enhanced weight management program",
    },
  },
};

// Helper to get Weight Management price by plan
export function getWeightManagementPrice(plan: "core" | "precision", type: "firstMonth" | "monthly") {
  return WEIGHT_MANAGEMENT_PRICES[plan][type];
}
