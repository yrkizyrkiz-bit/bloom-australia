import { prisma } from "@/lib/prisma";
import type { JourneyStatus, ScriptStatus } from "@prisma/client";

/** Maps prescription script status → user journey (WM only). */
export const WM_SCRIPT_TO_JOURNEY: Partial<Record<ScriptStatus, JourneyStatus>> = {
  SCRIPT_WRITTEN: "SCRIPT_WRITTEN",
  SCRIPT_SENT_TO_PHARMACY: "PHARMACY_PENDING",
  PHARMACY_PENDING: "PHARMACY_PENDING",
  DISPENSING: "DISPENSING",
  SHIPPED: "SHIPPED",
  DELIVERED: "DELIVERED",
};

const WM_PORTAL_FROM_SCRIPT: Partial<Record<ScriptStatus, string>> = {
  SCRIPT_WRITTEN: "TREATMENT_PENDING",
  SCRIPT_SENT_TO_PHARMACY: "TREATMENT_PENDING",
  PHARMACY_PENDING: "TREATMENT_PENDING",
  DISPENSING: "TREATMENT_PENDING",
  SHIPPED: "TREATMENT_PENDING",
  DELIVERED: "TREATMENT_ACTIVE",
};

/**
 * Sync WM user journey + intake portal status from script status.
 * No-op if user has no WM intake (other programs untouched).
 */
export async function syncWMJourneyFromScript(
  userId: string,
  scriptStatus: ScriptStatus
) {
  const journey = WM_SCRIPT_TO_JOURNEY[scriptStatus];
  if (!journey) return;

  await prisma.user.update({
    where: { id: userId },
    data: { journeyStatus: journey },
  });

  const portalStatus = WM_PORTAL_FROM_SCRIPT[scriptStatus];
  if (!portalStatus) return;

  const intake = await prisma.weightManagementIntake.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  if (intake) {
    await prisma.weightManagementIntake.update({
      where: { id: intake.id },
      data: { portalStatus: portalStatus as "TREATMENT_PENDING" | "TREATMENT_ACTIVE" },
    });
  }
}
