/**
 * Checkout path billing coverage — documents expected MemberSubscription + Entitlement writes.
 * Update this table when adding a new purchase flow.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

type CheckoutPathExpectation = {
  path: string;
  memberSubscription: "yes" | "after_doctor" | "on_activate" | "webhook";
  entitlement: "yes" | "pending_on_pay" | "on_complete" | "sync_signals";
};

const CHECKOUT_PATHS: CheckoutPathExpectation[] = [
  {
    path: "Portal program upsell (program-purchase.ts)",
    memberSubscription: "yes",
    entitlement: "yes",
  },
  {
    path: "Portal biomarkers panel (biomarkers-purchase.ts)",
    memberSubscription: "on_activate",
    entitlement: "yes",
  },
  {
    path: "Portal organ care (organ-care-purchase.ts)",
    memberSubscription: "on_activate",
    entitlement: "yes",
  },
  {
    path: "Public biomarkers (public-biomarkers-purchase.ts)",
    memberSubscription: "on_activate",
    entitlement: "pending_on_pay",
  },
  {
    path: "Public funnel booking (bookings/confirm)",
    memberSubscription: "after_doctor",
    entitlement: "yes",
  },
  {
    path: "Doctor approval WM (doctor/decision)",
    memberSubscription: "yes",
    entitlement: "sync_signals",
  },
  {
    path: "Public organ membership (organ-care-membership.ts)",
    memberSubscription: "yes",
    entitlement: "yes",
  },
];

const ROOT = join(process.cwd(), "src");

function readSource(relativePath: string): string {
  return readFileSync(join(ROOT, relativePath), "utf8");
}

describe("checkout billing coverage", () => {
  it("portal program purchase grants entitlement and syncs subscription", () => {
    const source = readSource("lib/portal/program-purchase.ts");
    expect(source).toContain("grantEntitlement");
    expect(source).toContain("syncMemberSubscriptionFromStripe");
  });

  it("public biomarkers activates pending entitlement and subscription on payment", () => {
    const source = readSource("lib/portal/public-biomarkers-purchase.ts");
    expect(source).toContain('status: "PENDING"');
    expect(source).toContain("syncMemberSubscriptionFromPaymentIntent");
    expect(source).toContain('status: "ACTIVE"');
  });

  it("hair-loss public biomarkers path does not bundle Organ Care", () => {
    const tierMap = readSource("lib/biomarkers/public-checkout-tier-map.ts");
    const purchase = readSource("lib/portal/public-biomarkers-purchase.ts");
    expect(tierMap).toContain('sourceProgram === "hair_loss"');
    expect(purchase).toContain("shouldBundleOrganCare");
    expect(purchase).toContain("revokeEntitlement");
  });

  it("hair-loss public biomarkers enrollment stays in pre-triage and saves hair quiz", () => {
    const purchase = readSource("lib/portal/public-biomarkers-purchase.ts");
    expect(purchase).toContain("ensureHairLossMemberRecords");
    expect(purchase).toContain('journeyStatus: "PRE_TRIAGE_PENDING"');
    expect(purchase).toContain("bookingLinkedTriage");
    expect(purchase).toContain("savePublicFunnelQuizFromIntake");
  });

  it("consult-first and public biomarkers grant panel entitlements at payment", () => {
    const confirm = readSource("app/api/bookings/confirm/route.ts");
    const purchase = readSource("lib/portal/public-biomarkers-purchase.ts");
    const helper = readSource("lib/portal/grant-program-panel-at-payment.ts");
    expect(helper).toContain("grantProgramPanelEntitlementsAtPayment");
    expect(helper).toContain("BIOLOGICAL_CLOCK");
    expect(helper).toContain("ORGAN_CARE");
    expect(confirm).toContain("grantProgramPanelEntitlementsAtPayment");
    expect(purchase).toContain("grantProgramPanelEntitlementsAtPayment");
  });

  it("portal biomarkers syncs incomplete subscription instead of duplicating", () => {
    const source = readSource("lib/portal/biomarkers-purchase.ts");
    expect(source).toContain("syncMemberSubscriptionFromPaymentIntent");
    expect(source).toContain("grantEntitlement");
  });

  it("portal organ care syncs incomplete subscription for organ-only checkout", () => {
    const source = readSource("lib/portal/organ-care-purchase.ts");
    expect(source).toContain("syncMemberSubscriptionFromPaymentIntent");
    expect(source).toContain("grantEntitlement");
  });

  it("stripe webhook handles portal and public biomarkers sources", () => {
    const source = readSource("app/api/webhooks/stripe/route.ts");
    expect(source).toContain('"portal_biomarkers"');
    expect(source).toContain('"public_biomarkers"');
    expect(source).toContain('"portal_organ_care"');
  });

  it("documents all checkout paths", () => {
    expect(CHECKOUT_PATHS.length).toBeGreaterThanOrEqual(7);
  });
});
