import { prisma } from "@/lib/prisma";
import {
  OPEN_CONSULTATION_BOOKING_STATUSES,
  resolveUpcomingConsultation,
  toPortalConsultation,
  type PortalConsultation,
} from "@/lib/program-journey/upcoming-consultation";

export async function loadPortalConsultation(
  userId: string,
  journeyStatus?: string | null
): Promise<PortalConsultation | null> {
  const [openBooking, completedBooking, intake] = await Promise.all([
    prisma.consultationBooking.findFirst({
      where: {
        userId,
        completedAt: null,
        status: { in: [...OPEN_CONSULTATION_BOOKING_STATUSES] },
      },
      orderBy: { scheduledAt: "asc" },
      select: { scheduledAt: true, doctorName: true },
    }),
    prisma.consultationBooking.findFirst({
      where: {
        userId,
        OR: [{ completedAt: { not: null } }, { status: "BOOKING_COMPLETED" }],
      },
      select: { id: true },
    }),
    prisma.weightManagementIntake.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { scheduledAt: true },
    }),
  ]);

  return toPortalConsultation(
    resolveUpcomingConsultation({
      journeyStatus,
      openBooking,
      hasCompletedBooking: Boolean(completedBooking),
      intakeScheduledAt: intake?.scheduledAt ?? null,
    })
  );
}
