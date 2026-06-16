import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function canAccessDoctorAccount(role?: string | null): boolean {
  return role === "DOCTOR" || role === "ADMIN" || role === "admin";
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !canAccessDoctorAccount(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [doctor, latestPrescription] = await Promise.all([
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          address: true,
          addressLine1: true,
          addressLine2: true,
          suburb: true,
          state: true,
          postcode: true,
          country: true,
          role: true,
          updatedAt: true,
        },
      }),
      prisma.prescription.findFirst({
        where: { prescriberId: session.user.id },
        orderBy: { prescribedAt: "desc" },
        select: {
          prescriberName: true,
          prescriberLicense: true,
          prescribedAt: true,
        },
      }),
    ]);

    if (!doctor || !canAccessDoctorAccount(doctor.role)) {
      return NextResponse.json({ error: "Doctor account not found" }, { status: 404 });
    }

    return NextResponse.json({
      doctor: {
        ...doctor,
        fullName: `${doctor.firstName} ${doctor.lastName}`.trim(),
        registrationNumber: latestPrescription?.prescriberLicense || null,
        registrationSource: latestPrescription?.prescriberLicense
          ? "Latest prescription record"
          : null,
      },
    });
  } catch (error) {
    console.error("[Doctor Account GET]", error);
    return NextResponse.json(
      { error: "Failed to load doctor account" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !canAccessDoctorAccount(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { newPassword } = body;

    if (!newPassword || typeof newPassword !== "string") {
      return NextResponse.json(
        { error: "New password is required" },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        password: hashedPassword,
        passwordHash: hashedPassword,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "DOCTOR_PASSWORD_RESET",
        entity: "user",
        entityId: session.user.id,
        details: {
          resetBy: session.user.id,
          resetByEmail: session.user.email,
          timestamp: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("[Doctor Account PATCH]", error);
    return NextResponse.json(
      { error: "Failed to reset password" },
      { status: 500 }
    );
  }
}
