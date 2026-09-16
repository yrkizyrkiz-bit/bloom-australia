import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isCatalogBiomarker } from "@/lib/catalog-biomarkers";
import { filterToLatestPanelDate, getLatestPanelDateKey } from "@/lib/biomarkers/panel-scoped";

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

type RawLatestRow = {
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
};

function mapRawRows(rows: RawLatestRow[]): LatestBiomarkerResultRow[] {
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

/**
 * Latest result per biomarker for a member (Postgres DISTINCT ON).
 * Lifetime semantics — use for goals / longitudinal “most recent known value”.
 *
 * For dashboard / “current panel” UIs prefer {@link getLatestPanelCatalogBiomarkerResults}.
 */
export async function getLatestCatalogBiomarkerResults(
  userId: string
): Promise<LatestBiomarkerResultRow[]> {
  const rows = await prisma.$queryRaw<RawLatestRow[]>(Prisma.sql`
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

  return mapRawRows(rows);
}

/**
 * Results actually present on the member’s newest blood-panel date (UTC day).
 * Does not backfill missing markers from older panels.
 */
export async function getLatestPanelCatalogBiomarkerResults(
  userId: string
): Promise<LatestBiomarkerResultRow[]> {
  const maxRow = await prisma.biomarkerResult.findFirst({
    where: { userId },
    orderBy: { testedAt: "desc" },
    select: { testedAt: true },
  });
  if (!maxRow) return [];

  const panelDate = getLatestPanelDateKey([maxRow]);
  if (!panelDate) return [];

  // Inclusive UTC day window matching history API day keys.
  const dayStart = new Date(`${panelDate}T00:00:00.000Z`);
  const dayEnd = new Date(`${panelDate}T23:59:59.999Z`);

  const rows = await prisma.$queryRaw<RawLatestRow[]>(Prisma.sql`
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
      AND br."testedAt" >= ${dayStart}
      AND br."testedAt" <= ${dayEnd}
    ORDER BY br."biomarkerId", br."testedAt" DESC
  `);

  // Defence in depth: same panel filter as pure helper (handles clock skew edge cases).
  return filterToLatestPanelDate(mapRawRows(rows));
}

/** Distinct biomarker IDs present for readiness / coverage checks (no history payload). */
export async function getDistinctBiomarkerIdsForUser(userId: string): Promise<string[]> {
  const grouped = await prisma.biomarkerResult.groupBy({
    by: ["biomarkerId"],
    where: { userId },
  });
  return grouped.map((row) => row.biomarkerId);
}
