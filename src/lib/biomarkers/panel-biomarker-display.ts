import { bloodPanelConfig, getBiomarkerFromPanel, type BloodPanelCategoryKey } from "@/data/bloodPanelConfig";
import { getBiomarkerById } from "@/data/biomarkers";
import {
  getBiomarkerTierMarkerIds,
  type BiomarkerSubscriptionTier,
} from "@/lib/biomarkers/public-subscription-panels";

export type PanelBiomarkerDisplay = {
  id: string;
  shortName: string;
  name: string;
  categoryKey: BloodPanelCategoryKey;
  categoryName: string;
  categoryColor: string;
  unit: string;
  description: string;
  rangeLabel: string;
  isDerived: boolean;
};

const CATEGORY_BADGE: Record<BloodPanelCategoryKey, string> = {
  heart: "bg-red-500",
  metabolism: "bg-amber-500",
  thyroid: "bg-purple-500",
  hormones: "bg-pink-500",
  nutrients: "bg-teal-500",
  liver: "bg-emerald-500",
  kidney: "bg-sky-500",
  blood: "bg-rose-500",
  inflammation: "bg-orange-500",
};

const DERIVED_IDS = new Set([
  "non_hdl_cholesterol",
  "tc_hdl_ratio",
  "ldl_hdl_ratio",
  "tg_hdl_ratio",
  "homa_ir",
  "egfr",
  "globulin",
  "transferrin_saturation",
  "atherogenic_index_plasma",
  "vldl_cholesterol",
  "albumin_globulin_ratio",
  "ast_alt_ratio",
  "indirect_bilirubin",
  "bilirubin_albumin_ratio",
  "tyg_index",
  "estimated_average_glucose",
  "urea_creatinine_ratio",
  "anion_gap",
  "free_t3_t4_ratio",
  "free_androgen_index",
  "crp_albumin_ratio",
  "ferritin_albumin_ratio",
  "nlr",
  "platelet_lymphocyte_ratio",
]);

const CATEGORY_ORDER: BloodPanelCategoryKey[] = [
  "heart",
  "metabolism",
  "thyroid",
  "hormones",
  "nutrients",
  "liver",
  "kidney",
  "blood",
  "inflammation",
];

function formatRangeLabel(
  optimalLow: number,
  optimalHigh: number,
  unit: string
): string {
  if (!unit) return "Calculated in portal";
  return `${optimalLow}–${optimalHigh} ${unit}`;
}

export function getTierBiomarkersForDisplay(
  tier: BiomarkerSubscriptionTier
): PanelBiomarkerDisplay[] {
  const ids = [...getBiomarkerTierMarkerIds(tier)];

  const items: PanelBiomarkerDisplay[] = [];

  for (const id of ids) {
    const panelEntry = getBiomarkerFromPanel(id);
    const definition = getBiomarkerById(id);
    const isDerived = DERIVED_IDS.has(id);

    if (panelEntry) {
      const { category, biomarker } = panelEntry;
      const config = bloodPanelConfig[category];
      items.push({
        id,
        shortName: biomarker.shortName || biomarker.name.slice(0, 4),
        name: biomarker.name,
        categoryKey: category,
        categoryName: config.name.replace(" Health", "").replace(" Panel", ""),
        categoryColor: CATEGORY_BADGE[category],
        unit: biomarker.unit,
        description:
          definition?.description ??
          biomarker.note ??
          config.description,
        rangeLabel: isDerived
          ? "Calculated in your portal"
          : formatRangeLabel(biomarker.optimalLow, biomarker.optimalHigh, biomarker.unit),
        isDerived,
      });
      continue;
    }

    if (definition) {
      const categoryKey = mapDefinitionCategory(definition.category);
      items.push({
        id,
        shortName: definition.shortName || definition.name.slice(0, 4),
        name: definition.name,
        categoryKey,
        categoryName: bloodPanelConfig[categoryKey]?.name.replace(" Health", "") ?? categoryKey,
        categoryColor: CATEGORY_BADGE[categoryKey],
        unit: definition.ranges.male.unit,
        description: definition.description,
        rangeLabel: formatRangeLabel(
          definition.ranges.male.optimal_low,
          definition.ranges.male.optimal_high,
          definition.ranges.male.unit
        ),
        isDerived,
      });
    }
  }

  return items.sort((a, b) => {
    const catDiff =
      CATEGORY_ORDER.indexOf(a.categoryKey) - CATEGORY_ORDER.indexOf(b.categoryKey);
    if (catDiff !== 0) return catDiff;
    return a.name.localeCompare(b.name);
  });
}

function mapDefinitionCategory(
  category: string
): BloodPanelCategoryKey {
  switch (category) {
    case "metabolic":
      return "metabolism";
    case "vitamins":
    case "minerals":
      return "nutrients";
    case "immunity":
      return "inflammation";
    default:
      return category as BloodPanelCategoryKey;
  }
}

export function countBiomarkersByCategory(
  biomarkers: PanelBiomarkerDisplay[]
): Record<BloodPanelCategoryKey, number> {
  const counts = Object.fromEntries(
    CATEGORY_ORDER.map((key) => [key, 0])
  ) as Record<BloodPanelCategoryKey, number>;

  for (const marker of biomarkers) {
    counts[marker.categoryKey] = (counts[marker.categoryKey] ?? 0) + 1;
  }
  return counts;
}

export { CATEGORY_BADGE, CATEGORY_ORDER };
