import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { matchesDevVerificationCode } from "@/lib/auth/dev-verification";
import { signVerifiedContactToken } from "@/lib/auth/verified-contact-token";
import {
  isEstablishedMember,
  phoneMatchCandidates,
} from "@/lib/auth/member-identity-guard";
import { publicVerifiedContactIdentity } from "@/lib/auth/verified-contact-public";
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

    const identitySelect = {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      passwordHash: true,
      subscriptionStatus: true,
      journeyStatus: true,
      memberStatus: true,
    } as const;

    let existingUser = null;
    if (type === "email") {
      existingUser = await prisma.user.findUnique({
        where: { email: normalizedContact },
        select: identitySelect,
      });
    } else {
      const candidates = phoneMatchCandidates(contact);
      existingUser = await prisma.user.findFirst({
        where: {
          OR: candidates.map((phone) => ({ phone })),
        },
        select: identitySelect,
      });
    }

    const established = existingUser ? isEstablishedMember(existingUser) : false;
    const publicIdentity = publicVerifiedContactIdentity({
      type,
      existingUser,
      isEstablished: established,
    });

    // Generate a session token for the checkout flow.
    // Phone matches stay unbound so a shared mobile creates a new account
    // (triage is flagged at membership activation) instead of opening the other member.
    const sessionToken = signVerifiedContactToken({
      contact,
      type,
      userId: publicIdentity.bindUserId,
    });

    return NextResponse.json({
      success: true,
      verified: true,
      existingUser: publicIdentity.existingUser,
      phoneAlreadyRegistered: publicIdentity.phoneAlreadyRegistered,
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
