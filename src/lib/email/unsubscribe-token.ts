import { createHmac, timingSafeEqual } from "crypto";

function signingSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("NEXTAUTH_SECRET is required to sign unsubscribe tokens");
  }
  return secret;
}

function signPayload(payload: string): string {
  return createHmac("sha256", signingSecret()).update(payload).digest("base64url");
}

function signaturesMatch(provided: string, expected: string): boolean {
  try {
    const a = Buffer.from(provided);
    const b = Buffer.from(expected);
    if (a.length === 0 || a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/**
 * Opaque unsubscribe token: base64url(userId) + "." + HMAC.
 * Guessing or forging another user's token requires the server secret.
 */
export function createUnsubscribeToken(userId: string): string {
  const payload = Buffer.from(userId, "utf8").toString("base64url");
  return `${payload}.${signPayload(payload)}`;
}

/** Verify token and return the user id, or null if invalid. */
export function verifyUnsubscribeToken(token: string): string | null {
  const trimmed = token.trim();
  if (!trimmed) return null;

  const sep = trimmed.lastIndexOf(".");
  if (sep <= 0 || sep === trimmed.length - 1) return null;

  const payload = trimmed.slice(0, sep);
  const providedSig = trimmed.slice(sep + 1);

  let expectedSig: string;
  try {
    expectedSig = signPayload(payload);
  } catch {
    return null;
  }

  if (!signaturesMatch(providedSig, expectedSig)) {
    return null;
  }

  try {
    const userId = Buffer.from(payload, "base64url").toString("utf8");
    return userId || null;
  } catch {
    return null;
  }
}

export function buildUnsubscribeUrl(baseUrl: string, userId: string): string {
  const token = createUnsubscribeToken(userId);
  return `${baseUrl.replace(/\/$/, "")}/api/email/unsubscribe?token=${encodeURIComponent(token)}`;
}
