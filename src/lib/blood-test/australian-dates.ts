/**
 * Australian pathology dates are DD/MM/YYYY (and DD-MMM-YY).
 * Claude sometimes emits US-swapped ISO (03/09 → 2026-03-09 instead of 2026-09-03).
 */

const MONTHS: Record<string, number> = {
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12,
};

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function toIso(year: number, month: number, day: number): string | null {
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return null;
  }
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const dt = new Date(Date.UTC(year, month - 1, day));
  if (
    dt.getUTCFullYear() !== year ||
    dt.getUTCMonth() !== month - 1 ||
    dt.getUTCDate() !== day
  ) {
    return null;
  }
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

function expandYear(yy: number): number {
  if (yy >= 100) return yy;
  // Pathology 2-digit years: 00-79 → 2000s, 80-99 → 1900s
  return yy <= 79 ? 2000 + yy : 1900 + yy;
}

/**
 * Normalize a single date string to YYYY-MM-DD using Australian day-first rules.
 */
export function normalizeAustralianTestDate(
  input?: string | null
): string | null {
  if (!input) return null;
  const raw = String(input).trim();
  if (!raw) return null;

  // Already ISO / ISO datetime
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    return toIso(Number(iso[1]), Number(iso[2]), Number(iso[3]));
  }

  // DD-MMM-YYYY / DD MMM YYYY / DD-MMM-YY
  const mon = raw.match(
    /^(\d{1,2})[\/\-\s]+([A-Za-z]{3,9})[\/\-\s]+(\d{2,4})$/
  );
  if (mon) {
    const day = Number(mon[1]);
    const month = MONTHS[mon[2].toLowerCase()];
    const year = expandYear(Number(mon[3]));
    if (!month) return null;
    return toIso(year, month, day);
  }

  // DD/MM/YYYY or DD-MM-YYYY (Australian)
  const slash = raw.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
  if (slash) {
    const day = Number(slash[1]);
    const month = Number(slash[2]);
    const year = expandYear(Number(slash[3]));
    return toIso(year, month, day);
  }

  return null;
}

function areDayMonthSwaps(a: string, b: string): boolean {
  const [ay, am, ad] = a.split("-").map(Number);
  const [by, bm, bd] = b.split("-").map(Number);
  return ay === by && am === bd && ad === bm && am !== ad;
}

/**
 * Within one extraction batch, if both YYYY-MM-DD and its day/month swap appear,
 * collapse the minority (or ambiguous) form onto the canonical AU date.
 */
export function reconcileDayMonthSwappedIsoDates(
  dates: Array<string | null | undefined>
): Map<string, string> {
  const counts = new Map<string, number>();
  for (const d of dates) {
    if (!d) continue;
    const iso = normalizeAustralianTestDate(d) || d.slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) continue;
    counts.set(iso, (counts.get(iso) || 0) + 1);
  }

  const mapping = new Map<string, string>();
  const unique = [...counts.keys()];

  for (let i = 0; i < unique.length; i++) {
    for (let j = i + 1; j < unique.length; j++) {
      const a = unique[i];
      const b = unique[j];
      if (!areDayMonthSwaps(a, b)) continue;

      const [, am, ad] = a.split("-").map(Number);
      const [, bm, bd] = b.split("-").map(Number);
      const countA = counts.get(a) || 0;
      const countB = counts.get(b) || 0;

      // Prefer unambiguous day (>12), else higher frequency, else later calendar date.
      let canonical = a;
      if (ad > 12 && bd <= 12) canonical = a;
      else if (bd > 12 && ad <= 12) canonical = b;
      else if (countA !== countB) canonical = countA > countB ? a : b;
      else canonical = a > b ? a : b;

      const other = canonical === a ? b : a;
      mapping.set(other, canonical);
      console.log(
        `[dates] Reconciled likely US/AU swap: ${other} → ${canonical} (counts ${countA}/${countB}, months ${am}/${bm})`
      );
    }
  }

  return mapping;
}

export function applyAustralianDateGuards<T extends { testDate?: string | null }>(
  biomarkers: T[],
  testDates?: string[] | null
): { biomarkers: T[]; testDates: string[] } {
  const normalized = biomarkers.map((b) => {
    const iso = normalizeAustralianTestDate(b.testDate ?? null);
    return iso ? { ...b, testDate: iso } : b;
  });

  const swapMap = reconcileDayMonthSwappedIsoDates([
    ...normalized.map((b) => b.testDate),
    ...(testDates || []),
  ]);

  const fixed = normalized.map((b) => {
    if (!b.testDate) return b;
    const mapped = swapMap.get(b.testDate);
    return mapped ? { ...b, testDate: mapped } : b;
  });

  const dates = [
    ...new Set(
      [
        ...(testDates || []).map((d) => normalizeAustralianTestDate(d) || d),
        ...fixed.map((b) => b.testDate).filter(Boolean),
      ]
        .map((d) => (d && swapMap.get(d)) || d)
        .filter((d): d is string => Boolean(d))
    ),
  ].sort((a, b) => (a < b ? 1 : -1));

  return { biomarkers: fixed, testDates: dates };
}
