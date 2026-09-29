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
 * - attach biomarker/organ-care add-ons to an existing In Triage consult
 * - tailor notification copy when a clinical upsell lands beside a booked consult
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
 * Clinical portal program purchases always need a Pre-Triage Queue row so care
 * can book (or review alongside an existing consult). Biomarkers / organ-care
 * add-ons only enqueue when a consult is already In Triage.
 */
function shouldEnqueuePortalPurchase(
  payload: PortalPurchaseTriagePayload,
  inTriage: boolean
): boolean {
  if (payload.source === "portal_upsell" && payload.programKey) {
    return true;
  }
  return inTriage;
}

/**
 * Enqueue care-partner Pre-Triage Queue for an in-portal paid purchase.
 * Clinical program upsells always enqueue. Biomarkers / organ-care only enqueue
 * when the member already has a consult In Triage. Never mutates bookings.
 */
export async function enqueuePortalPurchaseTriage(payload: PortalPurchaseTriagePayload) {
  const existing = await prisma.preTriageTask.findFirst({
    where: {
      patientId: payload.userId,
      notes: { contains: payload.paymentIntentId },
    },
    select: { id: true },
  });
  if (existing) {
    return { enqueued: false as const, reason: "already_enqueued" as const };
  }

  const inTriage = await memberHasConsultInTriage(payload.userId);
  if (!shouldEnqueuePortalPurchase(payload, inTriage)) {
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
    const message = inTriage
      ? `${user?.firstName ?? "Member"} ${user?.lastName ?? ""} purchased ${payload.label}. Review with their existing consult in triage.`
      : `${user?.firstName ?? "Member"} ${user?.lastName ?? ""} purchased ${payload.label}. Book their included consultation.`;

    await prisma.notification
      .create({
        data: {
          userId: assignedOwnerId,
          type: "INFO",
          title: "Member added program",
          message,
          actionUrl: "/admin/triage",
        },
      })
      .catch(() => undefined);
  }

  return { enqueued: true as const };
}
