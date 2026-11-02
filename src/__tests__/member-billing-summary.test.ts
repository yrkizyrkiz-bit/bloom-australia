import { beforeEach, describe, expect, it, vi } from "vitest";
import { LIVER_BIOMARKER_INSIGHTS_PRODUCT_SLUG } from "@/lib/membership/checkout-product-select";
import { LIVER_BIOMARKER_INSIGHTS_ENTITLEMENT_KEY } from "@/lib/membership/liver-biomarker-insights-access";

const {
  findUniqueUser,
  findManyProgramMember,
  findManyEntitlement,
  findManyMemberSubscription,
} = vi.hoisted(() => ({
  findUniqueUser: vi.fn(),
  findManyProgramMember: vi.fn(),
  findManyEntitlement: vi.fn(),
  findManyMemberSubscription: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: findUniqueUser },
    programMember: { findMany: findManyProgramMember },
    entitlement: { findMany: findManyEntitlement },
    memberSubscription: { findMany: findManyMemberSubscription },
  },
}));

vi.mock("@/lib/billing/catalog", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/billing/catalog")>();
  return {
    ...actual,
    ensureBillingCatalog: vi.fn(async () => undefined),
    billingModelsAvailable: () => true,
  };
});

vi.mock("@/lib/portal-quiz-submissions", () => ({
  getLatestPortalQuizSubmissions: vi.fn(async () => []),
}));

vi.mock("@/lib/billing/included-care", () => ({
  loadIncludedCareForBilling: vi.fn(async () => null),
}));

const periodStart = new Date("2026-11-02T00:00:00.000Z");
const periodEnd = new Date("2027-01-02T00:00:00.000Z");
const paidAt = new Date("2026-11-02T01:00:00.000Z");

function liverMemberSub(amountCents: number) {
  return {
    id: "sub-liver-1",
    status: "ACTIVE",
    stripeSubscriptionId: null,
    stripeCustomerId: "cus_test",
    billingPriceId: "price-liver-1",
    currentPeriodStart: periodStart,
    currentPeriodEnd: periodEnd,
    nextChargeAt: null,
    activatedAt: periodStart,
    createdAt: periodStart,
    product: {
      program: "LIVER_BIOMARKER_INSIGHTS",
      slug: LIVER_BIOMARKER_INSIGHTS_PRODUCT_SLUG,
      name: "Liver Biomarker Insights",
      planTier: null,
    },
    billingPrice: {
      amountCents,
      billingInterval: "ONE_TIME" as const,
      label: "2 months Liver portal access",
    },
    history: [],
  };
}

function liverInvoice(amount: number) {
  return {
    stripeId: "pi_liver_1",
    description: "Liver Biomarker Insights: 2 months Liver portal access",
    amount,
    paidAt,
  };
}

describe("getMemberBillingOverview liver biomarker insights", () => {
  beforeEach(() => {
    findUniqueUser.mockReset();
    findManyProgramMember.mockReset();
    findManyEntitlement.mockReset();
    findManyMemberSubscription.mockReset();

    findManyProgramMember.mockResolvedValue([]);
    findManyEntitlement.mockResolvedValue([
      {
        key: LIVER_BIOMARKER_INSIGHTS_ENTITLEMENT_KEY,
        status: "ACTIVE",
        source: "PORTAL_PURCHASE",
        notes: "Liver Biomarker Insights: 2 months Liver portal access. PI pi_liver_1",
        type: "SCOPE",
      },
      {
        key: "ORGAN_CARE",
        status: "ACTIVE",
        source: "PORTAL_PURCHASE",
        notes: "Liver Biomarker Insights: 2 months Liver portal access. PI pi_liver_1",
        type: "SCOPE",
      },
    ]);
  });

  it("appends the stored one-time liver subscription without inventing clock or organ-care billing", async () => {
    findUniqueUser.mockResolvedValue({
      journeyStatus: "CONSULTATION_PAID",
      subscriptionTier: LIVER_BIOMARKER_INSIGHTS_PRODUCT_SLUG,
      subscriptionStatus: "ACTIVE",
      weightManagementIntakes: [],
      membershipSubscription: null,
      invoices: [liverInvoice(1)],
    });
    findManyMemberSubscription.mockResolvedValue([liverMemberSub(100)]);

    const { getMemberBillingOverview } = await import(
      "@/lib/billing/member-billing-summary"
    );
    const overview = await getMemberBillingOverview("user-liver");

    expect(overview.programs.map((program) => program.program)).toEqual([
      LIVER_BIOMARKER_INSIGHTS_PRODUCT_SLUG,
    ]);

    const liver = overview.programs[0];
    expect(liver.programLabel).toBe("Liver Biomarker Insights");
    expect(liver.planLabel).toBe("Liver Biomarker Insights");
    expect(liver.firstMonth.status).toBe("paid");
    expect(liver.firstMonth.amountAud).toBe(1);
    expect(liver.recurring.status).toBe("active");
    expect(liver.recurring.amountAud).toBe(1);
    expect(liver.recurring.billingInterval).toBe("ONE_TIME");
    expect(liver.recurring.billingLabel).toBe("2 months Liver portal access");
    expect(liver.recurring.paidTill).toBe(periodEnd.toISOString());
    expect(liver.subscription?.currentPeriodStart).toBe(periodStart.toISOString());
    expect(liver.subscription?.currentPeriodEnd).toBe(periodEnd.toISOString());
    expect(liver.recurring.amountAud).not.toBe(79);
  });

  it("does not list liver when no MemberSubscription row exists", async () => {
    findUniqueUser.mockResolvedValue({
      journeyStatus: "CONSULTATION_PAID",
      subscriptionTier: LIVER_BIOMARKER_INSIGHTS_PRODUCT_SLUG,
      subscriptionStatus: "ACTIVE",
      weightManagementIntakes: [],
      membershipSubscription: null,
      invoices: [liverInvoice(79)],
    });
    findManyMemberSubscription.mockResolvedValue([]);

    const { getMemberBillingOverview } = await import(
      "@/lib/billing/member-billing-summary"
    );
    const overview = await getMemberBillingOverview("user-no-sub");

    expect(overview.programs).toEqual([]);
  });
});
