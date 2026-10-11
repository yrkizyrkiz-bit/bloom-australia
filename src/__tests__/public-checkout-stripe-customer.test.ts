import { beforeEach, describe, expect, it, vi } from "vitest";

const { findUniqueUser } = vi.hoisted(() => ({
  findUniqueUser: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: findUniqueUser },
  },
}));

vi.mock("@/lib/stripe", () => ({
  getStripe: () => null,
}));

import { resolvePublicCheckoutStripeCustomer } from "@/lib/portal/stripe-customer";

function fakeStripe(existing: Array<{ id: string }> = []) {
  return {
    customers: {
      list: vi.fn().mockResolvedValue({ data: existing }),
      update: vi.fn().mockResolvedValue({ id: existing[0]?.id }),
      create: vi.fn().mockResolvedValue({ id: "cus_new" }),
    },
  };
}

describe("resolvePublicCheckoutStripeCustomer", () => {
  beforeEach(() => {
    findUniqueUser.mockReset();
  });

  it("does not write name or phone onto an established member's Stripe customer", async () => {
    findUniqueUser.mockResolvedValue({
      passwordHash: "hash",
      subscriptionStatus: "ACTIVE",
      journeyStatus: "ACTIVE",
      memberStatus: "MEMBER",
    });
    const stripe = fakeStripe([{ id: "cus_existing" }]);

    const customerId = await resolvePublicCheckoutStripeCustomer({
      stripe: stripe as never,
      email: "member@example.com",
      userId: "user_1",
      firstName: "Other",
      lastName: "Name",
      phone: "0499999999",
    });

    expect(customerId).toBe("cus_existing");
    expect(stripe.customers.update).not.toHaveBeenCalled();
    expect(stripe.customers.create).not.toHaveBeenCalled();
  });

  it("creates an email-only Stripe customer for an established member without one", async () => {
    findUniqueUser.mockResolvedValue({
      passwordHash: "hash",
      subscriptionStatus: "ACTIVE",
      journeyStatus: "ACTIVE",
      memberStatus: "MEMBER",
    });
    const stripe = fakeStripe([]);

    await resolvePublicCheckoutStripeCustomer({
      stripe: stripe as never,
      email: "member@example.com",
      userId: "user_1",
      firstName: "Other",
      lastName: "Name",
      phone: "0499999999",
    });

    expect(stripe.customers.create).toHaveBeenCalledWith({
      email: "member@example.com",
      metadata: { userId: "user_1" },
    });
  });

  it("writes name and phone for a new or prospective checkout", async () => {
    findUniqueUser.mockResolvedValue(null);
    const stripe = fakeStripe([]);

    await resolvePublicCheckoutStripeCustomer({
      stripe: stripe as never,
      email: "new@example.com",
      firstName: "New",
      lastName: "Member",
      phone: "0411111111",
    });

    expect(stripe.customers.create).toHaveBeenCalledWith({
      email: "new@example.com",
      name: "New Member",
      phone: "0411111111",
    });
  });
});
