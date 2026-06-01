import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      firstName,
      lastName,
      email,
      mobile,
      dob,
      program,
      intakeData,
      stripePaymentIntentId,
      stripeCustomerId,
      clinicToken,
      referralToken,
    } = body;

    // Validate required fields
    if (!firstName || !lastName || !email || !mobile || !dob || !program) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if member already exists
    const existingMember = await prisma.programMember.findUnique({
      where: { email },
    });

    if (existingMember) {
      return NextResponse.json(
        { success: false, message: "An account with this email already exists" },
        { status: 400 }
      );
    }

    // Calculate membership end date (1 year from now)
    const membershipEnd = new Date();
    membershipEnd.setFullYear(membershipEnd.getFullYear() + 1);

    let clinicId: string | null = null;
    let referralId: string | null = null;

    // If from clinic QR code
    if (clinicToken) {
      const clinic = await prisma.clinic.findUnique({
        where: { qrToken: clinicToken },
      });
      if (clinic) {
        clinicId = clinic.id;
      }
    }

    // If from GP referral
    if (referralToken) {
      const referral = await prisma.gpReferral.findUnique({
        where: { token: referralToken },
        include: { clinic: true },
      });
      if (referral && referral.status === "PENDING") {
        referralId = referral.id;
        clinicId = referral.clinicId;
      }
    }

    // Assign a care partner (simple round-robin for now)
    const availableCarePartner = await prisma.carePartner.findFirst({
      where: {
        active: true,
        programs: { has: program },
      },
      orderBy: {
        assignedMembers: {
          _count: "asc",
        },
      },
    });

    // Create the member
    const member = await prisma.programMember.create({
      data: {
        firstName,
        lastName,
        email,
        mobile,
        dob: new Date(dob),
        program,
        intakeData: intakeData || {},
        stripeCustomerId: stripeCustomerId || null,
        membershipEnd,
        clinicId,
        referralId,
        carePartnerId: availableCarePartner?.id || null,
      },
    });

    // Update referral status if applicable
    if (referralId) {
      await prisma.gpReferral.update({
        where: { id: referralId },
        data: {
          status: "ENROLLED",
          enrolledAt: new Date(),
        },
      });
    }

    // Update QR scan conversion if applicable
    if (clinicId && clinicToken) {
      const scanEvent = await prisma.qrScanEvent.findFirst({
        where: {
          clinicId,
          converted: false,
        },
        orderBy: {
          scannedAt: "desc",
        },
      });

      if (scanEvent) {
        await prisma.qrScanEvent.update({
          where: { id: scanEvent.id },
          data: {
            converted: true,
            memberId: member.id,
          },
        });
      }
    }

    // Create GP notification for new enrolment
    if (clinicId) {
      await prisma.gpNotification.create({
        data: {
          clinicId,
          type: "ENROLMENT",
          message: `${firstName} ${lastName} has enrolled in the ${program} program`,
          patientName: `${firstName} ${lastName}`,
          patientId: member.id,
        },
      });
    }

    // Create welcome check-in
    if (availableCarePartner) {
      await prisma.programCheckIn.create({
        data: {
          memberId: member.id,
          carePartnerId: availableCarePartner.id,
          type: "WELCOME",
          notes: "Welcome check-in scheduled",
        },
      });
    }

    // TODO: Send welcome email to member
    // TODO: Notify care partner of new assignment

    return NextResponse.json({
      success: true,
      message: "Membership created successfully",
      data: {
        memberId: member.id,
        program: member.program,
        membershipEnd: member.membershipEnd,
      },
    });
  } catch (error) {
    console.error("Member checkout error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create membership" },
      { status: 500 }
    );
  }
}
