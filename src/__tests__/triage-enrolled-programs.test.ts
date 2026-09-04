import { describe, expect, it } from "vitest";
import {
  collectEnrolledPrograms,
  enrolledProgramLabel,
} from "@/lib/triage/enrolled-programs";

describe("collectEnrolledPrograms", () => {
  it("returns active and pending program members with distinctive labels", () => {
    expect(
      collectEnrolledPrograms([
        { program: "MENS_HEALTH_SEXUAL", membershipStatus: "ACTIVE" },
        { program: "HAIR_LOSS", membershipStatus: "PENDING" },
        { program: "WEIGHT_MANAGEMENT", membershipStatus: "CANCELLED" },
      ])
    ).toEqual([
      { key: "MENS_HEALTH_SEXUAL", label: "Men's Sexual Health", status: "ACTIVE" },
      { key: "HAIR_LOSS", label: "Hair", status: "PENDING" },
    ]);
  });

  it("uses subscription tier when there are no enrolled program members", () => {
    expect(collectEnrolledPrograms([], "womens_health")).toEqual([
      { key: "WOMENS_HEALTH_VITALITY", label: "Women's Vitality", status: "ACTIVE" },
    ]);
  });

  it("unions subscription tier with enrolled program members", () => {
    expect(
      collectEnrolledPrograms(
        [{ program: "HAIR_LOSS", membershipStatus: "ACTIVE" }],
        "weight_management"
      )
    ).toEqual([
      { key: "HAIR_LOSS", label: "Hair", status: "ACTIVE" },
      { key: "WEIGHT_MANAGEMENT", label: "Weight Management", status: "ACTIVE" },
    ]);
  });

  it("deduplicates by canonical program key", () => {
    expect(
      collectEnrolledPrograms([
        { program: "mens_health", membershipStatus: "ACTIVE" },
        { program: "MENS_HEALTH_VITALITY", membershipStatus: "PENDING" },
      ])
    ).toEqual([
      { key: "MENS_HEALTH_VITALITY", label: "Men's Vitality", status: "ACTIVE" },
    ]);
  });
});

describe("enrolledProgramLabel", () => {
  it("disambiguates men's and women's vitality vs sexual health", () => {
    expect(enrolledProgramLabel("MENS_HEALTH_SEXUAL")).toBe("Men's Sexual Health");
    expect(enrolledProgramLabel("WOMENS_HEALTH_VITALITY")).toBe("Women's Vitality");
  });
});
