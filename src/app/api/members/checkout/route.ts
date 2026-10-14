import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePrePaymentConsent } from "@/lib/legal/require-pre-payment-consent";
import { RATE_LIMITS } from "@/lib/security/rate-limit-config";
import {
  enforceIpRateLimit,
  rateLimitExceededResponse,
} from "@/lib/security/rate-limit-http";
import { verifyLegacyMembersCheckoutPayment } from "@/lib/stripe/verify-legacy-members-checkout-payment";

export async function POST(request: NextRequest) {
  try {
    const ipLimited = await enforceIpRateLimit(
      request,
      "members-checkout:ip",
      RATE_LIMITS.checkoutIp
    );
    if (!ipLimited.allowed) {
      return rateLimitExceededResponse(ipLimited.retryAfterSec);
    }

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
      consentRecordId,
      stripeCustomerId,
      clinicToken,
      referralToken,
    } = body;

    const consentVerification = await requirePrePaymentConsent({
      consentRecordId,
      email,
    });

    if (!consentVerification.ok) {
      return NextResponse.json(
        { success: false, message: consentVerification.error },
        { status: consentVerification.status }
      );
    }

    // Validate required fields
    if (!firstName || !lastName || !email || !mobile || !dob || !program) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!stripePaymentIntentId || typeof stripePaymentIntentId !== "string") {
      return NextResponse.json(
        { success: false, message: "Payment intent is required" },
        { status: 400 }
      );
    }

    const paymentVerification = await verifyLegacyMembersCheckoutPayment({
      paymentIntentId: stripePaymentIntentId,
      email,
      program,
      stripeCustomerId: typeof stripeCustomerId === "string" ? stripeCustomerId : null,
    });

    if (!paymentVerification.ok) {
      return NextResponse.json(
        { success: false, message: paymentVerification.error },
        { status: paymentVerification.status }
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

    const baseIntake =
      intakeData && typeof intakeData === "object" && !Array.isArray(intakeData)
        ? (intakeData as Record<string, unknown>)
        : {};

    // Create the member only after Stripe payment verification
    const member = await prisma.programMember.create({
      data: {
        firstName,
        lastName,
        email,
        mobile,
        dob: new Date(dob),
        program,
        intakeData: {
          ...baseIntake,
          stripePaymentIntentId: paymentVerification.paymentIntent.id,
          verifiedPaymentIntentId: paymentVerification.paymentIntent.id,
          paymentVerifiedAt: new Date().toISOString(),
          paymentAmountCents: paymentVerification.paymentIntent.amount,
        },
        stripeCustomerId:
          paymentVerification.customerId ||
          (typeof stripeCustomerId === "string" ? stripeCustomerId : null),
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
