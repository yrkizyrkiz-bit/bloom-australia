import { sign, verify } from "jsonwebtoken";

export interface MagicLinkPayload {
  userId: string;
  email: string;
  purpose: string;
}

/** Must match everywhere tokens are signed and verified. */
export function getMagicLinkSecret(): string {
  return (
    process.env.MAGIC_LINK_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    "fallback-secret-change-me"
  );
}

export function signMagicLoginToken(userId: string, email: string): string {
  return sign(
    { userId, email, purpose: "magic_login" },
    getMagicLinkSecret(),
    { expiresIn: "7d" }
  );
}

export function verifyMagicLoginToken(token: string): MagicLinkPayload {
  return verify(token, getMagicLinkSecret()) as MagicLinkPayload;
}
