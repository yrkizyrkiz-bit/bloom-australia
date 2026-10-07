import { describe, expect, it } from "vitest";
import { memberCareSupportInboxUrl } from "@/lib/care-support/member-inbox-url";

describe("memberCareSupportInboxUrl", () => {
  it("routes by gender and tier", () => {
    expect(memberCareSupportInboxUrl({ gender: "female" })).toBe(
      "/dashboard/womens-health/care"
    );
    expect(memberCareSupportInboxUrl({ subscriptionTier: "weight_management" })).toBe(
      "/dashboard/weight-management/support"
    );
    expect(memberCareSupportInboxUrl({ gender: "male" })).toBe(
      "/dashboard/mens-health/support"
    );
  });

  it("prefers weight entitlement over female gender (avoids programs redirect)", () => {
    expect(
      memberCareSupportInboxUrl({
        gender: "female",
        subscriptionTier: "weight_management",
      })
    ).toBe("/dashboard/weight-management/support");
    expect(
      memberCareSupportInboxUrl({
        gender: "female",
        programKeys: ["WEIGHT_MANAGEMENT"],
      })
    ).toBe("/dashboard/weight-management/support");
  });

  it("appends thread and chat query params", () => {
    expect(
      memberCareSupportInboxUrl({ gender: "male" }, { threadId: "abc" })
    ).toBe("/dashboard/mens-health/support?thread=abc");
    expect(
      memberCareSupportInboxUrl({ gender: "female" }, { openChat: true })
    ).toBe("/dashboard/womens-health/care?chat=1");
  });
});
