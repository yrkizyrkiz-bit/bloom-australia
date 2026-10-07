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

  it("does not misclassify Women's Health booking notes as Men's Health", () => {
    expect(
      resolvePublicConsultProgramFromBookingNotes(
        "Women's Health Program - Booked via care partner"
      )?.slug
    ).toBe("womens_health");
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

  it("does not misclassify womens_* tiers as mens (substring trap)", () => {
    expect(
      resolvePublicConsultProgramFromPaymentMetadata({
        intentProgram: "womens_health_sexual",
      })?.slug
    ).toBe("womens_health");
    expect(
      resolvePublicConsultProgramFromPaymentMetadata({
        sourceProgram: "womens_health_vitality",
      })?.slug
    ).toBe("womens_health");
    expect(
      resolvePublicConsultProgramFromContext({
        subscriptionTier: "womens_health_sexual",
      }).slug
    ).toBe("womens_health");
  });

  it("uses subscription tier when notes and metadata are absent", () => {
    const program = resolvePublicConsultProgramFromContext({
      subscriptionTier: "mens_health",
    });
    expect(program.slug).toBe("mens_health");
    expect(getPublicConsultProgram("mens_health").firstMonthAud).toBe(365);
  });
});

describe("resolveWomensHealthCanonicalKey", () => {
  it("maps menopause funnel categories to Women's Wellness", () => {
    for (const category of ["menopause", "hrt", "contraception", "fertility", "sexual"] as const) {
      expect(resolveWomensHealthCanonicalKey(category)).toBe("WOMENS_HEALTH_SEXUAL");
    }
  });

  it("maps explicit vitality / menopause_care to WOMENS_HEALTH_VITALITY", () => {
    expect(resolveWomensHealthCanonicalKey("vitality")).toBe("WOMENS_HEALTH_VITALITY");
    expect(resolveWomensHealthCanonicalKey("menopause_care")).toBe("WOMENS_HEALTH_VITALITY");
  });

  it("maps unsure and unknown to null", () => {
    expect(resolveWomensHealthCanonicalKey("unsure")).toBeNull();
    expect(resolveWomensHealthCanonicalKey("general")).toBeNull();
    expect(resolveWomensHealthCanonicalKey("")).toBeNull();
  });

  it("does not use concerns to reroute (category-only signature)", () => {
    expect(resolveWomensHealthCanonicalKey("fertility")).toBe("WOMENS_HEALTH_SEXUAL");
    expect(resolveWomensHealthCanonicalKey("contraception")).toBe("WOMENS_HEALTH_SEXUAL");
    expect(resolveWomensHealthCanonicalKey("menopause")).toBe("WOMENS_HEALTH_SEXUAL");
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
