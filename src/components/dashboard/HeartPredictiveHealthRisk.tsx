"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertTriangle, TrendingUp, TrendingDown, Activity, Heart, Shield, Brain,
  ChevronRight, ChevronDown, CheckCircle, Clock, Target, LineChart, ArrowRight,
  Loader2, RefreshCw, Sparkles, AlertCircle, Lightbulb, History, Calendar, BarChart3, FileText, Flame, Zap,
  HeartPulse, Calculator, Info, User, Stethoscope
} from "lucide-react";
import { ReportDataDateNotice } from "@/components/dashboard/ReportDataDateNotice";
import { AscvdSetupForm } from "@/components/dashboard/AscvdSetupForm";
import type { AscvdLabInputs, AscvdProfileInputs } from "@/lib/ascvd-inputs";

interface HeartRiskFactor {
  id: string;
  name: string;
  category: "cardiovascular" | "metabolic" | "lipid" | "inflammation";
  currentRisk: number;
  previousRisk: number;
  trend: "improving" | "stable" | "worsening";
  contributingBiomarkers: { name: string; value: number; unit: string; status: "optimal" | "borderline" | "elevated" | "critical"; impact: number }[];
  timeToRisk?: string;
  preventionPotential: number;
  explanation?: string;
}

interface HeartPrediction {
  condition: string;
  probability: number;
  timeframe: string;
  preventable: boolean;
  keyFactors: string[];
  recommendations: string[];
}

// ASCVD Risk Types
interface ASCVDResult {
  tenYearRisk: number;
  lifetimeRisk: number;
  riskCategory: "low" | "borderline" | "intermediate" | "high";
  optimal10YearRisk: number;
  heartAge: number;
  applicable: boolean;
  reason?: string;
  dataSource?: {
    bloodPressure: "measured" | "estimated";
    smoking: "reported" | "assumed_non_smoker";
    race: "reported" | "default_white";
  };
  inputValues?: {
    systolicBP: number;
    onBPMeds: boolean;
    smoker: boolean;
    race: string;
  };
}

// Health profile = ASCVD lifestyle / BP inputs
type HealthProfile = AscvdProfileInputs;

type SetupPhase = "initializing" | "setup" | "generating" | "report";

interface HeartAnalysisResult {
  overallRiskScore: number;
  previousOverallRisk: number;
  summary: string;
  ascvdRisk?: ASCVDResult;
  riskFactors: HeartRiskFactor[];
  predictions: HeartPrediction[];
  personalizedInsights: string[];
  urgentActions: string[];
  lifestyleRecommendations: string[];
  analyzedAt: string;
  cached?: boolean;
  cacheExpiresAt?: string;
  dataDate?: string | null;
  resultsStale?: boolean;
}

interface HistoryItem extends HeartAnalysisResult {
  id: string;
  overallScore: number;
  riskLevel: string;
  biomarkerCount: number;
  createdAt: string;
}

export function HeartPredictiveHealthRisk() {
  const [activeTab, setActiveTab] = useState("current");
  const [expandedRisk, setExpandedRisk] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<HeartAnalysisResult | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<HistoryItem | null>(null);
  const [phase, setPhase] = useState<SetupPhase>("initializing");
  const [error, setError] = useState<string | null>(null);
  const [labInputs, setLabInputs] = useState<AscvdLabInputs | null>(null);
  const [missingForFirstRun, setMissingForFirstRun] = useState<string[]>([]);
  const [hasExistingReport, setHasExistingReport] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [healthProfile, setHealthProfile] = useState<HealthProfile>({
    systolicBP: null,
    diastolicBP: null,
    onBPMedication: false,
    smokingStatus: "NEVER",
    race: "OTHER",
    familyHistoryCVD: false
  });
  const [editedProfile, setEditedProfile] = useState<HealthProfile>(healthProfile);

  const fetchHistory = useCallback(async () => {
    try {
      const response = await fetch("/api/heart-analysis/history");
      if (response.ok) {
        const data = await response.json();
        setHistory(data.history || []);
      }
    } catch (err) {
      console.error("Error fetching heart history:", err);
    }
  }, []);

  const fetchAnalysis = useCallback(async () => {
    setPhase("generating");
    setError(null);

    try {
      const response = await fetch("/api/heart-analysis");

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || "Failed to fetch analysis");
      }

      const data = await response.json();
      setAnalysis(data);
      setHasExistingReport(true);
      setPhase("report");
      fetchHistory();
    } catch (err) {
      console.error("Error fetching heart analysis:", err);
      setError(err instanceof Error ? err.message : "Failed to load analysis");
      setPhase(hasExistingReport ? "report" : "setup");
    }
  }, [fetchHistory, hasExistingReport]);

  const initialize = useCallback(async () => {
    setPhase("initializing");
    setError(null);

    try {
      const [inputsResponse, historyResponse] = await Promise.all([
        fetch("/api/heart-analysis/ascvd-inputs"),
        fetch("/api/heart-analysis/history"),
      ]);

      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        setHistory(historyData.history || []);
      }

      if (!inputsResponse.ok) {
        const errorData = await inputsResponse.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || "Failed to load ASCVD inputs");
      }

      const inputsData = await inputsResponse.json();
      setLabInputs(inputsData.labInputs);
      setHealthProfile(inputsData.profile);
      setEditedProfile(inputsData.profile);
      setMissingForFirstRun(inputsData.missingForFirstRun || []);
      setHasExistingReport(Boolean(inputsData.hasExistingReport));

      if (inputsData.hasExistingReport) {
        const analysisResponse = await fetch("/api/heart-analysis");
        if (analysisResponse.ok) {
          setAnalysis(await analysisResponse.json());
          setPhase("report");
        } else {
          setPhase("setup");
        }
      } else {
        setPhase("setup");
      }
    } catch (err) {
      console.error("Error initializing heart risk assessment:", err);
      setError(err instanceof Error ? err.message : "Failed to load cardiovascular assessment");
      setPhase("setup");
    }
  }, []);

  useEffect(() => {
    initialize();
  }, [initialize]);

  const saveProfile = async (profile: HealthProfile, bpOnly: boolean) => {
    setIsSavingProfile(true);
    setError(null);

    try {
      const payload = bpOnly
        ? {
            systolicBP: profile.systolicBP,
            diastolicBP: profile.diastolicBP,
          }
        : profile;

      const response = await fetch("/api/health-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to save profile");
      }

      const data = await response.json();
      const savedProfile = data.profile
        ? {
            systolicBP: data.profile.systolicBP,
            diastolicBP: data.profile.diastolicBP,
            onBPMedication: data.profile.onBPMedication,
            smokingStatus: data.profile.smokingStatus,
            race: data.profile.race,
            familyHistoryCVD: data.profile.familyHistoryCVD,
          }
        : profile;

      setHealthProfile(savedProfile);
      setEditedProfile(savedProfile);
      await fetchAnalysis();
    } catch (err) {
      console.error("Error saving health profile:", err);
      setError(err instanceof Error ? err.message : "Failed to save profile");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const getRiskLevel = (risk: number) => {
    if (risk < 20) return { label: "Low", color: "text-emerald-600", bgColor: "bg-emerald-500", lightBg: "bg-emerald-50" };
    if (risk < 40) return { label: "Moderate", color: "text-amber-600", bgColor: "bg-amber-500", lightBg: "bg-amber-50" };
    if (risk < 60) return { label: "Elevated", color: "text-orange-600", bgColor: "bg-orange-500", lightBg: "bg-orange-50" };
    return { label: "High", color: "text-red-600", bgColor: "bg-red-500", lightBg: "bg-red-50" };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "optimal": return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "borderline": return "bg-amber-100 text-amber-700 border-amber-200";
      case "elevated": return "bg-orange-100 text-orange-700 border-orange-200";
      case "critical": return "bg-red-100 text-red-700 border-red-200";
      default: return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "cardiovascular": return <Heart className="w-4 h-4" />;
      case "metabolic": return <Flame className="w-4 h-4" />;
      case "lipid": return <Activity className="w-4 h-4" />;
      case "inflammation": return <Zap className="w-4 h-4" />;
      default: return <Heart className="w-4 h-4" />;
    }
  };

  // ASCVD Risk Category styling
  const getASCVDRiskStyle = (category: string) => {
    switch (category) {
      case "low":
        return { bg: "bg-emerald-500", text: "text-emerald-700", lightBg: "bg-emerald-50", border: "border-emerald-200", gradient: "from-emerald-500 to-emerald-600" };
      case "borderline":
        return { bg: "bg-amber-500", text: "text-amber-700", lightBg: "bg-amber-50", border: "border-amber-200", gradient: "from-amber-500 to-amber-600" };
      case "intermediate":
        return { bg: "bg-orange-500", text: "text-orange-700", lightBg: "bg-orange-50", border: "border-orange-200", gradient: "from-orange-500 to-orange-600" };
      case "high":
        return { bg: "bg-red-500", text: "text-red-700", lightBg: "bg-red-50", border: "border-red-200", gradient: "from-red-500 to-red-600" };
      default:
        return { bg: "bg-slate-500", text: "text-slate-700", lightBg: "bg-slate-50", border: "border-slate-200", gradient: "from-slate-500 to-slate-600" };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-AU", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  if (phase === "initializing") {
    return (
      <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-50 to-white">
        <CardContent className="py-20">
          <div className="flex flex-col items-center gap-4 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-red-600" />
            <p className="text-slate-600">Loading cardiovascular assessment…</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (phase === "setup" && labInputs) {
    if (!labInputs.hasHeartBiomarkers) {
      return (
        <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50">
          <CardContent className="py-16 text-center">
            <AlertCircle className="w-10 h-10 text-orange-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-orange-800 mb-2">Blood test results required</h3>
            <p className="text-orange-700 text-sm max-w-md mx-auto">
              Upload heart blood test results before generating your cardiovascular risk report.
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg shadow-red-500/20">
            <Calculator className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-serif font-semibold text-slate-800">Cardiovascular Risk Assessment</h2>
            <p className="text-slate-500 text-sm mt-0.5">
              Confirm ASCVD calculator inputs before your first report is generated
            </p>
          </div>
        </div>

        {error && (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="py-3 text-sm text-orange-700">{error}</CardContent>
          </Card>
        )}

        <AscvdSetupForm
          mode="initial"
          labInputs={labInputs}
          profile={editedProfile}
          onProfileChange={setEditedProfile}
          onSubmit={() => saveProfile(editedProfile, false)}
          isSubmitting={isSavingProfile || phase === "generating"}
          missingForFirstRun={missingForFirstRun}
        />
      </div>
    );
  }

  if (phase === "generating" && !analysis) {
    return (
      <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-50 to-white">
        <CardContent className="py-20">
          <div className="flex flex-col items-center gap-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-100 to-rose-100 flex items-center justify-center">
                <Brain className="w-10 h-10 text-red-600 animate-pulse" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-amber-500 animate-bounce" />
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-semibold text-slate-800 mb-2">Analyzing Your Heart Health</h3>
              <p className="text-slate-500 max-w-md">
                Claude AI is reviewing your biomarker data to generate personalized cardiovascular risk insights...
              </p>
            </div>
            <div className="flex items-center gap-2 text-red-600">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm font-medium">Processing</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error && !analysis) {
    return (
      <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50">
        <CardContent className="py-16">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-orange-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-orange-800 mb-2">Analysis Unavailable</h3>
              <p className="text-orange-600 text-sm max-w-md">{error}</p>
            </div>
            <Button onClick={() => fetchAnalysis()} variant="outline" className="gap-2 border-orange-300 text-orange-700 hover:bg-orange-100">
              <RefreshCw className="w-4 h-4" />
              Try Again
            </Button>
            <Button onClick={() => setPhase("setup")} variant="ghost" className="gap-2">
              Review ASCVD inputs
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analysis) return null;

  const displayAnalysis = selectedHistoryItem || analysis;
  const riskLevel = getRiskLevel(displayAnalysis.overallRiskScore);
  const ascvdRisk = displayAnalysis.ascvdRisk;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg shadow-red-500/20">
            <Brain className="w-7 h-7 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-serif font-semibold text-slate-800">Cardiovascular Risk Assessment</h2>
              <Badge className="bg-gradient-to-r from-amber-400 to-orange-400 text-white border-0 text-xs">
                <Sparkles className="w-3 h-3 mr-1" />
                Claude AI
              </Badge>
            </div>
            <p className="text-slate-500 text-sm mt-0.5">
              AI-powered analysis using ACC/AHA ASCVD Pooled Cohort Equations
            </p>
          </div>
        </div>
      </div>

      {/* Based-on-results notice (and stale-results recommendation) */}
      {!selectedHistoryItem && (
        <ReportDataDateNotice dataDate={analysis.dataDate} resultsStale={analysis.resultsStale} />
      )}

      {error && analysis && (
        <Card className="border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50">
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-orange-500" />
                <span className="text-orange-700 text-sm">{error}</span>
              </div>
              <Button onClick={() => setError(null)} variant="ghost" size="sm" className="text-orange-600">
                Dismiss
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {labInputs && !selectedHistoryItem && (
        <AscvdSetupForm
          mode="bp_update"
          labInputs={labInputs}
          profile={editedProfile}
          onProfileChange={setEditedProfile}
          onSubmit={() => saveProfile(editedProfile, true)}
          isSubmitting={isSavingProfile || phase === "generating"}
        />
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-100/80 p-1">
          <TabsTrigger value="current" className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <BarChart3 className="w-4 h-4" />
            Current Analysis
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <History className="w-4 h-4" />
            History
            {history.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">{history.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="mt-6 space-y-6">
          {/* Hero Card */}
          <Card className="border-0 shadow-xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
            <CardContent className="relative pt-8 pb-8">
              <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                  <p className="text-slate-400 text-sm font-medium mb-3">Overall Cardiovascular Risk</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-6xl font-bold tracking-tight">{displayAnalysis.overallRiskScore}</span>
                    <span className="text-slate-400 text-2xl">/100</span>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    {displayAnalysis.overallRiskScore < displayAnalysis.previousOverallRisk ? (
                      <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                        <TrendingDown className="w-3 h-3 mr-1" />
                        Improving
                      </Badge>
                    ) : displayAnalysis.overallRiskScore > displayAnalysis.previousOverallRisk ? (
                      <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        Needs attention
                      </Badge>
                    ) : (
                      <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">
                        <Activity className="w-3 h-3 mr-1" />
                        Stable
                      </Badge>
                    )}
                    <Badge className={`${riskLevel.bgColor} text-white border-0`}>
                      {riskLevel.label} Risk
                    </Badge>
                  </div>
                  {analysis.cached && (
                    <p className="text-xs text-slate-500 mt-4 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Cached • {formatDate(displayAnalysis.analyzedAt)}
                    </p>
                  )}
                </div>

                <div className="lg:col-span-2">
                  <p className="text-slate-400 text-sm font-medium mb-4">Risk Categories</p>
                  <div className="space-y-4">
                    {displayAnalysis.riskFactors.slice(0, 4).map(risk => {
                      const level = getRiskLevel(risk.currentRisk);
                      return (
                        <div key={risk.id} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-2 text-slate-300">
                              {getCategoryIcon(risk.category)}
                              {risk.name}
                            </span>
                            <span className={level.color}>{risk.currentRisk}%</span>
                          </div>
                          <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all duration-700 ${level.bgColor}`} style={{ width: `${risk.currentRisk}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ASCVD Risk Calculator Card */}
          {ascvdRisk && (
            <Card className="border-0 shadow-lg overflow-hidden">
              <div className={`h-2 bg-gradient-to-r ${getASCVDRiskStyle(ascvdRisk.riskCategory).gradient}`} />
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-red-600" />
                    ASCVD 10-Year Risk Calculator
                  </CardTitle>
                  <Badge variant="outline" className="text-xs font-normal">
                    <Info className="w-3 h-3 mr-1" />
                    ACC/AHA Pooled Cohort Equations
                  </Badge>
                </div>
                <CardDescription>
                  Atherosclerotic Cardiovascular Disease risk assessment based on 2013 ACC/AHA guidelines
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {ascvdRisk.applicable ? (
                  <>
                    {/* Main Risk Grid */}
                    <div className="grid md:grid-cols-4 gap-4">
                      {/* 10-Year Risk */}
                      <div className={`p-4 rounded-xl ${getASCVDRiskStyle(ascvdRisk.riskCategory).lightBg} border ${getASCVDRiskStyle(ascvdRisk.riskCategory).border}`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">10-Year Risk</span>
                          <HeartPulse className={`w-4 h-4 ${getASCVDRiskStyle(ascvdRisk.riskCategory).text}`} />
                        </div>
                        <p className={`text-3xl font-bold ${getASCVDRiskStyle(ascvdRisk.riskCategory).text}`}>
                          {ascvdRisk.tenYearRisk}%
                        </p>
                        <Badge className={`mt-2 ${getASCVDRiskStyle(ascvdRisk.riskCategory).bg} text-white text-xs capitalize`}>
                          {ascvdRisk.riskCategory.replace("_", " ")} Risk
                        </Badge>
                      </div>

                      {/* Heart Age */}
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Heart Age</span>
                          <User className="w-4 h-4 text-slate-400" />
                        </div>
                        <p className="text-3xl font-bold text-slate-800">{ascvdRisk.heartAge}</p>
                        <p className="text-xs text-slate-500 mt-2">years old</p>
                      </div>

                      {/* Optimal Risk */}
                      <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Optimal Risk</span>
                          <Target className="w-4 h-4 text-emerald-500" />
                        </div>
                        <p className="text-3xl font-bold text-emerald-600">{ascvdRisk.optimal10YearRisk}%</p>
                        <p className="text-xs text-emerald-600 mt-2">with ideal factors</p>
                      </div>

                      {/* Lifetime Risk */}
                      <div className="p-4 rounded-xl bg-purple-50 border border-purple-100">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Lifetime Risk</span>
                          <LineChart className="w-4 h-4 text-purple-500" />
                        </div>
                        <p className="text-3xl font-bold text-purple-600">~{ascvdRisk.lifetimeRisk}%</p>
                        <p className="text-xs text-purple-600 mt-2">estimated</p>
                      </div>
                    </div>

                    {/* Risk Comparison Visual */}
                    <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Risk Comparison</p>
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-600">Your 10-Year Risk</span>
                            <span className={`font-medium ${getASCVDRiskStyle(ascvdRisk.riskCategory).text}`}>{ascvdRisk.tenYearRisk}%</span>
                          </div>
                          <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${getASCVDRiskStyle(ascvdRisk.riskCategory).bg}`}
                              style={{ width: `${Math.min(100, ascvdRisk.tenYearRisk * 2)}%` }}
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-600">Optimal 10-Year Risk</span>
                            <span className="font-medium text-emerald-600">{ascvdRisk.optimal10YearRisk}%</span>
                          </div>
                          <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-emerald-500"
                              style={{ width: `${Math.min(100, ascvdRisk.optimal10YearRisk * 2)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                      {ascvdRisk.tenYearRisk > ascvdRisk.optimal10YearRisk && (
                        <p className="text-sm text-slate-600 mt-4 flex items-center gap-2">
                          <Lightbulb className="w-4 h-4 text-amber-500" />
                          Lifestyle changes could reduce your risk by up to {Math.round(((ascvdRisk.tenYearRisk - ascvdRisk.optimal10YearRisk) / ascvdRisk.tenYearRisk) * 100)}%
                        </p>
                      )}
                    </div>

                    {/* Risk Category Legend */}
                    <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">ASCVD Risk Categories</p>
                      <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <div className="w-4 h-4 rounded bg-emerald-500" />
                          <span className="text-xs text-slate-600">&lt;5% Low</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-4 h-4 rounded bg-amber-500" />
                          <span className="text-xs text-slate-600">5-7.5% Borderline</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-4 h-4 rounded bg-orange-500" />
                          <span className="text-xs text-slate-600">7.5-20% Intermediate</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-4 h-4 rounded bg-red-500" />
                          <span className="text-xs text-slate-600">≥20% High</span>
                        </div>
                      </div>
                    </div>

                    {/* Statin Consideration */}
                    {ascvdRisk.riskCategory !== "low" && (
                      <div className={`p-4 rounded-xl ${ascvdRisk.riskCategory === "high" ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"} border`}>
                        <div className="flex items-start gap-3">
                          <AlertCircle className={`w-5 h-5 mt-0.5 ${ascvdRisk.riskCategory === "high" ? "text-red-600" : "text-amber-600"}`} />
                          <div>
                            <h4 className={`font-medium ${ascvdRisk.riskCategory === "high" ? "text-red-800" : "text-amber-800"}`}>
                              {ascvdRisk.riskCategory === "high"
                                ? "High-Intensity Statin Therapy Recommended"
                                : ascvdRisk.riskCategory === "intermediate"
                                ? "Consider Moderate-Intensity Statin Therapy"
                                : "Discuss Risk Reduction with Your Doctor"}
                            </h4>
                            <p className={`text-sm mt-1 ${ascvdRisk.riskCategory === "high" ? "text-red-700" : "text-amber-700"}`}>
                              Based on ACC/AHA guidelines, your risk level may benefit from lipid-lowering therapy in addition to lifestyle modifications.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-4 rounded-lg bg-slate-50 border border-slate-100 flex items-center gap-3">
                    <Info className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="text-sm text-slate-600">{ascvdRisk.reason || "ASCVD calculator requires age 40-79 and cholesterol data"}</p>
                      <p className="text-xs text-slate-400 mt-1">Upload additional biomarkers to enable ASCVD risk calculation</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* AI Summary */}
          <Card className="border-0 shadow-md bg-gradient-to-r from-red-50 via-rose-50 to-red-50">
            <CardContent className="py-6">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-400 to-rose-400 flex items-center justify-center shadow-lg shadow-red-500/20 shrink-0">
                  <Lightbulb className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-800 mb-2">AI Summary</h3>
                  <p className="text-slate-600 leading-relaxed">{displayAnalysis.summary}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Urgent Actions */}
          {displayAnalysis.urgentActions && displayAnalysis.urgentActions.length > 0 && (
            <Card className="border-red-200 bg-gradient-to-r from-red-50 to-rose-50">
              <CardContent className="py-5">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-red-800 mb-2">Attention Required</h4>
                    <ul className="space-y-1">
                      {displayAnalysis.urgentActions.map((action, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-red-700">
                          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                          <span>{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Insights */}
          {displayAnalysis.personalizedInsights && displayAnalysis.personalizedInsights.length > 0 && (
            <div className="grid md:grid-cols-3 gap-4">
              {displayAnalysis.personalizedInsights.map((insight, i) => (
                <Card key={i} className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow">
                  <CardContent className="py-5">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-100 to-rose-100 flex items-center justify-center shrink-0">
                        <span className="text-sm font-bold text-red-600">{i + 1}</span>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed">{insight}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Risk Factors */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-red-600" />
                Detailed Risk Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {displayAnalysis.riskFactors.map(risk => {
                const level = getRiskLevel(risk.currentRisk);
                const isExpanded = expandedRisk === risk.id;

                return (
                  <div key={risk.id} className={`rounded-xl border transition-all ${isExpanded ? "border-red-200 bg-red-50/30" : "border-slate-100 bg-white hover:border-slate-200"}`}>
                    <button onClick={() => setExpandedRisk(isExpanded ? null : risk.id)} className="w-full p-4 flex items-center justify-between text-left">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg ${level.lightBg} flex items-center justify-center`}>
                          {getCategoryIcon(risk.category)}
                        </div>
                        <div>
                          <h4 className="font-medium text-slate-800">{risk.name}</h4>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {risk.trend === "improving" && "↓ Improving"}
                            {risk.trend === "stable" && "→ Stable"}
                            {risk.trend === "worsening" && "↑ Worsening"}
                            {risk.timeToRisk && ` • Risk horizon: ${risk.timeToRisk}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className={`text-xl font-bold ${level.color}`}>{risk.currentRisk}%</p>
                          <Badge variant="outline" className={`text-xs ${level.color} border-current`}>{level.label}</Badge>
                        </div>
                        {isExpanded ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-4 pb-4 space-y-4 border-t border-slate-100 pt-4">
                        {risk.explanation && <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">{risk.explanation}</p>}
                        <div>
                          <p className="text-xs font-medium text-slate-500 mb-2">Contributing Biomarkers</p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {risk.contributingBiomarkers.map(bio => (
                              <div key={bio.name} className="p-3 rounded-lg bg-white border border-slate-100">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs font-medium text-slate-700">{bio.name}</span>
                                  <Badge variant="outline" className={`text-[10px] ${getStatusColor(bio.status)}`}>{bio.status}</Badge>
                                </div>
                                <p className="text-sm font-semibold text-slate-800">{bio.value} <span className="text-xs font-normal text-slate-500">{bio.unit}</span></p>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                          <div className="flex items-center gap-2">
                            <Shield className="w-5 h-5 text-emerald-600" />
                            <span className="text-sm text-emerald-700"><strong>{risk.preventionPotential}%</strong> preventable with lifestyle changes</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Predictions */}
          {displayAnalysis.predictions && displayAnalysis.predictions.length > 0 && (
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <LineChart className="w-5 h-5 text-blue-600" />
                  Future Heart Health Predictions
                </CardTitle>
                <CardDescription>Potential outcomes based on current biomarker trends</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {displayAnalysis.predictions.map((pred, i) => (
                    <div key={i} className="p-4 rounded-xl border border-slate-100 bg-white">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-medium text-slate-800">{pred.condition}</h4>
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                            <Clock className="w-3 h-3" />{pred.timeframe}
                          </p>
                        </div>
                        <Badge className={pred.probability < 25 ? "bg-emerald-100 text-emerald-700" : pred.probability < 50 ? "bg-amber-100 text-amber-700" : "bg-orange-100 text-orange-700"}>
                          {pred.probability}% risk
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-1">
                          {pred.keyFactors.slice(0, 2).map((f, j) => (
                            <Badge key={j} variant="secondary" className="text-xs">{f}</Badge>
                          ))}
                        </div>
                        {pred.preventable && (
                          <p className="text-xs text-emerald-600 flex items-center gap-1">
                            <Shield className="w-3 h-3" />Preventable
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recommendations */}
          {displayAnalysis.lifestyleRecommendations && displayAnalysis.lifestyleRecommendations.length > 0 && (
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="w-5 h-5 text-red-600" />
                  Personalized Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-3">
                  {displayAnalysis.lifestyleRecommendations.map((rec, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 hover:bg-red-50 transition-colors">
                      <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle className="w-4 h-4 text-red-600" />
                      </div>
                      <p className="text-sm text-slate-700">{rec}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {displayAnalysis.overallRiskScore < 25 && (
            <Card className="bg-gradient-to-r from-red-500/10 to-rose-500/5 border-red-200/20">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center">
                      <Target className="w-7 h-7 text-red-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Your Heart Health is Looking Good!</h3>
                      <p className="text-muted-foreground">Continue with healthy lifestyle choices</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline">Learn More</Button>
                    <Button>Create Action Plan<ArrowRight className="w-4 h-4 ml-1" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          {history.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-16 text-center">
                <History className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-600 mb-2">No Analysis History</h3>
                <p className="text-slate-400 text-sm">Your history will appear here after generating new reports.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-1 border-0 shadow-md">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Analysis History</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[500px]">
                    <div className="p-4 space-y-2">
                      {history.map((item) => {
                        const level = getRiskLevel(item.overallScore);
                        const isSelected = selectedHistoryItem?.id === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => setSelectedHistoryItem(item)}
                            className={`w-full p-3 rounded-lg border text-left transition-all ${isSelected ? "border-red-300 bg-red-50" : "border-slate-100 bg-white hover:border-slate-200"}`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <Badge className={`${level.bgColor} text-white text-xs`}>Score: {item.overallScore}</Badge>
                              <span className="text-xs text-slate-400">{item.biomarkerCount} markers</span>
                            </div>
                            <p className="text-xs text-slate-500 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />{formatDate(item.createdAt)}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              <div className="lg:col-span-2">
                {selectedHistoryItem ? (
                  <Card className="border-0 shadow-md">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">Analysis from {formatDate(selectedHistoryItem.createdAt)}</CardTitle>
                          <CardDescription>{selectedHistoryItem.biomarkerCount} biomarkers analyzed</CardDescription>
                        </div>
                        <Badge className={`${getRiskLevel(selectedHistoryItem.overallScore).bgColor} text-white`}>Score: {selectedHistoryItem.overallScore}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-4 rounded-lg bg-slate-50">
                        <h4 className="text-sm font-medium text-slate-700 mb-2">Summary</h4>
                        <p className="text-sm text-slate-600">{selectedHistoryItem.summary}</p>
                      </div>
                      {selectedHistoryItem.riskFactors && (
                        <div>
                          <h4 className="text-sm font-medium text-slate-700 mb-3">Risk Factors</h4>
                          <div className="space-y-2">
                            {selectedHistoryItem.riskFactors.map(risk => {
                              const level = getRiskLevel(risk.currentRisk);
                              return (
                                <div key={risk.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100">
                                  <span className="text-sm text-slate-700">{risk.name}</span>
                                  <Badge variant="outline" className={level.color}>{risk.currentRisk}%</Badge>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      <Button variant="outline" className="w-full" onClick={() => { setSelectedHistoryItem(null); setActiveTab("current"); }}>
                        <ArrowRight className="w-4 h-4 mr-2" />View Current Analysis
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="border-dashed h-full">
                    <CardContent className="py-16 text-center h-full flex flex-col items-center justify-center">
                      <FileText className="w-12 h-12 text-slate-300 mb-4" />
                      <h3 className="text-lg font-medium text-slate-600 mb-2">Select an Analysis</h3>
                      <p className="text-slate-400 text-sm">Click on a past analysis to view details</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
