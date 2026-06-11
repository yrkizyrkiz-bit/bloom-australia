"use client";

import { useCallback, useEffect, useState } from "react";
import {
  normalizeOrganAnalysis,
  ORGAN_CONFIG,
  type NormalizedOrganAnalysis,
  type OrganType,
} from "@/lib/organ-ai-recommendations";

export function useOrganAnalysis(organ: OrganType) {
  const [analysis, setAnalysis] = useState<NormalizedOrganAnalysis | null>(null);
  const [rawAnalysis, setRawAnalysis] = useState<unknown>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataDate, setDataDate] = useState<string | null>(null);
  const [resultsStale, setResultsStale] = useState(false);

  const fetchAnalysis = useCallback(async () => {
    const config = ORGAN_CONFIG[organ];
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(config.apiPath, {
        method: config.method,
        headers: config.method === "POST" ? { "Content-Type": "application/json" } : undefined,
        body: config.method === "POST" ? JSON.stringify({}) : undefined,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || errorData.error || "Failed to load AI analysis"
        );
      }

      const data = await response.json();
      setRawAnalysis(data);
      setDataDate(data.dataDate ?? null);
      setResultsStale(data.resultsStale ?? false);

      const payload = organ === "hormone" ? data.analysis ?? data : data;
      setAnalysis(normalizeOrganAnalysis(organ, payload));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load AI analysis");
      setAnalysis(null);
      setRawAnalysis(null);
    } finally {
      setIsLoading(false);
    }
  }, [organ]);

  useEffect(() => {
    fetchAnalysis();
  }, [fetchAnalysis]);

  return {
    analysis,
    rawAnalysis,
    isLoading,
    error,
    dataDate,
    resultsStale,
    refetch: fetchAnalysis,
  };
}
