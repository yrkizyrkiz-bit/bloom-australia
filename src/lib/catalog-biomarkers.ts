import { getAllBiomarkerIds } from "@/data/bloodPanelConfig";

/**
 * Retired private / out-of-catalog markers. Kept for API filtering and DB cleanup —
 * they must not appear in My Biomarkers or member-facing results.
 */
export const DEPRECATED_BIOMARKER_IDS = new Set<string>([
  "apob",
  "lpa",
  "cystatin_c",
  "reverse_t3",
  "iodine",
  // legacy aliases
  "apo_b",
  "apolipoprotein_b",
  "lp_a",
  "lipoprotein_a",
]);

const catalogIds = new Set(getAllBiomarkerIds());

export function isCatalogBiomarker(biomarkerId: string): boolean {
  return catalogIds.has(biomarkerId) && !DEPRECATED_BIOMARKER_IDS.has(biomarkerId);
}

export function filterToCatalogBiomarkerIds(biomarkerIds: string[]): string[] {
  return biomarkerIds.filter(isCatalogBiomarker);
}

export function getCatalogBiomarkerIdSet(): ReadonlySet<string> {
  return catalogIds;
}
