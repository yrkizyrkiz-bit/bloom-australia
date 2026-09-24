import { NextRequest, NextResponse } from "next/server";
import {
  peekPasswordResetToken,
  resetPasswordWithToken,
} from "@/lib/auth/password-reset";
import { RATE_LIMITS } from "@/lib/security/rate-limit-config";
import {
  enforceIpRateLimit,
  rateLimitExceededResponse,
} from "@/lib/security/rate-limit-http";

/** Tell the reset page whether the link it was opened with is still usable. */
export async function GET(request: NextRequest) {
  const ipLimited = await enforceIpRateLimit(
    request,
    "reset-password:ip",
    RATE_LIMITS.forgotPasswordIp
  );
  if (!ipLimited.allowed) {
    return rateLimitExceededResponse(ipLimited.retryAfterSec);
  }

  const token = request.nextUrl.searchParams.get("token");
  const stored = await peekPasswordResetToken(token);
  return NextResponse.json({ valid: Boolean(stored) });
}

/** Set a new password using a token from the reset email. Single use. */
export async function POST(request: NextRequest) {
  try {
    const ipLimited = await enforceIpRateLimit(
      request,
      "reset-password:ip",
      RATE_LIMITS.forgotPasswordIp
    );
    if (!ipLimited.allowed) {
      return rateLimitExceededResponse(ipLimited.retryAfterSec);
    }

    const body = await request.json().catch(() => ({}));
    const token = typeof body?.token === "string" ? body.token : null;
    const password = typeof body?.password === "string" ? body.password : null;

    const outcome = await resetPasswordWithToken(token, password);
    if (!outcome.ok) {
      return NextResponse.json({ error: outcome.error }, { status: outcome.status });
    }

    return NextResponse.json({
      success: true,
      email: outcome.email,
      redirectTo: outcome.redirectTo,
    });
  } catch (error) {
    console.error("[reset-password] error:", error);
    return NextResponse.json(
      { error: "Failed to reset password. Please try again." },
      { status: 500 }
    );
  }
}
