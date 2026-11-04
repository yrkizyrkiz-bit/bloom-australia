import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { membershipCheckoutPath } from "@/lib/analytics/meta-pixel";
import {
  LIVER_BIOMARKER_INSIGHTS_PRODUCT_SLUG,
  LIVER_HEALTH_CHECK_ITEM_NAME,
  LIVER_QUIZ_RESULT_BUTTON,
  MEMBERSHIP_PURCHASE_ITEM_NAME,
  isLiverBiomarkerInsightsCheckout,
  membershipCheckoutDisplayFallback,
  membershipPurchaseAnalytics,
} from "@/lib/membership/checkout-product";
import { HEART_ASSESSMENT_UI } from "@/lib/promo/heart-assessment-results";
import { KIDNEY_ASSESSMENT_UI } from "@/lib/promo/kidney-assessment-results";
import {
  LIVER_ASSESSMENT_UI,
  LIVER_CTA_RECOMMENDATION,
  LIVER_RESULT_VIDEO_POSTER,
  LIVER_RESULT_VIDEO_SRC,
} from "@/lib/promo/liver-assessment-results";

const ROOT = join(process.cwd(), "src");

function readSource(relativePath: string): string {
  return readFileSync(join(ROOT, relativePath), "utf8");
}

describe("liver quiz $79 checkout product", () => {
  it("selects Liver Biomarker Insights only from product or liver_quiz_result button", () => {
    expect(
      isLiverBiomarkerInsightsCheckout({
        product: LIVER_BIOMARKER_INSIGHTS_PRODUCT_SLUG,
        button: LIVER_QUIZ_RESULT_BUTTON,
      })
    ).toBe(true);
    expect(
      isLiverBiomarkerInsightsCheckout({
        product: LIVER_BIOMARKER_INSIGHTS_PRODUCT_SLUG,
        button: "liver_biomarkers_cta",
      })
    ).toBe(true);
    expect(
      isLiverBiomarkerInsightsCheckout({
        product: null,
        button: LIVER_QUIZ_RESULT_BUTTON,
      })
    ).toBe(true);

    expect(isLiverBiomarkerInsightsCheckout({ product: null, button: "liver_biomarkers_cta" })).toBe(
      false
    );
    expect(isLiverBiomarkerInsightsCheckout({ product: null, button: "liver_decode_cta" })).toBe(
      false
    );
    expect(isLiverBiomarkerInsightsCheckout({ product: null, button: "membership_card" })).toBe(
      false
    );
    expect(isLiverBiomarkerInsightsCheckout({ product: null, button: "liver_closing_cta" })).toBe(
      false
    );
    expect(isLiverBiomarkerInsightsCheckout({ product: null, button: "liver_quiz_email" })).toBe(
      false
    );
    expect(isLiverBiomarkerInsightsCheckout({ product: null, button: "heart_quiz_result" })).toBe(
      false
    );
    expect(isLiverBiomarkerInsightsCheckout({ product: null, button: "kidney_quiz_result" })).toBe(
      false
    );
  });

  it("does not switch product from source=fatty_liver alone", () => {
    expect(isLiverBiomarkerInsightsCheckout({ product: null, button: null })).toBe(false);
    expect(
      isLiverBiomarkerInsightsCheckout({
        product: "sanative_membership",
        button: "liver_biomarkers_cta",
      })
    ).toBe(false);
  });

  it("shows $79 Liver Biomarker Insights display defaults for that path only", () => {
    const liver = membershipCheckoutDisplayFallback({
      product: LIVER_BIOMARKER_INSIGHTS_PRODUCT_SLUG,
      button: LIVER_QUIZ_RESULT_BUTTON,
    });
    expect(liver.productName).toBe("Liver Biomarker Insights");
    expect(liver.amountAud).toBe(79);
    expect(liver.priceLabel).toBe("$79");
    expect(liver.intervalLabel).toBe("2 months Liver portal access");
    expect(liver.autoRenew).toBe(false);

    const membership = membershipCheckoutDisplayFallback({
      product: null,
      button: "liver_biomarkers_cta",
    });
    expect(membership.productName).toBe("Sanative Membership");
    expect(membership.amountAud).toBe(365);
    expect(membership.priceLabel).toBe("$365/yr");
    expect(membership.autoRenew).toBe(true);
  });

  it("adds product=liver_biomarker_insights on the liver quiz results CTA only", () => {
    expect(LIVER_ASSESSMENT_UI.ctaLabel).toBe("Catch issues early – $79");
    expect(LIVER_CTA_RECOMMENDATION.high).toBe(
      "Recommendation based on your risk: take a closer look at your liver biomarkers."
    );
    expect(LIVER_CTA_RECOMMENDATION.moderate).toBe(
      "Recommendation based on your risk: take a closer look at your liver biomarkers."
    );
    expect(LIVER_CTA_RECOMMENDATION.low).toBe(
      "Your risk looks low. If you’d still like peace of mind, you can check your liver biomarkers."
    );
    const resultsUi = readSource("components/promo/OrganAssessmentResults.tsx");
    expect(resultsUi).toContain("LIVER_CTA_RECOMMENDATION[tier]");
    expect(resultsUi).toContain("isLiver");
    expect(resultsUi).toContain("resultVideoSrc");
    expect(resultsUi).toContain('preload="none"');
    expect(resultsUi).toContain('tier === "high" || tier === "moderate"');
    expect(resultsUi).toContain("videoFinished");
    expect(resultsUi).toContain("onEnded={() => setVideoFinished(true)}");
    expect(resultsUi).toContain("canShowResultVideo && !videoFinished");
    const liverCalculator = readSource("components/promo/LiverHealthCalculator.tsx");
    expect(liverCalculator).toContain("resultVideoSrc={LIVER_RESULT_VIDEO_SRC}");
    expect(HEART_ASSESSMENT_UI.organ).toBe("heart");
    expect(KIDNEY_ASSESSMENT_UI.organ).toBe("kidney");
    expect(readSource("components/promo/HeartHealthCalculator.tsx")).not.toContain("resultVideoSrc");
    expect(readSource("components/promo/KidneyHealthCalculator.tsx")).not.toContain("resultVideoSrc");
    expect(LIVER_RESULT_VIDEO_SRC).toBe("/videos/liver-quiz-result.mp4");
    expect(LIVER_RESULT_VIDEO_POSTER).toBe("/videos/liver-quiz-result-poster.jpg");
    expect(LIVER_ASSESSMENT_UI.checkoutButton).toBe(LIVER_QUIZ_RESULT_BUTTON);
    expect(LIVER_ASSESSMENT_UI.checkoutProduct).toBe(LIVER_BIOMARKER_INSIGHTS_PRODUCT_SLUG);
    expect(
      membershipCheckoutPath(
        LIVER_ASSESSMENT_UI.checkoutSource,
        LIVER_ASSESSMENT_UI.checkoutButton,
        LIVER_ASSESSMENT_UI.checkoutProduct
      )
    ).toBe(
      "/membership/checkout?source=fatty_liver&button=liver_quiz_result&product=liver_biomarker_insights"
    );

    expect(HEART_ASSESSMENT_UI.checkoutProduct).toBeUndefined();
    expect(KIDNEY_ASSESSMENT_UI.checkoutProduct).toBeUndefined();
    expect(
      membershipCheckoutPath(HEART_ASSESSMENT_UI.checkoutSource, HEART_ASSESSMENT_UI.checkoutButton)
    ).toBe("/membership/checkout?source=heart_health&button=heart_quiz_result");
    expect(
      membershipCheckoutPath(
        KIDNEY_ASSESSMENT_UI.checkoutSource,
        KIDNEY_ASSESSMENT_UI.checkoutButton
      )
    ).toBe("/membership/checkout?source=kidney_health&button=kidney_quiz_result");
  });

  it("points the three liver page CTAs at $79 checkout with source=fatty_liver and product slug", () => {
    const liverPage = readSource("app/(public)/metabolic-care/fatty-liver/page.tsx");
    expect(liverPage).toContain('liverHealthCheckCheckoutPath("liver_biomarkers_cta")');
    expect(liverPage).toContain('liverHealthCheckCheckoutPath("liver_decode_cta")');
    expect(liverPage).toContain('liverHealthCheckCheckoutPath("liver_closing_cta")');
    expect(liverPage).toContain("LIVER_BIOMARKER_INSIGHTS_PRODUCT_SLUG");
    expect(liverPage).toContain("LIVER_ASSESSMENT_UI.ctaLabel");
    expect(liverPage).not.toContain("Check My Liver Risk");
    expect(liverPage).not.toContain("OrganCareMembershipSection");
    expect(liverPage).not.toContain("$365");
    expect(liverPage).not.toContain("$1 per day");
    expect(liverPage).toContain('announcementPrice="Liver Health Check – $79"');

    expect(
      membershipCheckoutPath(
        "fatty_liver",
        "liver_biomarkers_cta",
        LIVER_BIOMARKER_INSIGHTS_PRODUCT_SLUG
      )
    ).toBe(
      "/membership/checkout?source=fatty_liver&button=liver_biomarkers_cta&product=liver_biomarker_insights"
    );
    expect(
      membershipCheckoutPath(
        "fatty_liver",
        "liver_decode_cta",
        LIVER_BIOMARKER_INSIGHTS_PRODUCT_SLUG
      )
    ).toBe(
      "/membership/checkout?source=fatty_liver&button=liver_decode_cta&product=liver_biomarker_insights"
    );
    expect(
      membershipCheckoutPath(
        "fatty_liver",
        "liver_closing_cta",
        LIVER_BIOMARKER_INSIGHTS_PRODUCT_SLUG
      )
    ).toBe(
      "/membership/checkout?source=fatty_liver&button=liver_closing_cta&product=liver_biomarker_insights"
    );

    expect(
      isLiverBiomarkerInsightsCheckout({
        product: LIVER_BIOMARKER_INSIGHTS_PRODUCT_SLUG,
        button: "liver_biomarkers_cta",
      })
    ).toBe(true);
    expect(
      isLiverBiomarkerInsightsCheckout({
        product: null,
        button: "liver_biomarkers_cta",
      })
    ).toBe(false);

    const email = readSource("lib/promo/handle-organ-assessment-results.ts");
    expect(email).toContain("/membership/checkout?source=fatty_liver&button=liver_quiz_email");
    expect(email).not.toContain("product=liver_biomarker_insights");
  });

  it("emits Liver Health Check purchase analytics for $79 and membership for $365", () => {
    expect(
      membershipPurchaseAnalytics(
        { product: LIVER_BIOMARKER_INSIGHTS_PRODUCT_SLUG, button: "liver_biomarkers_cta" },
        79
      )
    ).toEqual({
      value: 79,
      currency: "AUD",
      content_name: LIVER_HEALTH_CHECK_ITEM_NAME,
      content_ids: [LIVER_BIOMARKER_INSIGHTS_PRODUCT_SLUG],
    });
    expect(
      membershipPurchaseAnalytics({ product: null, button: LIVER_QUIZ_RESULT_BUTTON }, 79)
    ).toEqual({
      value: 79,
      currency: "AUD",
      content_name: "Liver Health Check",
      content_ids: ["liver_biomarker_insights"],
    });
    expect(
      membershipPurchaseAnalytics({ product: null, button: "liver_biomarkers_cta" }, 365)
    ).toEqual({
      value: 365,
      currency: "AUD",
      content_name: MEMBERSHIP_PURCHASE_ITEM_NAME,
      content_ids: ["sanative_membership"],
    });

    const checkout = readSource("app/(public)/membership/checkout/page.tsx");
    expect(checkout).toContain("membershipPurchaseAnalytics");
    expect(checkout).toContain("purchaseAnalytics.content_name");
    expect(checkout).toContain("currency: \"AUD\"");
  });
});
