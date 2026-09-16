/**
 * Panel-scoped “current results” selection.
 *
 * A blood draw (panel) is grouped by UTC calendar day — the same key used by
 * `/api/biomarkers/history` (`testedAt.toISOString().split("T")[0]`).
 *
 * “Current / latest panel” means: only markers actually present on the newest
 * panel date. Missing markers must NOT be backfilled from older panels.
 */

/** UTC YYYY-MM-DD key matching history API date grouping. */
export function testedAtUtcDayKey(testedAt: Date | string): string {
  const d = testedAt instanceof Date ? testedAt : new Date(testedAt);
  return d.toISOString().split("T")[0];
}

/** Parse UTC day key to a Date at UTC midnight (stable for formatting). */
function utcDateFromDayKey(dayKey: string): Date {
  const [y, m, d] = dayKey.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

/**
 * Chart / compare labels for a blood-panel day.
 * Always include the calendar day so two draws in the same month
 * (e.g. 3 Sep and 13 Sep 2026) are not both labelled "Sep 26".
 */
export function formatUtcPanelDayLabel(
  testedAt: Date | string,
  style: "axis" | "full" = "axis"
): string {
  const day = utcDateFromDayKey(testedAtUtcDayKey(testedAt));
  if (style === "full") {
    return day.toLocaleDateString("en-AU", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    });
  }
  return day.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "2-digit",
    timeZone: "UTC",
  });
}

/** Newest UTC day key among results, or null if empty. */
export function getLatestPanelDateKey(
  results: Array<{ testedAt: Date | string }>
): string | null {
  let latest: string | null = null;
  for (const result of results) {
    const day = testedAtUtcDayKey(result.testedAt);
    if (!latest || day > latest) latest = day;
  }
  return latest;
}

/**
 * Keep only results whose UTC day equals the newest panel date across `results`.
 * If multiple rows share a biomarker on that day, keeps the latest timestamp.
 */
export function filterToLatestPanelDate<T extends { biomarkerId: string; testedAt: Date | string }>(
  results: T[]
): T[] {
  const panelDate = getLatestPanelDateKey(results);
  if (!panelDate) return [];

  const onPanel = results.filter((r) => testedAtUtcDayKey(r.testedAt) === panelDate);
  const byId = new Map<string, T>();

  for (const row of onPanel) {
    const existing = byId.get(row.biomarkerId);
    if (!existing) {
      byId.set(row.biomarkerId, row);
      continue;
    }
    if (new Date(row.testedAt).getTime() > new Date(existing.testedAt).getTime()) {
      byId.set(row.biomarkerId, row);
    }
  }

  return Array.from(byId.values());
}

/**
 * Restrict a “latest per biomarker” collection to the newest panel date only.
 * Use after building a map/list of lifetime-latest readings so older-panel-only
 * markers are dropped instead of appearing as “current”.
 */
export function restrictLatestMapToNewestPanelDate<
  T extends { biomarkerId: string; testedAt: Date | string },
>(latestByBiomarker: Iterable<T>): T[] {
  return filterToLatestPanelDate(Array.from(latestByBiomarker));
}

export type MarkerPanelResolution<T> = {
  /** Results on the chosen panel day (deduped per biomarkerId). */
  results: T[];
  /** UTC day used for these organ/marker results. */
  panelDate: string | null;
  /** Newest UTC day across the full result set (any marker). */
  overallLatestPanelDate: string | null;
  /**
   * True when the organ panel day is older than the member’s newest blood draw
   * (latest draw lacked these markers).
   */
  fromPriorPanel: boolean;
};

/**
 * Latest panel that actually includes any of `markerIds`.
 * If the overall newest draw has none of those markers, fall back to the most
 * recent prior draw that does — without mixing markers across different days.
 */
export function filterToLatestPanelForMarkers<
  T extends { biomarkerId: string; testedAt: Date | string },
>(
  results: T[],
  markerIds: ReadonlySet<string> | readonly string[]
): MarkerPanelResolution<T> {
  const idSet =
    markerIds instanceof Set ? markerIds : new Set(markerIds);
  const overallLatestPanelDate = getLatestPanelDateKey(results);
  const relevant = results.filter((r) => idSet.has(r.biomarkerId));
  const panelDate = getLatestPanelDateKey(relevant);

  if (!panelDate) {
    return {
      results: [],
      panelDate: null,
      overallLatestPanelDate,
      fromPriorPanel: false,
    };
  }

  const onPanel = relevant.filter(
    (r) => testedAtUtcDayKey(r.testedAt) === panelDate
  );
  const byId = new Map<string, T>();
  for (const row of onPanel) {
    const existing = byId.get(row.biomarkerId);
    if (
      !existing ||
      new Date(row.testedAt).getTime() > new Date(existing.testedAt).getTime()
    ) {
      byId.set(row.biomarkerId, row);
    }
  }

  return {
    results: Array.from(byId.values()),
    panelDate,
    overallLatestPanelDate,
    fromPriorPanel: Boolean(
      overallLatestPanelDate && panelDate < overallLatestPanelDate
    ),
  };
}

export type PanelScopedPair<T> = {
  biomarkerId: string;
  current: T;
  previous: T | null;
  panelDate: string;
};

/**
 * For each biomarker on the latest panel date, pair with that marker’s most
 * recent reading strictly before that UTC day.
 * Pass `panelDate` when the newest draw should be resolved from a wider result
 * set than `allResults` (e.g. organ-care subset vs all member labs).
 */
export function pairCurrentPanelWithPrevious<
  T extends { biomarkerId: string; testedAt: Date | string },
>(allResults: T[], panelDateOverride?: string | null): PanelScopedPair<T>[] {
  if (allResults.length === 0) return [];

  const panelDate = panelDateOverride || getLatestPanelDateKey(allResults);
  if (!panelDate) return [];

  const byBiomarker = new Map<string, T[]>();
  for (const result of allResults) {
    const list = byBiomarker.get(result.biomarkerId) || [];
    list.push(result);
    byBiomarker.set(result.biomarkerId, list);
  }

  const pairs: PanelScopedPair<T>[] = [];

  for (const [biomarkerId, rows] of byBiomarker) {
    const sorted = [...rows].sort(
      (a, b) => new Date(a.testedAt).getTime() - new Date(b.testedAt).getTime()
    );

    const onPanel = sorted.filter((r) => testedAtUtcDayKey(r.testedAt) === panelDate);
    if (onPanel.length === 0) continue;

    const current = onPanel[onPanel.length - 1];
    let previous: T | null = null;
    for (let i = sorted.length - 1; i >= 0; i--) {
      if (testedAtUtcDayKey(sorted[i].testedAt) < panelDate) {
        previous = sorted[i];
        break;
      }
    }

    pairs.push({ biomarkerId, current, previous, panelDate });
  }

  return pairs;
}
