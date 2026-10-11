import { describe, expect, it } from "vitest";
import { prospectiveResumeAuthorized } from "@/lib/funnel/prospective-resume-auth";

describe("prospectiveResumeAuthorized", () => {
  it("allows the same browser session that already has this user id", () => {
    expect(prospectiveResumeAuthorized({ sameSession: true, tokenValid: false })).toBe(true);
  });

  it("allows a verified email code", () => {
    expect(prospectiveResumeAuthorized({ sameSession: false, tokenValid: true })).toBe(true);
  });

  it("rejects a return visit that only knows the email", () => {
    expect(prospectiveResumeAuthorized({ sameSession: false, tokenValid: false })).toBe(false);
  });
});
