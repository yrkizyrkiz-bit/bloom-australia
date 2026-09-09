"use client";

import { useCallback, useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import {
  sanitizeHolisticHealthReport,
  type HolisticHealthReport,
  type HolisticMarkerItem,
  type HolisticPriorityBand,
} from "@/lib/holistic-health-report-types";
import {
  Sparkles,
  AlertTriangle,
  Brain,
  Loader2,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  Eye,
  Stethoscope,
  Activity,
  Heart,
  Bean,
  Droplets,
} from "lucide-react";
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
};

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

function bandMeta(band: HolisticPriorityBand) {
  switch (band) {
    case "immediate":
      return {
        label: "Immediate attention",
        className: "border-red-500/40 bg-red-500/5",
        badge: "bg-red-600 text-white",
        icon: <AlertTriangle className="h-4 w-4 text-red-600" />,
      };
    case "needs_attention":
      return {
        label: "Needs attention",
        className: "border-orange-500/40 bg-orange-500/5",
        badge: "bg-orange-600 text-white",
        icon: <Eye className="h-4 w-4 text-orange-600" />,
      };
    case "look_out":
      return {
        label: "Look out for",
        className: "border-amber-500/40 bg-amber-500/5",
        badge: "bg-amber-500 text-white",
        icon: <Activity className="h-4 w-4 text-amber-600" />,
      };
    default:
      return {
        label: "Looking good",
        className: "border-emerald-500/40 bg-emerald-500/5",
        badge: "bg-emerald-600 text-white",
        icon: <CheckCircle2 className="h-4 w-4 text-emerald-600" />,
      };
  }
}

function TrendIcon({ trend }: { trend?: string }) {
  if (trend === "improving") return <TrendingUp className="h-3.5 w-3.5 text-green-600" />;
  if (trend === "worsening" || trend === "declining") {
    return <TrendingDown className="h-3.5 w-3.5 text-red-600" />;
  }
  if (trend === "stable") return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
  return null;
}

function organIcon(id: string) {
  if (id === "liver") return <Bean className="h-4 w-4 text-green-700" />;
  if (id === "heart") return <Heart className="h-4 w-4 text-red-600" />;
  if (id === "kidney") return <Droplets className="h-4 w-4 text-sky-600" />;
  return <Activity className="h-4 w-4 text-[#5c7a52]" />;
}

function MarkerList({ items, band }: { items: HolisticMarkerItem[]; band: HolisticPriorityBand }) {
  const meta = bandMeta(band);
  if (!items.length) {
    return (
      <p className="text-sm text-muted-foreground py-6 text-center">
        Nothing in “{meta.label}” from your latest panel.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <Card key={`${band}-${item.biomarkerId}`} className={meta.className}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2">
                {meta.icon}
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{item.name}</p>
                    <Badge className={meta.badge}>{meta.label}</Badge>
                    <TrendIcon trend={item.trend} />
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{item.plainEnglish}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {item.value} {item.unit}
                    {item.previousValue != null ? ` · was ${item.previousValue}` : ""}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

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

  const loadReport = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setGenerateError(null);
    try {
      const res = await fetch(`/api/holistic-health-report?userId=${encodeURIComponent(userId)}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to load report");
      setState({
        report: data.report ? sanitizeHolisticHealthReport(data.report) : null,
        cached: Boolean(data.cached),
        canGenerate: Boolean(data.canGenerate),
        requiresNewBloodTest: Boolean(data.requiresNewBloodTest),
        biomarkerCount: data.biomarkerCount || 0,
        overallHealthScore: data.overallHealthScore || 0,
        dataDate: data.dataDate || null,
        resultsStale: Boolean(data.resultsStale),
        generatedAt: data.generatedAt || null,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load your health report");
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
      const res = await fetch("/api/holistic-health-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const text = await res.text();
      let data: {
        report?: HolisticHealthReport;
        error?: string;
        reason?: string;
        usedFallback?: boolean;
        dataDate?: string | null;
        resultsStale?: boolean;
      } = {};
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
        setState((prev) =>
          prev
            ? {
                ...prev,
                report: data.report ? sanitizeHolisticHealthReport(data.report) : prev.report,
                requiresNewBloodTest: true,
                canGenerate: false,
              }
            : prev
        );
        toast.message(data.reason || "Report already exists for your latest blood test");
        return;
      }

      if (!res.ok) throw new Error(data.error || data.reason || `Generation failed (${res.status})`);
      const report = data.report ? sanitizeHolisticHealthReport(data.report) : null;
      if (!report) throw new Error("Report was generated but could not be displayed.");

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
        dataDate: data.dataDate || null,
        resultsStale: Boolean(data.resultsStale),
        generatedAt: report.analysisTimestamp,
      });
      toast.success("Holistic health report ready");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not generate report";
      setGenerateError(message);
      toast.error(message);
    } finally {
      setGenerating(false);
    }
  };

  const report = state?.report;

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
          <div className="py-10 text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-[#5c7a52]/10 flex items-center justify-center mx-auto">
              <Brain className="w-10 h-10 text-[#5c7a52]" />
            </div>
            <h3 className="text-xl font-serif">Your Holistic Health Report</h3>
            <p className="text-muted-foreground max-w-lg mx-auto text-sm">
              We analyse liver, heart, kidney, metabolic, thyroid and hormone markers together,
              compare with previous results, and explain what looks good, what to watch, and what
              needs attention — including how your Sanative programs may support future results.
            </p>
            {state && state.biomarkerCount === 0 ? (
              <p className="text-sm text-orange-700">Add blood-test results before generating a report.</p>
            ) : (
              <Button
                onClick={generateReport}
                disabled={generating || !state?.canGenerate}
                size="lg"
                className="gap-2 bg-[#5c7a52] hover:bg-[#4a6243]"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Analysing your full panel...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Generate Holistic Report
                  </>
                )}
              </Button>
            )}
            {generateError && <p className="text-sm text-red-600">{generateError}</p>}
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Educational only — not a diagnosis. Australian clinical context with clinician handoff summary.
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[70vh]">
            <div className="space-y-6 pr-4">
              <Card className="border-[#5c7a52]/20 bg-gradient-to-r from-[#5c7a52]/5 to-transparent">
                <CardContent className="p-6 space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded-full bg-[#5c7a52]/10 flex items-center justify-center">
                        <span className="text-2xl font-serif font-bold text-[#5c7a52]">
                          {report.overallHealthScore}
                        </span>
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h3 className="font-medium text-lg">{report.reportTitle}</h3>
                          <Badge className={riskBadgeClass(report.overallRisk)}>
                            {report.overallRisk} risk
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{report.executiveSummary}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          For {userName}
                          {state?.dataDate
                            ? ` · Panel ${new Date(state.dataDate).toLocaleDateString("en-AU")}`
                            : ""}
                        </p>
                      </div>
                    </div>
                    {state?.canGenerate && (
                      <Button variant="outline" size="sm" onClick={generateReport} disabled={generating}>
                        {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Refresh"}
                      </Button>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground border-t pt-3">{report.clinicalContext}</p>
                </CardContent>
              </Card>

              <Tabs defaultValue="priorities">
                <TabsList className="grid grid-cols-2 sm:grid-cols-5 w-full h-auto">
                  <TabsTrigger value="priorities">Priorities</TabsTrigger>
                  <TabsTrigger value="organs">Organs</TabsTrigger>
                  <TabsTrigger value="patterns">Patterns</TabsTrigger>
                  <TabsTrigger value="programs">Programs</TabsTrigger>
                  <TabsTrigger value="actions">Actions</TabsTrigger>
                </TabsList>

                <TabsContent value="priorities" className="space-y-6 mt-4">
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-600" /> Immediate attention
                    </h4>
                    <MarkerList items={report.priorityBands.immediate} band="immediate" />
                  </div>
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Eye className="h-4 w-4 text-orange-600" /> Needs attention
                    </h4>
                    <MarkerList items={report.priorityBands.needsAttention} band="needs_attention" />
                  </div>
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Activity className="h-4 w-4 text-amber-600" /> Look out for
                    </h4>
                    <MarkerList items={report.priorityBands.lookOut} band="look_out" />
                  </div>
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Looking good
                    </h4>
                    <MarkerList items={report.priorityBands.good} band="good" />
                  </div>
                </TabsContent>

                <TabsContent value="organs" className="space-y-3 mt-4">
                  {report.organSystems.map((organ) => (
                    <Card key={organ.id}>
                      <CardContent className="p-4 space-y-2">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            {organIcon(organ.id)}
                            <p className="font-medium">{organ.label}</p>
                            <Badge variant="outline">{organ.status.replace("_", " ")}</Badge>
                            <TrendIcon trend={organ.trend} />
                          </div>
                          <span className="text-lg font-serif text-[#5c7a52]">{organ.score}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{organ.summary}</p>
                        {organ.highlights.length > 0 && (
                          <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                            {organ.highlights.map((line) => (
                              <li key={line}>{line}</li>
                            ))}
                          </ul>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>

                <TabsContent value="patterns" className="space-y-3 mt-4">
                  {report.crossSystemPatterns.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No strong cross-system patterns flagged from this panel.
                    </p>
                  ) : (
                    report.crossSystemPatterns.map((pattern) => (
                      <Card key={pattern.title}>
                        <CardContent className="p-4 space-y-2">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{pattern.title}</p>
                            <Badge variant="outline">{pattern.severity}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{pattern.explanation}</p>
                          <p className="text-xs text-muted-foreground">
                            Systems: {pattern.involvedSystems.join(", ")}
                          </p>
                          <p className="text-sm">{pattern.monitoringAdvice}</p>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </TabsContent>

                <TabsContent value="programs" className="space-y-3 mt-4">
                  {report.programContributions.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No active Sanative programs linked yet. Enrolling can help target the markers most likely to improve next.
                    </p>
                  ) : (
                    report.programContributions.map((program) => (
                      <Card key={program.key}>
                        <CardContent className="p-4 space-y-2">
                          <p className="font-medium">{program.label}</p>
                          <p className="text-sm text-muted-foreground">{program.howItHelpsFutureResults}</p>
                          <p className="text-sm">
                            <span className="font-medium">Monitoring focus: </span>
                            {program.monitoringFocus}
                          </p>
                          {program.markersLikelyToImprove.length > 0 && (
                            <p className="text-xs text-muted-foreground">
                              Markers often influenced: {program.markersLikelyToImprove.join(", ")}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    ))
                  )}
                </TabsContent>

                <TabsContent value="actions" className="space-y-4 mt-4">
                  {report.urgentActions.length > 0 && (
                    <Card className="border-red-500/30 bg-red-500/5">
                      <CardContent className="p-4 space-y-2">
                        <p className="font-medium text-red-700">Urgent educational actions</p>
                        <ul className="list-disc pl-5 text-sm space-y-1">
                          {report.urgentActions.map((action) => (
                            <li key={action}>{action}</li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  <div className="space-y-3">
                    {report.recommendations.map((rec) => (
                      <Card key={`${rec.category}-${rec.action}`}>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline">{rec.priority}</Badge>
                            <Badge variant="secondary">{rec.category}</Badge>
                          </div>
                          <p className="font-medium text-sm">{rec.action}</p>
                          <p className="text-sm text-muted-foreground mt-1">{rec.rationale}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <Card>
                    <CardContent className="p-4 space-y-2">
                      <p className="font-medium flex items-center gap-2">
                        <Stethoscope className="h-4 w-4" /> Ask your care team
                      </p>
                      <ul className="list-disc pl-5 text-sm space-y-1">
                        {report.questionsForCareTeam.map((q) => (
                          <li key={q}>{q}</li>
                        ))}
                      </ul>
                      <p className="text-sm pt-2">
                        <span className="font-medium">Retesting: </span>
                        {report.retestingGuidance}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-muted/40">
                    <CardContent className="p-4 space-y-2">
                      <p className="font-medium text-sm">Care team handoff</p>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {report.careTeamHandoffSummary}
                      </p>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              <p className="text-xs text-muted-foreground pb-4">{report.regulatoryNotice}</p>
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
