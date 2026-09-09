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

      const text = await response.text();
      let data: Record<string, unknown> = {};
      if (text.trim()) {
        try {
          data = JSON.parse(text) as Record<string, unknown>;
        } catch {
          throw new Error(
            response.ok
              ? "Could not read the AI analysis response. Please try again."
              : "Failed to load AI analysis"
          );
        }
      }

      if (!response.ok) {
        throw new Error(
          (typeof data.message === "string" && data.message) ||
            (typeof data.error === "string" && data.error) ||
            "Failed to load AI analysis"
        );
      }

      setRawAnalysis(data);
      setDataDate(typeof data.dataDate === "string" ? data.dataDate : null);
      setResultsStale(Boolean(data.resultsStale));

      const payload = organ === "hormone" ? (data.analysis as unknown) ?? data : data;
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
