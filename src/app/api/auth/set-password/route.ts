import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { userId, password } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    if (!password || password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update the user's password
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        passwordHash: hashedPassword, // Keep both for compatibility
      },
    });

    // Log the automation event
    await prisma.automationLog.create({
      data: {
        userId:        user.id,
        automationType: "password_set",
        triggerEvent:  "magic_link_password_set",
        channel:       "portal",
        status:        "completed",
      }
    }).catch(console.error);

    return NextResponse.json({ success: true });

  } catch (error: unknown) {
    console.error("Set password error:", error);
    return NextResponse.json(
      { error: "Failed to set password" },
      { status: 500 }
    );
  }
}
