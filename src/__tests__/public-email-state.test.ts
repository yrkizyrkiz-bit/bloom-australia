import { describe, expect, it } from "vitest";
import {
  classifyPublicEmailAccount,
  emailGateAction,
} from "@/lib/funnel/public-email-state";

describe("classifyPublicEmailAccount", () => {
  it("is new when nobody has this email", () => {
    expect(classifyPublicEmailAccount(null)).toBe("new");
    expect(classifyPublicEmailAccount(undefined)).toBe("new");
  });

  it("is unfinished for a potential member who never paid", () => {
    expect(
      classifyPublicEmailAccount({
        passwordHash: null,
        subscriptionStatus: "INACTIVE",
        journeyStatus: "LEAD",
        memberStatus: "POTENTIAL_MEMBER",
      })
    ).toBe("unfinished");
    expect(
      classifyPublicEmailAccount({
        passwordHash: null,
        subscriptionStatus: "TRIAL",
        journeyStatus: "SURVEY_COMPLETED",
        memberStatus: "POTENTIAL_MEMBER",
      })
    ).toBe("unfinished");
  });

  it("is member for password, active subscription, paid journey, or MEMBER status", () => {
    expect(classifyPublicEmailAccount({ passwordHash: "hash" })).toBe("member");
    expect(classifyPublicEmailAccount({ subscriptionStatus: "ACTIVE" })).toBe("member");
    expect(classifyPublicEmailAccount({ journeyStatus: "CONSULTATION_PAID" })).toBe("member");
    expect(classifyPublicEmailAccount({ memberStatus: "MEMBER" })).toBe("member");
  });
});

describe("emailGateAction", () => {
  it("continues a new email and resumes an unfinished one", () => {
    expect(emailGateAction({ state: "new" })).toBe("continue");
    expect(emailGateAction({ state: "unfinished" })).toBe("resume");
    expect(emailGateAction({ state: "member" })).toBe("member");
  });

  it("treats a legacy exists flag as a member so names are not inferred", () => {
    expect(emailGateAction({ exists: true })).toBe("member");
    expect(emailGateAction({})).toBe("continue");
    expect(emailGateAction(null)).toBe("continue");
  });
});
