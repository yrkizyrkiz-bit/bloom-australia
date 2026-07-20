import { describe, it, expect } from "vitest";
import {
  resolveBiomarkersPreTriageProgram,
  resolvePreTriageProgramForBooking,
} from "@/lib/funnel/program-pre-triage";

describe("pre-triage program resolution", () => {
  it("labels biomarkers consult bookings from public panel tier metadata", () => {
    const program = resolvePreTriageProgramForBooking({
      subscriptionTier: "weight_management",
      bookingNotes: "Biomarkers Panel - Doctor to be assigned during triage by care partner",
      paymentMetadata: {
        source: "public_biomarkers",
        publicPanelTier: "complete",
        panelTier: "comprehensive",
      },
    });

    expect(program.slug).toBe("biomarkers");
    expect(program.label).toBe("Complete Biomarkers");
    expect(program.isWeightManagement).toBe(false);
    expect(program.programKey).toBe("BIOLOGICAL_CLOCK");
    expect(program.panelTier).toBe("comprehensive");
  });

  it("does not fall back to weight management when booking notes are biomarkers", () => {
    const program = resolvePreTriageProgramForBooking({
      subscriptionTier: "weight_management",
      bookingNotes: "Biomarkers Panel - triage",
    });

    expect(program.slug).toBe("biomarkers");
    expect(program.label).toBe("Biomarkers Panel");
    expect(program.isWeightManagement).toBe(false);
  });

  it("resolves billing panel tier when public tier metadata is absent", () => {
    const program = resolveBiomarkersPreTriageProgram({
      source: "portal_biomarkers",
      panelTier: "extended",
    });

    expect(program.label).toBe("Advanced Biomarkers");
    expect(program.panelTier).toBe("extended");
  });

  it("still resolves legacy public consult programs from booking notes", () => {
    const program = resolvePreTriageProgramForBooking({
      subscriptionTier: "weight_management",
      bookingNotes: "Weight Management Program - Doctor to be assigned during triage",
    });

    expect(program.slug).toBe("weight_management");
    expect(program.label).toBe("Weight Management");
    expect(program.isWeightManagement).toBe(true);
  });

  it("resolves hair Advanced funnel as Hair Loss even when biomarkers payment metadata is present", () => {
    const program = resolvePreTriageProgramForBooking({
      subscriptionTier: "hair_loss",
      bookingNotes: "Hair Loss Program - Doctor to be assigned during triage by care partner",
      paymentMetadata: {
        source: "public_biomarkers",
        sourceProgram: "hair_loss",
        publicPanelTier: "advanced",
        panelTier: "extended",
      },
    });

    expect(program.slug).toBe("hair_loss");
    expect(program.label).toBe("Hair Loss");
    expect(program.programKey).toBe("HAIR_LOSS");
    expect(program.isWeightManagement).toBe(false);
  });

  it("resolves women's Advanced funnel as Women's Health, not Biomarkers", () => {
    const program = resolvePreTriageProgramForBooking({
      subscriptionTier: "womens_health",
      bookingNotes: "Women's Health Program - Doctor to be assigned during triage by care partner",
      paymentMetadata: {
        source: "public_biomarkers",
        sourceProgram: "womens_health",
        publicPanelTier: "advanced",
        panelTier: "extended",
      },
    });

    expect(program.slug).toBe("womens_health");
    expect(program.label).toBe("Women's Health");
    expect(program.programKey).toBe("WOMENS_HEALTH_VITALITY");
    expect(program.isWeightManagement).toBe(false);
  });
});
