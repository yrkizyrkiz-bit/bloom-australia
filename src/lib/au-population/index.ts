import { AU_POPULATION_DEFAULTS } from "./defaults";
import { calculatePercentile } from "./stats-math";
import {
  AU_POPULATION_AGE_BANDS,
  type AuAgeBandId,
  type AuBandStats,
  type AuMarkerDefinition,
  type AuPopulationCategory,
  type AuPopulationDataset,
  type AuSex,
} from "./types";

export * from "./types";
export { AU_POPULATION_DEFAULTS } from "./defaults";
export { calculatePercentile } from "./stats-math";

export function ageYearsFromDob(dob: string | Date | null | undefined): number | null {
  if (!dob) return null;
  const date = dob instanceof Date ? dob : new Date(dob);
  if (Number.isNaN(date.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - date.getFullYear();
  const month = now.getMonth() - date.getMonth();
  if (month < 0 || (month === 0 && now.getDate() < date.getDate())) age -= 1;
  if (age < 0 || age > 120) return null;
  return age;
}

export function ageBandForYears(age: number | null): AuAgeBandId {
  if (age == null) return "45-54";
  const band = AU_POPULATION_AGE_BANDS.find((b) => age >= b.min && age <= b.max);
  if (!band) return age < 18 ? "18-24" : "75+";
  return band.id;
}

export function ageBandLabel(id: AuAgeBandId): string {
  return AU_POPULATION_AGE_BANDS.find((b) => b.id === id)?.label ?? id;
}

export function mergePopulationDataset(
  base: AuPopulationDataset,
  override: AuPopulationDataset | null | undefined
): AuPopulationDataset {
  if (!override?.markers?.length) return base;
  const byId = new Map(base.markers.map((m) => [m.biomarkerId, structuredClone(m)]));
  for (const marker of override.markers) {
    const existing = byId.get(marker.biomarkerId);
    if (!existing) {
      byId.set(marker.biomarkerId, structuredClone(marker));
      continue;
    }
    existing.name = marker.name ?? existing.name;
    existing.unit = marker.unit ?? existing.unit;
    existing.higherIsBetter = marker.higherIsBetter ?? existing.higherIsBetter;
    existing.category = marker.category ?? existing.category;
    existing.stats = marker.stats ?? existing.stats;
  }
  return {
    version: Math.max(base.version, override.version || 0),
    sources: override.sources?.length ? override.sources : base.sources,
    markers: Array.from(byId.values()),
  };
}

export function lookupMarkerStats(
  dataset: AuPopulationDataset,
  biomarkerId: string,
  sex: AuSex,
  ageBand: AuAgeBandId
): { marker: AuMarkerDefinition; stats: AuBandStats } | null {
  const marker = dataset.markers.find((m) => m.biomarkerId === biomarkerId);
  if (!marker) return null;
  const stats = marker.stats[sex]?.[ageBand];
  if (!stats) return null;
  return { marker, stats };
}

export function markersForCategory(
  dataset: AuPopulationDataset,
  category: AuPopulationCategory
): AuMarkerDefinition[] {
  return dataset.markers.filter((m) => m.category === category);
}

export function compareResultToPopulation(options: {
  dataset: AuPopulationDataset;
  biomarkerId: string;
  value: number;
  sex: AuSex;
  ageBand: AuAgeBandId;
}) {
  const found = lookupMarkerStats(
    options.dataset,
    options.biomarkerId,
    options.sex,
    options.ageBand
  );
  if (!found) return null;
  const percentile = calculatePercentile(
    options.value,
    found.stats.mean,
    found.stats.p25,
    found.stats.p75,
    found.marker.higherIsBetter
  );
  return { ...found, percentile };
}
