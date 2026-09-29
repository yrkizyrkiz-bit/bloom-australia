import { describe, expect, it } from "vitest";
import {
  bookingMatchesProgram,
  computeAwaitingConsultationArrangement,
  parsePortalUpsellProgramKey,
  programKeyToConsultSlug,
} from "@/lib/portal/awaiting-consultation";

const hairUpsellNotes = JSON.stringify({
  source: "portal_upsell",
  programKey: "HAIR_LOSS",
  paymentIntentId: "pi_test",
});

describe("awaiting consultation arrangement", () => {
  it("maps program keys to consult note families", () => {
    expect(programKeyToConsultSlug("HAIR_LOSS")).toBe("hair_loss");
    expect(programKeyToConsultSlug("WEIGHT_MANAGEMENT")).toBe("weight_management");
    expect(programKeyToConsultSlug("MENS_HEALTH_SEXUAL")).toBe("mens_health");
    expect(programKeyToConsultSlug("WOMENS_HEALTH_VITALITY")).toBe("womens_health");
  });

  it("parses portal_upsell programKey from PreTriage notes", () => {
    expect(parsePortalUpsellProgramKey(hairUpsellNotes)).toBe("HAIR_LOSS");
    expect(parsePortalUpsellProgramKey("not-json")).toBeNull();
    expect(
      parsePortalUpsellProgramKey(JSON.stringify({ source: "portal_biomarkers" }))
    ).toBeNull();
  });

  it("matches bookings by program notes", () => {
    expect(
      bookingMatchesProgram(
        "Weight Management Program - Doctor to be assigned during triage by care partner",
        "WEIGHT_MANAGEMENT"
      )
    ).toBe(true);
    expect(
      bookingMatchesProgram(
        "Weight Management Program - Doctor to be assigned during triage by care partner",
        "HAIR_LOSS"
      )
    ).toBe(false);
    expect(bookingMatchesProgram("Hair Loss Program - Booked via care partner", "HAIR_LOSS")).toBe(
      true
    );
  });

  it("shows banner for hair portal upsell even with an open weight booking (Luna case)", () => {
    expect(
      computeAwaitingConsultationArrangement({
        pendingPortalUpsells: [{ notes: hairUpsellNotes }],
        openBookings: [
          {
            notes:
              "Weight Management Program - Doctor to be assigned during triage by care partner",
          },
        ],
      })
    ).toBe(true);
  });

  it("clears banner when the upsold program already has an open booking", () => {
    expect(
      computeAwaitingConsultationArrangement({
        pendingPortalUpsells: [{ notes: hairUpsellNotes }],
        openBookings: [{ notes: "Hair Loss Program - Booked via care partner" }],
      })
    ).toBe(false);
  });

  it("stays false with no pending portal upsells", () => {
    expect(
      computeAwaitingConsultationArrangement({
        pendingPortalUpsells: [],
        openBookings: [],
      })
    ).toBe(false);
  });
});
