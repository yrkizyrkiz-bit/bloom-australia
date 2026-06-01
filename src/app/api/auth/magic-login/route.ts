import { NextRequest, NextResponse } from "next/server";
import { verify } from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

interface MagicLinkPayload {
  userId: string;
  email: string;
  purpose: string;
}

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 400 });
    }

    // Verify the JWT token
    const secret = process.env.MAGIC_LINK_SECRET || "fallback-secret-change-me";
    let payload: MagicLinkPayload;

    try {
      payload = verify(token, secret) as MagicLinkPayload;
    } catch (err: unknown) {
      const error = err as Error & { name?: string };
      if (error.name === "TokenExpiredError") {
        return NextResponse.json(
          { error: "This link has expired. Please request a new one." },
          { status: 401 }
        );
      }
      return NextResponse.json(
        { error: "Invalid or expired link" },
        { status: 401 }
      );
    }

    if (payload.purpose !== "magic_login") {
      return NextResponse.json({ error: "Invalid token purpose" }, { status: 400 });
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        password: true,
        passwordHash: true,
        firstName: true,
        subscriptionTier: true,
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // If user has no password yet, they need to set one
    const needsPassword = !user.password && !user.passwordHash;

    return NextResponse.json({
      userId: user.id,
      email: user.email,
      firstName: user.firstName,
      subscriptionTier: user.subscriptionTier,
      needsPassword,
    });

  } catch (error: unknown) {
    console.error("Magic login error:", error);
    return NextResponse.json({ error: "Invalid or expired link" }, { status: 401 });
  }
}
