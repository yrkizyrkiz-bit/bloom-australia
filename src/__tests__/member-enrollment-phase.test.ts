import { describe, expect, it } from "vitest";
import {
  canDiscoverBillingFromProgramIntake,
  hasPaidMemberJourney,
  isProspectiveEnrollment,
} from "@/lib/funnel/member-enrollment-phase";

describe("member-enrollment-phase", () => {
  it("treats survey completed intake as prospective", () => {
    expect(
      isProspectiveEnrollment({
        memberStatus: "POTENTIAL_MEMBER",
        journeyStatus: "SURVEY_COMPLETED",
      })
    ).toBe(true);
    expect(canDiscoverBillingFromProgramIntake("SURVEY_COMPLETED")).toBe(false);
  });

  it("treats paid journey as billable", () => {
    expect(hasPaidMemberJourney("CONSULTATION_PAID")).toBe(true);
    expect(canDiscoverBillingFromProgramIntake("CONSULTATION_PAID")).toBe(true);
    expect(
      isProspectiveEnrollment({
        memberStatus: "MEMBER",
        journeyStatus: "CONSULTATION_PAID",
      })
    ).toBe(false);
  });
});
