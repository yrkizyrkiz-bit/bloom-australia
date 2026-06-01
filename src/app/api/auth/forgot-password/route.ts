import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // For security reasons, we always return success even if user doesn't exist
    // This prevents email enumeration attacks
    if (!user) {
      // Log the attempt but don't reveal that the user doesn't exist
      console.log(`Password reset requested for non-existent email: ${email}`);
      return NextResponse.json({
        success: true,
        message: "If an account exists with this email, a password reset link will be sent.",
      });
    }

    // Generate a secure reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenHash = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    // Store the hashed token in the database
    // Note: You would need to add these fields to your User model in Prisma schema
    // For now, we'll simulate the token storage

    // In a production app, you would:
    // 1. Store the hashed token in the database
    // 2. Send an email with the reset link containing the plain token
    // 3. When user clicks the link, hash the token and compare with stored hash

    // Example database update (uncomment when fields are added to schema):
    // await prisma.user.update({
    //   where: { id: user.id },
    //   data: {
    //     passwordResetToken: resetTokenHash,
    //     passwordResetExpiry: resetTokenExpiry,
    //   },
    // });

    // For demo purposes, log the reset token (in production, send via email)
    console.log(`Password reset token for ${email}: ${resetToken}`);
    console.log(`Reset link would be: ${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}`);

    // In production, send email using a service like SendGrid, AWS SES, etc.
    // Example:
    // await sendPasswordResetEmail({
    //   to: user.email,
    //   name: user.firstName,
    //   resetLink: `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}`,
    // });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "PASSWORD_RESET_REQUESTED",
        entity: "user",
        entityId: user.id,
        details: {
          email: user.email,
          requestedAt: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "If an account exists with this email, a password reset link will be sent.",
    });
  } catch (error) {
    console.error("Password reset error:", error);
    return NextResponse.json(
      { error: "An error occurred while processing your request" },
      { status: 500 }
    );
  }
}
