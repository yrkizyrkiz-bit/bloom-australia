/** Card only — Apple Pay and Google Pay still appear as wallets. Excludes Klarna/BNPL. */
export const STRIPE_CHECKOUT_PAYMENT_METHOD_TYPES = ["card"] as const;

export const STRIPE_CHECKOUT_WALLETS = {
  applePay: "auto",
  googlePay: "auto",
  link: "never",
} as const;

/** Hide wallets in Payment Element when Express Checkout is already showing them. */
export const STRIPE_CHECKOUT_WALLETS_CARD_ONLY = {
  applePay: "never",
  googlePay: "never",
  link: "never",
} as const;

export const STRIPE_EXPRESS_CHECKOUT_PAYMENT_METHODS = {
  applePay: "auto",
  googlePay: "auto",
  link: "never",
  amazonPay: "never",
  paypal: "never",
  klarna: "never",
} as const;

/** Same phone split as membership checkout verification (`md` / 767px). */
export const CHECKOUT_WALLET_PHONE_MEDIA_QUERY = "(max-width: 767px)";

export type CheckoutWalletOs = "ios" | "android" | "other";

export type MobileWalletEnv = {
  userAgent?: string;
  maxWidthMatches?: boolean;
  coarsePointer?: boolean;
  maxTouchPoints?: number;
};

export function detectCheckoutWalletOs(userAgent: string): CheckoutWalletOs {
  const ua = userAgent || "";
  if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
  if (/Macintosh/i.test(ua) && /Mobile/i.test(ua)) return "ios";
  if (/Android/i.test(ua)) return "android";
  return "other";
}

/**
 * Conservative mobile check for wallet Express Checkout.
 * Requires the checkout phone breakpoint plus a mobile OS or touch signal
 * so a narrow desktop window does not force Express Checkout.
 */
export function isMobileWalletCheckout(env?: MobileWalletEnv): boolean {
  const ua =
    env?.userAgent ??
    (typeof navigator !== "undefined" ? navigator.userAgent : "");
  const os = detectCheckoutWalletOs(ua);
  const maxWidthMatches =
    env?.maxWidthMatches ??
    (typeof window !== "undefined" &&
      window.matchMedia(CHECKOUT_WALLET_PHONE_MEDIA_QUERY).matches);
  const coarsePointer =
    env?.coarsePointer ??
    (typeof window !== "undefined" &&
      window.matchMedia("(pointer: coarse)").matches);
  const maxTouchPoints =
    env?.maxTouchPoints ??
    (typeof navigator !== "undefined" ? navigator.maxTouchPoints || 0 : 0);

  // iPhone landscape and iPad are wider than the phone breakpoint but still
  // need Express Checkout; a narrow desktop window is excluded by OS check.
  if (os === "ios" || os === "android") return true;
  if (!maxWidthMatches) return false;
  return coarsePointer || maxTouchPoints > 0;
}

/** Stripe shows the OS-appropriate button; order still prefers that wallet first. */
export function expressCheckoutPaymentMethodOrder(
  os: CheckoutWalletOs
): string[] {
  if (os === "android") return ["google_pay", "apple_pay"];
  return ["apple_pay", "google_pay"];
}

export function stripeExpressCheckoutOptions(os: CheckoutWalletOs) {
  return {
    layout: {
      maxColumns: 1,
      maxRows: 1,
      overflow: "never" as const,
    },
    buttonHeight: 48,
    buttonType: {
      applePay: "plain" as const,
      googlePay: "pay" as const,
    },
    paymentMethodOrder: expressCheckoutPaymentMethodOrder(os),
    paymentMethods: STRIPE_EXPRESS_CHECKOUT_PAYMENT_METHODS,
    emailRequired: false,
    phoneNumberRequired: false,
    shippingAddressRequired: false,
  };
}

export function stripePaymentElementWallets(opts: {
  hideWallets: boolean;
}) {
  return opts.hideWallets
    ? STRIPE_CHECKOUT_WALLETS_CARD_ONLY
    : STRIPE_CHECKOUT_WALLETS;
}

export function stripePaymentElementOrder(
  os: CheckoutWalletOs,
  hideWallets: boolean
): string[] {
  if (hideWallets) return ["card"];
  if (os === "android") return ["google_pay", "apple_pay", "card"];
  return ["apple_pay", "google_pay", "card"];
}

/** Accordion, wallets first. Boolean `radios` is rejected by Stripe Dahlia. */
export function stripePaymentElementOptions(opts: {
  hideWallets: boolean;
  os: CheckoutWalletOs;
}) {
  return {
    layout: {
      type: "accordion" as const,
      defaultCollapsed: false,
      radios: "never" as const,
      spacedAccordionItems: true,
    },
    wallets: stripePaymentElementWallets(opts),
    paymentMethodOrder: stripePaymentElementOrder(opts.os, opts.hideWallets),
    fields: {
      billingDetails: {
        email: "never" as const,
        name: "never" as const,
      },
    },
  };
}

/** Elements-level order so Apple Pay is selected before card on Safari. */
export function stripeCheckoutElementsPaymentMethodOrder(
  os: CheckoutWalletOs
): string[] {
  return stripePaymentElementOrder(os, false);
}
