import { describe, expect, it } from "vitest";
import { signMagicLoginToken, verifyMagicLoginToken } from "@/lib/magic-link";
import { signWebAuthnLoginToken, verifyWebAuthnLoginToken } from "@/lib/webauthn/tokens";

describe("webauthn login tokens", () => {
  it("signs and verifies a Face ID token", () => {
    const token = signWebAuthnLoginToken("user-1", "red@sanative.com");
    const payload = verifyWebAuthnLoginToken(token);
    expect(payload.userId).toBe("user-1");
    expect(payload.email).toBe("red@sanative.com");
    expect(payload.purpose).toBe("webauthn_login");
  });

  it("rejects a magic-link token as a Face ID token", () => {
    const token = signMagicLoginToken("user-1", "red@sanative.com");
    expect(() => verifyWebAuthnLoginToken(token)).toThrow(/Invalid Face ID token/);
  });

  it("still verifies magic-link tokens independently", () => {
    const token = signMagicLoginToken("user-1", "red@sanative.com");
    expect(verifyMagicLoginToken(token).purpose).toBe("magic_login");
  });
});
