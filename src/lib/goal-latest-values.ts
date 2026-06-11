export interface GoalLatestResult {
  value: number;
  testedAt: string;
  status?: string;
}

export interface GoalWithLatest<T extends { biomarkerId: string; currentValue: number }> extends T {
  latestResult: GoalLatestResult | null;
  effectiveCurrentValue: number;
}

/** Pick the most recent result per biomarker from a desc-sorted results list. */
export function indexLatestResultsByBiomarker(
  results: Array<{
    biomarkerId: string;
    value: number;
    testedAt: Date | string;
    status?: string;
  }>
): Map<string, GoalLatestResult> {
  const map = new Map<string, GoalLatestResult>();

  for (const result of results) {
    if (map.has(result.biomarkerId)) continue;
    map.set(result.biomarkerId, {
      value: result.value,
      testedAt:
        result.testedAt instanceof Date
          ? result.testedAt.toISOString()
          : result.testedAt,
      status: result.status,
    });
  }

  return map;
}

export function attachLatestResultsToGoals<
  T extends { biomarkerId: string; currentValue: number },
>(goals: T[], latestByBiomarker: Map<string, GoalLatestResult>): GoalWithLatest<T>[] {
  return goals.map(goal => {
    const latestResult = latestByBiomarker.get(goal.biomarkerId) ?? null;
    return {
      ...goal,
      latestResult,
      effectiveCurrentValue: latestResult?.value ?? goal.currentValue,
    };
  });
}

export function formatLatestResultDate(testedAt: string): string {
  return new Date(testedAt).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
