import { describe, expect, it } from "vitest";
import {
  getOrganCheckoutSummary,
  isOrganCheckoutSource,
} from "@/lib/membership/organ-checkout-summary";

describe("organ checkout summary", () => {
  it("matches membershipCheckoutPath source query names", () => {
    expect(isOrganCheckoutSource("fatty_liver")).toBe(true);
    expect(isOrganCheckoutSource("heart_health")).toBe(true);
    expect(isOrganCheckoutSource("kidney_health")).toBe(true);
    expect(getOrganCheckoutSummary(null)).toBeNull();
    expect(getOrganCheckoutSummary("weight_management")).toBeNull();
  });

  it("keeps liver, heart, and kidney copy parallel", () => {
    const liver = getOrganCheckoutSummary("fatty_liver")!;
    const heart = getOrganCheckoutSummary("heart_health")!;
    const kidney = getOrganCheckoutSummary("kidney_health")!;

    expect(liver.cardTitle).toBe("Check your liver in 4 simple steps");
    expect(heart.cardTitle).toBe("Check your heart in 4 simple steps");
    expect(kidney.cardTitle).toBe("Check your kidneys in 4 simple steps");

    expect(liver.headline).toBe("Your liver blood test + doctor review");
    expect(heart.headline).toBe("Your heart blood test + doctor review");
    expect(kidney.headline).toBe("Your kidney blood test + doctor review");

    expect(liver.formBadge).toBe("Liver health check");
    expect(heart.formBadge).toBe("Heart health check");
    expect(kidney.formBadge).toBe("Kidney health check");
    expect(liver.formHeadline).toBe("Step 1: Create your account");
    expect(heart.formHeadline).toBe(liver.formHeadline);
    expect(kidney.formHeadline).toBe(liver.formHeadline);

    expect(liver.steps.slice(0, 3)).toEqual(heart.steps.slice(0, 3));
    expect(liver.steps[3]).toContain("liver care dashboard");
    expect(heart.steps[3]).toContain("heart care dashboard");
    expect(kidney.steps[3]).toContain("kidney care dashboard");

    expect(liver.included).toContain("ALT, AST, GGT");
    expect(heart.included).toContain("LDL, HDL, triglycerides, total cholesterol, hs-CRP, HbA1c, ApoB");
    expect(kidney.included).toContain("eGFR, creatinine, uACR, BUN, HbA1c, insulin, electrolytes");
  });

  it("uses only organ-specific photos plus app and biomarker screens", () => {
    const liver = getOrganCheckoutSummary("fatty_liver")!;
    const heart = getOrganCheckoutSummary("heart_health")!;
    const kidney = getOrganCheckoutSummary("kidney_health")!;

    expect(liver.marquee.some((item) => item.src.includes("organ-slider/liver.webp"))).toBe(true);
    expect(heart.marquee.some((item) => item.src.includes("organ-slider/heart.webp"))).toBe(true);
    expect(kidney.marquee.some((item) => item.src.includes("organ-slider/kidney.webp"))).toBe(true);

    for (const summary of [liver, heart, kidney]) {
      expect(summary.marquee.some((item) => item.src.includes("app-insights.webp"))).toBe(true);
      expect(summary.marquee.some((item) => item.src.includes("biomarker-vial.webp"))).toBe(true);
    }

    expect(liver.marquee.some((item) => item.src.includes("heart.webp"))).toBe(false);
    expect(liver.marquee.some((item) => item.src.includes("kidney.webp"))).toBe(false);
    expect(heart.marquee.some((item) => item.src.includes("liver.webp"))).toBe(false);
    expect(heart.marquee.some((item) => item.src.includes("kidney.webp"))).toBe(false);
    expect(kidney.marquee.some((item) => item.src.includes("liver.webp"))).toBe(false);
    expect(kidney.marquee.some((item) => item.src.includes("heart.webp"))).toBe(false);
  });
});
