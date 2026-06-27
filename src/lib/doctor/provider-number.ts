import { prisma } from "@/lib/prisma";

const PROVIDER_LOG_ACTION = "DOCTOR_MEDICARE_PROVIDER_SAVED";

async function readSavedProviderNumber(doctorUserId: string): Promise<string | null> {
  const logs = await prisma.activityLog.findMany({
    where: {
      userId: doctorUserId,
      action: PROVIDER_LOG_ACTION,
    },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { details: true },
  });

  for (const log of logs) {
    const details = log.details as Record<string, unknown> | null;
    const value = details?.providerNumber;
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

/** Resolve Medicare provider number: request body → saved profile log → latest prescription. */
export async function resolveDoctorProviderNumber(
  doctorUserId: string,
  fromRequest?: string | null
): Promise<{ providerNumber: string | null; source: string | null }> {
  const trimmedRequest = fromRequest?.trim();
  if (trimmedRequest) {
    return { providerNumber: trimmedRequest, source: "Referral form" };
  }

  const saved = await readSavedProviderNumber(doctorUserId);
  if (saved) {
    return { providerNumber: saved, source: "Doctor account profile" };
  }

  const latestPrescription = await prisma.prescription.findFirst({
    where: { prescriberId: doctorUserId },
    orderBy: { prescribedAt: "desc" },
    select: { prescriberLicense: true },
  });

  if (latestPrescription?.prescriberLicense?.trim()) {
    return {
      providerNumber: latestPrescription.prescriberLicense.trim(),
      source: "Latest prescription record",
    };
  }

  return { providerNumber: null, source: null };
}

export async function saveDoctorProviderNumber(
  doctorUserId: string,
  providerNumber: string
): Promise<void> {
  const trimmed = providerNumber.trim();
  if (!trimmed) return;

  await prisma.activityLog.create({
    data: {
      userId: doctorUserId,
      action: PROVIDER_LOG_ACTION,
      entity: "user",
      entityId: doctorUserId,
      details: {
        providerNumber: trimmed,
        savedAt: new Date().toISOString(),
      },
    },
  });
}

export function providerNumberStorageKey(doctorUserId: string): string {
  return `sanative-doctor-provider-${doctorUserId}`;
}
