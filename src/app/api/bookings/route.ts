import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verify } from "jsonwebtoken";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'sanative-secret-key';

// GAP-008: Allowed roles for listing all bookings
const ADMIN_ROLES = ["ADMIN", "CARE_PARTNER", "DOCTOR"];

// Get available time slots for the next 2 days (9am - 8pm, 1-hour slots)
function getAvailableSlots(): { date: string; slots: { time: string; datetime: string }[] }[] {
  const result: { date: string; slots: { time: string; datetime: string }[] }[] = [];
  const now = new Date();

  // Start from tomorrow (or today if before 9am)
  const startDate = new Date(now);
  if (now.getHours() >= 20) {
    startDate.setDate(startDate.getDate() + 1);
  }
  startDate.setHours(9, 0, 0, 0);

  // Get slots for 2 days
  for (let day = 0; day < 2; day++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + day);

    const daySlots: { time: string; datetime: string }[] = [];

    // Generate slots from 9am to 8pm (last slot starts at 7pm for 1-hour duration)
    for (let hour = 9; hour < 20; hour++) {
      const slotTime = new Date(currentDate);
      slotTime.setHours(hour, 0, 0, 0);

      // Skip past times for today
      if (day === 0 && slotTime <= now) continue;

      const timeStr = slotTime.toLocaleTimeString('en-AU', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });

      daySlots.push({
        time: timeStr,
        datetime: slotTime.toISOString(),
      });
    }

    const dateStr = currentDate.toLocaleDateString('en-AU', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });

    result.push({
      date: dateStr,
      slots: daySlots,
    });
  }

  return result;
}

// GET - Get available slots (legacy endpoint - use /api/bookings/availability for new flow)
// GAP-008: Added authentication for listing all bookings
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const listAll = searchParams.get('listAll') === 'true';

    // GAP-008: If requesting all bookings, require admin/doctor authentication
    if (listAll) {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id || !ADMIN_ROLES.includes(session.user.role)) {
        return NextResponse.json(
          { error: "Unauthorized - Admin or doctor access required to list all bookings" },
          { status: 401 }
        );
      }

      // Return all upcoming bookings for admin/doctor portal
      const now = new Date();
      const bookings = await prisma.consultationBooking.findMany({
        where: {
          scheduledAt: { gte: now },
          status: { in: ['SLOT_HELD', 'BOOKING_CONFIRMED'] },
        },
        orderBy: { scheduledAt: 'asc' },
        take: 100,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              journeyStatus: true,
            },
          },
        },
      });

      return NextResponse.json({
        bookings: bookings.map(b => ({
          id: b.id,
          scheduledAt: b.scheduledAt.toISOString(),
          status: b.status,
          duration: b.duration,
          appointmentType: b.appointmentType,
          doctorId: b.doctorId,
          doctorName: b.doctorName,
          patient: b.user ? {
            id: b.user.id,
            name: `${b.user.firstName} ${b.user.lastName}`.trim(),
            email: b.user.email,
            phone: b.user.phone,
            journeyStatus: b.user.journeyStatus,
          } : null,
        })),
        total: bookings.length,
      });
    }

    // Public endpoint: Get available slots only (no patient data)
    const availableSlots = getAvailableSlots();

    // If userId provided, filter out already booked slots
    if (userId) {
      const now = new Date();
      const existingBookings = await prisma.consultationBooking.findMany({
        where: {
          OR: [
            { status: 'SLOT_HELD', holdExpiresAt: { gt: now } },
            { status: 'BOOKING_CONFIRMED' },
          ],
          scheduledAt: {
            gte: now,
          },
        },
        select: {
          scheduledAt: true,
        },
      });

      const bookedTimes = new Set(
        existingBookings.map(b => b.scheduledAt.toISOString())
      );

      // Filter out booked slots
      for (const day of availableSlots) {
        day.slots = day.slots.filter(slot => !bookedTimes.has(slot.datetime));
      }
    }

    return NextResponse.json({
      availableSlots,
      timezone: 'Australia/Sydney',
    });
  } catch (error) {
    console.error("Error getting available slots:", error);
    return NextResponse.json(
      { error: "Failed to get available slots" },
      { status: 500 }
    );
  }
}

// POST - Create a booking (legacy endpoint - use /api/bookings/hold + /api/bookings/confirm for new flow)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, sessionToken, scheduledAt, notes } = body;

    // Verify either userId or sessionToken
    let verifiedUserId = userId;

    if (!userId && sessionToken) {
      try {
        const tokenData = verify(sessionToken, JWT_SECRET) as { userId: string | null };
        verifiedUserId = tokenData.userId;
      } catch {
        return NextResponse.json(
          { error: "Invalid session" },
          { status: 401 }
        );
      }
    }

    if (!verifiedUserId) {
      return NextResponse.json(
        { error: "User ID required" },
        { status: 400 }
      );
    }

    if (!scheduledAt) {
      return NextResponse.json(
        { error: "Scheduled time required" },
        { status: 400 }
      );
    }

    const scheduledTime = new Date(scheduledAt);

    // Validate time is in the future
    if (scheduledTime <= new Date()) {
      return NextResponse.json(
        { error: "Cannot book past times" },
        { status: 400 }
      );
    }

    // Check if slot is still available
    const now = new Date();
    const existingBooking = await prisma.consultationBooking.findFirst({
      where: {
        scheduledAt: scheduledTime,
        OR: [
          { status: 'SLOT_HELD', holdExpiresAt: { gt: now } },
          { status: 'BOOKING_CONFIRMED' },
        ],
      },
    });

    if (existingBooking) {
      return NextResponse.json(
        { error: "This time slot is no longer available" },
        { status: 409 }
      );
    }

    // Create booking
    const booking = await prisma.consultationBooking.create({
      data: {
        userId: verifiedUserId,
        bookingType: 'initial_consultation',
        scheduledAt: scheduledTime,
        duration: 60,
        status: 'SLOT_HELD',
        notes,
      },
    });

    // Update user journey status
    await prisma.user.update({
      where: { id: verifiedUserId },
      data: {
        journeyStatus: 'CONSULTATION_BOOKED',
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: verifiedUserId,
        action: 'CONSULTATION_BOOKED',
        entity: 'consultation_booking',
        entityId: booking.id,
        details: {
          scheduledAt: scheduledTime.toISOString(),
          duration: booking.duration,
        },
      },
    });

    // Get user for email
    const user = await prisma.user.findUnique({
      where: { id: verifiedUserId },
      select: { email: true, firstName: true },
    });

    return NextResponse.json({
      success: true,
      booking: {
        id: booking.id,
        scheduledAt: booking.scheduledAt,
        status: booking.status,
        duration: booking.duration,
      },
      message: `Your consultation is booked for ${scheduledTime.toLocaleString('en-AU', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })}`,
    });
  } catch (error) {
    console.error("Error creating booking:", error);
    return NextResponse.json(
      { error: "Failed to create booking" },
      { status: 500 }
    );
  }
}
