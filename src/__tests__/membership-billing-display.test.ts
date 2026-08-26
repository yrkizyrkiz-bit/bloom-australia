import { describe, expect, it } from "vitest";
import {
  hasActiveSanativeMembership,
  hasWeightProgramContext,
  isSanativeMembershipProduct,
} from "@/lib/membership/weight-access";
import {
  invoiceMatchesMembership,
  invoiceMatchesProgram,
  invoiceMatchesScope,
} from "@/lib/billing/paid-till";
import { MEMBERSHIP_INCLUDED_SCOPE_SLUGS } from "@/lib/billing/program-slugs";

describe("Sanative Membership billing display", () => {
  it("recognises the membership catalog product", () => {
    expect(
      isSanativeMembershipProduct({
        slug: "sanative_membership",
        name: "Sanative Membership",
        program: "MEMBERSHIP",
      })
    ).toBe(true);
    expect(
      isSanativeMembershipProduct({
        slug: "weight_management",
        name: "Weight Management",
        program: "WEIGHT_MANAGEMENT",
      })
    ).toBe(false);
  });

  it("treats a paid membership plus weight intake as weight-program context", () => {
    expect(
      hasWeightProgramContext({
        subscriptionTier: "membership",
        subscriptionStatus: "ACTIVE",
        journeyStatus: "ACTIVE",
        hasWeightIntake: true,
        memberSubscriptions: [
          {
            status: "ACTIVE",
            product: {
              slug: "sanative_membership",
              name: "Sanative Membership",
              program: "MEMBERSHIP",
            },
          },
        ],
      })
    ).toBe(true);
  });

  it("does not treat membership-only join as a weight program", () => {
    expect(
      hasActiveSanativeMembership({
        subscriptionTier: "membership",
        subscriptionStatus: "ACTIVE",
      })
    ).toBe(true);
    expect(
      hasWeightProgramContext({
        subscriptionTier: "membership",
        subscriptionStatus: "ACTIVE",
        journeyStatus: "ACTIVE",
        hasWeightIntake: false,
      })
    ).toBe(false);
  });

  it("matches membership invoices without treating them as weight management", () => {
    const description = "Sanative Membership: annual auto-renew (includes Essential biomarker panel)";
    expect(invoiceMatchesMembership(description)).toBe(true);
    expect(invoiceMatchesProgram(description, "WEIGHT_MANAGEMENT")).toBe(false);
  });

  it("does not treat membership invoices as standalone organ care or clock products", () => {
    const description = "Sanative Membership: annual auto-renew (includes Essential biomarker panel)";
    expect(invoiceMatchesScope(description, "ORGAN_CARE")).toBe(false);
    expect(MEMBERSHIP_INCLUDED_SCOPE_SLUGS).toEqual(["organ_care", "biological_clock"]);
  });
});

describe("Stripe subscription period", () => {
  it("reads period from subscription items when the subscription object omits it", async () => {
    const { getStripeSubscriptionPeriod } = await import(
      "@/lib/stripe/subscription-period"
    );
    const start = 1787731840;
    const end = 1819267840;
    const period = getStripeSubscriptionPeriod({
      items: {
        data: [
          {
            current_period_start: start,
            current_period_end: end,
            price: { recurring: { interval: "year", interval_count: 1 } },
          },
        ],
      },
    } as never);
    expect(period.start.toISOString()).toBe(new Date(start * 1000).toISOString());
    expect(period.end.toISOString()).toBe(new Date(end * 1000).toISOString());
  });

  it("falls back to one year for annual prices", async () => {
    const { getStripeSubscriptionPeriod } = await import(
      "@/lib/stripe/subscription-period"
    );
    const start = Math.floor(Date.parse("2026-08-26T10:50:39.000Z") / 1000);
    const period = getStripeSubscriptionPeriod({
      current_period_start: start,
      items: {
        data: [{ price: { recurring: { interval: "year", interval_count: 1 } } }],
      },
    } as never);
    expect(period.end.toISOString()).toBe("2027-08-26T10:50:39.000Z");
  });
});
