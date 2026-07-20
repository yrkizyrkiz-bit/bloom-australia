import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { RATE_LIMITS } from "@/lib/security/rate-limit-config";
import {
  enforceIpRateLimit,
  rateLimitExceededResponse,
} from "@/lib/security/rate-limit-http";

export async function POST(req: NextRequest) {
  try {
    const ipLimited = await enforceIpRateLimit(
      req,
      "check-email:ip",
      RATE_LIMITS.checkEmailIp
    );
    if (!ipLimited.allowed) {
      return rateLimitExceededResponse(ipLimited.retryAfterSec);
    }

    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        firstName: true,
        subscriptionTier: true,
        journeyStatus: true,
      },
    });

    if (existingUser) {
      return NextResponse.json({
        exists: true,
        hasActiveProgram: !!existingUser.subscriptionTier,
        journeyStatus: existingUser.journeyStatus,
        firstName: existingUser.firstName,
      });
    }

    return NextResponse.json({
      exists: false,
    });
  } catch (error) {
    console.error("Error checking email:", error);
    return NextResponse.json(
      { error: "Failed to check email" },
      { status: 500 }
    );
  }
}
