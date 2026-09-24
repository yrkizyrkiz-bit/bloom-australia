import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { matchesDevVerificationCode } from "@/lib/auth/dev-verification";
import { signVerifiedContactToken } from "@/lib/auth/verified-contact-token";
import { RATE_LIMITS } from "@/lib/security/rate-limit-config";
import {
  enforceIpRateLimit,
  rateLimitExceededResponse,
} from "@/lib/security/rate-limit-http";

export async function POST(req: NextRequest) {
  try {
    const ipLimited = await enforceIpRateLimit(
      req,
      "verify-code:ip",
      RATE_LIMITS.verifyCodeIp
    );
    if (!ipLimited.allowed) {
      return rateLimitExceededResponse(ipLimited.retryAfterSec);
    }

    const { contact, type, code } = await req.json();

    if (!contact || !type || !code) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    if (type !== "email" && type !== "phone") {
      return NextResponse.json({ error: "Invalid verification type" }, { status: 400 });
    }

    const normalizedContact = String(contact).toLowerCase().trim();
    const usingDevCode = matchesDevVerificationCode(code);

    // Find verification record
    const verification = await prisma.verificationCode.findUnique({
      where: {
        contact_type: {
          contact: normalizedContact,
          type,
        },
      },
    });

    if (usingDevCode) {
      console.warn("[DEV] Accepted DEV_VERIFICATION_CODE for", type);
      if (verification) {
        await prisma.verificationCode.update({
          where: { id: verification.id },
          data: { verified: true },
        });
      }
    } else {
      if (!verification) {
        return NextResponse.json(
          { error: "No verification code found. Please request a new one." },
          { status: 404 }
        );
      }

      // Check if expired
      if (new Date() > verification.expiresAt) {
        return NextResponse.json(
          { error: "Verification code has expired. Please request a new one." },
          { status: 400 }
        );
      }

      // Check attempts (max 5)
      if (verification.attempts >= 5) {
        return NextResponse.json(
          { error: "Too many attempts. Please request a new code." },
          { status: 429 }
        );
      }

      // Increment attempts
      await prisma.verificationCode.update({
        where: { id: verification.id },
        data: { attempts: { increment: 1 } },
      });

      // Verify code
      if (verification.code !== code) {
        return NextResponse.json(
          { error: "Invalid verification code" },
          { status: 400 }
        );
      }

      // Mark as verified
      await prisma.verificationCode.update({
        where: { id: verification.id },
        data: { verified: true },
      });
    }

    // Check if user already exists
    let existingUser = null;
    if (type === 'email') {
      existingUser = await prisma.user.findUnique({
        where: { email: normalizedContact },
        select: { id: true, email: true, firstName: true, lastName: true, phone: true },
      });
    } else {
      existingUser = await prisma.user.findFirst({
        where: { phone: contact },
        select: { id: true, email: true, firstName: true, lastName: true, phone: true },
      });
    }

    // Generate a session token for the checkout flow
    const sessionToken = signVerifiedContactToken({
      contact,
      type,
      userId: existingUser?.id || null,
    });

    return NextResponse.json({
      success: true,
      verified: true,
      existingUser: existingUser ? {
        id: existingUser.id,
        email: existingUser.email,
        firstName: existingUser.firstName,
        lastName: existingUser.lastName,
        phone: existingUser.phone,
      } : null,
      sessionToken,
    });
  } catch (error) {
    console.error("Error verifying code:", error);
    return NextResponse.json(
      { error: "Failed to verify code" },
      { status: 500 }
    );
  }
}
