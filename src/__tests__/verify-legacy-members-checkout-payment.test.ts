import { beforeEach, describe, expect, it, vi } from "vitest";

const retrieve = vi.fn();
const customersRetrieve = vi.fn();
const findFirst = vi.fn();
const getPricing = vi.fn();

vi.mock("@/lib/stripe", () => ({
  getStripe: () => ({
    paymentIntents: { retrieve },
    customers: { retrieve: customersRetrieve },
  }),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    programMember: { findFirst },
  },
}));

vi.mock("@/lib/billing/portal-pricing", () => ({
  getPublicOrganCareAnnualPricing: () => getPricing(),
}));

describe("verifyLegacyMembersCheckoutPayment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getPricing.mockResolvedValue({ amountCents: 36500 });
    findFirst.mockResolvedValue(null);
  });

  it("rejects missing payment intent id", async () => {
    const { verifyLegacyMembersCheckoutPayment } = await import(
      "@/lib/stripe/verify-legacy-members-checkout-payment"
    );
    const result = await verifyLegacyMembersCheckoutPayment({
      paymentIntentId: "",
      email: "a@b.co",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(400);
  });

  it("rejects non-succeeded payment intents", async () => {
    retrieve.mockResolvedValue({
      id: "pi_1",
      status: "requires_payment_method",
      amount: 36500,
      currency: "aud",
      metadata: { type: "organ_care_membership", email: "a@b.co" },
      customer: "cus_1",
    });
    const { verifyLegacyMembersCheckoutPayment } = await import(
      "@/lib/stripe/verify-legacy-members-checkout-payment"
    );
    const result = await verifyLegacyMembersCheckoutPayment({
      paymentIntentId: "pi_1",
      email: "a@b.co",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(402);
  });

  it("accepts a succeeded organ_care_membership payment for the same email", async () => {
    retrieve.mockResolvedValue({
      id: "pi_ok",
      status: "succeeded",
      amount: 36500,
      currency: "aud",
      metadata: {
        type: "organ_care_membership",
        email: "member@sanative.com.au",
        program: "organ_care",
      },
      customer: "cus_1",
    });
    const { verifyLegacyMembersCheckoutPayment } = await import(
      "@/lib/stripe/verify-legacy-members-checkout-payment"
    );
    const result = await verifyLegacyMembersCheckoutPayment({
      paymentIntentId: "pi_ok",
      email: "member@sanative.com.au",
      program: "organ_care",
    });
    expect(result).toEqual(
      expect.objectContaining({
        ok: true,
        customerId: "cus_1",
      })
    );
  });

  it("rejects replay of an already-used payment intent", async () => {
    retrieve.mockResolvedValue({
      id: "pi_used",
      status: "succeeded",
      amount: 36500,
      currency: "aud",
      metadata: { type: "organ_care_membership", email: "a@b.co" },
      customer: "cus_1",
    });
    findFirst.mockResolvedValue({ id: "pm_existing" });
    const { verifyLegacyMembersCheckoutPayment } = await import(
      "@/lib/stripe/verify-legacy-members-checkout-payment"
    );
    const result = await verifyLegacyMembersCheckoutPayment({
      paymentIntentId: "pi_used",
      email: "a@b.co",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(409);
  });
});
