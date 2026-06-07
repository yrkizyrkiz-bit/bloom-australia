// Shared helpers for the organ AI risk analyses (liver, heart, kidney,
// thyroid, hormone). Reports are keyed to the exact biomarker dataset they were
// generated from: while that data is unchanged the saved report is always
// returned (no regeneration), and we surface the date of the underlying results
// plus whether they are now considered stale.

// Results older than this are considered stale and prompt a "see your doctor
// for a new test" recommendation.
export const RESULTS_STALE_MONTHS = 6;

/**
 * Returns the most recent tested-at date (ISO string) across a set of results,
 * which is the effective "date" of the report's underlying blood test.
 */
export function getDataDate(testedAtValues: (string | Date | null | undefined)[]): string | null {
  let max: number | null = null;
  for (const value of testedAtValues) {
    if (!value) continue;
    const ms = new Date(value).getTime();
    if (!Number.isNaN(ms) && (max === null || ms > max)) {
      max = ms;
    }
  }
  return max === null ? null : new Date(max).toISOString();
}

/**
 * True when the underlying results are older than RESULTS_STALE_MONTHS.
 */
export function isResultsStale(dataDate: string | null): boolean {
  if (!dataDate) return false;
  const date = new Date(dataDate);
  if (Number.isNaN(date.getTime())) return false;
  const threshold = new Date();
  threshold.setMonth(threshold.getMonth() - RESULTS_STALE_MONTHS);
  return date.getTime() < threshold.getTime();
}
