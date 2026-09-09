"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  sanitizeHolisticHealthReport,
  type HolisticHealthReport,
} from "@/lib/holistic-health-report-types";
import { toast } from "sonner";

export type HolisticReportState = {
  report: HolisticHealthReport | null;
  cached: boolean;
  canGenerate: boolean;
  requiresNewBloodTest: boolean;
  biomarkerCount: number;
  overallHealthScore: number;
  dataDate: string | null;
  resultsStale: boolean;
  generatedAt: string | null;
  generatingOnServer?: boolean;
  generationError?: string | null;
};

const POLL_MS = 4000;
const POLL_MAX_MS = 4 * 60 * 1000;

type Options = {
  userId: string;
  /** When false, skips load/poll (e.g. dialog closed). Default true. */
  enabled?: boolean;
  /** Fired after generate/poll returns a Claude report (not on initial load). */
  onReady?: (report: HolisticHealthReport) => void;
};

/**
 * Shared load / generate / poll for holistic Claude reports.
 * Used by the dashboard AI Health Report dialog and Generated Reports tab.
 */
export function useHolisticHealthReport({ userId, enabled = true, onReady }: Options) {
  const [state, setState] = useState<HolisticReportState | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

  const applyPayload = useCallback((data: Record<string, unknown>) => {
    const raw = data.report
      ? sanitizeHolisticHealthReport(data.report as Partial<HolisticHealthReport>)
      : null;
    // Ignore cached failover/clinical seed — only show Claude reports.
    const report = raw?.aiProvider === "claude" ? raw : null;
    setState({
      report,
      cached: Boolean(data.cached),
      canGenerate: Boolean(data.canGenerate) || (!report && Number(data.biomarkerCount || 0) > 0),
      requiresNewBloodTest: Boolean(data.requiresNewBloodTest),
      biomarkerCount: Number(data.biomarkerCount || 0),
      overallHealthScore: Number(data.overallHealthScore || 0),
      dataDate: (data.dataDate as string | null) || null,
      resultsStale: Boolean(data.resultsStale),
      generatedAt: (data.generatedAt as string | null) || null,
      generatingOnServer: Boolean(data.generating),
      generationError: (data.generationError as string | null) || null,
    });
    return {
      report,
      generating: Boolean(data.generating),
      generationError: (data.generationError as string | null) || null,
    };
  }, []);

  const loadReport = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setGenerateError(null);
    try {
      const res = await fetch(`/api/holistic-health-report?userId=${encodeURIComponent(userId)}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to load report");
      const next = applyPayload(data);
      if (next.generating) setGenerating(true);
      if (next.generationError) setGenerateError(next.generationError);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load your health report");
    } finally {
      setLoading(false);
    }
  }, [userId, applyPayload]);

  useEffect(() => {
    if (enabled) void loadReport();
  }, [enabled, loadReport]);

  useEffect(() => {
    if (!enabled || !userId || !generating) return;

    const started = Date.now();
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const poll = async () => {
      try {
        const res = await fetch(`/api/holistic-health-report?userId=${encodeURIComponent(userId)}`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Failed while waiting for report");
        if (cancelled) return;

        const next = applyPayload(data);
        if (next.report?.aiProvider === "claude") {
          setGenerating(false);
          toast.success("Holistic health report ready");
          onReadyRef.current?.(next.report);
          return;
        }
        if (next.generationError) {
          setGenerating(false);
          setGenerateError(next.generationError);
          toast.error(next.generationError);
          return;
        }
        if (!next.generating && Date.now() - started > POLL_MAX_MS) {
          setGenerating(false);
          setGenerateError("Report is taking longer than expected. Please try again.");
          return;
        }
        if (Date.now() - started > POLL_MAX_MS) {
          setGenerating(false);
          setGenerateError("Claude is still working — check again in a minute.");
          return;
        }
      } catch (error) {
        if (!cancelled) {
          setGenerating(false);
          setGenerateError(error instanceof Error ? error.message : "Polling failed");
        }
        return;
      }
      timer = setTimeout(poll, POLL_MS);
    };

    timer = setTimeout(poll, POLL_MS);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [enabled, userId, generating, applyPayload]);

  const generateReport = useCallback(async () => {
    if (!userId) {
      setGenerateError("Your session is still loading. Please wait a moment and try again.");
      return;
    }
    setGenerating(true);
    setGenerateError(null);
    try {
      const res = await fetch("/api/holistic-health-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const text = await res.text();
      let data: Record<string, unknown> = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        throw new Error(
          res.status === 504 || res.status === 502
            ? "Report timed out on the server. Please try again in a moment."
            : "Could not read the report response. Please try again."
        );
      }

      if (res.status === 409) {
        applyPayload({
          ...data,
          canGenerate: false,
          requiresNewBloodTest: true,
          cached: true,
        });
        toast.message(
          typeof data.reason === "string"
            ? data.reason
            : "Report already exists for your latest blood test"
        );
        setGenerating(false);
        if (data.report) {
          const report = sanitizeHolisticHealthReport(
            data.report as Partial<HolisticHealthReport>
          );
          if (report?.aiProvider === "claude") onReadyRef.current?.(report);
        }
        return;
      }

      if (res.status === 202 || data.generating) {
        applyPayload({
          ...data,
          generating: true,
          canGenerate: false,
          biomarkerCount: Number(data.biomarkerCount || 0),
          overallHealthScore: Number(data.overallHealthScore || 0),
        });
        toast.message("Claude is writing your full report — usually 1–2 minutes.");
        return;
      }

      if (!res.ok) {
        throw new Error(
          (typeof data.error === "string" && data.error) ||
            (typeof data.reason === "string" && data.reason) ||
            `Generation failed (${res.status})`
        );
      }

      const report = data.report
        ? sanitizeHolisticHealthReport(data.report as Partial<HolisticHealthReport>)
        : null;
      if (!report || report.aiProvider !== "claude") {
        throw new Error("Claude report was not returned. Please try again.");
      }

      setState({
        report,
        cached: false,
        canGenerate: false,
        requiresNewBloodTest: true,
        biomarkerCount:
          report.priorityBands.good.length +
          report.priorityBands.lookOut.length +
          report.priorityBands.needsAttention.length +
          report.priorityBands.immediate.length,
        overallHealthScore: report.overallHealthScore,
        dataDate: (data.dataDate as string | null) || null,
        resultsStale: Boolean(data.resultsStale),
        generatedAt: report.analysisTimestamp,
        generatingOnServer: false,
        generationError: null,
      });
      setGenerating(false);
      toast.success("Holistic health report ready");
      onReadyRef.current?.(report);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not generate report";
      setGenerateError(message);
      toast.error(message);
      setGenerating(false);
    }
  }, [userId, applyPayload]);

  const waitingForClaude = generating || Boolean(state?.generatingOnServer);

  return {
    state,
    loading,
    generating,
    generateError,
    waitingForClaude,
    loadReport,
    generateReport,
  };
}
