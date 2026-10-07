import { describe, expect, it } from "vitest";
import {
  portalProgramBookingNote,
  programDashboardPath,
} from "@/lib/admin/pre-triage-appointment-notify";
import { bookingMatchesProgram } from "@/lib/portal/awaiting-consultation";

describe("portalProgramBookingNote", () => {
  it("stamps notes that program portals can match", () => {
    expect(bookingMatchesProgram(portalProgramBookingNote("HAIR_LOSS"), "HAIR_LOSS")).toBe(
      true
    );
    expect(
      bookingMatchesProgram(portalProgramBookingNote("MENS_HEALTH_SEXUAL"), "MENS_HEALTH_SEXUAL")
    ).toBe(true);
    expect(
      bookingMatchesProgram(
        portalProgramBookingNote("WOMENS_HEALTH_SEXUAL"),
        "WOMENS_HEALTH_SEXUAL"
      )
    ).toBe(true);
    expect(
      bookingMatchesProgram(portalProgramBookingNote("HAIR_LOSS"), "WEIGHT_MANAGEMENT")
    ).toBe(false);
  });

  it("routes members to the right program dashboard", () => {
    expect(programDashboardPath("HAIR_LOSS")).toBe("/dashboard/mens-health/hair-loss");
    expect(programDashboardPath("MENS_HEALTH_SEXUAL")).toBe(
      "/dashboard/mens-health/sexual-health"
    );
    expect(programDashboardPath(null)).toBe("/dashboard");
  });
});
