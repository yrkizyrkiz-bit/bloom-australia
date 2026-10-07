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
});
