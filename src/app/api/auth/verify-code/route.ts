import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sign } from "jsonwebtoken";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'sanative-secret-key';

export async function POST(req: NextRequest) {
  try {
    const { contact, type, code } = await req.json();

    if (!contact || !type || !code) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Find verification record
    const verification = await prisma.verificationCode.findUnique({
      where: {
        contact_type: {
          contact: contact.toLowerCase().trim(),
          type,
        },
      },
    });

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

    // Check if user already exists
    let existingUser = null;
    if (type === 'email') {
      existingUser = await prisma.user.findUnique({
        where: { email: contact.toLowerCase().trim() },
        select: { id: true, email: true, firstName: true, lastName: true, phone: true },
      });
    } else {
      existingUser = await prisma.user.findFirst({
        where: { phone: contact },
        select: { id: true, email: true, firstName: true, lastName: true, phone: true },
      });
    }

    // Generate a session token for the checkout flow
    const sessionToken = sign(
      {
        contact,
        type,
        verified: true,
        userId: existingUser?.id || null,
        exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour
      },
      JWT_SECRET
    );

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
