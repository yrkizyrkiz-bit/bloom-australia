import { prisma } from "@/lib/prisma";

export type PortalPurchaseTriagePayload = {
  source: "portal_upsell" | "portal_biomarkers" | "portal_organ_care";
  userId: string;
  paymentIntentId: string;
  programKey?: string;
  panelTier?: string;
  addOrganCare?: boolean;
  priceLabel: string;
  label: string;
};

/**
 * True when the member already has a consult in care-partner triage
 * (`PRE_TRIAGE_PENDING` + held/confirmed booking). Used to:
 * - enqueue portal upsells into Pre-Triage Queue only when a consult exists
 * - skip biomarker/program add-on tasks when they belong to that first booking
 */
export async function memberHasConsultInTriage(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { journeyStatus: true },
  });
  if (user?.journeyStatus !== "PRE_TRIAGE_PENDING") return false;

  const booking = await prisma.consultationBooking.findFirst({
    where: {
      userId,
      status: { in: ["BOOKING_CONFIRMED", "SLOT_HELD"] },
    },
    select: { id: true },
  });
  return Boolean(booking);
}

/**
 * Enqueue care-partner Pre-Triage Queue for an in-portal paid purchase.
 * Only when the member already has a consult In Triage, otherwise the purchase
 * is access-only and does not need a booking task.
 */
export async function enqueuePortalPurchaseTriage(payload: PortalPurchaseTriagePayload) {
  const inTriage = await memberHasConsultInTriage(payload.userId);
  if (!inTriage) {
    return { enqueued: false as const, reason: "no_consult_in_triage" as const };
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { firstName: true, lastName: true, assignedCarePartnerId: true },
  });

  let assignedOwnerId = user?.assignedCarePartnerId ?? null;
  if (!assignedOwnerId) {
    const partner = await prisma.user.findFirst({
      where: { role: "CARE_PARTNER" },
      select: { id: true },
    });
    assignedOwnerId = partner?.id ?? null;
  }

  const dueDate = new Date(Date.now() + 48 * 60 * 60 * 1000);
  const notes = JSON.stringify({
    ...payload,
    memberAddedProgram: true,
    appointmentConfirmed: false,
  });

  await prisma.preTriageTask.create({
    data: {
      patientId: payload.userId,
      assignedOwnerId,
      dueDate,
      status: "PENDING",
      quizComplete: true,
      appointmentConfirmed: false,
      notes,
    },
  });

  if (assignedOwnerId) {
    await prisma.notification
      .create({
        data: {
          userId: assignedOwnerId,
          type: "INFO",
          title: "Member added program",
          message: `${user?.firstName ?? "Member"} ${user?.lastName ?? ""} purchased ${payload.label}. Review with their existing consult in triage.`,
          actionUrl: "/admin/triage",
        },
      })
      .catch(() => undefined);
  }

  return { enqueued: true as const };
}
