/**
 * Australian labs report HbA1c as IFCC mmol/mol and/or NGSP %.
 * Sanative catalog stores HbA1c as NGSP % only.
 *
 * IFCC → NGSP (master equation):
 *   NGSP% = (0.09148 × IFCC mmol/mol) + 2.152
 */

export const HBA1C_IFCC_TO_NGSP = (mmolMol: number): number =>
  Math.round((0.09148 * mmolMol + 2.152) * 10) / 10;

/** Typical NGSP % clinical range used for unit detection. */
const NGSP_MAX = 18;
/** IFCC mmol/mol is almost always ≥ ~20 even in hypoglycemia-adjacent reporting. */
const IFCC_MIN = 20;

function unitLooksLikeIfcc(unit?: string | null): boolean {
  if (!unit) return false;
  const u = unit.toLowerCase().replace(/\s+/g, "");
  return (
    u.includes("mmol/mol") ||
    u.includes("mmolmol") ||
    u === "mmol" ||
    u.includes("ifcc")
  );
}

function unitLooksLikePercent(unit?: string | null): boolean {
  if (!unit) return false;
  const u = unit.toLowerCase().trim();
  return u === "%" || u.includes("percent") || u.includes("ngsp") || u.includes("dcct");
}

export type Hba1cLike = {
  biomarkerId: string;
  value: number;
  unit?: string | null;
  testDate?: string | null;
  name?: string;
  confidence?: number;
  isHistorical?: boolean;
  flag?: string;
  notes?: string;
};

/**
 * Convert a single extracted HbA1c value to catalog NGSP % when it is clearly IFCC.
 */
export function normalizeHba1cValueToPercent(
  value: number,
  unit?: string | null
): { value: number; unit: "%"; convertedFromIfcc: boolean } | null {
  if (!Number.isFinite(value) || value <= 0) return null;

  if (unitLooksLikeIfcc(unit) || value >= IFCC_MIN) {
    // Guard: values already in % never reach ≥20 in practice for HbA1c.
    if (value < IFCC_MIN && unitLooksLikePercent(unit)) {
      return { value: Math.round(value * 10) / 10, unit: "%", convertedFromIfcc: false };
    }
    const pct = HBA1C_IFCC_TO_NGSP(value);
    if (pct < 3 || pct > NGSP_MAX) return null;
    return { value: pct, unit: "%", convertedFromIfcc: true };
  }

  if (value > NGSP_MAX) return null;
  return { value: Math.round(value * 10) / 10, unit: "%", convertedFromIfcc: false };
}

/**
 * Normalize all hba1c rows in an extraction batch:
 * - convert mmol/mol → %
 * - drop IFCC duplicates when an equivalent % already exists for the same date
 */
export function normalizeExtractedHba1cEntries<T extends Hba1cLike>(
  biomarkers: T[]
): T[] {
  const others = biomarkers.filter((b) => b.biomarkerId !== "hba1c");
  const hba1cRows = biomarkers.filter((b) => b.biomarkerId === "hba1c");
  if (hba1cRows.length === 0) return biomarkers;

  const converted: T[] = [];
  for (const row of hba1cRows) {
    const result = normalizeHba1cValueToPercent(row.value, row.unit);
    if (!result) {
      console.log(
        `[hba1c] Dropping unusable HbA1c value ${row.value} ${row.unit ?? ""}`
      );
      continue;
    }
    if (result.convertedFromIfcc) {
      console.log(
        `[hba1c] Converted IFCC ${row.value} mmol/mol → ${result.value}%`
      );
    }
    converted.push({
      ...row,
      value: result.value,
      unit: result.unit,
      notes: result.convertedFromIfcc
        ? `Converted from ${row.value} mmol/mol (IFCC) to NGSP %`
        : row.notes,
    });
  }

  // Dedupe by test date: keep one % per date (prefer higher confidence, then original %).
  const byDate = new Map<string, T>();
  for (const row of converted) {
    const key = row.testDate || "unknown";
    const existing = byDate.get(key);
    if (!existing) {
      byDate.set(key, row);
      continue;
    }
    // Near-equal after conversion (e.g. 39→5.7 and 5.7) — keep the better confidence.
    if (Math.abs(existing.value - row.value) <= 0.2) {
      const keep =
        (row.confidence ?? 0) > (existing.confidence ?? 0) ? row : existing;
      byDate.set(key, keep);
      console.log(
        `[hba1c] Deduped duplicate HbA1c on ${key}: kept ${keep.value}%`
      );
      continue;
    }
    // Different values same date — keep the one in plausible % band closer to mid-range,
    // prefer value already in typical % range without conversion notes if conflict.
    const existingConverted = Boolean(existing.notes?.includes("mmol/mol"));
    const rowConverted = Boolean(row.notes?.includes("mmol/mol"));
    if (existingConverted && !rowConverted) {
      byDate.set(key, row);
    } else if (!existingConverted && rowConverted) {
      // keep existing
    } else if ((row.confidence ?? 0) > (existing.confidence ?? 0)) {
      byDate.set(key, row);
    }
  }

  return [...others, ...byDate.values()];
}
