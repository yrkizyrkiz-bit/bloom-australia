import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OPEN_CONSULTATION_BOOKING_STATUSES } from "@/lib/program-journey/upcoming-consultation";

type PreTriageNote = {
  memberAddedProgram?: boolean;
  source?: string;
  label?: string;
  programKey?: string;
  programSlug?: string;
  programLabel?: string;
  panelTier?: string;
  addOrganCare?: boolean;
  priceLabel?: string;
  paymentIntentId?: string;
};

type AppointmentRow = {
  id: string;
  scheduledAt: Date;
  status: string;
  doctorId: string | null;
  doctorName: string | null;
  appointmentType: string | null;
};

function parsePreTriageNote(notes: string | null): PreTriageNote | null {
  if (!notes) return null;
  try {
    return JSON.parse(notes) as PreTriageNote;
  } catch {
    return null;
  }
}

/** GET /api/admin/triage/member-programs, pre-triage queue for portal upsells + public consult bookings */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !["ADMIN", "CARE_PARTNER", "DOCTOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tasks = await prisma.preTriageTask.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const patientIds = [...new Set(tasks.map((t) => t.patientId))];
    const linkedBookingIds = tasks.map((t) => t.bookingId).filter(Boolean) as string[];
    const now = new Date();

    const [patients, upcomingBookings, linkedBookings, doctors] = await Promise.all([
      prisma.user.findMany({
        where: { id: { in: patientIds } },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          assignedCarePartnerId: true,
          journeyStatus: true,
          subscriptionTier: true,
        },
      }),
      patientIds.length
        ? prisma.consultationBooking.findMany({
            where: {
              userId: { in: patientIds },
              status: { in: [...OPEN_CONSULTATION_BOOKING_STATUSES] },
              scheduledAt: { gte: now },
              completedAt: null,
            },
            orderBy: { scheduledAt: "asc" },
            select: {
              id: true,
              userId: true,
              scheduledAt: true,
              status: true,
              doctorId: true,
              doctorName: true,
              appointmentType: true,
            },
          })
        : Promise.resolve([]),
      linkedBookingIds.length
        ? prisma.consultationBooking.findMany({
            where: { id: { in: linkedBookingIds } },
            select: {
              id: true,
              scheduledAt: true,
              status: true,
              doctorId: true,
              doctorName: true,
              appointmentType: true,
            },
          })
        : Promise.resolve([]),
      prisma.user.findMany({
        where: { role: "DOCTOR" },
        select: { id: true, firstName: true, lastName: true },
        orderBy: { firstName: "asc" },
      }),
    ]);

    const patientMap = new Map(patients.map((p) => [p.id, p]));
    const linkedMap = new Map(linkedBookings.map((b) => [b.id, b]));
    const upcomingByUser = new Map<string, AppointmentRow[]>();
    for (const booking of upcomingBookings) {
      if (!booking.userId) continue;
      const list = upcomingByUser.get(booking.userId) ?? [];
      list.push({
        id: booking.id,
        scheduledAt: booking.scheduledAt,
        status: booking.status,
        doctorId: booking.doctorId,
        doctorName: booking.doctorName,
        appointmentType: booking.appointmentType,
      });
      upcomingByUser.set(booking.userId, list);
    }

    const items = tasks
      .map((task) => {
        const meta = parsePreTriageNote(task.notes);
        if (!meta) return null;

        const isPortalUpsell = Boolean(meta.memberAddedProgram);
        // Public consults live in In Triage (journey status), not this queue.
        // Keep subscription-only onboarding + portal add-ons when a consult exists.
        const isPublicSubscription = meta.source === "public_subscription";

        if (!isPortalUpsell && !isPublicSubscription) {
          return null;
        }

        const upcomingAppointments = upcomingByUser.get(task.patientId) ?? [];
        const booking = task.bookingId ? linkedMap.get(task.bookingId) ?? null : null;

        return {
          taskId: task.id,
          dueDate: task.dueDate,
          createdAt: task.createdAt,
          quizComplete: task.quizComplete,
          appointmentConfirmed: task.appointmentConfirmed,
          patient: patientMap.get(task.patientId) ?? null,
          booking,
          upcomingAppointments,
          purchase: {
            label: meta.label ?? meta.programLabel ?? "Program",
            source: meta.source,
            programKey: meta.programKey,
            programSlug: meta.programSlug,
            programLabel: meta.programLabel,
            panelTier: meta.panelTier,
            priceLabel: meta.priceLabel,
            memberAddedProgram: Boolean(meta.memberAddedProgram),
          },
        };
      })
      .filter(Boolean);

    return NextResponse.json({ items, doctors });
  } catch (error) {
    console.error("[admin/triage/member-programs]", error);
    return NextResponse.json({ error: "Failed to load queue" }, { status: 500 });
  }
}
