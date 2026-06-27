import type { BiomarkerStatus } from "@prisma/client";
import prisma from "@/lib/prisma";
import { calculateBiomarkerStatus } from "@/lib/biomarker-status";

/** Recompute stored statuses when values were saved with incorrect labels (e.g. all NORMAL). */
export async function recalculateStoredBiomarkerStatuses(
  userId: string,
  gender: string
): Promise<number> {
  const results = await prisma.biomarkerResult.findMany({
    where: { userId },
    include: { biomarker: true },
  });

  const updates: Array<{ id: string; nextStatus: BiomarkerStatus }> = [];
  for (const result of results) {
    const nextStatus = calculateBiomarkerStatus(
      result.value,
      result.biomarker,
      gender
    );
    if (result.status !== nextStatus) {
      updates.push({ id: result.id, nextStatus });
    }
  }

  if (updates.length === 0) return 0;

  await prisma.$transaction(
    updates.map(({ id, nextStatus }) =>
      prisma.biomarkerResult.update({
        where: { id },
        data: { status: nextStatus },
      })
    )
  );

  return updates.length;
}
