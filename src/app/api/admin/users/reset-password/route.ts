import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { sendEmail } from "@/lib/email";

// Generate a random password
function generateRandomPassword(length: number = 12): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// POST /api/admin/users/reset-password - Admin reset user password
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Only allow admins
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { userId, newPassword, sendEmail: shouldSendEmail = true } = body;

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Use provided password or generate a random one
    const password = newPassword || generateRandomPassword(12);

    // Validate password length
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update the user's password
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        passwordHash: hashedPassword,
      },
    });

    // Create internal note
    await prisma.internalNote.create({
      data: {
        userId,
        category: "GENERAL",
        title: "Password Reset by Admin",
        content: `Password was reset by admin: ${session.user.firstName || ""} ${session.user.lastName || ""} (${session.user.email})`,
        createdBy: session.user.id,
        authorId: session.user.id,
        authorName: `${session.user.firstName || ""} ${session.user.lastName || ""}`.trim() || "Admin",
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId,
        action: "ADMIN_PASSWORD_RESET",
        entity: "user",
        entityId: userId,
        details: {
          resetBy: session.user.id,
          resetByEmail: session.user.email,
          emailSent: shouldSendEmail,
          timestamp: new Date().toISOString(),
        },
      },
    });

    // Send email with new password if requested
    if (shouldSendEmail) {
      const loginUrl = `${process.env.NEXTAUTH_URL || "https://sanative.com.au"}/login`;

      await sendEmail({
        to: user.email,
        subject: "Your Sanative password has been reset",
        body: `
          <h2>Hi ${user.firstName || "there"},</h2>
          <p>Your Sanative account password has been reset by our support team.</p>

          <div style="background: #f4f7f2; border-radius: 12px; padding: 20px; margin: 24px 0;">
            <p style="margin: 0 0 8px 0; color: #666;">Your new temporary password:</p>
            <p style="margin: 0; font-size: 24px; font-weight: bold; font-family: monospace; color: #2c3628; letter-spacing: 2px;">
              ${password}
            </p>
          </div>

          <p><strong>Important:</strong> Please log in and change your password as soon as possible for security.</p>

          <div style="margin: 24px 0;">
            <a href="${loginUrl}" style="display:inline-block;background:#5c7a52;color:white;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;">
              Log In Now
            </a>
          </div>

          <p style="color:#666;font-size:14px;">
            If you didn't request this password reset, please contact our support team immediately.
          </p>

          <p style="color:#666;margin-top:24px;">The Sanative Health Team</p>
        `,
      });
    }

    return NextResponse.json({
      success: true,
      message: shouldSendEmail
        ? "Password reset successfully. Email sent to user."
        : "Password reset successfully.",
      // Only return password if email wasn't sent (so admin can share it manually)
      ...(shouldSendEmail ? {} : { temporaryPassword: password }),
    });

  } catch (error) {
    console.error("Admin password reset error:", error);
    return NextResponse.json(
      { error: "Failed to reset password" },
      { status: 500 }
    );
  }
}
