import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  resolveDoctorProviderNumber,
  saveDoctorProviderNumber,
} from "@/lib/doctor/provider-number";

function canAccessDoctorAccount(role?: string | null): boolean {
  return role === "DOCTOR" || role === "ADMIN" || role === "admin";
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !canAccessDoctorAccount(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const doctor = await prisma.user.findUnique({
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
    });

    if (!doctor || !canAccessDoctorAccount(doctor.role)) {
      return NextResponse.json({ error: "Doctor account not found" }, { status: 404 });
    }

    const provider = await resolveDoctorProviderNumber(session.user.id);

    return NextResponse.json({
      doctor: {
        ...doctor,
        fullName: `${doctor.firstName} ${doctor.lastName}`.trim(),
        registrationNumber: provider.providerNumber,
        registrationSource: provider.source,
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
    const { newPassword, medicareProviderNumber } = body as {
      newPassword?: string;
      medicareProviderNumber?: string;
    };

    if (medicareProviderNumber !== undefined) {
      if (typeof medicareProviderNumber !== "string") {
        return NextResponse.json(
          { error: "Provider number must be a string" },
          { status: 400 }
        );
      }

      const trimmed = medicareProviderNumber.trim();
      if (!trimmed) {
        return NextResponse.json(
          { error: "Provider number cannot be empty" },
          { status: 400 }
        );
      }

      await saveDoctorProviderNumber(session.user.id, trimmed);

      return NextResponse.json({
        success: true,
        message: "Medicare provider number saved",
        medicareProviderNumber: trimmed,
      });
    }

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
      { error: "Failed to update doctor account" },
      { status: 500 }
    );
  }
}
