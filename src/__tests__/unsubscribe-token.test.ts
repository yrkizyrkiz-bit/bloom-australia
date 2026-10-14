import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildUnsubscribeUrl,
  createUnsubscribeToken,
  verifyUnsubscribeToken,
} from "@/lib/email/unsubscribe-token";

describe("unsubscribe token", () => {
  beforeEach(() => {
    vi.stubEnv("NEXTAUTH_SECRET", "test-secret-for-unsubscribe");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("round-trips a user id through a signed token", () => {
    const token = createUnsubscribeToken("user_abc123");
    expect(token).not.toContain("user_abc123");
    expect(verifyUnsubscribeToken(token)).toBe("user_abc123");
  });

  it("rejects forged or truncated tokens", () => {
    const token = createUnsubscribeToken("user_abc123");
    expect(verifyUnsubscribeToken(token.slice(0, -2) + "aa")).toBeNull();
    expect(verifyUnsubscribeToken("not-a-token")).toBeNull();
    expect(verifyUnsubscribeToken("user_abc123")).toBeNull();
  });

  it("builds an unsubscribe URL with an encoded signed token", () => {
    const url = buildUnsubscribeUrl("https://sanative.com.au", "user_1");
    const parsed = new URL(url);
    expect(parsed.pathname).toBe("/api/email/unsubscribe");
    const token = parsed.searchParams.get("token");
    expect(token).toBeTruthy();
    expect(verifyUnsubscribeToken(token!)).toBe("user_1");
  });
});
