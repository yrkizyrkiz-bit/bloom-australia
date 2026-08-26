import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
    const bookingIds = tasks.map((t) => t.bookingId).filter(Boolean) as string[];

    const [patients, bookings] = await Promise.all([
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
      bookingIds.length
        ? prisma.consultationBooking.findMany({
            where: { id: { in: bookingIds } },
            select: { id: true, scheduledAt: true, status: true, doctorName: true },
          })
        : Promise.resolve([]),
    ]);

    const patientMap = new Map(patients.map((p) => [p.id, p]));
    const bookingMap = new Map(bookings.map((b) => [b.id, b]));

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

        return {
          taskId: task.id,
          dueDate: task.dueDate,
          createdAt: task.createdAt,
          quizComplete: task.quizComplete,
          appointmentConfirmed: task.appointmentConfirmed,
          patient: patientMap.get(task.patientId) ?? null,
          booking: task.bookingId ? bookingMap.get(task.bookingId) ?? null : null,
          purchase: {
            label: meta.label ?? meta.programLabel ?? "Program",
            source: meta.source,
            programKey: meta.programKey,
            programSlug: meta.programSlug,
            panelTier: meta.panelTier,
            priceLabel: meta.priceLabel,
          },
        };
      })
      .filter(Boolean);

    return NextResponse.json({ items });
  } catch (error) {
    console.error("[admin/triage/member-programs]", error);
    return NextResponse.json({ error: "Failed to load queue" }, { status: 500 });
  }
}
