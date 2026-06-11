"use client";

import { useMemo } from "react";
import { useBiomarkerResults } from "@/hooks/useApi";
import {
  buildOrganTrendFromResults,
  getOrganMockTrend,
  type OrganTrendId,
} from "@/lib/organ-trend-data";

export function useOrganTrendData(organId: OrganTrendId, gender: "male" | "female") {
  const { data, isLoading, error } = useBiomarkerResults(undefined);

  const trend = useMemo(() => {
    if (!data?.results?.length) {
      return { data: getOrganMockTrend(organId), isIllustration: true };
    }
    return buildOrganTrendFromResults(organId, gender, data.results);
  }, [data?.results, gender, organId]);

  return {
    ...trend,
    isLoading,
    error,
  };
}
