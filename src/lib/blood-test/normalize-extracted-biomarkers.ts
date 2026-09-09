import { biomarkerDefinitions } from "@/data/biomarkers";

const ID_ALIASES: Record<string, string> = {
  haemoglobin: "hemoglobin",
  haematocrit: "hematocrit",
  leucocytes: "wbc",
  leukocytes: "wbc",
  wcc: "wbc",
  rcc: "rbc",
  plt: "platelets",
  trig: "triglycerides",
  trigs: "triglycerides",
  chol: "total_cholesterol",
  cholesterol: "total_cholesterol",
  ldl: "ldl_cholesterol",
  ldl_c: "ldl_cholesterol",
  hdl: "hdl_cholesterol",
  hdl_c: "hdl_cholesterol",
  vit_d: "vitamin_d",
  vit_b12: "vitamin_b12",
  b12: "vitamin_b12",
  tbil: "bilirubin_total",
  total_bilirubin: "bilirubin_total",
  dbil: "bilirubin_direct",
  direct_bilirubin: "bilirubin_direct",
  alk_phos: "alp",
  alkaline_phosphatase: "alp",
  egfr_ckd_epi: "egfr",
  estimated_gfr: "egfr",
  hs_crp: "crp",
  hscrp: "crp",
  fbg: "glucose",
  fasting_glucose: "glucose",
  a1c: "hba1c",
  hb_a1c: "hba1c",
  lymph: "lymphocytes",
  lymphs: "lymphocytes",
  lymphocyte: "lymphocytes",
  lymphocyte_pct: "lymphocyte_percent",
  lymphocytes_percent: "lymphocyte_percent",
  lymphocytes_pct: "lymphocyte_percent",
};

function normalizeKey(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[%]/g, " percent ")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

const catalogById = new Map(biomarkerDefinitions.map((b) => [b.id, b]));

/**
 * Coerce AI values like "126", "126 L", "1,234.5" into finite numbers.
 */
export function coerceBiomarkerValue(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return null;
  const cleaned = value.replace(/,/g, "").match(/-?\d+(?:\.\d+)?/);
  if (!cleaned) return null;
  const num = Number(cleaned[0]);
  return Number.isFinite(num) ? num : null;
}

/**
 * Map AI biomarker IDs / names onto catalog IDs.
 */
export function resolveCatalogBiomarkerId(
  biomarkerId?: string | null,
  name?: string | null
): string | null {
  if (biomarkerId) {
    const key = normalizeKey(biomarkerId);
    if (catalogById.has(key)) return key;
    if (ID_ALIASES[key] && catalogById.has(ID_ALIASES[key])) {
      return ID_ALIASES[key];
    }
  }

  const nameKey = name ? normalizeKey(name) : "";
  if (nameKey) {
    if (catalogById.has(nameKey)) return nameKey;
    if (ID_ALIASES[nameKey] && catalogById.has(ID_ALIASES[nameKey])) {
      return ID_ALIASES[nameKey];
    }

    for (const def of biomarkerDefinitions) {
      if (
        normalizeKey(def.name) === nameKey ||
        normalizeKey(def.shortName) === nameKey
      ) {
        return def.id;
      }
    }
  }

  return null;
}

/** Haematocrit: NSW / AU labs report L/L; US-style % (e.g. 42) → 0.42. */
export function normalizeHematocritValue(value: number, unit?: string | null): number {
  const u = (unit || "").toLowerCase();
  if (u.includes("%") || u.includes("percent")) return value / 100;
  if (value > 1.5) return value / 100;
  return value;
}

/**
 * UACR: NSW / AU labs report mg/mmol.
 * Values that look like US ACR (mg/g / mg/mg creatinine×1000) are converted (×0.113).
 */
export function normalizeUacrValue(value: number, unit?: string | null): number {
  const u = (unit || "").toLowerCase().replace(/\s+/g, "");
  if (u.includes("mg/g") || u.includes("mg/mg") || u.includes("µg/mg") || u.includes("ug/mg")) {
    return value * 0.113;
  }
  if (u.includes("mg/mmol")) return value;
  // Heuristic: typical AU UACR is <50; US ACR microalbuminuria starts ~30–300
  if (value > 50) return value * 0.113;
  return value;
}

/** Zinc: convert legacy µg/dL (or µg/L mislabels) into µmol/L when needed. */
export function normalizeZincValue(value: number, unit?: string | null): number {
  const u = (unit || "").toLowerCase().replace(/\s+/g, "");
  if (u.includes("µmol") || u.includes("umol")) return value;
  if (u.includes("μg/dl") || u.includes("ug/dl") || u.includes("µg/dl")) {
    return value / 6.54;
  }
  // Legacy catalog used µg/dL (~50–150); AU µmol/L is ~10–18
  if (value > 30) return value / 6.54;
  return value;
}

type ExtractedLike = {
  biomarkerId?: string;
  name?: string;
  value?: unknown;
  unit?: string;
};

/** Apply AU unit/scale fixes after catalog ID resolution. */
export function normalizeExtractedBiomarkerValues<T extends ExtractedLike>(
  entries: T[]
): T[] {
  return entries.map((entry) => {
    const id = resolveCatalogBiomarkerId(entry.biomarkerId, entry.name);
    const numeric = coerceBiomarkerValue(entry.value);
    if (!id || numeric === null) return entry;

    if (id === "hematocrit") {
      const value = normalizeHematocritValue(numeric, entry.unit);
      return { ...entry, biomarkerId: id, value, unit: "L/L" };
    }
    if (id === "uacr") {
      const value = normalizeUacrValue(numeric, entry.unit);
      return { ...entry, biomarkerId: id, value, unit: "mg/mmol" };
    }
    if (id === "zinc") {
      const value = normalizeZincValue(numeric, entry.unit);
      return { ...entry, biomarkerId: id, value, unit: "µmol/L" };
    }
    return entry;
  });
}
