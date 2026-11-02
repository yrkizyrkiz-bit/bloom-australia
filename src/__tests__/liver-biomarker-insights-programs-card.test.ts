import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { LIVER_BIOMARKER_INSIGHTS_PRODUCT_SLUG } from "@/lib/membership/checkout-product-select";
import {
  LIVER_BIOMARKER_INSIGHTS_ENTITLEMENT_KEY,
  hasLiverBiomarkerInsightsAccess,
} from "@/lib/membership/liver-biomarker-insights-access";
import { LIVER_BIOMARKER_INSIGHTS_CARD } from "@/lib/programs/catalog";

const ROOT = join(process.cwd(), "src");

function readSource(relativePath: string): string {
  return readFileSync(join(ROOT, relativePath), "utf8");
}

describe("hasLiverBiomarkerInsightsAccess", () => {
  it("is true for the dedicated $79 product entitlement", () => {
    expect(
      hasLiverBiomarkerInsightsAccess({
        entitlements: [
          {
            type: "SCOPE",
            key: LIVER_BIOMARKER_INSIGHTS_ENTITLEMENT_KEY,
            status: "ACTIVE",
            expiresAt: new Date(Date.now() + 60_000),
          },
        ],
      })
    ).toBe(true);
  });

  it("is true for an active liver product subscription", () => {
    expect(
      hasLiverBiomarkerInsightsAccess({
        memberSubscriptions: [
          {
            status: "ACTIVE",
            currentPeriodEnd: new Date(Date.now() + 60_000),
            product: { slug: LIVER_BIOMARKER_INSIGHTS_PRODUCT_SLUG },
          },
        ],
      })
    ).toBe(true);
  });

  it("is true for catalog-less activation via subscription tier", () => {
    expect(
      hasLiverBiomarkerInsightsAccess({
        subscriptionTier: LIVER_BIOMARKER_INSIGHTS_PRODUCT_SLUG,
      })
    ).toBe(true);
  });

  it("is false for $365 membership / organ-care only", () => {
    expect(
      hasLiverBiomarkerInsightsAccess({
        subscriptionTier: "membership",
        entitlements: [
          { type: "SCOPE", key: "MEMBERSHIP", status: "ACTIVE" },
          { type: "SCOPE", key: "ORGAN_CARE", status: "ACTIVE" },
        ],
        memberSubscriptions: [
          { status: "ACTIVE", product: { slug: "sanative_membership", program: "ORGAN_CARE" } },
        ],
      })
    ).toBe(false);
  });

  it("is false when the 2-month liver subscription has lapsed", () => {
    expect(
      hasLiverBiomarkerInsightsAccess({
        subscriptionTier: LIVER_BIOMARKER_INSIGHTS_PRODUCT_SLUG,
        entitlements: [
          {
            type: "SCOPE",
            key: LIVER_BIOMARKER_INSIGHTS_ENTITLEMENT_KEY,
            status: "ACTIVE",
            expiresAt: new Date(Date.now() - 60_000),
          },
        ],
        memberSubscriptions: [
          {
            status: "ACTIVE",
            currentPeriodEnd: new Date(Date.now() - 60_000),
            product: { slug: LIVER_BIOMARKER_INSIGHTS_PRODUCT_SLUG },
          },
        ],
      })
    ).toBe(false);
  });
});

describe("Programs hub liver card", () => {
  it("links to the in-portal liver page and sits above supplements", () => {
    expect(LIVER_BIOMARKER_INSIGHTS_CARD.label).toBe("Liver Care");
    expect(LIVER_BIOMARKER_INSIGHTS_CARD.route).toBe("/dashboard/liver-test");

    const grid = readSource("components/dashboard/ProgramGridDashboard.tsx");
    expect(grid).toContain("showLiverInsightsCard");
    expect(grid).toContain("hasLiverBiomarkerInsights");
    const renderLiver = grid.lastIndexOf("<LiverInsightsTile");
    const renderSupplements = grid.lastIndexOf("<SupplementsTile");
    expect(renderLiver).toBeGreaterThan(-1);
    expect(renderLiver).toBeLessThan(renderSupplements);
    expect(grid).toContain("LIVER_BIOMARKER_INSIGHTS_CARD");
    expect(grid).not.toContain("membership?.scopes?.ORGAN_CARE");
  });

  it("does not add liver to the $365 membership program grid", () => {
    const catalog = readSource("lib/programs/catalog.ts");
    const programCardsBlock = catalog.slice(
      catalog.indexOf("export const PROGRAM_CARDS"),
      catalog.indexOf("export const ORGAN_CARE_CARD")
    );
    expect(programCardsBlock).not.toContain("liver");
    expect(programCardsBlock).not.toContain("LIVER_BIOMARKER");
  });

  it("grants a product-specific entitlement on $79 activation", () => {
    const activation = readSource("lib/portal/liver-biomarker-insights.ts");
    expect(activation).toContain("LIVER_BIOMARKER_INSIGHTS_ENTITLEMENT_KEY");
    expect(activation).toContain('key: "ORGAN_CARE"');
  });
});

describe("Liver Biomarker Insights first-login redirect", () => {
  it("sends $79 checkout complete magic-link to /dashboard/liver-test, not organ-care", () => {
    const complete = readSource("app/api/public/membership-checkout/complete/route.ts");
    const liverRedirect = complete.match(
      /const postCheckoutPath = isLiverInsights\s*\n\s*\? "([^"]+)"/
    );
    expect(liverRedirect?.[1]).toBe("/dashboard/liver-test");
    expect(complete).not.toMatch(
      /const postCheckoutPath = isLiverInsights\s*\n\s*\? "\/dashboard\/organ-care"/
    );
  });

  it("maps liver_biomarker_insights login/magic tier to /dashboard/liver-test", () => {
    const magic = readSource("app/auth/magic/page.tsx");
    expect(magic).toContain("LIVER_BIOMARKER_INSIGHTS_PRODUCT_SLUG");
    expect(magic).toContain('"/dashboard/liver-test"');
    expect(magic).not.toMatch(
      /LIVER_BIOMARKER_INSIGHTS_PRODUCT_SLUG\]:\s*"\/dashboard\/organ-care"/
    );
  });
});
