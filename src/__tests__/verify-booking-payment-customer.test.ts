import { describe, it, expect } from "vitest";
import { paymentMetadataMatchesSelectedPlan } from "@/lib/stripe/plan-pricing";
import {
  normalizeCheckoutProgramSlug,
  resolvePublicConsultProgramFromContext,
} from "@/lib/funnel/public-consult-programs";

describe("TomTom mens health payment verification context", () => {
  const tomMetadata = {
    bookingHoldId: "cmqp26sql0015sgyih25ggnst",
    program: "mens_health",
    type: "mens_health_plan",
    selectedPlan: "core",
    planId: "core",
    userId: "cmqp26h44000nsgyilw043gor",
  };

  it("resolves mens health from booking notes", () => {
    const program = resolvePublicConsultProgramFromContext({
      subscriptionTier: "mens_health",
      bookingNotes:
        "Men's Health Program - Doctor to be assigned during triage by care partner",
      paymentMetadata: tomMetadata,
    });
    expect(program.slug).toBe("mens_health");
    expect(program.isWeightManagement).toBe(false);
  });

  it("matches program slug from legacy core plan metadata", () => {
    const metaProgram = normalizeCheckoutProgramSlug(
      tomMetadata.program || tomMetadata.type || ""
    );
    expect(metaProgram).toBe("mens_health");
  });

  it("does not treat mens_health core metadata as WM precision mismatch", () => {
    expect(paymentMetadataMatchesSelectedPlan(tomMetadata, "CORE")).toBe(true);
  });
});
