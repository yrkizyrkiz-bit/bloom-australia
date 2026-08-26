import { describe, expect, it, afterEach, vi } from "vitest";
import {
  getDevVerificationCode,
  isDevVerificationEnabled,
  matchesDevVerificationCode,
} from "@/lib/auth/dev-verification";

describe("temporary dev verification code", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("is disabled when the env var is missing", () => {
    vi.stubEnv("DEV_VERIFICATION_CODE", "");
    expect(isDevVerificationEnabled()).toBe(false);
    expect(getDevVerificationCode()).toBeNull();
    expect(matchesDevVerificationCode("000000")).toBe(false);
  });

  it("accepts only an exact 6-digit test code", () => {
    vi.stubEnv("DEV_VERIFICATION_CODE", "000000");
    expect(isDevVerificationEnabled()).toBe(true);
    expect(getDevVerificationCode()).toBe("000000");
    expect(matchesDevVerificationCode("000000")).toBe(true);
    expect(matchesDevVerificationCode("123456")).toBe(false);
    expect(matchesDevVerificationCode("00000")).toBe(false);
  });
});
