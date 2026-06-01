import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, generateRandomPassword } from "@/lib/password";
import { sendClinicWelcomeEmail } from "@/lib/email";

// Generate a short random token for QR codes
function generateQrToken(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let token = "";
  for (let i = 0; i < 10; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      clinicName,
      streetAddress,
      suburb,
      state,
      postcode,
      leadGpName,
      leadGpEmail,
      leadGpMobile,
      abn,
      programs,
    } = body;

    // Validate required fields
    if (
      !clinicName ||
      !streetAddress ||
      !suburb ||
      !state ||
      !postcode ||
      !leadGpName ||
      !leadGpEmail ||
      !leadGpMobile
    ) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if clinic with this email already exists
    const existingClinic = await prisma.clinic.findUnique({
      where: { leadGpEmail },
    });

    if (existingClinic) {
      return NextResponse.json(
        { success: false, message: "A clinic with this email is already registered" },
        { status: 400 }
      );
    }

    // Generate unique QR token
    let qrToken = generateQrToken();
    let tokenExists = await prisma.clinic.findUnique({ where: { qrToken } });
    while (tokenExists) {
      qrToken = generateQrToken();
      tokenExists = await prisma.clinic.findUnique({ where: { qrToken } });
    }

    // Generate a random password for the GP
    const tempPassword = generateRandomPassword(12);
    const passwordHash = await hashPassword(tempPassword);

    // Create clinic record
    const clinic = await prisma.clinic.create({
      data: {
        name: clinicName,
        address: streetAddress,
        suburb,
        state,
        postcode,
        leadGpName,
        leadGpEmail,
        leadGpMobile,
        abn: abn || null,
        qrToken,
        programs: programs || [],
        passwordHash,
      },
    });

    // Send welcome email with credentials
    await sendClinicWelcomeEmail(leadGpEmail, {
      clinicName,
      gpName: leadGpName,
      qrToken,
    });

    // Log the temporary password (in production, this would only be in the email)
    console.log(`[Clinic Registration] ${clinicName} registered. Temp password: ${tempPassword}`);

    return NextResponse.json({
      success: true,
      message: "Clinic registered successfully",
      data: {
        clinicId: clinic.id,
        qrToken: clinic.qrToken,
        // In development, return temp password for testing
        ...(process.env.NODE_ENV === "development" && { tempPassword }),
      },
    });
  } catch (error) {
    console.error("Clinic registration error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to register clinic" },
      { status: 500 }
    );
  }
}
