import { prisma } from "@/lib/prisma";

export type PortalPurchaseTriagePayload = {
  source: "portal_upsell" | "portal_biomarkers";
  userId: string;
  paymentIntentId: string;
  programKey?: string;
  panelTier?: string;
  addOrganCare?: boolean;
  priceLabel: string;
  label: string;
};

/** Enqueue care-partner pre-triage for an in-portal paid purchase. */
export async function enqueuePortalPurchaseTriage(payload: PortalPurchaseTriagePayload) {
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
    await prisma.notification.create({
      data: {
        userId: assignedOwnerId,
        type: "INFO",
        title: "Member added program",
        message: `${user?.firstName ?? "Member"} ${user?.lastName ?? ""} purchased ${payload.label}. Book consultation.`,
        actionUrl: "/admin/triage",
      },
    }).catch(() => undefined);
  }

  if (!user?.assignedCarePartnerId && assignedOwnerId) {
    await prisma.user.update({
      where: { id: payload.userId },
      data: { assignedCarePartnerId: assignedOwnerId, journeyStatus: "PRE_TRIAGE_PENDING" },
    });
  }
}
