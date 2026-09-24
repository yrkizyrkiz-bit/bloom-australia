import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { verifyMagicLoginToken } from "@/lib/magic-link";
import { verifyVerifiedContactToken } from "@/lib/auth/verified-contact-token";
import { RATE_LIMITS } from "@/lib/security/rate-limit-config";
import {
  enforceIpRateLimit,
  rateLimitExceededResponse,
} from "@/lib/security/rate-limit-http";

type Body = {
  userId?: string;
  password?: string;
  magicToken?: string;
  sessionToken?: string;
};

/**
 * Work out whose password this request may set. The body's userId is never
 * trusted on its own; the caller must present one of:
 *  - a magic login token for that account (welcome step / magic page),
 *  - a verified-contact token from /api/auth/verify-code that names that account,
 *  - a signed-in session for that account.
 */
async function resolveAuthorisedUserId(
  body: Body
): Promise<{ userId: string; via: string } | null> {
  if (body.magicToken) {
    try {
      const payload = verifyMagicLoginToken(body.magicToken);
      if (payload.purpose === "magic_login" && payload.userId) {
        return { userId: payload.userId, via: "magic_link" };
      }
    } catch {
      // fall through to the other proofs
    }
  }

  const contact = verifyVerifiedContactToken(body.sessionToken);
  if (contact?.userId) {
    return { userId: contact.userId, via: "verified_contact" };
  }

  const session = await getServerSession(authOptions);
  if (session?.user?.id) {
    return { userId: session.user.id, via: "session" };
  }

  return null;
}

export async function POST(req: NextRequest) {
  try {
    const ipLimited = await enforceIpRateLimit(
      req,
      "set-password:ip",
      RATE_LIMITS.forgotPasswordIp
    );
    if (!ipLimited.allowed) {
      return rateLimitExceededResponse(ipLimited.retryAfterSec);
    }

    const body = (await req.json().catch(() => ({}))) as Body;
    const { password } = body;

    if (!password || typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const authorised = await resolveAuthorisedUserId(body);
    if (!authorised) {
      return NextResponse.json(
        { error: "Please use the link we emailed you to set your password." },
        { status: 401 }
      );
    }

    if (body.userId && body.userId !== authorised.userId) {
      return NextResponse.json({ error: "Not allowed" }, { status: 403 });
    }
    const userId = authorised.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        passwordHash: hashedPassword, // Keep both for compatibility
      },
    });

    await prisma.automationLog.create({
      data: {
        userId:        user.id,
        automationType: "password_set",
        triggerEvent:  `${authorised.via}_password_set`,
        channel:       "portal",
        status:        "completed",
      }
    }).catch(console.error);

    return NextResponse.json({ success: true, email: user.email });

  } catch (error: unknown) {
    console.error("Set password error:", error);
    return NextResponse.json(
      { error: "Failed to set password" },
      { status: 500 }
    );
  }
}
