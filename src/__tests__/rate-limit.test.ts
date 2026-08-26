import { describe, it, expect } from "vitest";
import { rateLimitBucketKey, RATE_LIMITS } from "@/lib/security/rate-limit-config";

describe("Rate limit config", () => {
  it("builds stable bucket keys", () => {
    expect(rateLimitBucketKey("send-verification:contact", "User@Example.com")).toBe(
      "send-verification:contact:user@example.com"
    );
    expect(rateLimitBucketKey("verify-code:ip", " 1.2.3.4 ")).toBe(
      "verify-code:ip:1.2.3.4"
    );
  });

  it("defines auth and checkout limits", () => {
    expect(RATE_LIMITS.sendVerificationContact.limit).toBeGreaterThan(0);
    expect(RATE_LIMITS.authLoginIp.windowSec).toBe(15 * 60);
    expect(RATE_LIMITS.checkoutIp.limit).toBe(20);
    expect(RATE_LIMITS.addressSuggestIp.limit).toBeGreaterThan(0);
    expect(RATE_LIMITS.addressDetailsIp.windowSec).toBe(60);
  });
});
