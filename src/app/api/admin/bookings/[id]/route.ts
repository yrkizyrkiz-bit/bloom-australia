import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  rescheduleConsultationBooking,
  cancelConsultationBooking,
  updateConsultationBookingStatus,
  assignDoctorToConsultationBooking,
  getBookingChangeHistory,
  findBookingById,
} from "@/lib/booking-manage";

async function requireStaff() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true },
  });

  if (!user || !["ADMIN", "CARE_PARTNER"].includes(user.role)) {
    return { error: NextResponse.json({ error: "Access denied" }, { status: 403 }) };
  }

  return { user };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireStaff();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const found = await findBookingById(id);
  if (!found) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  if (found.source === "appointment") {
    return NextResponse.json({ source: "appointment", history: [] });
  }

  const history = await getBookingChangeHistory(id);
  return NextResponse.json({ source: "consultation", history });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireStaff();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const body = await req.json();
  const { action, scheduledAt, slotId, reason, status, notifyMember, doctorId } = body;

  const actor = { userId: auth.user.id, role: auth.user.role };

  try {
    const found = await findBookingById(id);
    if (!found) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (found.source === "appointment") {
      if (action === "update_status" && status) {
        const appointment = await prisma.appointment.update({
          where: { id },
          data: { status },
        });
        return NextResponse.json({ success: true, booking: appointment, source: "appointment" });
      }

      if (action === "reschedule" && scheduledAt) {
        const appointment = await prisma.appointment.update({
          where: { id },
          data: { scheduledAt: new Date(scheduledAt) },
        });
        return NextResponse.json({ success: true, booking: appointment, source: "appointment" });
      }

      if (action === "cancel") {
        const appointment = await prisma.appointment.update({
          where: { id },
          data: { status: "CANCELLED" },
        });
        return NextResponse.json({ success: true, booking: appointment, source: "appointment" });
      }

      return NextResponse.json({ error: "Invalid action for appointment" }, { status: 400 });
    }

    if (action === "reschedule") {
      if (!reason?.trim()) {
        return NextResponse.json({ error: "Reason is required for reschedule" }, { status: 400 });
      }
      const booking = await rescheduleConsultationBooking(id, actor, {
        scheduledAt,
        slotId,
        reason: reason.trim(),
        notifyMember: notifyMember !== false,
      });
      return NextResponse.json({ success: true, booking, source: "consultation" });
    }

    if (action === "cancel") {
      if (!reason?.trim()) {
        return NextResponse.json({ error: "Reason is required for cancellation" }, { status: 400 });
      }
      const booking = await cancelConsultationBooking(id, actor, {
        reason: reason.trim(),
        notifyMember: notifyMember !== false,
      });
      return NextResponse.json({ success: true, booking, source: "consultation" });
    }

    if (action === "update_status") {
      if (!status) {
        return NextResponse.json({ error: "Status is required" }, { status: 400 });
      }
      const booking = await updateConsultationBookingStatus(id, actor, {
        status,
        reason: reason?.trim(),
      });
      return NextResponse.json({ success: true, booking, source: "consultation" });
    }

    if (action === "assign_doctor") {
      if (!doctorId) {
        return NextResponse.json({ error: "doctorId is required" }, { status: 400 });
      }
      const booking = await assignDoctorToConsultationBooking(id, doctorId, actor);
      return NextResponse.json({ success: true, booking, source: "consultation" });
    }

    return NextResponse.json(
      { error: "Invalid action. Use reschedule, cancel, update_status, or assign_doctor" },
      { status: 400 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update booking";
    console.error("[Admin Bookings PATCH]", error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
