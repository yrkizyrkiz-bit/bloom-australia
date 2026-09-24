/**
 * Single source for the secret that signs first-party JWTs (checkout session
 * tokens, magic links, Face ID tokens, NextAuth sessions).
 *
 * Production never falls back to a built-in value: a missing secret throws, so
 * a misconfigured deploy refuses to mint or accept tokens instead of accepting
 * tokens anyone could forge.
 */
const DEV_ONLY_SECRET = "dev-nextauth-secret-not-for-production";

export function isProductionRuntime(): boolean {
  return process.env.NODE_ENV === "production";
}

export function getAuthJwtSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
  if (secret) return secret;
  if (!isProductionRuntime()) return DEV_ONLY_SECRET;
  throw new Error("NEXTAUTH_SECRET is not configured");
}
