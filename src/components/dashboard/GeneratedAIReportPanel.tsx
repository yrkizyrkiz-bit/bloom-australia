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
import { useHolisticHealthReport } from "@/hooks/useHolisticHealthReport";
import { Loader2 } from "lucide-react";

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
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    if (!userId) return;
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const [currentRes, historyRes] = await Promise.all([
        fetch(`/api/holistic-health-report?userId=${encodeURIComponent(userId)}`),
        fetch(`/api/holistic-health-report/history?userId=${encodeURIComponent(userId)}`),
      ]);
      const currentData = await currentRes.json().catch(() => ({}));
      const historyData = await historyRes.json().catch(() => ({}));

      if (!historyRes.ok) throw new Error(historyData.error || "Failed to load report history");

      const list = Array.isArray(historyData.history)
        ? (historyData.history as HistoryItem[]).filter(
            (item) => item?.report?.aiProvider === "claude"
          )
        : [];

      const cached =
        currentRes.ok && currentData.report
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
    } catch (err) {
      setHistoryError(err instanceof Error ? err.message : "Could not load report history");
    } finally {
      setHistoryLoading(false);
    }
  }, [userId]);

  const onReady = useCallback(() => {
    void loadHistory();
  }, [loadHistory]);

  // Same generate / poll / load path as dashboard AI Health Report dialog.
  const {
    state,
    loading: reportLoading,
    generateError,
    waitingForClaude,
    generateReport,
  } = useHolisticHealthReport({
    userId,
    enabled: Boolean(userId),
    onReady,
  });

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  const current = history[index] || null;
  const isLatest = index === 0;
  const canGenerate = Boolean(state?.canGenerate) || (!current && Number(state?.biomarkerCount || 0) > 0);
  const dataDate = (isLatest ? state?.dataDate : null) || current?.dataDate || null;

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
      positionLabel: history.length > 1 ? `${index + 1} of ${history.length}` : undefined,
    };
  }, [history, index]);

  if (reportLoading || historyLoading) {
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
        biomarkerCount={state?.biomarkerCount || 0}
        canGenerate={canGenerate || Boolean(generateError || state?.generationError)}
        waitingForClaude={waitingForClaude}
        generateError={generateError || state?.generationError || historyError}
        onGenerate={generateReport}
      />
    );
  }

  return (
    <HolisticHealthReportView
      report={current.report}
      userId={userId}
      userName={userName}
      dataDate={dataDate}
      canGenerate={isLatest && canGenerate}
      waitingForClaude={waitingForClaude}
      onGenerate={generateReport}
      dateNav={dateNav}
    />
  );
}
