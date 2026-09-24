import { sign, verify, type SignOptions } from "jsonwebtoken";
import { getAuthJwtSecret } from "@/lib/security/jwt-secret";

type TokenTtl = NonNullable<SignOptions["expiresIn"]>;

export interface MagicLinkPayload {
  userId: string;
  email: string;
  purpose: string;
}

/** Lifetime of a magic link delivered by email. */
export const MAGIC_LINK_EMAIL_TTL: TokenTtl = "7d";
/** Lifetime of a magic link handed straight back to the browser that just paid. */
export const MAGIC_LINK_BROWSER_TTL: TokenTtl = "24h";

/** Must match everywhere tokens are signed and verified. */
export function getMagicLinkSecret(): string {
  return process.env.MAGIC_LINK_SECRET || getAuthJwtSecret();
}

export function signMagicLoginToken(
  userId: string,
  email: string,
  expiresIn: TokenTtl = MAGIC_LINK_EMAIL_TTL
): string {
  return sign(
    { userId, email, purpose: "magic_login" },
    getMagicLinkSecret(),
    { expiresIn }
  );
}

export function verifyMagicLoginToken(token: string): MagicLinkPayload {
  return verify(token, getMagicLinkSecret()) as MagicLinkPayload;
}
