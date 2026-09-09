"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  sanitizeHolisticHealthReport,
  type HolisticHealthReport,
} from "@/lib/holistic-health-report-types";
import {
  HolisticHealthReportEmpty,
  HolisticHealthReportView,
} from "@/components/dashboard/HolisticHealthReportView";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const POLL_MS = 4000;
const POLL_MAX_MS = 4 * 60 * 1000;

type HistoryItem = {
  id: string;
  overallScore: number;
  riskLevel: string;
  biomarkerCount: number;
  createdAt: string;
  dataDate: string | null;
  report: HolisticHealthReport;
};

function formatNavDate(iso: string | null | undefined, fallbackIso?: string) {
  const value = iso || fallbackIso;
  if (!value) return "Report";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "Report";
  return d.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function GeneratedAIReportPanel() {
  const { user } = useAuth();
  const userId = user?.id || "";
  const userName = user?.firstName || "Member";

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [index, setIndex] = useState(0);
  const [canGenerate, setCanGenerate] = useState(false);
  const [biomarkerCount, setBiomarkerCount] = useState(0);
  const [latestDataDate, setLatestDataDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const [currentRes, historyRes] = await Promise.all([
        fetch(`/api/holistic-health-report?userId=${encodeURIComponent(userId)}`),
        fetch(`/api/holistic-health-report/history?userId=${encodeURIComponent(userId)}`),
      ]);
      const currentData = await currentRes.json().catch(() => ({}));
      const historyData = await historyRes.json().catch(() => ({}));

      if (!currentRes.ok) throw new Error(currentData.error || "Failed to load AI report");
      if (!historyRes.ok) throw new Error(historyData.error || "Failed to load report history");

      const list = Array.isArray(historyData.history)
        ? (historyData.history as HistoryItem[]).filter(
            (item) => item?.report?.aiProvider === "claude"
          )
        : [];

      // If cache has a Claude report not yet mirrored in history (edge case), prepend it.
      const cached = currentData.report
        ? sanitizeHolisticHealthReport(currentData.report as Partial<HolisticHealthReport>)
        : null;
      if (cached?.aiProvider === "claude") {
        const already = list.some(
          (h) =>
            h.report.analysisTimestamp === cached.analysisTimestamp &&
            h.report.overallHealthScore === cached.overallHealthScore
        );
        if (!already) {
          list.unshift({
            id: `cache-${cached.analysisTimestamp}`,
            overallScore: cached.overallHealthScore,
            riskLevel: cached.overallRisk,
            biomarkerCount: Number(currentData.biomarkerCount || 0),
            createdAt: currentData.generatedAt || cached.analysisTimestamp,
            dataDate: (currentData.dataDate as string | null) || null,
            report: cached,
          });
        } else if (list[0] && !list[0].dataDate && currentData.dataDate) {
          list[0] = { ...list[0], dataDate: currentData.dataDate as string };
        }
      }

      setHistory(list);
      setIndex(0);
      setCanGenerate(Boolean(currentData.canGenerate) || list.length === 0);
      setBiomarkerCount(Number(currentData.biomarkerCount || 0));
      setLatestDataDate((currentData.dataDate as string | null) || null);
      if (currentData.generating) setGenerating(true);
      if (currentData.generationError) setError(String(currentData.generationError));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load report");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  useEffect(() => {
    if (!userId || !generating) return;
    const started = Date.now();
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const poll = async () => {
      try {
        const res = await fetch(`/api/holistic-health-report?userId=${encodeURIComponent(userId)}`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok || cancelled) return;

        const raw = data.report
          ? sanitizeHolisticHealthReport(data.report as Partial<HolisticHealthReport>)
          : null;
        if (raw?.aiProvider === "claude") {
          setGenerating(false);
          toast.success("Your AI health report is ready");
          await loadAll();
          return;
        }
        if (data.generationError) {
          setGenerating(false);
          setError(String(data.generationError));
          return;
        }
        if (Date.now() - started > POLL_MAX_MS) {
          setGenerating(false);
          setError("Report is taking longer than expected. Please try again.");
          return;
        }
      } catch {
        if (!cancelled) {
          setGenerating(false);
          setError("Could not refresh report status");
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
  }, [userId, generating, loadAll]);

  const generateReport = async () => {
    if (!userId) return;
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/holistic-health-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.status === 409 && data.report) {
        await loadAll();
        setGenerating(false);
        return;
      }

      if (res.status === 202 || data.generating) {
        toast.message("Claude is writing your report — usually 1–2 minutes.");
        return;
      }

      if (!res.ok) throw new Error(data.error || "Generation failed");

      const raw = data.report
        ? sanitizeHolisticHealthReport(data.report as Partial<HolisticHealthReport>)
        : null;
      if (!raw || raw.aiProvider !== "claude") {
        throw new Error("Claude report was not returned");
      }
      setGenerating(false);
      toast.success("Your AI health report is ready");
      await loadAll();
    } catch (err) {
      setGenerating(false);
      const message = err instanceof Error ? err.message : "Could not generate report";
      setError(message);
      toast.error(message);
    }
  };

  const current = history[index] || null;
  const isLatest = index === 0;

  const dateNav = useMemo(() => {
    if (history.length === 0) return null;
    const item = history[index];
    if (!item) return null;
    return {
      label: formatNavDate(item.dataDate, item.createdAt),
      canGoOlder: index < history.length - 1,
      canGoNewer: index > 0,
      onOlder: () => setIndex((i) => Math.min(history.length - 1, i + 1)),
      onNewer: () => setIndex((i) => Math.max(0, i - 1)),
      positionLabel:
        history.length > 1 ? `${index + 1} of ${history.length}` : undefined,
    };
  }, [history, index]);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin text-[#5c7a52]" />
        Loading your generated report...
      </div>
    );
  }

  if (!current) {
    return (
      <HolisticHealthReportEmpty
        biomarkerCount={biomarkerCount}
        canGenerate={canGenerate || Boolean(error)}
        waitingForClaude={generating}
        generateError={error}
        onGenerate={generateReport}
      />
    );
  }

  return (
    <HolisticHealthReportView
      report={current.report}
      userId={userId}
      userName={userName}
      dataDate={current.dataDate || (isLatest ? latestDataDate : null)}
      canGenerate={isLatest && canGenerate}
      waitingForClaude={generating}
      onGenerate={generateReport}
      dateNav={dateNav}
    />
  );
}
