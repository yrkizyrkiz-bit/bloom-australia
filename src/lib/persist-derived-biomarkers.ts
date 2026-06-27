import prisma from "@/lib/prisma";
import {
  ageFromDateOfBirth,
  deriveBiomarkersForEpisode,
  normalizeDeriveGender,
  type DerivedBiomarkerOutput,
} from "@/lib/derived-biomarkers";
import type { BiomarkerStatus } from "@prisma/client";
import { calculateBiomarkerStatus } from "@/lib/biomarker-status";

function dateKeyFromTestedAt(testedAt: Date): string {
  return testedAt.toISOString().split("T")[0];
}

export interface PersistDerivedResult {
  created: number;
  skippedExisting: number;
  derived: DerivedBiomarkerOutput[];
}

/**
 * Compute and persist missing derived biomarkers grouped by test date.
 * Does not overwrite values already stored for that biomarker on that date.
 */
export async function persistDerivedBiomarkersForUser(
  userId: string,
  options?: { limitDays?: number }
): Promise<PersistDerivedResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, gender: true, dateOfBirth: true },
  });

  if (!user) {
    return { created: 0, skippedExisting: 0, derived: [] };
  }

  const where: { userId: string; testedAt?: { gte: Date } } = { userId };
  if (options?.limitDays) {
    const from = new Date();
    from.setDate(from.getDate() - options.limitDays);
    where.testedAt = { gte: from };
  }

  const results = await prisma.biomarkerResult.findMany({
    where,
    select: {
      biomarkerId: true,
      value: true,
      testedAt: true,
      labReportId: true,
    },
    orderBy: { testedAt: "desc" },
  });

  if (results.length === 0) {
    return { created: 0, skippedExisting: 0, derived: [] };
  }

  const episodes = new Map<
    string,
    {
      testedAt: Date;
      labReportId: string | null;
      values: Array<{ biomarkerId: string; value: number }>;
      existingIds: Set<string>;
    }
  >();

  for (const result of results) {
    const key = dateKeyFromTestedAt(result.testedAt);
    if (!episodes.has(key)) {
      episodes.set(key, {
        testedAt: result.testedAt,
        labReportId: result.labReportId,
        values: [],
        existingIds: new Set<string>(),
      });
    }
    const episode = episodes.get(key)!;
    if (!episode.existingIds.has(result.biomarkerId)) {
      episode.existingIds.add(result.biomarkerId);
      episode.values.push({ biomarkerId: result.biomarkerId, value: result.value });
    }
  }

  const biomarkerDefs = await prisma.biomarkerDefinition.findMany();
  const biomarkerDefMap = new Map(biomarkerDefs.map(b => [b.biomarkerId, b]));

  const toCreate: Array<{
    biomarkerId: string;
    value: number;
    testedAt: Date;
    labReportId: string | null;
    notes: string;
    status: BiomarkerStatus;
  }> = [];

  let skippedExisting = 0;

  const context = {
    gender: normalizeDeriveGender(user.gender),
    ageYears: ageFromDateOfBirth(user.dateOfBirth),
  };

  for (const episode of episodes.values()) {
    const derived = deriveBiomarkersForEpisode(
      episode.values,
      context,
      episode.existingIds
    );

    for (const item of derived) {
      if (episode.existingIds.has(item.biomarkerId)) {
        skippedExisting++;
        continue;
      }

      const biomarkerDef = biomarkerDefMap.get(item.biomarkerId);
      if (!biomarkerDef) continue;

      toCreate.push({
        biomarkerId: item.biomarkerId,
        value: item.value,
        testedAt: episode.testedAt,
        labReportId: episode.labReportId,
        notes: item.notes,
        status: calculateBiomarkerStatus(item.value, biomarkerDef, user.gender),
      });
      episode.existingIds.add(item.biomarkerId);
    }
  }

  if (toCreate.length === 0) {
    return { created: 0, skippedExisting, derived: [] };
  }

  await prisma.$transaction(
    toCreate.map(item =>
      prisma.biomarkerResult.create({
        data: {
          userId,
          biomarkerId: item.biomarkerId,
          value: item.value,
          status: item.status,
          testedAt: item.testedAt,
          labReportId: item.labReportId,
          notes: item.notes,
          uploadedBy: null,
        },
      })
    )
  );

  return {
    created: toCreate.length,
    skippedExisting,
    derived: toCreate.map(item => ({
      biomarkerId: item.biomarkerId as DerivedBiomarkerOutput["biomarkerId"],
      value: item.value,
      notes: item.notes,
    })),
  };
}
