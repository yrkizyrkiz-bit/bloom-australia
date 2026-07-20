import { describe, expect, it, vi, beforeEach } from "vitest";
import { sign } from "jsonwebtoken";

describe("verifyResumeVerificationToken", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.NEXTAUTH_SECRET = "test-secret";
  });

  it("accepts a valid verified email token for the same address", async () => {
    const { verifyResumeVerificationToken } = await import(
      "@/lib/funnel/resume-verification-token"
    );
    const token = sign(
      {
        contact: "zico@example.com",
        type: "email",
        verified: true,
        userId: "user-123",
      },
      "test-secret",
      { expiresIn: "1h" }
    );

    expect(verifyResumeVerificationToken(token, "zico@example.com")).toEqual({
      valid: true,
      userId: "user-123",
    });
  });

  it("rejects tokens for a different email", async () => {
    const { verifyResumeVerificationToken } = await import(
      "@/lib/funnel/resume-verification-token"
    );
    const token = sign(
      {
        contact: "other@example.com",
        type: "email",
        verified: true,
        userId: "user-123",
      },
      "test-secret",
      { expiresIn: "1h" }
    );

    expect(verifyResumeVerificationToken(token, "zico@example.com")).toEqual({
      valid: false,
    });
  });
});
