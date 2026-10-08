import { describe, it, expect } from "vitest";
import { consultationConfirmationCopy } from "@/lib/funnel/clinical-program-funnel";
import { resolvePublicConsultProgramFromContext } from "@/lib/funnel/public-consult-programs";
import { buildPortalActivationMagicLink } from "@/lib/portal-context";

describe("consultationConfirmationCopy", () => {
  it("uses Women's Health copy and dashboard for a women's health membership PI", () => {
    const program = resolvePublicConsultProgramFromContext({
      subscriptionTier: "weight_management",
      bookingNotes: "Sanative Membership consultation",
      paymentMetadata: {
        purchaseType: "sanative_membership",
        intentProgram: "womens_health_sexual",
        source: "womens_health_assessment",
      },
    });
    const copy = consultationConfirmationCopy({
      slug: program.slug,
      label: program.label,
      intentProgram: "womens_health_sexual",
    });

    expect(program.slug).toBe("womens_health");
    expect(copy.consultationName).toBe("Women's Health");
    expect(copy.portalPath).toBe("/dashboard/womens-health?onboarding=post-checkout");
    expect(copy.programHomePhrase).toBe("women's health program home");
  });

  it("keeps Weight Management copy for the WM funnel", () => {
    const copy = consultationConfirmationCopy({
      slug: "weight_management",
      label: "Weight Management",
      intentProgram: "weight_management",
    });
    expect(copy.consultationName).toBe("Weight Management");
    expect(copy.portalPath).toBe("/dashboard/weight-management?onboarding=post-checkout");
    expect(copy.programHomePhrase).toBe("weight program home");
  });

  it("appends the program home onto the portal activation link", () => {
    const link = buildPortalActivationMagicLink(
      "https://sanative.com.au/auth/magic?token=abc",
      "/dashboard/womens-health?onboarding=post-checkout"
    );
    expect(link).toContain(
      encodeURIComponent("/dashboard/womens-health?onboarding=post-checkout")
    );
    expect(link).not.toContain("weight-management");
  });
});
