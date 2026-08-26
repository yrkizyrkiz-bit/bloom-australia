import { describe, it, expect } from "vitest";
import {
  getPublicConsultProgram,
  normalizeCheckoutProgramSlug,
  resolvePublicConsultProgramFromBookingNotes,
  resolvePublicConsultProgramFromContext,
  resolvePublicConsultProgramFromPaymentMetadata,
  resolveWomensHealthCanonicalKey,
} from "@/lib/funnel/public-consult-programs";

describe("public consult program resolution", () => {
  it("prefers booking notes over subscription tier", () => {
    const program = resolvePublicConsultProgramFromContext({
      subscriptionTier: "weight_management",
      bookingNotes: "Men's Health Program - Doctor to be assigned during triage",
    });
    expect(program.slug).toBe("mens_health");
  });

  it("matches curly apostrophe in booking notes", () => {
    const program = resolvePublicConsultProgramFromBookingNotes(
      "Men\u2019s Health Program - triage"
    );
    expect(program?.slug).toBe("mens_health");
  });

  it("falls back to Stripe metadata when notes are generic", () => {
    const program = resolvePublicConsultProgramFromContext({
      subscriptionTier: "weight_management",
      bookingNotes: "Doctor to be assigned during triage by care partner",
      paymentMetadata: {
        program: "mens_health",
        type: "mens_health_plan",
        selectedPlan: "mens_health",
      },
    });
    expect(program.slug).toBe("mens_health");
  });

  it("normalizes checkout program slugs from metadata type", () => {
    expect(normalizeCheckoutProgramSlug("mens_health_plan")).toBe("mens_health");
    expect(
      resolvePublicConsultProgramFromPaymentMetadata({
        type: "mens_health_plan",
      })?.slug
    ).toBe("mens_health");
  });

  it("uses subscription tier when notes and metadata are absent", () => {
    const program = resolvePublicConsultProgramFromContext({
      subscriptionTier: "mens_health",
    });
    expect(program.slug).toBe("mens_health");
    expect(getPublicConsultProgram("mens_health").firstMonthAud).toBe(49);
  });
});

describe("resolveWomensHealthCanonicalKey", () => {
  it("maps vitality categories to WOMENS_HEALTH_VITALITY", () => {
    for (const category of ["menopause", "hrt", "contraception", "fertility"] as const) {
      expect(resolveWomensHealthCanonicalKey(category)).toBe("WOMENS_HEALTH_VITALITY");
    }
  });

  it("maps sexual to WOMENS_HEALTH_SEXUAL", () => {
    expect(resolveWomensHealthCanonicalKey("sexual")).toBe("WOMENS_HEALTH_SEXUAL");
  });

  it("maps unsure and unknown to null", () => {
    expect(resolveWomensHealthCanonicalKey("unsure")).toBeNull();
    expect(resolveWomensHealthCanonicalKey("general")).toBeNull();
    expect(resolveWomensHealthCanonicalKey("")).toBeNull();
  });

  it("does not use concerns to reroute (category-only signature)", () => {
    // Fertility + sexual-sounding concerns still Vitality, reproductive, not Sexual SKU.
    expect(resolveWomensHealthCanonicalKey("fertility")).toBe("WOMENS_HEALTH_VITALITY");
    expect(resolveWomensHealthCanonicalKey("contraception")).toBe("WOMENS_HEALTH_VITALITY");
    expect(resolveWomensHealthCanonicalKey("menopause")).toBe("WOMENS_HEALTH_VITALITY");
    // Only the sexual category yields Sexual Health.
    expect(resolveWomensHealthCanonicalKey("sexual")).toBe("WOMENS_HEALTH_SEXUAL");
  });
});

describe("women's assessment panel resolution (step 13)", () => {
  it("resolves advanced panel for every women's category including unsure", async () => {
    const { resolveRequiredPanelTier } = await import(
      "@/lib/biomarkers/program-panel-requirements"
    );
    const { publicTierToBillingTier } = await import(
      "@/lib/biomarkers/public-checkout-tier-map"
    );

    const categories = [
      "menopause",
      "hrt",
      "contraception",
      "fertility",
      "sexual",
      "unsure",
    ] as const;

    for (const category of categories) {
      const program = resolveWomensHealthCanonicalKey(category);
      const tier = resolveRequiredPanelTier(program);
      expect(tier).toBe("advanced");
      expect(publicTierToBillingTier(tier)).toBe("extended");
    }
  });
});
