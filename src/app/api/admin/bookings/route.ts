import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const start = searchParams.get("start");
    const end = searchParams.get("end");
    const status = searchParams.get("status");
    const userId = searchParams.get("userId");

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

    // Fetch appointments (consultations)
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

    // Also fetch consultation bookings if they exist
    let consultationBookings: Array<{
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
    }> = [];

    try {
      const bookings = await prisma.consultationBooking.findMany({
        where: start && end ? {
          scheduledAt: {
            gte: new Date(start),
            lte: new Date(end),
          },
        } : undefined,
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
          patientName: booking.user ? `${booking.user.firstName} ${booking.user.lastName}` : "Unknown",
          patientEmail: booking.user?.email || "",
          type: booking.bookingType || "CONSULTATION",
          title: `${booking.user?.subscriptionTier || "Weight Management"} Consultation`,
          scheduledAt: booking.scheduledAt.toISOString(),
          duration: booking.duration || 30,
          location: "Video", // Default to video for consultation bookings
          status: booking.status || "SCHEDULED",
          notes: booking.notes,
          program: booking.user?.subscriptionTier || null,
        }));
    } catch (e) {
      // ConsultationBooking table may not exist
      console.log("ConsultationBooking lookup skipped:", e);
    }

    // Transform appointments to booking format
    const appointmentBookings = appointments.map((apt) => ({
      id: apt.id,
      userId: apt.userId,
      patientName: `${apt.user.firstName} ${apt.user.lastName}`,
      patientEmail: apt.user.email,
      type: apt.type || "CONSULTATION",
      title: apt.title || "Consultation",
      scheduledAt: apt.scheduledAt.toISOString(),
      duration: apt.duration || 30,
      location: apt.location || "Video",
      status: apt.status || "SCHEDULED",
      notes: apt.notes,
    }));

    // Combine and sort all bookings
    const allBookings = [...appointmentBookings, ...consultationBookings].sort(
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
