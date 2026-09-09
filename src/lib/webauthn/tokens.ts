import { sign, verify } from "jsonwebtoken";
import { getMagicLinkSecret } from "@/lib/magic-link";

export type WebAuthnLoginPayload = {
  userId: string;
  email: string;
  purpose: "webauthn_login";
};

export function signWebAuthnLoginToken(userId: string, email: string): string {
  return sign(
    { userId, email, purpose: "webauthn_login" },
    getMagicLinkSecret(),
    { expiresIn: "2m" }
  );
}

export function verifyWebAuthnLoginToken(token: string): WebAuthnLoginPayload {
  const payload = verify(token, getMagicLinkSecret()) as WebAuthnLoginPayload;
  if (payload.purpose !== "webauthn_login" || !payload.userId || !payload.email) {
    throw new Error("Invalid Face ID token");
  }
  return payload;
}
