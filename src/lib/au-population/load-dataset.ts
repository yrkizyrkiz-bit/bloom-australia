import { prisma } from "@/lib/prisma";
import {
  AU_POPULATION_DEFAULTS,
  mergePopulationDataset,
  type AuPopulationDataset,
} from "@/lib/au-population";

export async function loadPopulationDataset(): Promise<{
  dataset: AuPopulationDataset;
  updatedAt: string | null;
  updatedBy: string | null;
  usingOverride: boolean;
}> {
  try {
    const row = await prisma.populationReferenceOverride.findUnique({
      where: { id: "default" },
    });
    if (!row?.data || typeof row.data !== "object") {
      return {
        dataset: AU_POPULATION_DEFAULTS,
        updatedAt: null,
        updatedBy: null,
        usingOverride: false,
      };
    }
    const dataset = mergePopulationDataset(
      AU_POPULATION_DEFAULTS,
      row.data as unknown as AuPopulationDataset
    );
    return {
      dataset,
      updatedAt: row.updatedAt.toISOString(),
      updatedBy: row.updatedBy,
      usingOverride: true,
    };
  } catch (error) {
    console.warn("[population-references] falling back to shipped defaults", error);
    return {
      dataset: AU_POPULATION_DEFAULTS,
      updatedAt: null,
      updatedBy: null,
      usingOverride: false,
    };
  }
}
