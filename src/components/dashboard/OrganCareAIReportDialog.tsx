"use client";

import { useCallback, useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { healthTestsConfig } from "@/lib/healthTestScoring";
import type { OrganCareAIReport } from "@/lib/organ-care-ai-report-types";
import { sanitizeOrganCareReport } from "@/lib/organ-care-ai-report-types";
import {
  Sparkles,
  Download,
  AlertTriangle,
  Brain,
  Loader2,
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  Clock,
  FileText,
  Stethoscope,
} from "lucide-react";
import { jsPDF } from "jspdf";
import { toast } from "sonner";

type ReportState = {
  report: OrganCareAIReport | null;
  cached: boolean;
  canGenerate: boolean;
  requiresNewBloodTest: boolean;
  biomarkerCount: number;
  overallHealthScore: number;
  dataDate: string | null;
  resultsStale: boolean;
  generatedAt: string | null;
};

const CATEGORY_COLORS: Record<string, string> = Object.fromEntries(
  healthTestsConfig.map((t) => [t.id, t.color])
);

function riskBadgeClass(risk: string) {
  switch (risk) {
    case "high":
      return "bg-red-600 text-white";
    case "elevated":
      return "bg-orange-600 text-white";
    case "moderate":
      return "bg-amber-500 text-white";
    default:
      return "bg-emerald-600 text-white";
  }
}

function statusBadgeVariant(status: string) {
  if (status === "needs_attention") return "destructive" as const;
  if (status === "watch") return "secondary" as const;
  return "outline" as const;
}

function TrendIcon({ trend }: { trend?: string }) {
  if (trend === "improving") {
    return <TrendingUp className="h-3.5 w-3.5 text-green-600" />;
  }
  if (trend === "worsening" || trend === "declining") {
    return <TrendingDown className="h-3.5 w-3.5 text-red-600" />;
  }
  if (trend === "stable") {
    return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
  }
  return null;
}

interface OrganCareAIReportDialogProps {
  userId: string;
  userName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OrganCareAIReportDialog({
  userId,
  userName,
  open,
  onOpenChange,
}: OrganCareAIReportDialogProps) {
  const [state, setState] = useState<ReportState | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  const loadReport = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setGenerateError(null);
    try {
      const res = await fetch("/api/organ-care/ai-report");
      const text = await res.text();
      let data: ReportState;
      try {
        data = JSON.parse(text) as ReportState;
      } catch {
        throw new Error("Could not read report data from the server.");
      }
      if (!res.ok) {
        throw new Error((data as unknown as { error?: string }).error || "Failed to load report");
      }
      setState({
        ...data,
        report: data.report ? sanitizeOrganCareReport(data.report) : null,
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not load your Organ Care report"
      );
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (open) void loadReport();
  }, [open, loadReport]);

  const generateReport = async () => {
    if (!userId) {
      setGenerateError("Your session is still loading. Please wait a moment and try again.");
      return;
    }

    setGenerating(true);
    setGenerateError(null);
    try {
      const res = await fetch("/api/organ-care/ai-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const text = await res.text();
      let data: {
        report?: OrganCareAIReport;
        error?: string;
        detail?: string;
        usedFallback?: boolean;
      };
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("The server returned an unexpected response. Please try again.");
      }

      if (res.status === 409) {
        setState((prev) =>
          prev
            ? {
                ...prev,
                report: data.report ? sanitizeOrganCareReport(data.report) : prev.report,
                requiresNewBloodTest: true,
                canGenerate: false,
              }
            : prev
        );
        toast.message("Report already exists for your latest blood test");
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || data.detail || "Generation failed");
      }

      const normalizedReport = data.report ? sanitizeOrganCareReport(data.report) : null;
      if (!normalizedReport) {
        throw new Error("Report was generated but could not be displayed. Please try again.");
      }

      setState((prev) =>
        prev
          ? {
              ...prev,
              report: normalizedReport,
              cached: false,
              canGenerate: false,
              requiresNewBloodTest: true,
              generatedAt: new Date().toISOString(),
            }
          : prev
      );
      toast.success(
        data.usedFallback
          ? "Organ Care report generated (summary mode)"
          : "Organ Care report generated"
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to generate report";
      setGenerateError(message);
      toast.error(message);
    } finally {
      setGenerating(false);
    }
  };

  const downloadPdf = async () => {
    const report = state?.report;
    if (!report) return;
    setDownloading(true);

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      let y = 24;

      doc.setFontSize(22);
      doc.setTextColor(44, 54, 40);
      doc.text("Organ & Metabolic Care Report", pageWidth / 2, y, { align: "center" });
      y += 10;
      doc.setFontSize(11);
      doc.setTextColor(100, 100, 100);
      doc.text(`${userName} · ${new Date().toLocaleDateString("en-AU")}`, pageWidth / 2, y, {
        align: "center",
      });
      y += 14;

      doc.setFontSize(36);
      doc.setTextColor(29, 158, 117);
      doc.text(String(report.overallHealthScore), pageWidth / 2, y, { align: "center" });
      y += 8;
      doc.setFontSize(12);
      doc.text("Overall Health Score", pageWidth / 2, y, { align: "center" });
      y += 16;

      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      for (const line of doc.splitTextToSize(report.executiveSummary, pageWidth - 40)) {
        doc.text(line, 20, y);
        y += 5;
      }

      y += 8;
      doc.setFontSize(14);
      doc.text("Risk patterns", 20, y);
      y += 8;
      doc.setFontSize(10);
      for (const pattern of riskPatterns.slice(0, 4)) {
        doc.text(`• ${pattern.title} (${pattern.severity})`, 20, y);
        y += 5;
        for (const line of doc.splitTextToSize(pattern.explanation, pageWidth - 44).slice(0, 3)) {
          doc.text(line, 24, y);
          y += 5;
        }
        y += 4;
        if (y > 260) {
          doc.addPage();
          y = 24;
        }
      }

      doc.save(`${userName.replace(/\s+/g, "_")}_Organ_Care_Report.pdf`);
      toast.success("Report downloaded");
    } catch {
      toast.error("Failed to download PDF");
    } finally {
      setDownloading(false);
    }
  };

  const report = state?.report ? sanitizeOrganCareReport(state.report) : null;
  const categoryScores = report?.categoryScores ?? [];
  const biomarkerFindings = report?.biomarkerFindings ?? [];
  const riskPatterns = report?.riskPatterns ?? [];
  const recommendations = report?.recommendations ?? [];
  const urgentActions = report?.urgentActions ?? [];
  const questionsForCareTeam = report?.questionsForCareTeam ?? [];
  const limitations = report?.limitations ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="flex items-center gap-2 font-serif">
            <Sparkles className="h-5 w-5 text-[#1D9E75]" />
            Organ & Metabolic Care Report
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(92vh-4rem)] px-6 pb-6">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading your report...
            </div>
          ) : !report ? (
            <div className="py-10 text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#1D9E75]/20 to-emerald-100">
                <Brain className="h-10 w-10 text-[#1D9E75]" />
              </div>
              <h3 className="font-serif text-xl mb-2">Your personalised organ health report</h3>
              <p className="text-muted-foreground mb-2 max-w-md mx-auto text-sm">
                Claude analyses your liver, kidney, heart, thyroid, hormone and metabolic markers,
                including historical trends and combined risk patterns.
              </p>
              {state?.biomarkerCount === 0 ? (
                <p className="text-sm text-amber-700 mb-6">
                  Upload blood test results to generate a report.
                </p>
              ) : (
                <p className="text-xs text-muted-foreground mb-6">
                  {state?.biomarkerCount} biomarkers available
                  {state?.dataDate &&
                    ` · Latest test ${new Date(state.dataDate).toLocaleDateString("en-AU")}`}
                </p>
              )}
              {generateError && (
                <div className="mb-6 mx-auto max-w-md rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 text-left">
                  <p>{generateError}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={generateReport}
                    disabled={generating}
                  >
                    Try again
                  </Button>
                </div>
              )}
              <Button
                onClick={generateReport}
                disabled={generating || !state?.canGenerate}
                size="lg"
                className="gap-2 rounded-full bg-[#1D9E75] hover:bg-[#178a66]"
              >
                {generating ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Analysing your results…
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5" />
                    Generate AI Report
                  </>
                )}
              </Button>
              {generating && (
                <p className="mt-3 text-xs text-muted-foreground">
                  This usually takes 1–2 minutes while Claude reviews your markers.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Hero, Superpower-style score summary */}
              <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 p-6 text-white">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-slate-400 mb-1">
                      Overall health score
                    </p>
                    <div className="flex items-end gap-2">
                      <span className="text-5xl font-bold tabular-nums">
                        {report.overallHealthScore}
                      </span>
                      <span className="text-slate-400 mb-2">/100</span>
                    </div>
                    <Badge className={`mt-3 ${riskBadgeClass(report.overallRisk || "low")}`}>
                      {(report.overallRisk || "low").replace("_", " ")} risk profile
                    </Badge>
                  </div>
                  <div className="text-right text-xs text-slate-400 space-y-1">
                    {state?.dataDate && (
                      <p>Blood test: {new Date(state.dataDate).toLocaleDateString("en-AU")}</p>
                    )}
                    {state?.generatedAt && (
                      <p>
                        Report:{" "}
                        {new Date(state.generatedAt).toLocaleDateString("en-AU", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    )}
                    <p>{state?.biomarkerCount} biomarkers analysed</p>
                  </div>
                </div>
                <p className="mt-4 text-sm text-slate-300 leading-relaxed">
                  {report.executiveSummary}
                </p>
              </div>

              {state?.resultsStale && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 flex gap-2">
                  <AlertTriangle className="h-5 w-5 shrink-0" />
                  <p>
                    Your latest results are over 6 months old. Consider repeat testing for an
                    up-to-date assessment.
                  </p>
                </div>
              )}

              {/* Category grid */}
              <div>
                <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-[#1D9E75]" />
                  Organ & metabolic systems
                </h3>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {categoryScores.map((cat) => (
                    <div
                      key={cat.category}
                      className="rounded-xl border bg-card p-3"
                      style={{ borderLeftWidth: 3, borderLeftColor: CATEGORY_COLORS[cat.category] }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-medium truncate">{cat.label}</p>
                        <span
                          className="text-lg font-bold tabular-nums"
                          style={{ color: CATEGORY_COLORS[cat.category] }}
                        >
                          {cat.score}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-1">
                        <Badge variant={statusBadgeVariant(cat.status || "watch")} className="text-[10px]">
                          {(cat.status || "watch").replace("_", " ")}
                        </Badge>
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <TrendIcon trend={cat.trend} />
                          <span className="capitalize">{cat.trend}</span>
                        </div>
                      </div>
                      <p className="mt-2 text-[11px] text-muted-foreground line-clamp-2">
                        {cat.summary}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <p className="text-sm text-muted-foreground">{report.clinicalContext}</p>

              <Tabs defaultValue="findings">
                <TabsList className="grid w-full grid-cols-3 h-auto">
                  <TabsTrigger value="findings" className="text-xs sm:text-sm">
                    Key findings
                  </TabsTrigger>
                  <TabsTrigger value="patterns" className="text-xs sm:text-sm">
                    Risk patterns
                  </TabsTrigger>
                  <TabsTrigger value="actions" className="text-xs sm:text-sm">
                    Actions
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="findings" className="space-y-3 mt-4">
                  {biomarkerFindings.map((finding) => (
                    <Card key={finding.biomarkerId}>
                      <CardContent className="p-4">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <p className="font-medium">{finding.name}</p>
                            <p className="text-xs text-muted-foreground capitalize">
                              {finding.category}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold tabular-nums">
                              {finding.value} {finding.unit}
                            </p>
                            <Badge variant="outline" className="text-[10px] capitalize mt-1">
                              {(finding.status || "normal").replace(/_/g, " ")}
                            </Badge>
                          </div>
                        </div>
                        {finding.previousValue != null && (
                          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <TrendIcon trend={finding.trend} />
                            <span>
                              Previous: {finding.previousValue} {finding.unit}
                              {finding.changePercent != null &&
                                ` (${finding.changePercent > 0 ? "+" : ""}${finding.changePercent}%)`}
                            </span>
                            {finding.previousTestedAt && (
                              <span>
                                ·{" "}
                                {new Date(finding.previousTestedAt).toLocaleDateString("en-AU")}
                              </span>
                            )}
                          </div>
                        )}
                        <p className="mt-2 text-sm text-muted-foreground">{finding.interpretation}</p>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>

                <TabsContent value="patterns" className="space-y-3 mt-4">
                  {riskPatterns.map((pattern, i) => (
                    <Card
                      key={i}
                      className={`border-l-4 ${
                        pattern.severity === "high"
                          ? "border-l-red-500"
                          : pattern.severity === "medium"
                            ? "border-l-amber-500"
                            : "border-l-emerald-500"
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <p className="font-medium">{pattern.title}</p>
                          <Badge variant="outline" className="capitalize text-xs">
                            {pattern.severity}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{pattern.explanation}</p>
                        <p className="text-xs font-medium text-[#1D9E75]">
                          Monitoring: {pattern.monitoringAdvice}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {(pattern.involvedBiomarkers ?? []).map((b) => (
                            <Badge key={b} variant="secondary" className="text-[10px]">
                              {b.replace(/_/g, " ")}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>

                <TabsContent value="actions" className="space-y-4 mt-4">
                  {recommendations.map((rec, i) => (
                    <div key={i} className="rounded-xl border p-4">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <Badge variant="outline" className="capitalize text-xs">
                          {rec.priority}
                        </Badge>
                        <Badge variant="secondary" className="capitalize text-xs">
                          {(rec.category || "follow_up").replace("_", " ")}
                        </Badge>
                      </div>
                      <p className="font-medium">{rec.action}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{rec.rationale}</p>
                    </div>
                  ))}

                  {urgentActions.length > 0 && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                      <p className="font-medium text-red-800 mb-2">Urgent actions</p>
                      <ul className="list-disc pl-5 text-sm text-red-700 space-y-1">
                        {urgentActions.map((a) => (
                          <li key={a}>{a}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
                    <div className="flex items-start gap-2">
                      <Stethoscope className="h-4 w-4 mt-0.5 text-[#1D9E75]" />
                      <div>
                        <p className="text-sm font-medium">Questions for your care team</p>
                        <ul className="mt-1 list-disc pl-5 text-sm text-muted-foreground space-y-1">
                          {questionsForCareTeam.map((q) => (
                            <li key={q}>{q}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Clock className="h-4 w-4 mt-0.5 text-[#1D9E75]" />
                      <div>
                        <p className="text-sm font-medium">Retesting guidance</p>
                        <p className="text-sm text-muted-foreground">{report.retestingGuidance}</p>
                      </div>
                    </div>
                  </div>

                  {limitations.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {limitations.join(" ")}
                    </p>
                  )}
                </TabsContent>
              </Tabs>

              {state?.requiresNewBloodTest && (
                <p className="text-xs text-muted-foreground">
                  This report reflects your latest blood test. Upload new results to generate an
                  updated report.
                </p>
              )}

              <div className="flex flex-wrap gap-2 pt-2 border-t">
                {state?.canGenerate && (
                  <Button
                    variant="outline"
                    onClick={generateReport}
                    disabled={generating}
                    className="gap-2"
                  >
                    {generating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    Regenerate
                  </Button>
                )}
                <Button onClick={downloadPdf} disabled={downloading} className="gap-2">
                  {downloading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  Download PDF
                </Button>
                <Button variant="ghost" asChild className="gap-2">
                  <a href="/dashboard/biomarkers?view=history">
                    <FileText className="h-4 w-4" />
                    View history
                  </a>
                </Button>
              </div>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
