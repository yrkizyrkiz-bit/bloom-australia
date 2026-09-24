import { sign, verify } from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { getAuthJwtSecret } from "@/lib/security/jwt-secret";

/**
 * Short-lived token issued by /api/auth/verify-code once a member proves they
 * control an email address or mobile number. Checkout and password-setting
 * routes trust only what this token says, never the request body.
 */
export type VerifiedContactClaims = {
  contact: string;
  type: "email" | "phone";
  verified: true;
  userId: string | null;
  exp?: number;
};

export function signVerifiedContactToken(input: {
  contact: string;
  type: "email" | "phone";
  userId: string | null;
}): string {
  return sign(
    {
      contact: input.contact,
      type: input.type,
      verified: true,
      userId: input.userId,
      exp: Math.floor(Date.now() / 1000) + 60 * 60,
    },
    getAuthJwtSecret()
  );
}

export function verifyVerifiedContactToken(
  token: string | null | undefined
): VerifiedContactClaims | null {
  if (!token) return null;
  try {
    const payload = verify(token, getAuthJwtSecret()) as Partial<VerifiedContactClaims>;
    if (payload.verified !== true) return null;
    if (payload.type !== "email" && payload.type !== "phone") return null;
    if (typeof payload.contact !== "string" || !payload.contact) return null;
    return {
      contact: payload.contact,
      type: payload.type,
      verified: true,
      userId: typeof payload.userId === "string" && payload.userId ? payload.userId : null,
      exp: payload.exp,
    };
  } catch {
    return null;
  }
}

export type BoundCheckoutIdentity =
  | { ok: true; email: string; userId: string | null }
  | { ok: false; error: string; status: number };

function normaliseEmail(value: string | null | undefined): string {
  return (value || "").toLowerCase().trim();
}

/**
 * Resolve the email a checkout may act on, given a verified-contact token and
 * whatever the browser sent.
 *
 * - Email verified: the email is the verified address. A different body email
 *   is rejected.
 * - Mobile verified for an existing account: the email must be that account's.
 * - Mobile verified with no account on file: the email must not already belong
 *   to someone else, otherwise a stranger could attach a payment to that
 *   account and receive its login link.
 */
export async function bindCheckoutEmail(
  claims: VerifiedContactClaims,
  bodyEmail: string | null | undefined,
  options: {
    /**
     * Account this exact payment already activated on an earlier call. Lets an
     * idempotent retry succeed after the first call created the member.
     */
    activatedUserId?: string | null;
  } = {}
): Promise<BoundCheckoutIdentity> {
  const requested = normaliseEmail(bodyEmail);

  if (claims.type === "email") {
    const verified = normaliseEmail(claims.contact);
    if (requested && requested !== verified) {
      return {
        ok: false,
        status: 400,
        error: "Email must match the address you verified",
      };
    }
    return { ok: true, email: verified, userId: claims.userId };
  }

  if (claims.userId) {
    const account = await prisma.user.findUnique({
      where: { id: claims.userId },
      select: { id: true, email: true },
    });
    if (!account) {
      return { ok: false, status: 401, error: "Invalid or expired session" };
    }
    const accountEmail = normaliseEmail(account.email);
    if (requested && requested !== accountEmail) {
      return {
        ok: false,
        status: 400,
        error: "Email must match the account linked to your verified mobile",
      };
    }
    return { ok: true, email: accountEmail, userId: account.id };
  }

  if (!requested) {
    return { ok: false, status: 400, error: "Email is required" };
  }
  const existing = await prisma.user.findFirst({
    where: { email: { equals: requested, mode: "insensitive" } },
    select: { id: true },
  });
  if (existing && existing.id === options.activatedUserId) {
    return { ok: true, email: requested, userId: existing.id };
  }
  if (existing) {
    return {
      ok: false,
      status: 409,
      error:
        "An account already exists for this email. Please verify with your email address to continue.",
    };
  }
  return { ok: true, email: requested, userId: null };
}
