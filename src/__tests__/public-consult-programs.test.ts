import { describe, it, expect } from "vitest";
import {
  getPublicConsultProgram,
  normalizeCheckoutProgramSlug,
  resolvePublicConsultProgramFromBookingNotes,
  resolvePublicConsultProgramFromContext,
  resolvePublicConsultProgramFromPaymentMetadata,
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
