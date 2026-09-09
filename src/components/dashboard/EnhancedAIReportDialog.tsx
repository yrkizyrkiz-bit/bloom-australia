"use client";

import { useCallback, useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  sanitizeHolisticHealthReport,
  type HolisticHealthReport,
} from "@/lib/holistic-health-report-types";
import {
  HolisticHealthReportEmpty,
  HolisticHealthReportView,
} from "@/components/dashboard/HolisticHealthReportView";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface EnhancedAIReportDialogProps {
  userId: string;
  userName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ReportState = {
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

export function EnhancedAIReportDialog({
  userId,
  userName,
  open,
  onOpenChange,
}: EnhancedAIReportDialogProps) {
  const [state, setState] = useState<ReportState | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

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
    if (open) void loadReport();
  }, [open, loadReport]);

  useEffect(() => {
    if (!open || !userId || !generating) return;

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
          setGenerateError("Claude is still working — reopen this dialog in a minute to check.");
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
  }, [open, userId, generating, applyPayload]);

  const generateReport = async () => {
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
        return;
      }

      if (res.status === 202 || data.generating) {
        applyPayload({
          ...data,
          generating: true,
          canGenerate: false,
          biomarkerCount: state?.biomarkerCount || 0,
          overallHealthScore: state?.overallHealthScore || 0,
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
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not generate report";
      setGenerateError(message);
      toast.error(message);
      setGenerating(false);
    }
  };

  const report = state?.report;
  const waitingForClaude = generating || Boolean(state?.generatingOnServer);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#5c7a52]" />
            AI Health Report
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-16 flex flex-col items-center gap-3 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin text-[#5c7a52]" />
            Preparing your holistic report...
          </div>
        ) : !report ? (
          <HolisticHealthReportEmpty
            biomarkerCount={state?.biomarkerCount || 0}
            canGenerate={Boolean(state?.canGenerate || state?.generationError)}
            waitingForClaude={waitingForClaude}
            generateError={generateError}
            onGenerate={generateReport}
          />
        ) : (
          <ScrollArea className="h-[70vh]">
            <div className="pr-4">
              <HolisticHealthReportView
                report={report}
                userId={userId}
                userName={userName}
                dataDate={state?.dataDate}
                canGenerate={state?.canGenerate}
                waitingForClaude={waitingForClaude}
                onGenerate={generateReport}
              />
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
