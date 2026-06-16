import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type CalendarBooking = {
  id: string;
  userId: string;
  patientName: string;
  patientEmail: string;
  type: string;
  title: string;
  scheduledAt: string;
  duration: number;
  location: string;
  status: string;
  notes?: string | null;
  program?: string | null;
  doctorName?: string | null;
  doctorId?: string | null;
  source: "appointment" | "consultation";
};

function duplicateBookingKey(booking: CalendarBooking): string {
  const scheduledAt = new Date(booking.scheduledAt);
  scheduledAt.setSeconds(0, 0);
  return `${booking.userId}:${scheduledAt.toISOString()}`;
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (
      !session?.user?.id ||
      !["admin", "ADMIN", "CARE_PARTNER", "DOCTOR"].includes(session.user.role)
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const start = searchParams.get("start");
    const end = searchParams.get("end");
    const status = searchParams.get("status");
    const userId = searchParams.get("userId");
    const isDoctor = session.user.role === "DOCTOR";

    const where: Record<string, unknown> = {};

    // Date range filter
    if (start && end) {
      where.scheduledAt = {
        gte: new Date(start),
        lte: new Date(end),
      };
    }

    // Status filter
    if (status && status !== "all") {
      where.status = status;
    }

    // User filter
    if (userId) {
      where.userId = userId;
    }

    if (isDoctor) {
      where.doctorId = session.user.id;
    }

    // Fetch appointments (legacy consultations table)
    let appointmentBookings: CalendarBooking[] = [];

    try {
      const appointments = await prisma.appointment.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: {
          scheduledAt: "asc",
        },
        take: 100,
      });

      appointmentBookings = appointments
        .filter((apt) => apt.user !== null)
        .map((apt) => ({
          id: apt.id,
          userId: apt.userId,
          patientName: [apt.user.firstName, apt.user.lastName].filter(Boolean).join(" ") || "Unknown",
          patientEmail: apt.user.email || "",
          type: apt.type || "CONSULTATION",
          title: apt.title || "Consultation",
          scheduledAt: apt.scheduledAt.toISOString(),
          duration: apt.duration || 30,
          location: apt.location || "Video",
          status: apt.status || "SCHEDULED",
          notes: apt.notes,
          source: "appointment" as const,
        }));
    } catch (e) {
      console.log("Appointment lookup skipped:", e);
    }

    // Also fetch consultation bookings if they exist
    let consultationBookings: CalendarBooking[] = [];

    try {
      const now = new Date();
      const bookings = await prisma.consultationBooking.findMany({
        where: {
          ...(start && end
            ? {
                scheduledAt: {
                  gte: new Date(start),
                  lte: new Date(end),
                },
              }
            : {}),
          ...(isDoctor ? { doctorId: session.user.id } : {}),
          OR: [
            { status: "BOOKING_CONFIRMED" },
            { status: "BOOKING_COMPLETED" },
            { status: "BOOKING_RESCHEDULED" },
            { status: "SLOT_HELD", holdExpiresAt: { gt: now } },
          ],
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              subscriptionTier: true,
            },
          },
        },
        orderBy: {
          scheduledAt: "asc",
        },
        take: 100,
      });

      // GAP-012: Filter out bookings without users and handle nullable user
      consultationBookings = bookings
        .filter((booking) => booking.user !== null)
        .map((booking) => ({
          id: booking.id,
          userId: booking.userId || "",
          patientName: booking.user
            ? [booking.user.firstName, booking.user.lastName].filter(Boolean).join(" ") || "Unknown"
            : "Unknown",
          patientEmail: booking.user?.email || "",
          type: booking.bookingType || "CONSULTATION",
          title: `${booking.user?.subscriptionTier || "Weight Management"} Consultation`,
          scheduledAt: booking.scheduledAt.toISOString(),
          duration: booking.duration || 30,
          location: "Video", // Default to video for consultation bookings
          status: booking.status || "SCHEDULED",
          notes: booking.notes,
          program: booking.user?.subscriptionTier || null,
          doctorName: booking.doctorName || null,
          doctorId: booking.doctorId || null,
          source: "consultation" as const,
        }));
    } catch (e) {
      // ConsultationBooking table may not exist
      console.log("ConsultationBooking lookup skipped:", e);
    }

    // Prefer ConsultationBooking over legacy Appointment when both represent
    // the same patient at the same minute. Triage creates a legacy appointment
    // for older workflows, but the real calendar item is ConsultationBooking.
    const consultationKeys = new Set(consultationBookings.map(duplicateBookingKey));
    const dedupedAppointmentBookings = appointmentBookings.filter(
      (booking) => !consultationKeys.has(duplicateBookingKey(booking))
    );

    // Combine and sort all bookings
    const allBookings = [...dedupedAppointmentBookings, ...consultationBookings].sort(
      (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
    );

    return NextResponse.json({
      bookings: allBookings,
      total: allBookings.length,
    });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}

// Create a new booking
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    const { userId, type, title, scheduledAt, duration, location, notes } = data;

    if (!userId || !scheduledAt) {
      return NextResponse.json(
        { error: "userId and scheduledAt are required" },
        { status: 400 }
      );
    }

    const appointment = await prisma.appointment.create({
      data: {
        userId,
        type: type || "CONSULTATION",
        title: title || "Consultation",
        scheduledAt: new Date(scheduledAt),
        duration: duration || 30,
        location: location || "Video",
        status: "SCHEDULED",
        notes,
      },
    });

    return NextResponse.json({
      booking: {
        id: appointment.id,
        userId: appointment.userId,
        type: appointment.type,
        title: appointment.title,
        scheduledAt: appointment.scheduledAt.toISOString(),
        duration: appointment.duration,
        location: appointment.location,
        status: appointment.status,
        notes: appointment.notes,
      },
    });
  } catch (error) {
    console.error("Error creating booking:", error);
    return NextResponse.json(
      { error: "Failed to create booking" },
      { status: 500 }
    );
  }
}

// Update booking status
export async function PATCH(req: NextRequest) {
  try {
    const data = await req.json();
    const { id, status, notes } = data;

    if (!id) {
      return NextResponse.json(
        { error: "Booking id is required" },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;

    const appointment = await prisma.appointment.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      booking: appointment,
    });
  } catch (error) {
    console.error("Error updating booking:", error);
    return NextResponse.json(
      { error: "Failed to update booking" },
      { status: 500 }
    );
  }
}
