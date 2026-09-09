import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isCatalogBiomarker } from "@/lib/catalog-biomarkers";

export type LatestBiomarkerResultRow = {
  id: string;
  userId: string;
  biomarkerId: string;
  value: number;
  status: string;
  testedAt: Date;
  uploadedAt: Date;
  uploadedBy: string | null;
  labReportId: string | null;
  notes: string | null;
  biomarker: {
    name: string;
    shortName: string;
    category: string;
    unit: string;
  };
};

/**
 * Latest result per biomarker for a member (Postgres DISTINCT ON).
 * Same semantics as loading all history and keeping the first per id after testedAt desc.
 */
export async function getLatestCatalogBiomarkerResults(
  userId: string
): Promise<LatestBiomarkerResultRow[]> {
  const rows = await prisma.$queryRaw<
    Array<{
      id: string;
      userId: string;
      biomarkerId: string;
      value: number;
      status: string;
      testedAt: Date;
      uploadedAt: Date;
      uploadedBy: string | null;
      labReportId: string | null;
      notes: string | null;
      name: string;
      shortName: string;
      category: string;
      unit: string;
    }>
  >(Prisma.sql`
    SELECT DISTINCT ON (br."biomarkerId")
      br.id,
      br."userId",
      br."biomarkerId",
      br.value,
      br.status::text AS status,
      br."testedAt",
      br."uploadedAt",
      br."uploadedBy",
      br."labReportId",
      br.notes,
      bd.name,
      bd."shortName",
      bd.category::text AS category,
      bd.unit
    FROM "BiomarkerResult" br
    INNER JOIN "BiomarkerDefinition" bd ON bd."biomarkerId" = br."biomarkerId"
    WHERE br."userId" = ${userId}
    ORDER BY br."biomarkerId", br."testedAt" DESC
  `);

  return rows
    .filter((row) => isCatalogBiomarker(row.biomarkerId))
    .map((row) => ({
      id: row.id,
      userId: row.userId,
      biomarkerId: row.biomarkerId,
      value: row.value,
      status: row.status,
      testedAt: row.testedAt,
      uploadedAt: row.uploadedAt,
      uploadedBy: row.uploadedBy,
      labReportId: row.labReportId,
      notes: row.notes,
      biomarker: {
        name: row.name,
        shortName: row.shortName,
        category: row.category,
        unit: row.unit,
      },
    }));
}

/** Distinct biomarker IDs present for readiness / coverage checks (no history payload). */
export async function getDistinctBiomarkerIdsForUser(userId: string): Promise<string[]> {
  const grouped = await prisma.biomarkerResult.groupBy({
    by: ["biomarkerId"],
    where: { userId },
  });
  return grouped.map((row) => row.biomarkerId);
}
