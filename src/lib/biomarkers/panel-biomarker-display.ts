import { bloodPanelConfig, getBiomarkerFromPanel, type BloodPanelCategoryKey } from "@/data/bloodPanelConfig";
import { getBiomarkerById } from "@/data/biomarkers";
import {
  getBiomarkerTierMarkerIds,
  type BiomarkerSubscriptionTier,
} from "@/lib/biomarkers/public-subscription-panels";
import {
  FUNCTION_STYLE_CALCULATED_IDS,
  FUNCTION_STYLE_CATEGORIES,
  buildFunctionStyleMarkerUniverse,
  type FunctionStyleCategory,
  type FunctionStyleCategoryId,
} from "@/lib/biomarkers/function-style-categories";

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
  "remnant_cholesterol",
  "atherogenic_coefficient",
  "homa_b",
  "quicki",
  "mcauley_index",
  "uric_acid_hdl_ratio",
  "fib4",
  "apri",
  "sii",
  "siri",
  "mlr",
  "nhr",
  "corrected_calcium",
  "calculated_osmolality",
  "mentzer_index",
  "kdigo_risk",
  "tsh_index",
  "phenotypic_age",
  "age_acceleration",
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

const FUNCTION_CATEGORY_BADGE: Record<FunctionStyleCategoryId, string> = {
  heart: "bg-red-500",
  thyroid: "bg-purple-500",
  immune: "bg-orange-500",
  "female-health": "bg-pink-500",
  "male-health": "bg-rose-600",
  metabolic: "bg-amber-500",
  nutrients: "bg-teal-500",
  "biological-age": "bg-indigo-500",
  liver: "bg-emerald-500",
  blood: "bg-rose-500",
  kidneys: "bg-sky-500",
};

function resolveMarkerForDisplay(
  id: string,
  functionCategory: FunctionStyleCategory
): PanelBiomarkerDisplay | null {
  const panelEntry = getBiomarkerFromPanel(id);
  const definition = getBiomarkerById(id);
  const isDerived = DERIVED_IDS.has(id) || FUNCTION_STYLE_CALCULATED_IDS.has(id);
  const categoryColor = FUNCTION_CATEGORY_BADGE[functionCategory.id];

  if (panelEntry) {
    const { biomarker } = panelEntry;
    return {
      id,
      shortName: biomarker.shortName || biomarker.name.slice(0, 4),
      name: biomarker.name,
      categoryKey: panelEntry.category,
      categoryName: functionCategory.name,
      categoryColor,
      unit: biomarker.unit,
      description:
        definition?.description ?? biomarker.note ?? bloodPanelConfig[panelEntry.category].description,
      rangeLabel: isDerived
        ? "Calculated in your portal"
        : formatRangeLabel(biomarker.optimalLow, biomarker.optimalHigh, biomarker.unit),
      isDerived,
    };
  }

  if (definition) {
    return {
      id,
      shortName: definition.shortName || definition.name.slice(0, 4),
      name: definition.name,
      categoryKey: mapDefinitionCategory(definition.category),
      categoryName: functionCategory.name,
      categoryColor,
      unit: definition.ranges.male.unit,
      description: definition.description,
      rangeLabel: isDerived
        ? "Calculated in your portal"
        : formatRangeLabel(
            definition.ranges.male.optimal_low,
            definition.ranges.male.optimal_high,
            definition.ranges.male.unit
          ),
      isDerived,
    };
  }

  return null;
}

/**
 * Markers available for a tier in Function-style grouping:
 * tier set ∪ calculated markers surfaced on intake.
 */
export function getTierMarkerIdUniverse(tier: BiomarkerSubscriptionTier): Set<string> {
  return buildFunctionStyleMarkerUniverse(
    tier,
    getBiomarkerTierMarkerIds(tier),
    tier === "complete" ? getBiomarkerTierMarkerIds("advanced") : undefined
  );
}

const ESSENTIAL_PORTAL_MARKER_IDS = getTierMarkerIdUniverse("essential");

/** Subscription Essential catalogue (measured + calculated), including Free T aliases. */
export function isEssentialPortalMarker(id: string): boolean {
  if (ESSENTIAL_PORTAL_MARKER_IDS.has(id)) return true;
  if (id === "free_testosterone" || id === "testosterone_free") {
    return (
      ESSENTIAL_PORTAL_MARKER_IDS.has("free_testosterone") ||
      ESSENTIAL_PORTAL_MARKER_IDS.has("testosterone_free")
    );
  }
  return false;
}

/**
 * Portal cards: Essential always (pending or resulted).
 * Advanced / Complete extras only when a result exists.
 */
export function shouldShowPortalMarkerCard(id: string, hasResult: boolean): boolean {
  return hasResult || isEssentialPortalMarker(id);
}

export type FunctionStyleCategoryPreview = FunctionStyleCategory & {
  markerCount: number;
  markers: PanelBiomarkerDisplay[];
};

/** Function-style categories for intake, with resolved markers and accurate counts. */
export function getFunctionStyleCategoriesForTier(
  tier: BiomarkerSubscriptionTier
): FunctionStyleCategoryPreview[] {
  const universe = getTierMarkerIdUniverse(tier);

  return FUNCTION_STYLE_CATEGORIES.filter((cat) => cat.tiers.includes(tier))
    .map((cat) => {
      const markers: PanelBiomarkerDisplay[] = [];
      const seen = new Set<string>();
      for (const id of cat.markerIds) {
        const resolvedId =
          id === "free_testosterone" && !universe.has(id) && universe.has("testosterone_free")
            ? "testosterone_free"
            : id;
        if (!universe.has(resolvedId) && !universe.has(id)) continue;
        if (seen.has(resolvedId)) continue;
        const marker = resolveMarkerForDisplay(resolvedId, cat);
        if (!marker) continue;
        seen.add(resolvedId);
        markers.push(marker);
      }
      return {
        ...cat,
        markers,
        markerCount: markers.length,
      };
    })
    .filter((cat) => cat.markerCount > 0);
}

/** Flat unique markers across Function categories (for plan totals if needed). */
export function getFunctionStyleBiomarkersForDisplay(
  tier: BiomarkerSubscriptionTier
): PanelBiomarkerDisplay[] {
  const categories = getFunctionStyleCategoriesForTier(tier);
  const byId = new Map<string, PanelBiomarkerDisplay>();
  for (const cat of categories) {
    for (const marker of cat.markers) {
      if (!byId.has(marker.id)) byId.set(marker.id, marker);
    }
  }
  return [...byId.values()];
}

/** Unique Function-style totals shown on intake / plan cards (tested + calculated). */
export function getTierDisplayMarkerCounts(tier: BiomarkerSubscriptionTier): {
  total: number;
  measurable: number;
  derived: number;
} {
  const markers = getFunctionStyleBiomarkersForDisplay(tier);
  const measurable = markers.filter((m) => !m.isDerived).length;
  const derived = markers.length - measurable;
  return { total: markers.length, measurable, derived };
}

export { CATEGORY_BADGE, CATEGORY_ORDER, FUNCTION_CATEGORY_BADGE };
