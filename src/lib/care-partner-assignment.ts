import { prisma } from "@/lib/prisma";

/** Patients assigned to this care partner, plus unassigned patients they can pick up. */
export function carePartnerPatientFilter(carePartnerId: string) {
  return {
    OR: [
      { assignedCarePartnerId: carePartnerId },
      { assignedCarePartnerId: null },
    ],
  };
}

export async function getLeastLoadedCarePartner(): Promise<string | null> {
  const carePartners = await prisma.user.findMany({
    where: { role: "CARE_PARTNER" },
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });

  if (carePartners.length === 0) return null;

  const counts = await prisma.user.groupBy({
    by: ["assignedCarePartnerId"],
    where: {
      assignedCarePartnerId: { in: carePartners.map((cp) => cp.id) },
      role: "MEMBER",
    },
    _count: true,
  });

  const countMap = new Map(
    counts.map((c) => [c.assignedCarePartnerId, c._count])
  );

  let leastLoaded = carePartners[0].id;
  let minCount = countMap.get(leastLoaded) ?? 0;

  for (const cp of carePartners) {
    const count = countMap.get(cp.id) ?? 0;
    if (count < minCount) {
      minCount = count;
      leastLoaded = cp.id;
    }
  }

  return leastLoaded;
}

/** Assign a care partner to a patient if not already assigned. Returns the care partner id. */
export async function assignCarePartnerToPatient(
  patientId: string,
  carePartnerId?: string | null
): Promise<string | null> {
  const patient = await prisma.user.findUnique({
    where: { id: patientId },
    select: { assignedCarePartnerId: true },
  });

  if (!patient) return null;
  if (patient.assignedCarePartnerId) return patient.assignedCarePartnerId;

  const partnerId = carePartnerId ?? (await getLeastLoadedCarePartner());
  if (!partnerId) return null;

  await prisma.user.update({
    where: { id: patientId },
    data: { assignedCarePartnerId: partnerId },
  });

  await prisma.preTriageTask.updateMany({
    where: { patientId, assignedOwnerId: null },
    data: { assignedOwnerId: partnerId },
  });

  return partnerId;
}
