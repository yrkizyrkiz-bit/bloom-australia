import type { BiomarkerCategory as PrismaBiomarkerCategory } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { biomarkerDefinitions } from "@/data/biomarkers";

const CATEGORY_MAP: Record<string, PrismaBiomarkerCategory> = {
  heart: "HEART",
  metabolic: "METABOLIC",
  hormones: "HORMONES",
  thyroid: "THYROID",
  liver: "LIVER",
  kidney: "KIDNEY",
  blood: "BLOOD",
  vitamins: "VITAMINS",
  minerals: "MINERALS",
  inflammation: "INFLAMMATION",
  immunity: "IMMUNITY",
};

function toPrismaCategory(category: string): PrismaBiomarkerCategory {
  return CATEGORY_MAP[category.toLowerCase()] ?? "METABOLIC";
}

function catalogRows(ids?: string[]) {
  const wanted = ids?.length ? new Set(ids) : null;
  return biomarkerDefinitions.filter((b) => !wanted || wanted.has(b.id));
}

/**
 * Ensure code-catalog biomarkers have matching BiomarkerDefinition rows.
 * By default only creates missing rows (cheap on every save). Pass
 * `updateExisting: true` for full seed-style refresh of ranges/copy.
 */
export async function ensureCatalogBiomarkerDefinitions(
  ids?: string[],
  options?: { updateExisting?: boolean }
): Promise<{
  ensured: number;
  created: number;
  updated: number;
}> {
  const rows = catalogRows(ids);
  if (rows.length === 0) {
    return { ensured: 0, created: 0, updated: 0 };
  }

  const existing = await prisma.biomarkerDefinition.findMany({
    where: { biomarkerId: { in: rows.map((b) => b.id) } },
    select: { biomarkerId: true },
  });
  const existingIds = new Set(existing.map((e) => e.biomarkerId));

  let created = 0;
  let updated = 0;
  const updateExisting = options?.updateExisting === true;

  for (const biomarker of rows) {
    const data = {
      name: biomarker.name,
      shortName: biomarker.shortName,
      category: toPrismaCategory(biomarker.category),
      description: biomarker.description,
      whyItMatters: biomarker.whyItMatters,
      unit: biomarker.ranges.male.unit,
      maleRanges: {
        low: biomarker.ranges.male.low,
        optimal_low: biomarker.ranges.male.optimal_low,
        optimal_high: biomarker.ranges.male.optimal_high,
        high: biomarker.ranges.male.high,
      },
      femaleRanges: {
        low: biomarker.ranges.female.low,
        optimal_low: biomarker.ranges.female.optimal_low,
        optimal_high: biomarker.ranges.female.optimal_high,
        high: biomarker.ranges.female.high,
      },
      improvementTips: biomarker.improvementTips,
      relatedBiomarkerIds: biomarker.relatedBiomarkers || [],
      isActive: true,
    };

    if (existingIds.has(biomarker.id)) {
      if (!updateExisting) continue;
      await prisma.biomarkerDefinition.update({
        where: { biomarkerId: biomarker.id },
        data,
      });
      updated++;
    } else {
      await prisma.biomarkerDefinition.create({
        data: {
          biomarkerId: biomarker.id,
          ...data,
        },
      });
      created++;
    }
  }

  if (created > 0 || updated > 0) {
    console.log(
      `[biomarker-defs] Synced catalog → DB: created ${created}, updated ${updated} (of ${rows.length})`
    );
  }

  return { ensured: rows.length, created, updated };
}

/** True when the ID exists in the code catalog (safe to auto-create). */
export function isCodeCatalogBiomarkerId(biomarkerId: string): boolean {
  return biomarkerDefinitions.some((b) => b.id === biomarkerId);
}
