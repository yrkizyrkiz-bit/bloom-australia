"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  Brain,
  CalendarDays,
  ChevronRight,
  FileText,
  Loader2,
  Sparkles,
  TestTubes,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type CheckIn = {
  id: string;
  careArea: string;
  energyLevel: number;
  moodLevel: number;
  sleepQuality: number;
  stressLevel: number;
  painLevel: number | null;
  hotFlushesLevel: number | null;
  symptoms: string[];
  notes: string | null;
  treatmentSideEffectFlag: boolean;
  checkedInAt: string;
};

type CheckInData = {
  checkIns: CheckIn[];
  summary: {
    total: number;
    sideEffectFlags: number;
    averages: Record<string, number>;
    symptomCounts: Array<{ symptom: string; count: number }>;
    trend: Array<{
      date: string;
      careArea: string;
      energy: number;
      mood: number;
      sleep: number;
      stress: number;
      pain: number | null;
      hotFlushes: number | null;
    }>;
  };
};

type WomensHealthAIReport = {
  aiProvider?: "claude";
  aiModel?: string;
  reportTitle: string;
  overallRisk: "low" | "moderate" | "elevated" | "high";
  riskScore: number;
  executiveSummary: string;
  clinicalContext: string;
  inputReview?: {
    summary: string;
    usefulInputs: string[];
    missingOrUnclearInputs: string[];
    possibleContradictions: string[];
  };
  biomarkerFindings: Array<{
    area: string;
    finding: string;
    interpretation: string;
    relatedBiomarkers: string[];
    priority: "low" | "medium" | "high";
  }>;
  womenHealthAreas: Array<{
    area: string;
    status: "reassuring" | "watch" | "needs_review";
    summary: string;
    evidence: string[];
  }>;
  recommendations: Array<{
    category: string;
    priority: "high" | "medium" | "low";
    action: string;
    rationale: string;
  }>;
  symptomBiomarkerCorrelations?: Array<{
    symptomPattern: string;
    possibleBiomarkerLinks: string[];
    explanation: string;
  }>;
  questionsForCareTeam: string[];
  retestingGuidance: string;
  urgentActions: string[];
  limitations: string[];
};

type AIReportState = {
  report: WomensHealthAIReport | null;
  cached: boolean;
  canGenerate: boolean;
  requiresNewBloodTest: boolean;
  biomarkerCount: number;
  dataDate: string | null;
  resultsStale: boolean;
  generatedAt: string | null;
};

type AIReportHistoryItem = {
  id: string;
  overallScore: number;
  riskLevel: string;
  biomarkerCount: number;
  createdAt: string;
  report: WomensHealthAIReport;
};

const biomarkerViews = [
  { label: "Hormone Health", href: "/dashboard/biomarkers?view=program&program=WOMENS_HEALTH&subcategory=hormones" },
  { label: "Menopause", href: "/dashboard/biomarkers?view=program&program=WOMENS_HEALTH&subcategory=menopause" },
  { label: "PCOS", href: "/dashboard/biomarkers?view=program&program=WOMENS_HEALTH&subcategory=pcos" },
  { label: "Fertility", href: "/dashboard/biomarkers?view=program&program=WOMENS_HEALTH&subcategory=fertility" },
];

function formatLabel(value: string) {
  return value.replace(/_/g, " ");
}

function TrendBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value || 0}/5</span>
      </div>
      <div className="h-2 rounded-full bg-rose-100 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-rose-500 to-purple-500"
          style={{ width: `${Math.min(100, ((value || 0) / 5) * 100)}%` }}
        />
      </div>
    </div>
  );
}

function ReportSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="font-semibold">{title}</h3>
      {children}
    </div>
  );
}

function FullAIReportView({ report }: { report: WomensHealthAIReport }) {
  return (
    <div className="space-y-6 rounded-2xl border bg-white p-4">
      <ReportSection title="Full summary">
        <p className="text-sm text-muted-foreground">{report.executiveSummary}</p>
        <p className="text-sm text-slate-700">{report.clinicalContext}</p>
      </ReportSection>

      {report.inputReview && (
        <ReportSection title="Check-in input review">
          <div className="space-y-3 rounded-xl border bg-rose-50/50 p-4">
            <p className="text-sm text-slate-700">{report.inputReview.summary}</p>
            {report.inputReview.usefulInputs?.length > 0 && (
              <div>
                <p className="text-sm font-medium">Useful inputs</p>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  {report.inputReview.usefulInputs.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
            {report.inputReview.missingOrUnclearInputs?.length > 0 && (
              <div>
                <p className="text-sm font-medium">Missing or unclear details</p>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  {report.inputReview.missingOrUnclearInputs.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
            {report.inputReview.possibleContradictions?.length > 0 && (
              <div>
                <p className="text-sm font-medium">Possible mismatches to clarify</p>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  {report.inputReview.possibleContradictions.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </ReportSection>
      )}

      {report.womenHealthAreas.length > 0 && (
        <ReportSection title="Women’s Health areas">
          <div className="grid gap-3 md:grid-cols-2">
            {report.womenHealthAreas.map((area) => (
              <div key={area.area} className="rounded-xl border p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium capitalize">{formatLabel(area.area)}</p>
                  <Badge variant={area.status === "needs_review" ? "destructive" : "secondary"}>
                    {formatLabel(area.status)}
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{area.summary}</p>
                {area.evidence?.length > 0 && (
                  <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                    {area.evidence.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </ReportSection>
      )}

      {report.biomarkerFindings.length > 0 && (
        <ReportSection title="Biomarker findings">
          <div className="space-y-3">
            {report.biomarkerFindings.map((finding) => (
              <div key={`${finding.area}-${finding.finding}`} className="rounded-xl border p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="capitalize">{finding.priority}</Badge>
                  <p className="font-medium">{finding.finding}</p>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{finding.interpretation}</p>
                {finding.relatedBiomarkers?.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {finding.relatedBiomarkers.map((marker) => (
                      <Badge key={marker} variant="secondary" className="capitalize">
                        {formatLabel(marker)}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </ReportSection>
      )}

      {(report.symptomBiomarkerCorrelations || []).length > 0 && (
        <ReportSection title="Symptom and biomarker connections">
          <div className="space-y-3">
            {(report.symptomBiomarkerCorrelations || []).map((item) => (
              <div key={item.symptomPattern} className="rounded-xl border p-4">
                <p className="font-medium">{item.symptomPattern}</p>
                <p className="mt-2 text-sm text-muted-foreground">{item.explanation}</p>
                {item.possibleBiomarkerLinks?.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {item.possibleBiomarkerLinks.map((marker) => (
                      <Badge key={marker} variant="secondary" className="capitalize">
                        {formatLabel(marker)}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </ReportSection>
      )}

      {report.recommendations.length > 0 && (
        <ReportSection title="All recommendations">
          <div className="space-y-3">
            {report.recommendations.map((item) => (
              <div key={`${item.category}-${item.action}`} className="rounded-xl border p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="capitalize">{item.priority}</Badge>
                  <Badge variant="secondary" className="capitalize">{formatLabel(item.category)}</Badge>
                  <p className="font-medium">{item.action}</p>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{item.rationale}</p>
              </div>
            ))}
          </div>
        </ReportSection>
      )}

      {report.questionsForCareTeam.length > 0 && (
        <ReportSection title="Questions for your care team">
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            {report.questionsForCareTeam.map((question) => (
              <li key={question}>{question}</li>
            ))}
          </ul>
        </ReportSection>
      )}

      {report.retestingGuidance && (
        <ReportSection title="Retesting guidance">
          <p className="text-sm text-muted-foreground">{report.retestingGuidance}</p>
        </ReportSection>
      )}

      {report.urgentActions.length > 0 && (
        <ReportSection title="Urgent actions">
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <ul className="list-disc space-y-1 pl-5 text-sm text-amber-900">
              {report.urgentActions.map((action) => (
                <li key={action}>{action}</li>
              ))}
            </ul>
          </div>
        </ReportSection>
      )}

      {report.limitations.length > 0 && (
        <ReportSection title="Important notes">
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            {report.limitations.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </ReportSection>
      )}
    </div>
  );
}

export default function WomensHealthReportsPage() {
  const [data, setData] = useState<CheckInData | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiReportState, setAiReportState] = useState<AIReportState | null>(null);
  const [reportHistory, setReportHistory] = useState<AIReportHistoryItem[]>([]);
  const [aiLoading, setAiLoading] = useState(true);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [showFullReport, setShowFullReport] = useState(false);
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);

  const loadAIReport = async () => {
    setAiLoading(true);
    try {
      const [reportRes, historyRes] = await Promise.all([
        fetch("/api/womens-health/ai-report"),
        fetch("/api/womens-health/ai-report/history"),
      ]);
      if (reportRes.ok) {
        setAiReportState(await reportRes.json());
      }
      if (historyRes.ok) {
        const historyJson = await historyRes.json();
        setReportHistory(historyJson.history || []);
      }
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    fetch("/api/womens-health/check-ins?limit=24")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => setData(json))
      .finally(() => setLoading(false));
    loadAIReport();
  }, []);

  const generateAIReport = async () => {
    setGeneratingReport(true);
    try {
      const res = await fetch("/api/womens-health/ai-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const json = await res.json();
      if (res.status === 409) {
        setAiReportState((current) => ({
          ...(current || {
            canGenerate: false,
            requiresNewBloodTest: true,
            biomarkerCount: 0,
            dataDate: json.dataDate || null,
            resultsStale: Boolean(json.resultsStale),
            generatedAt: null,
            cached: true,
          }),
          report: json.report,
          cached: true,
          canGenerate: false,
          requiresNewBloodTest: true,
        }));
        toast.info(json.reason || "A report already exists for the latest blood test.");
        return;
      }
      if (!res.ok) throw new Error(json.error || "Failed to generate report");
      toast.success("Women's Health AI report generated");
      await loadAIReport();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to generate report");
    } finally {
      setGeneratingReport(false);
    }
  };

  const insightCards = useMemo(() => {
    if (!data) return [];
    const mostCommonSymptom = data.summary.symptomCounts[0];
    const latest = data.checkIns[0];
    return [
      {
        title: "Check-in coverage",
        value: `${data.summary.total}`,
        detail: "Women’s Health entries recorded",
      },
      {
        title: "Most common symptom",
        value: mostCommonSymptom ? formatLabel(mostCommonSymptom.symptom) : "Not enough data",
        detail: mostCommonSymptom ? `${mostCommonSymptom.count} recent entries` : "Log symptoms to build a trend",
      },
      {
        title: "Latest focus area",
        value: latest ? formatLabel(latest.careArea) : "No entry yet",
        detail: latest ? new Date(latest.checkedInAt).toLocaleDateString("en-AU") : "Start with a check-in",
      },
      {
        title: "Treatment flags",
        value: `${data.summary.sideEffectFlags}`,
        detail: "Entries marked as possible treatment-related symptoms",
      },
    ];
  }, [data]);

  const generateDisabledReason = useMemo(() => {
    if (generatingReport) return "Generating your report now.";
    if (aiLoading) return "Loading report status.";
    if (!aiReportState) return null;
    if (aiReportState.biomarkerCount === 0) {
      return "Women's Health biomarker results are needed before Claude can generate this report.";
    }
    if (aiReportState.requiresNewBloodTest) {
      return "A report already exists for the latest blood test. Upload a newer blood test to generate another.";
    }
    if (!aiReportState.canGenerate) return "Report generation is currently unavailable.";
    return null;
  }, [aiLoading, aiReportState, generatingReport]);

  const isGenerateDisabled =
    generatingReport ||
    aiLoading ||
    aiReportState?.biomarkerCount === 0 ||
    aiReportState?.requiresNewBloodTest === true;

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link href="/dashboard/womens-health">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-rose-600" />
            Women&apos;s Health Reports
          </h1>
          <p className="text-muted-foreground">Symptom trends, care insights and biomarker links.</p>
        </div>
      </div>

      {loading ? (
        <Card>
          <CardContent className="p-8 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid md:grid-cols-4 gap-4">
            {insightCards.map((card) => (
              <Card key={card.title} className="border-rose-100">
                <CardContent className="p-5">
                  <p className="text-xs uppercase tracking-wide text-rose-600 font-semibold">{card.title}</p>
                  <p className="text-2xl font-bold capitalize mt-2">{card.value}</p>
                  <p className="text-sm text-muted-foreground mt-1">{card.detail}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-rose-600" />
                  Recent averages
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <TrendBar label="Energy" value={data?.summary.averages.energy || 0} />
                <TrendBar label="Mood" value={data?.summary.averages.mood || 0} />
                <TrendBar label="Sleep" value={data?.summary.averages.sleep || 0} />
                <TrendBar label="Stress" value={data?.summary.averages.stress || 0} />
                <TrendBar label="Pain" value={data?.summary.averages.pain || 0} />
                <TrendBar label="Hot flushes" value={data?.summary.averages.hotFlushes || 0} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent entries</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data?.checkIns.length ? (
                  data.checkIns.slice(0, 6).map((entry) => (
                    <div key={entry.id} className="rounded-xl border p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-medium capitalize">{formatLabel(entry.careArea)}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(entry.checkedInAt).toLocaleDateString("en-AU", {
                              day: "numeric",
                              month: "short",
                            })}
                          </p>
                        </div>
                        {entry.treatmentSideEffectFlag && (
                          <Badge className="bg-amber-100 text-amber-800">Treatment flag</Badge>
                        )}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1">
                        {entry.symptoms.slice(0, 5).map((symptom) => (
                          <Badge key={symptom} variant="outline" className="capitalize">
                            {formatLabel(symptom)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-dashed p-6 text-center">
                    <CalendarDays className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">No data yet. Log a check-in to start reporting.</p>
                    <Button asChild variant="link" className="text-rose-700">
                      <Link href="/dashboard/womens-health/check-in">Log check-in</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}

      <Card className="border-rose-200 bg-gradient-to-br from-rose-50 to-purple-50">
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-rose-600" />
              Claude Women&apos;s Health AI Report
            </CardTitle>
            {aiReportState?.dataDate && (
              <Badge variant="outline" className="w-fit bg-white">
                Blood test: {new Date(aiReportState.dataDate).toLocaleDateString("en-AU")}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {aiLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading saved AI report...
            </div>
          ) : aiReportState?.report ? (
            <div className="space-y-4">
              <div className="rounded-2xl border bg-white p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-rose-600 font-semibold">
                      Saved comprehensive report
                    </p>
                    <h2 className="mt-1 text-xl font-semibold">{aiReportState.report.reportTitle}</h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {aiReportState.report.executiveSummary}
                    </p>
                  </div>
                  <Badge className="w-fit bg-rose-600">
                    {aiReportState.report.overallRisk} · {aiReportState.report.riskScore}/100
                  </Badge>
                </div>
                {aiReportState.report.aiProvider === "claude" && (
                  <Badge variant="secondary" className="mt-3 w-fit">
                    Claude generated · {aiReportState.report.aiModel || "model unavailable"}
                  </Badge>
                )}
                <p className="mt-4 text-sm text-slate-700">{aiReportState.report.clinicalContext}</p>
                <Button
                  type="button"
                  variant="outline"
                  className="mt-4 bg-white"
                  onClick={() => setShowFullReport((current) => !current)}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  {showFullReport ? "Hide full report" : "View full report"}
                </Button>
              </div>

              {showFullReport && <FullAIReportView report={aiReportState.report} />}

              {aiReportState.requiresNewBloodTest && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  <div className="flex gap-2">
                    <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600" />
                    <p>
                      A report already exists for the latest blood test. Upload a new blood test
                      before generating another Women&apos;s Health AI report.
                    </p>
                  </div>
                </div>
              )}

              <div className="grid gap-3 lg:grid-cols-2">
                {aiReportState.report.womenHealthAreas.slice(0, 4).map((area) => (
                  <div key={area.area} className="rounded-xl border bg-white p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium capitalize">{formatLabel(area.area)}</p>
                      <Badge variant={area.status === "needs_review" ? "destructive" : "secondary"}>
                        {formatLabel(area.status)}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{area.summary}</p>
                  </div>
                ))}
              </div>

              {aiReportState.report.recommendations.length > 0 && (
                <div className="space-y-2">
                  <p className="font-medium">Top recommendations</p>
                  {aiReportState.report.recommendations.slice(0, 3).map((item) => (
                    <div key={`${item.category}-${item.action}`} className="rounded-xl border bg-white p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="capitalize">{item.priority}</Badge>
                        <p className="font-medium">{item.action}</p>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{item.rationale}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed bg-white/70 p-5 text-sm text-muted-foreground">
              No AI report has been generated yet. Generate one after Women&apos;s Health biomarkers
              are available.
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              onClick={generateAIReport}
              disabled={isGenerateDisabled}
              className="bg-rose-600 hover:bg-rose-700"
            >
              {generatingReport ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              Generate Claude report
            </Button>
            <Button asChild variant="outline" className="bg-white">
              <Link href="/dashboard/biomarkers?view=program&program=WOMENS_HEALTH">
                View Women&apos;s biomarkers
              </Link>
            </Button>
          </div>

          {!aiReportState?.canGenerate && aiReportState?.report && (
            <p className="text-xs text-muted-foreground">
              Report generation is locked until a newer blood test is uploaded.
            </p>
          )}
          {generateDisabledReason && (
            <p className="text-xs text-muted-foreground">{generateDisabledReason}</p>
          )}
        </CardContent>
      </Card>

      {reportHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-rose-600" />
              AI report history
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {reportHistory.map((item) => (
              <div key={item.id} className="rounded-xl border p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium">{item.report.reportTitle || "Women's Health AI Report"}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(item.createdAt).toLocaleDateString("en-AU", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })} · {item.biomarkerCount} biomarkers
                    </p>
                  </div>
                  <Badge variant="secondary" className="w-fit">
                    {item.riskLevel} · {item.overallScore}/100
                  </Badge>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="mt-3 px-0 text-rose-700 hover:text-rose-800"
                  onClick={() =>
                    setExpandedHistoryId((current) => (current === item.id ? null : item.id))
                  }
                >
                  {expandedHistoryId === item.id ? "Hide report details" : "View report details"}
                </Button>
                {expandedHistoryId === item.id && (
                  <div className="mt-3">
                    <FullAIReportView report={item.report} />
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card className="border-rose-100 bg-rose-50/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTubes className="w-5 h-5 text-rose-600" />
            Biomarker report views
          </CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-4 gap-3">
          {biomarkerViews.map((view) => (
            <Button key={view.href} asChild variant="outline" className="justify-between bg-white">
              <Link href={view.href}>
                {view.label}
                <ChevronRight className="w-4 h-4" />
              </Link>
            </Button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
