import { describe, expect, it } from "vitest";
import { stripePaymentMethodBillingDetails } from "@/lib/checkout/stripe-billing-details";

describe("stripePaymentMethodBillingDetails", () => {
  it("passes collected name and email into confirmPayment payload", () => {
    expect(
      stripePaymentMethodBillingDetails({
        name: "  Ada Lovelace ",
        email: " ada@example.com ",
      })
    ).toEqual({
      payment_method_data: {
        billing_details: {
          name: "Ada Lovelace",
          email: "ada@example.com",
        },
      },
    });
  });

  it("falls back to email when name is missing", () => {
    expect(
      stripePaymentMethodBillingDetails({ email: "ada@example.com" }).payment_method_data
        .billing_details.name
    ).toBe("ada@example.com");
  });
});
