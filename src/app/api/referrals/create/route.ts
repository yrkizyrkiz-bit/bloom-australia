import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Generate a unique referral token
function generateReferralToken(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let token = "";
  for (let i = 0; i < 16; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

export async function POST(request: NextRequest) {
  try {
    // Get the session to verify GP is authenticated
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Find the clinic associated with this GP
    const clinic = await prisma.clinic.findUnique({
      where: { leadGpEmail: session.user.email },
    });

    if (!clinic) {
      return NextResponse.json(
        { success: false, message: "No clinic found for this account" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      patientFirstName,
      patientLastName,
      patientEmail,
      patientMobile,
      program,
      clinicalNote,
    } = body;

    // Validate required fields
    if (!patientFirstName || !patientEmail || !patientMobile || !program) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Generate unique referral token
    let token = generateReferralToken();
    let tokenExists = await prisma.gpReferral.findUnique({ where: { token } });
    while (tokenExists) {
      token = generateReferralToken();
      tokenExists = await prisma.gpReferral.findUnique({ where: { token } });
    }

    // Create referral with 30-day expiry
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const referral = await prisma.gpReferral.create({
      data: {
        clinicId: clinic.id,
        token,
        patientFname: patientFirstName,
        patientEmail,
        patientMobile,
        program,
        clinicalNote: clinicalNote || null,
        expiresAt,
      },
    });

    // TODO: Send SMS and email to patient with referral link
    const referralLink = `${process.env.NEXT_PUBLIC_BASE_URL || "https://sanative.com.au"}/join?ref=${token}`;

    return NextResponse.json({
      success: true,
      message: "Referral created successfully",
      data: {
        referralId: referral.id,
        referralLink,
        expiresAt: referral.expiresAt,
      },
    });
  } catch (error) {
    console.error("Referral creation error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create referral" },
      { status: 500 }
    );
  }
}
