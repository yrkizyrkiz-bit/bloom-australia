/** Card only — Apple Pay and Google Pay still appear as wallets. Excludes Klarna/BNPL. */
export const STRIPE_CHECKOUT_PAYMENT_METHOD_TYPES = ["card"] as const;

export const STRIPE_CHECKOUT_WALLETS = {
  applePay: "auto",
  googlePay: "auto",
  link: "never",
} as const;
