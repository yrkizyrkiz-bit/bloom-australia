import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Email and password are required" },
        { status: 400 }
      );
    }

    // Find clinic by email
    const clinic = await prisma.clinic.findUnique({
      where: { leadGpEmail: email },
      select: {
        id: true,
        name: true,
        leadGpName: true,
        leadGpEmail: true,
        passwordHash: true,
        status: true,
      },
    });

    if (!clinic) {
      return NextResponse.json(
        { success: false, message: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Check if clinic is active
    if (clinic.status !== "ACTIVE") {
      return NextResponse.json(
        { success: false, message: "This clinic account is not active" },
        { status: 403 }
      );
    }

    // Check if password is set
    if (!clinic.passwordHash) {
      return NextResponse.json(
        { success: false, message: "Password not set. Please contact support." },
        { status: 401 }
      );
    }

    // Verify password
    const isValid = await verifyPassword(password, clinic.passwordHash);

    if (!isValid) {
      return NextResponse.json(
        { success: false, message: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Return clinic info (NextAuth will handle session creation)
    return NextResponse.json({
      success: true,
      data: {
        id: clinic.id,
        email: clinic.leadGpEmail,
        name: clinic.leadGpName,
        clinicName: clinic.name,
        role: "GP",
      },
    });
  } catch (error) {
    console.error("GP auth error:", error);
    return NextResponse.json(
      { success: false, message: "Authentication failed" },
      { status: 500 }
    );
  }
}
