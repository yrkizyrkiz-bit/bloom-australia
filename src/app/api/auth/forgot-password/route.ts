import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { RATE_LIMITS, rateLimitBucketKey } from "@/lib/security/rate-limit-config";
import {
  enforceDbRateLimits,
  enforceIpRateLimit,
  rateLimitExceededResponse,
} from "@/lib/security/rate-limit-http";
import {
  PASSWORD_RESET_TTL_MS,
  createPasswordResetToken,
  findResetAccount,
} from "@/lib/auth/password-reset";
import { sendPasswordResetEmail } from "@/lib/email";
import { resolveAppBaseUrl } from "@/lib/app-base-url";

const GENERIC_RESPONSE = {
  success: true,
  message: "If an account exists with this email, a password reset link will be sent.",
};

export async function POST(request: NextRequest) {
  try {
    const ipLimited = await enforceIpRateLimit(
      request,
      "forgot-password:ip",
      RATE_LIMITS.forgotPasswordIp
    );
    if (!ipLimited.allowed) {
      return rateLimitExceededResponse(ipLimited.retryAfterSec);
    }

    const body = await request.json().catch(() => ({}));
    const email = typeof body?.email === "string" ? body.email : "";
    const clientOrigin = typeof body?.clientOrigin === "string" ? body.clientOrigin : undefined;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const emailLimited = await enforceDbRateLimits([
      {
        bucketKey: rateLimitBucketKey("forgot-password:email", normalizedEmail),
        config: RATE_LIMITS.forgotPasswordEmail,
      },
    ]);
    if (!emailLimited.allowed) {
      return rateLimitExceededResponse(emailLimited.retryAfterSec);
    }

    // The response is identical whether or not an account exists, and whether
    // or not the email could be delivered, so this endpoint can't be used to
    // enumerate accounts.
    const account = await findResetAccount(normalizedEmail);
    if (!account) {
      return NextResponse.json(GENERIC_RESPONSE);
    }

    const token = await createPasswordResetToken(account.email);
    const baseUrl = resolveAppBaseUrl({ clientOrigin, request });
    const resetLink = `${baseUrl}/reset-password?token=${encodeURIComponent(token)}`;

    const sent = await sendPasswordResetEmail({
      to: account.email,
      firstName: account.firstName,
      resetLink,
      expiresInMinutes: Math.round(PASSWORD_RESET_TTL_MS / 60000),
    });
    if (!sent.success) {
      console.error("[forgot-password] reset email failed:", sent.error);
    }

    await prisma.activityLog
      .create({
        data: {
          userId: account.kind === "user" ? account.id : null,
          action: "PASSWORD_RESET_REQUESTED",
          entity: account.kind,
          entityId: account.id,
          details: {
            email: account.email,
            requestedAt: new Date().toISOString(),
            emailSent: sent.success,
          },
        },
      })
      .catch((err) => console.error("[forgot-password] activity log failed:", err));

    return NextResponse.json(GENERIC_RESPONSE);
  } catch (error) {
    console.error("Password reset error:", error);
    return NextResponse.json(
      { error: "An error occurred while processing your request" },
      { status: 500 }
    );
  }
}
