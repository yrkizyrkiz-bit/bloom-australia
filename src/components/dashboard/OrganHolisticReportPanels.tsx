"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ReportDataDateNotice } from "@/components/dashboard/ReportDataDateNotice";
import {
  getApprovedOrganSystem,
  holisticReportShowsPendingOverlay,
  sanitizeHolisticHealthReport,
  type HolisticHealthReport,
  type HolisticOrganSystem,
} from "@/lib/holistic-health-report-types";
import {
  buildOrganRiskAssessmentView,
  riskLevelFromScore,
  type OrganPanelId,
} from "@/lib/organ-holistic-risk-view";
import { OrganGoalSetting } from "@/components/dashboard/OrganGoalSetting";
import { normalizeHolisticOrganForGoals } from "@/lib/organ-ai-recommendations";
import type { BiomarkerResult } from "@/types";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  BarChart3,
  Bean,
  Brain,
  ChevronDown,
  ChevronRight,
  Droplets,
  Heart,
  Lightbulb,
  LineChart,
  Loader2,
  Shield,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

const ORGAN_LABEL: Record<OrganPanelId, string> = {
  liver: "liver",
  heart: "heart",
  kidney: "kidney",
};

const ORGAN_THEME: Record<
  OrganPanelId,
  {
    title: string;
    subtitle: string;
    headerGradient: string;
    headerShadow: string;
    loaderRing: string;
    loaderIcon: string;
    accent: string;
    Icon: typeof Bean;
  }
> = {
  liver: {
    title: "Liver Health Risk Assessment",
    subtitle: "From the organs section of your approved report for this blood test",
    headerGradient: "from-emerald-500 to-teal-600",
    headerShadow: "shadow-emerald-500/20",
    loaderRing: "from-emerald-100 to-teal-100",
    loaderIcon: "text-emerald-600",
    accent: "text-emerald-600",
    Icon: Bean,
  },
  heart: {
    title: "Cardiovascular Risk Assessment",
    subtitle: "From the organs section of your approved report for this blood test",
    headerGradient: "from-red-500 to-rose-600",
    headerShadow: "shadow-red-500/20",
    loaderRing: "from-red-100 to-rose-100",
    loaderIcon: "text-red-600",
    accent: "text-red-600",
    Icon: Heart,
  },
  kidney: {
    title: "Kidney Health Risk Assessment",
    subtitle: "From the organs section of your approved report for this blood test",
    headerGradient: "from-cyan-500 to-blue-600",
    headerShadow: "shadow-cyan-500/20",
    loaderRing: "from-cyan-100 to-blue-100",
    loaderIcon: "text-cyan-600",
    accent: "text-cyan-600",
    Icon: Droplets,
  },
};

function formatAnalyzedAt(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function trendToneClass(tone: string) {
  if (tone === "positive") return "border-emerald-500/30 bg-emerald-500/20 text-emerald-400";
  if (tone === "watch") return "border-amber-500/30 bg-amber-500/20 text-amber-300";
  if (tone === "alert") return "border-orange-500/30 bg-orange-500/20 text-orange-300";
  return "border-slate-500/30 bg-slate-500/20 text-slate-400";
}

function factorTrendClass(tone: string) {
  if (tone === "positive") return "text-emerald-700";
  if (tone === "watch") return "text-amber-700";
  if (tone === "alert") return "text-orange-700";
  return "text-slate-500";
}

function markerStatusClass(status: string) {
  const key = status.toLowerCase().replace(/\s+/g, "_");
  if (key.includes("optimal") || key === "good") return "bg-emerald-100 text-emerald-700 border-emerald-200";
  if (key.includes("normal") || key.includes("look")) return "bg-amber-100 text-amber-700 border-amber-200";
  if (key.includes("out") || key.includes("elevat") || key.includes("attention")) {
    return "bg-orange-100 text-orange-700 border-orange-200";
  }
  if (key.includes("critical") || key.includes("immediate")) return "bg-red-100 text-red-700 border-red-200";
  return "bg-slate-100 text-slate-700 border-slate-200";
}

function WaitingForApprovedReport({ organ }: { organ: OrganPanelId }) {
  return (
    <Card className="border-dashed">
      <CardContent className="py-12 text-center">
        <AlertCircle className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
        <p className="mb-1 font-medium">Waiting for an approved report</p>
        <p className="mx-auto max-w-md text-sm text-muted-foreground">
          This {ORGAN_LABEL[organ]} section fills from the organs findings in your
          doctor-assisted report for this blood test, once a Sanative doctor approves it.
        </p>
      </CardContent>
    </Card>
  );
}

function MissingOrganInReport({ organ }: { organ: OrganPanelId }) {
  return (
    <Card className="border-dashed">
      <CardContent className="py-12 text-center">
        <AlertCircle className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
        <p className="mb-1 font-medium">No {ORGAN_LABEL[organ]} findings for this blood test</p>
        <p className="mx-auto max-w-md text-sm text-muted-foreground">
          The approved report for this blood test does not include a {ORGAN_LABEL[organ]} section.
          That usually means this panel was not part of the latest results used for the report.
        </p>
      </CardContent>
    </Card>
  );
}

function useApprovedOrganFromReport(organ: OrganPanelId) {
  const [report, setReport] = useState<HolisticHealthReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dataDate, setDataDate] = useState<string | null>(null);
  const [resultsStale, setResultsStale] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    void fetch("/api/holistic-health-report")
      .then(async (res) => {
        const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
        if (!res.ok) throw new Error("Failed to load report");
        const sanitized = data.report
          ? sanitizeHolisticHealthReport(data.report as Partial<HolisticHealthReport>)
          : null;
        const next = sanitized?.aiProvider === "claude" ? sanitized : null;
        if (cancelled) return;
        setReport(next);
        setDataDate(typeof data.dataDate === "string" ? data.dataDate : null);
        setResultsStale(Boolean(data.resultsStale));
      })
      .catch(() => {
        if (!cancelled) setReport(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const approvedOrgan: HolisticOrganSystem | null = getApprovedOrganSystem(report, organ);
  const pending = Boolean(report && holisticReportShowsPendingOverlay(report));

  return {
    loading: isLoading,
    report,
    approvedOrgan,
    pending,
    dataDate,
    resultsStale,
  };
}

export function OrganHolisticRiskAssessment({ organ }: { organ: OrganPanelId }) {
  const theme = ORGAN_THEME[organ];
  const HeaderIcon = theme.Icon;
  const [expandedRisk, setExpandedRisk] = useState<string | null>(null);
  const { loading, approvedOrgan, pending, report, dataDate, resultsStale } =
    useApprovedOrganFromReport(organ);

  const view = useMemo(() => {
    if (!report || !approvedOrgan) return null;
    return buildOrganRiskAssessmentView(report, approvedOrgan, organ);
  }, [report, approvedOrgan, organ]);

  if (loading) {
    return (
      <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-50 to-white">
        <CardContent className="py-20">
          <div className="flex flex-col items-center gap-6">
            <div className="relative">
              <div
                className={`flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br ${theme.loaderRing}`}
              >
                <Brain className={`h-10 w-10 animate-pulse ${theme.loaderIcon}`} />
              </div>
              <div className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-amber-100">
                <Sparkles className="h-4 w-4 animate-bounce text-amber-500" />
              </div>
            </div>
            <div className="text-center">
              <h3 className="mb-2 text-xl font-semibold text-slate-800">
                Loading your {ORGAN_LABEL[organ]} risk assessment
              </h3>
              <p className="max-w-md text-slate-500">
                Pulling the organs section from your approved doctor-assisted report for this blood test.
              </p>
            </div>
            <div className={`flex items-center gap-2 ${theme.loaderIcon}`}>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm font-medium">Processing</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!report || pending) {
    return <WaitingForApprovedReport organ={organ} />;
  }

  if (!approvedOrgan || !view) {
    return <MissingOrganInReport organ={organ} />;
  }

  const overallLevel = riskLevelFromScore(view.riskScore);
  const analyzedLabel = formatAnalyzedAt(view.analyzedAt);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div className="flex items-center gap-4">
          <div
            className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${theme.headerGradient} shadow-lg ${theme.headerShadow}`}
          >
            <HeaderIcon className="h-7 w-7 text-white" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-serif text-2xl font-semibold text-slate-800">{theme.title}</h2>
              <Badge className="border-0 bg-gradient-to-r from-amber-400 to-orange-400 text-xs text-white">
                <Sparkles className="mr-1 h-3 w-3" />
                Approved report
              </Badge>
            </div>
            <p className="mt-0.5 text-sm text-slate-500">{theme.subtitle}</p>
          </div>
        </div>
      </div>

      <ReportDataDateNotice dataDate={dataDate} resultsStale={resultsStale} />

      <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white shadow-xl">
        <CardContent className="relative pb-8 pt-8">
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <p className="mb-3 text-sm font-medium text-slate-400">Overall Risk Score</p>
              <div className="flex items-baseline gap-2">
                <span className="text-6xl font-bold tracking-tight">{view.riskScore}</span>
                <span className="text-2xl text-slate-400">/100</span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge className={trendToneClass(view.trendTone)}>
                  {view.trend === "improving" ? (
                    <TrendingDown className="mr-1 h-3 w-3" />
                  ) : view.trend === "declining" ? (
                    <TrendingUp className="mr-1 h-3 w-3" />
                  ) : (
                    <Activity className="mr-1 h-3 w-3" />
                  )}
                  {view.trendLabel}
                </Badge>
                <Badge className={`${overallLevel.bgColor} border-0 text-white`}>
                  {overallLevel.label} Risk
                </Badge>
              </div>
              <p className="mt-4 text-xs text-slate-500">
                Organ health score {view.healthScore}/100 · {view.biomarkersTracked} markers
                {analyzedLabel ? ` · ${analyzedLabel}` : ""}
              </p>
            </div>

            <div className="lg:col-span-2">
              <p className="mb-4 text-sm font-medium text-slate-400">Risk categories</p>
              {view.riskFactors.length === 0 ? (
                <p className="text-sm text-slate-400">
                  No elevated {ORGAN_LABEL[organ]} risk categories were flagged on this blood test.
                </p>
              ) : (
                <div className="space-y-4">
                  {view.riskFactors.slice(0, 4).map((risk) => {
                    const level = riskLevelFromScore(risk.currentRisk);
                    return (
                      <div key={risk.id} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2 text-slate-300">
                            <BarChart3 className="h-4 w-4" />
                            {risk.name}
                          </span>
                          <span className={level.color}>{risk.currentRisk}%</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-slate-700/50">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${level.bgColor}`}
                            style={{ width: `${risk.currentRisk}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {view.summary ? (
        <Card className="border-0 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 shadow-md">
          <CardContent className="py-6">
            <div className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-400 shadow-lg shadow-amber-500/20">
                <Lightbulb className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="mb-2 font-semibold text-slate-800">Assessment summary</h3>
                <p className="leading-relaxed text-slate-600">{view.summary}</p>
                {view.riskFactorLead ? (
                  <p className="mt-3 rounded-lg bg-white/70 p-3 text-sm leading-relaxed text-slate-700">
                    <span className="font-medium text-orange-800">Risk factor: </span>
                    {view.riskFactorLead}
                  </p>
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {view.urgentActions.length > 0 ? (
        <Card className="border-red-200 bg-gradient-to-r from-red-50 to-rose-50">
          <CardContent className="py-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-100">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h4 className="mb-2 font-semibold text-red-800">Attention required</h4>
                <ul className="space-y-1">
                  {view.urgentActions.map((action) => (
                    <li key={action} className="flex items-start gap-2 text-sm text-red-700">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {view.insights.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-3">
          {view.insights.map((insight, index) => (
            <Card key={insight} className="border-0 bg-white shadow-sm transition-shadow hover:shadow-md">
              <CardContent className="py-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-100 to-teal-100">
                    <span className="text-sm font-bold text-emerald-600">{index + 1}</span>
                  </div>
                  <p className="text-sm leading-relaxed text-slate-600">{insight}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}

      {view.riskFactors.length > 0 ? (
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className={`h-5 w-5 ${theme.accent}`} />
              Detailed risk factors
            </CardTitle>
            <CardDescription>
              Risk factor, gaps, and markers from this {ORGAN_LABEL[organ]} blood test
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {view.riskFactors.map((risk) => {
              const level = riskLevelFromScore(risk.currentRisk);
              const isExpanded = expandedRisk === risk.id;
              return (
                <div
                  key={risk.id}
                  className={`rounded-xl border transition-all ${
                    isExpanded
                      ? "border-emerald-200 bg-emerald-50/30"
                      : "border-slate-100 bg-white hover:border-slate-200"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setExpandedRisk(isExpanded ? null : risk.id)}
                    className="flex w-full items-center justify-between p-4 text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${level.lightBg}`}>
                        <AlertTriangle className={`h-4 w-4 ${level.color}`} />
                      </div>
                      <div>
                        <h4 className="font-medium text-slate-800">{risk.name}</h4>
                        <p className={`mt-0.5 text-xs ${factorTrendClass(risk.trendTone)}`}>
                          {risk.trendLabel}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className={`text-xl font-bold ${level.color}`}>{risk.currentRisk}%</p>
                        <Badge variant="outline" className={`border-current text-xs ${level.color}`}>
                          {level.label}
                        </Badge>
                      </div>
                      {isExpanded ? (
                        <ChevronDown className="h-5 w-5 text-slate-400" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-slate-400" />
                      )}
                    </div>
                  </button>
                  {isExpanded ? (
                    <div className="space-y-4 border-t border-slate-100 px-4 pb-4 pt-4">
                      <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">{risk.explanation}</p>
                      {risk.contributingBiomarkers.length > 0 ? (
                        <div>
                          <p className="mb-2 text-xs font-medium text-slate-500">Contributing biomarkers</p>
                          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                            {risk.contributingBiomarkers.map((bio) => (
                              <div key={`${risk.id}-${bio.name}`} className="rounded-lg border border-slate-100 bg-white p-3">
                                <div className="mb-1 flex items-center justify-between gap-1">
                                  <span className="text-xs font-medium text-slate-700">{bio.name}</span>
                                  <Badge variant="outline" className={`text-[10px] ${markerStatusClass(bio.status)}`}>
                                    {bio.trendLabel}
                                  </Badge>
                                </div>
                                <p className="text-sm font-semibold text-slate-800">
                                  {bio.value}{" "}
                                  <span className="text-xs font-normal text-slate-500">{bio.unit}</span>
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </CardContent>
        </Card>
      ) : null}

      {view.watchItems.length > 0 ? (
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <LineChart className="h-5 w-5 text-blue-600" />
              What to watch across systems
            </CardTitle>
            <CardDescription>
              Patterns from this blood test that involve your {ORGAN_LABEL[organ]} results
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {view.watchItems.map((item) => (
                <div key={item.title} className="rounded-xl border border-slate-100 bg-white p-4">
                  <h4 className="font-medium text-slate-800">{item.title}</h4>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.explanation}</p>
                  {item.advice ? (
                    <p className="mt-3 flex items-start gap-1 text-xs text-emerald-700">
                      <Shield className="mt-0.5 h-3 w-3 shrink-0" />
                      {item.advice}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

export function OrganHolisticGoals({
  organ,
  currentResults,
  gender = "male",
}: {
  organ: OrganPanelId;
  currentResults: BiomarkerResult[];
  gender?: "male" | "female";
}) {
  const { loading, approvedOrgan, pending, report, dataDate, resultsStale } =
    useApprovedOrganFromReport(organ);

  const analysis = useMemo(() => {
    if (!report || !approvedOrgan) return null;
    return normalizeHolisticOrganForGoals(
      report,
      approvedOrgan,
      organ,
      currentResults.map((result) => ({ biomarkerId: result.biomarkerId, value: result.value })),
      gender
    );
  }, [report, approvedOrgan, organ, currentResults, gender]);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading your approved report…</p>
        </CardContent>
      </Card>
    );
  }

  if (!report || pending) {
    return <WaitingForApprovedReport organ={organ} />;
  }

  if (!approvedOrgan) {
    return <MissingOrganInReport organ={organ} />;
  }

  return (
    <OrganGoalSetting
      organ={organ}
      currentResults={currentResults}
      gender={gender}
      analysisOverride={analysis}
      analysisLoadingOverride={false}
      dataDateOverride={dataDate}
      resultsStaleOverride={resultsStale}
      suggestionsTitle="Report goals"
      suggestionsDescription={`Add this ${ORGAN_LABEL[organ]} goal from Actions in your approved report. It is unique to this organ and is not repeated on other organs.`}
      uniqueReportActionsOnly
    />
  );
}
