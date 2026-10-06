import { describe, expect, it } from "vitest";
import {
  isStripeTerminalElementsError,
  stripePaymentIntentCanInitializeElements,
  stripePaymentIntentIsSucceeded,
} from "@/lib/checkout/stripe-payment-intent-state";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("stripe payment intent checkout state", () => {
  it("only initialises Elements with payable PaymentIntent statuses", () => {
    expect(stripePaymentIntentCanInitializeElements("requires_payment_method")).toBe(true);
    expect(stripePaymentIntentCanInitializeElements("requires_confirmation")).toBe(true);
    expect(stripePaymentIntentCanInitializeElements("requires_action")).toBe(true);
    expect(stripePaymentIntentCanInitializeElements("processing")).toBe(true);
    expect(stripePaymentIntentCanInitializeElements("succeeded")).toBe(false);
    expect(stripePaymentIntentCanInitializeElements("canceled")).toBe(false);
    expect(stripePaymentIntentIsSucceeded("succeeded")).toBe(true);
  });

  it("detects Stripe terminal-state Elements errors", () => {
    expect(
      isStripeTerminalElementsError(
        "This PaymentIntent is in a terminal state and cannot be used to initialize Elements."
      )
    ).toBe(true);
    expect(isStripeTerminalElementsError("Your card was declined.")).toBe(false);
  });

  it("resumes payable membership intents instead of remounting succeeded secrets", () => {
    const intent = readFileSync(
      join(process.cwd(), "src/app/api/public/membership-checkout/funnel-intent/route.ts"),
      "utf8"
    );
    const payment = readFileSync(
      join(process.cwd(), "src/components/checkout/FunnelMembershipPaymentScreen.tsx"),
      "utf8"
    );
    expect(intent).toContain("resumeOrCreateMembershipCheckoutPayment");
    expect(intent).toContain("alreadyPaid");
    expect(payment).toContain("retrievePaymentIntent");
    expect(payment).toContain("isStripeTerminalElementsError");
    expect(payment).toContain("setCompleted(true)");
  });
});
