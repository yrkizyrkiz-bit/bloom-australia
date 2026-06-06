import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verify } from "jsonwebtoken";
import { SYDNEY_TZ, toSydneyISO } from "@/lib/sydney-time";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "sanative-secret-key";

const TIMEZONE = SYDNEY_TZ;

// Parse unified slot ID to extract time info
// Format: slot_unified_<timestamp>
function parseUnifiedSlotId(slotId: string): { timestamp: number; isUnified: boolean } | null {
  // Unified format: slot_unified_<timestamp>
  const unifiedMatch = slotId.match(/^slot_unified_([a-z0-9]+)$/);
  if (unifiedMatch) {
    return {
      timestamp: parseInt(unifiedMatch[1], 36),
      isUnified: true,
    };
  }

  // Legacy format: slot_<doctorId>_<timestamp> - still support for backwards compatibility
  const legacyMatch = slotId.match(/^slot_(.+)_([a-z0-9]+)$/);
  if (legacyMatch) {
    return {
      timestamp: parseInt(legacyMatch[2], 36),
      isUnified: false,
    };
  }

  return null;
}

export interface HoldRequest {
  sessionId?: string;
  userId?: string;
  slotId: string;
  selectedPlan: "CORE" | "PRECISION";
  intakeId?: string;
  patientPhone?: string;
  patientBmi?: number;
  riskFlags?: string[];
}

export interface HoldResponse {
  success: boolean;
  bookingHoldId: string;
  holdExpiryTime: string;
  slot: {
    slotId: string;
    startTime: string;
    endTime: string;
    timezone: string;
    appointmentType: string;
  };
  selectedPlan: string;
  // Doctor assignment happens during triage
  doctorAssignmentNote: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: HoldRequest = await req.json();
    const { sessionId, userId: bodyUserId, slotId, selectedPlan, intakeId, patientPhone, patientBmi, riskFlags } = body;

    // Verify session or user ID
    let userId = bodyUserId;

    if (!userId && sessionId) {
      try {
        const tokenData = verify(sessionId, JWT_SECRET) as { userId: string | null };
        userId = tokenData.userId || undefined;
      } catch {
        // Session verification failed - continue without user if allowed
      }
    }

    // Validate required fields
    if (!slotId) {
      return NextResponse.json(
        { error: "Slot ID is required" },
        { status: 400 }
      );
    }

    if (!selectedPlan || !["CORE", "PRECISION"].includes(selectedPlan)) {
      return NextResponse.json(
        { error: "Selected plan must be CORE or PRECISION" },
        { status: 400 }
      );
    }

    // Parse slot ID to get time
    const slotInfo = parseUnifiedSlotId(slotId);
    if (!slotInfo) {
      return NextResponse.json(
        { error: "Invalid slot ID format" },
        { status: 400 }
      );
    }

    const { timestamp } = slotInfo;
    const scheduledAt = new Date(timestamp);

    // Validate the scheduled time is in the future
    const now = new Date();
    if (scheduledAt <= now) {
      return NextResponse.json(
        { error: "Cannot hold a slot in the past" },
        { status: 400 }
      );
    }

    // Get available doctors at this time
    const doctors = await prisma.user.findMany({
      where: {
        role: "DOCTOR",
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    });

    if (doctors.length === 0) {
      return NextResponse.json(
        { error: "No doctors available in the system" },
        { status: 400 }
      );
    }

    // Check existing bookings at this time
    const existingBookings = await prisma.consultationBooking.findMany({
      where: {
        scheduledAt,
        OR: [
          { status: "SLOT_HELD", holdExpiresAt: { gt: now } },
          { status: "BOOKING_CONFIRMED" },
        ],
      },
      select: {
        doctorId: true,
        status: true,
      },
    });

    // Track which doctors are already booked at this time
    const bookedDoctorIds = new Set<string>();
    let unassignedBookings = 0;

    for (const booking of existingBookings) {
      if (booking.doctorId) {
        bookedDoctorIds.add(booking.doctorId);
      } else {
        unassignedBookings++;
      }
    }

    // Calculate available capacity
    // Each unassigned booking will eventually take one doctor
    const effectiveBookedCount = bookedDoctorIds.size + unassignedBookings;
    const availableDoctors = doctors.length - effectiveBookedCount;

    if (availableDoctors <= 0) {
      return NextResponse.json(
        { error: "This slot is no longer available - all doctors are booked" },
        { status: 409 }
      );
    }

    // If we have a userId, check if user already has a hold
    if (userId) {
      const existingHold = await prisma.consultationBooking.findFirst({
        where: {
          userId,
          status: "SLOT_HELD",
          holdExpiresAt: { gt: now },
        },
      });

      if (existingHold) {
        // Remove abandoned hold — do not leave cancelled rows on the admin calendar
        await prisma.consultationBooking.delete({
          where: { id: existingHold.id },
        });
      }
    }

    // Set hold expiry to 15 minutes from now
    const holdExpiresAt = new Date(now.getTime() + 15 * 60 * 1000);

    // Calculate end time (30 minutes after start)
    const endTime = new Date(scheduledAt);
    endTime.setMinutes(endTime.getMinutes() + 30);

    // UNIFIED CALENDAR: Create booking WITHOUT doctor assignment
    // Doctor will be assigned during triage by care partner
    const booking = await prisma.consultationBooking.create({
      data: {
        // Only set userId if we have a real user ID
        ...(userId && userId !== "anonymous" ? { userId } : {}),
        bookingType: "initial_consultation",
        scheduledAt,
        duration: 30,
        status: "SLOT_HELD",
        holdExpiresAt,
        selectedPlan,
        intakeId,
        // NO DOCTOR ASSIGNMENT - assigned during triage
        doctorId: null,
        doctorName: null,
        appointmentType: "PHONE_CONSULT",
        patientPhone,
        patientBmi,
        riskFlags: riskFlags || [],
        notes: "Doctor to be assigned during triage by care partner",
      },
    });

    // Log activity if we have a user
    if (userId && userId !== "anonymous") {
      await prisma.activityLog.create({
        data: {
          userId,
          action: "SLOT_HELD",
          entity: "consultation_booking",
          entityId: booking.id,
          details: {
            slotId,
            scheduledAt: scheduledAt.toISOString(),
            selectedPlan,
            holdExpiresAt: holdExpiresAt.toISOString(),
            doctorAssignment: "Pending - to be assigned during triage",
          },
        },
      });

      // Update user journey status
      await prisma.user.update({
        where: { id: userId },
        data: { journeyStatus: "CONSULTATION_BOOKING_STARTED" },
      });
    }

    const response: HoldResponse = {
      success: true,
      bookingHoldId: booking.id,
      holdExpiryTime: holdExpiresAt.toISOString(),
      slot: {
        slotId,
        startTime: toSydneyISO(scheduledAt),
        endTime: toSydneyISO(endTime),
        timezone: TIMEZONE,
        appointmentType: "PHONE_CONSULT",
      },
      selectedPlan,
      doctorAssignmentNote: "Your doctor will be assigned by our care team before your consultation",
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error creating booking hold:", error);
    return NextResponse.json(
      { error: "Failed to create booking hold" },
      { status: 500 }
    );
  }
}

// GET endpoint to check hold status
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const holdId = searchParams.get("holdId");

    if (!holdId) {
      return NextResponse.json(
        { error: "Hold ID is required" },
        { status: 400 }
      );
    }

    const booking = await prisma.consultationBooking.findUnique({
      where: { id: holdId },
      select: {
        id: true,
        status: true,
        holdExpiresAt: true,
        scheduledAt: true,
        doctorId: true,
        doctorName: true,
        selectedPlan: true,
        appointmentType: true,
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Hold not found" },
        { status: 404 }
      );
    }

    const now = new Date();
    const isExpired = booking.holdExpiresAt && booking.holdExpiresAt <= now;
    const isActive = booking.status === "SLOT_HELD" && !isExpired;

    return NextResponse.json({
      holdId: booking.id,
      status: isExpired ? "EXPIRED" : booking.status,
      isActive,
      holdExpiresAt: booking.holdExpiresAt?.toISOString(),
      remainingSeconds: isActive && booking.holdExpiresAt
        ? Math.max(0, Math.floor((booking.holdExpiresAt.getTime() - now.getTime()) / 1000))
        : 0,
      slot: {
        startTime: booking.scheduledAt.toISOString(),
        doctorId: booking.doctorId,
        doctorName: booking.doctorName || "To be assigned",
        appointmentType: booking.appointmentType,
      },
      selectedPlan: booking.selectedPlan,
      doctorAssigned: !!booking.doctorId,
    });
  } catch (error) {
    console.error("Error checking hold status:", error);
    return NextResponse.json(
      { error: "Failed to check hold status" },
      { status: 500 }
    );
  }
}

// DELETE endpoint to release a hold
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const holdId = searchParams.get("holdId");

    if (!holdId) {
      return NextResponse.json(
        { error: "Hold ID is required" },
        { status: 400 }
      );
    }

    const booking = await prisma.consultationBooking.findUnique({
      where: { id: holdId },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Hold not found" },
        { status: 404 }
      );
    }

    if (booking.status !== "SLOT_HELD") {
      return NextResponse.json(
        { error: "Cannot release a booking that is not on hold" },
        { status: 400 }
      );
    }

    await prisma.consultationBooking.delete({
      where: { id: holdId },
    });

    return NextResponse.json({
      success: true,
      message: "Hold released successfully",
    });
  } catch (error) {
    console.error("Error releasing hold:", error);
    return NextResponse.json(
      { error: "Failed to release hold" },
      { status: 500 }
    );
  }
}
