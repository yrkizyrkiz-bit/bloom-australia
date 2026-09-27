"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ReadinessAssessment } from "@/lib/membership/biomarker-readiness";
import type { OrganCareArea } from "@/lib/membership/biomarker-readiness";

export type PortalReadinessPayload = {
  organCare: Record<OrganCareArea, ReadinessAssessment>;
  biologicalClock: ReadinessAssessment;
  healthScore: ReadinessAssessment & {
    categories?: Record<OrganCareArea, ReadinessAssessment>;
    readyCategoryCount?: number;
  };
  hasPendingResults: boolean;
};

/**
 * Loads biomarker/lab readiness after first paint.
 * Does not block the programs hub.
 */
export function usePortalReadiness(enabled = true) {
  const [data, setData] = useState<PortalReadinessPayload | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inflight = useRef<Promise<void> | null>(null);

  const fetchReadiness = useCallback(async () => {
    if (inflight.current) return inflight.current;

    const run = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/portal/readiness", { cache: "no-store" });
        if (!res.ok) {
          throw new Error(`Failed to load readiness (${res.status})`);
        }
        const payload = (await res.json()) as PortalReadinessPayload;
        setData(payload);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load readiness");
      } finally {
        setIsLoading(false);
      }
    };

    inflight.current = run().finally(() => {
      inflight.current = null;
    });
    return inflight.current;
  }, []);

  useEffect(() => {
    if (!enabled) return;
    void fetchReadiness();
  }, [enabled, fetchReadiness]);

  return { data, isLoading, error, refetch: fetchReadiness };
}
