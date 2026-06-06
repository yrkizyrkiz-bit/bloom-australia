import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/admin/debug-session - Debug session and user info
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({
        hasSession: false,
        error: "No session found",
      });
    }

    // Fetch user from database to compare
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    });

    return NextResponse.json({
      hasSession: true,
      session: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: session.user.role,
        firstName: session.user.firstName,
        lastName: session.user.lastName,
      },
      dbUser,
      roleMatch: dbUser?.role === session.user.role,
    });
  } catch (error) {
    console.error("Debug session error:", error);
    return NextResponse.json({ error: "Failed to get session" }, { status: 500 });
  }
}
