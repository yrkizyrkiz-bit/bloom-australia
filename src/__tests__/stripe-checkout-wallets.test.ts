import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  CHECKOUT_WALLET_PHONE_MEDIA_QUERY,
  detectCheckoutWalletOs,
  expressCheckoutPaymentMethodOrder,
  isMobileWalletCheckout,
  STRIPE_CHECKOUT_PAYMENT_METHOD_TYPES,
  STRIPE_CHECKOUT_WALLETS,
  STRIPE_CHECKOUT_WALLETS_CARD_ONLY,
  stripeExpressCheckoutOptions,
  stripePaymentElementWallets,
} from "@/lib/checkout/stripe-payment-methods";
import { PHONE_VERIFY_MEDIA_QUERY } from "@/lib/membership/checkout-verify-method";

const IPHONE_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
const ANDROID_UA =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36";
const DESKTOP_MAC_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

describe("membership checkout mobile wallets", () => {
  it("uses the existing checkout phone breakpoint", () => {
    expect(CHECKOUT_WALLET_PHONE_MEDIA_QUERY).toBe(PHONE_VERIFY_MEDIA_QUERY);
    expect(CHECKOUT_WALLET_PHONE_MEDIA_QUERY).toBe("(max-width: 767px)");
  });

  it("prefers Apple Pay on iOS / Safari mobile and Google Pay on Android", () => {
    expect(detectCheckoutWalletOs(IPHONE_UA)).toBe("ios");
    expect(detectCheckoutWalletOs(ANDROID_UA)).toBe("android");
    expect(detectCheckoutWalletOs(DESKTOP_MAC_UA)).toBe("other");
    expect(expressCheckoutPaymentMethodOrder("ios")[0]).toBe("apple_pay");
    expect(expressCheckoutPaymentMethodOrder("android")[0]).toBe("google_pay");
    expect(stripeExpressCheckoutOptions("ios").paymentMethodOrder[0]).toBe(
      "apple_pay"
    );
    expect(stripeExpressCheckoutOptions("android").paymentMethodOrder[0]).toBe(
      "google_pay"
    );
  });

  it("only treats a phone-width viewport as mobile when OS or touch agrees", () => {
    expect(
      isMobileWalletCheckout({
        userAgent: IPHONE_UA,
        maxWidthMatches: true,
        coarsePointer: true,
        maxTouchPoints: 5,
      })
    ).toBe(true);
    expect(
      isMobileWalletCheckout({
        userAgent: ANDROID_UA,
        maxWidthMatches: true,
        coarsePointer: true,
        maxTouchPoints: 5,
      })
    ).toBe(true);
    expect(
      isMobileWalletCheckout({
        userAgent: DESKTOP_MAC_UA,
        maxWidthMatches: true,
        coarsePointer: false,
        maxTouchPoints: 0,
      })
    ).toBe(false);
    expect(
      isMobileWalletCheckout({
        userAgent: IPHONE_UA,
        maxWidthMatches: false,
        coarsePointer: true,
        maxTouchPoints: 5,
      })
    ).toBe(false);
  });

  it("keeps card available and only hides wallets when Express Checkout is showing", () => {
    expect(STRIPE_CHECKOUT_PAYMENT_METHOD_TYPES).toEqual(["card"]);
    expect(STRIPE_CHECKOUT_WALLETS).toEqual({
      applePay: "auto",
      googlePay: "auto",
      link: "never",
    });
    expect(stripePaymentElementWallets({ hideWallets: false })).toEqual(
      STRIPE_CHECKOUT_WALLETS
    );
    expect(stripePaymentElementWallets({ hideWallets: true })).toEqual(
      STRIPE_CHECKOUT_WALLETS_CARD_ONLY
    );
    expect(STRIPE_CHECKOUT_WALLETS_CARD_ONLY.applePay).toBe("never");
    expect(STRIPE_CHECKOUT_WALLETS_CARD_ONLY.googlePay).toBe("never");
  });

  it("mounts Express Checkout on the shared membership checkout payment step", () => {
    const page = readFileSync(
      join(process.cwd(), "src/app/(public)/membership/checkout/page.tsx"),
      "utf8"
    );
    expect(page).toContain("ExpressCheckoutElement");
    expect(page).toContain("isMobileWalletCheckout");
    expect(page).toContain("confirmPayment");
    expect(page).toContain("PaymentElement");
    expect(page).not.toContain("apple_pay");
    expect(page).not.toContain("payment_method_types");

    const intent = readFileSync(
      join(process.cwd(), "src/app/api/public/membership-checkout/intent/route.ts"),
      "utf8"
    );
    expect(intent).toContain("STRIPE_CHECKOUT_PAYMENT_METHOD_TYPES");
    expect(intent).not.toContain("apple_pay");
  });
});
