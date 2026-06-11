"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertTriangle, TrendingUp, TrendingDown, Activity, Droplets, Zap, Shield, Brain,
  ChevronRight, ChevronDown, CheckCircle, Clock, Target, LineChart, ArrowRight,
  Loader2, RefreshCw, Sparkles, AlertCircle, Lightbulb, History, Calendar, BarChart3, FileText,
  Beaker, Heart, Info, MapPin
} from "lucide-react";
import { ReportDataDateNotice } from "@/components/dashboard/ReportDataDateNotice";

interface KidneyRiskFactor {
  id: string;
  name: string;
  category: "ckd_staging" | "albuminuria" | "electrolyte" | "anemia" | "progression";
  currentRisk: number;
  previousRisk: number;
  trend: "improving" | "stable" | "worsening";
  contributingBiomarkers: { name: string; value: number; unit: string; status: "optimal" | "borderline" | "elevated" | "critical"; impact: number }[];
  timeToRisk?: string;
  preventionPotential: number;
  explanation?: string;
  scientificBasis?: string;
}

interface KidneyPrediction {
  condition: string;
  probability: number;
  timeframe: string;
  preventable: boolean;
  keyFactors: string[];
  recommendations: string[];
}

// KDIGO CKD Classification Types
interface GFRCategoryInfo {
  category: "G1" | "G2" | "G3a" | "G3b" | "G4" | "G5";
  range: string;
  description: string;
  riskScore: number;
}

interface AlbuminuriaCategoryInfo {
  category: "A1" | "A2" | "A3";
  range: string;
  description: string;
  riskScore: number;
}

interface CKDRiskInfo {
  level: "low" | "moderate" | "high" | "very_high";
  color: "green" | "yellow" | "orange" | "red";
  description: string;
  riskScore: number;
  monitoringFrequency: string;
}

interface KFREResult {
  twoYearRisk: number;
  fiveYearRisk: number;
  applicable: boolean;
  reason?: string;
}

interface CKDStage {
  gfrCategory: GFRCategoryInfo;
  albuminuriaCategory: AlbuminuriaCategoryInfo | null;
  overallRisk: CKDRiskInfo;
  kfre: KFREResult | null;
}

// eGFR Decline Tracking Types
interface EGFRDeclineResult {
  annualDeclineRate: number;
  isRapidProgression: boolean;
  dataPoints: { date: string; value: number }[];
  timeSpanMonths: number;
  trend: "stable" | "slow_decline" | "moderate_decline" | "rapid_decline";
  projectedEGFR12Months?: number;
}

interface KidneyAnalysisResult {
  overallRiskScore: number;
  previousOverallRisk: number;
  summary: string;
  ckdStage?: CKDStage;
  eGFRDecline?: EGFRDeclineResult;
  riskFactors: KidneyRiskFactor[];
  predictions: KidneyPrediction[];
  personalizedInsights: string[];
  urgentActions: string[];
  lifestyleRecommendations: string[];
  analyzedAt: string;
  cached?: boolean;
  cacheExpiresAt?: string;
  dataDate?: string | null;
  resultsStale?: boolean;
}

interface HistoryItem extends KidneyAnalysisResult {
  id: string;
  overallScore: number;
  riskLevel: string;
  biomarkerCount: number;
  createdAt: string;
}

export function KidneyPredictiveHealthRisk() {
  const [activeTab, setActiveTab] = useState("current");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [expandedRisk, setExpandedRisk] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<KidneyAnalysisResult | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<HistoryItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    try {
      const response = await fetch("/api/kidney-analysis/history");
      if (response.ok) {
        const data = await response.json();
        setHistory(data.history || []);
      }
    } catch (err) {
      console.error("Error fetching kidney history:", err);
    }
  }, []);

  // The report is always based on the latest saved analysis for the member's
  // current biomarker data; a new report is only produced when a new blood test
  // changes that data, so there is no manual regeneration.
  const fetchAnalysis = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/kidney-analysis");

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || "Failed to fetch analysis");
      }

      const data = await response.json();
      setAnalysis(data);
      fetchHistory();
    } catch (err) {
      console.error("Error fetching kidney analysis:", err);
      setError(err instanceof Error ? err.message : "Failed to load analysis");
    } finally {
      setIsLoading(false);
    }
  }, [fetchHistory]);

  useEffect(() => {
    fetchAnalysis();
    fetchHistory();
  }, [fetchAnalysis, fetchHistory]);

  const filteredRisks = analysis?.riskFactors.filter(risk =>
    selectedCategory === "all" || risk.category === selectedCategory
  ) || [];

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
      case "ckd_staging": return <Beaker className="w-4 h-4" />;
      case "albuminuria": return <Droplets className="w-4 h-4" />;
      case "electrolyte": return <Zap className="w-4 h-4" />;
      case "anemia": return <Heart className="w-4 h-4" />;
      case "progression": return <TrendingUp className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  // KDIGO Heat Map color mapping with more detailed styling
  const getKDIGORiskStyle = (level: string) => {
    switch (level) {
      case "low":
        return {
          bg: "bg-emerald-500",
          text: "text-emerald-700",
          lightBg: "bg-emerald-50",
          border: "border-emerald-200",
          gradient: "from-emerald-500 to-emerald-600"
        };
      case "moderate":
        return {
          bg: "bg-amber-500",
          text: "text-amber-700",
          lightBg: "bg-amber-50",
          border: "border-amber-200",
          gradient: "from-amber-500 to-amber-600"
        };
      case "high":
        return {
          bg: "bg-orange-500",
          text: "text-orange-700",
          lightBg: "bg-orange-50",
          border: "border-orange-200",
          gradient: "from-orange-500 to-orange-600"
        };
      case "very_high":
        return {
          bg: "bg-red-500",
          text: "text-red-700",
          lightBg: "bg-red-50",
          border: "border-red-200",
          gradient: "from-red-500 to-red-600"
        };
      default:
        return {
          bg: "bg-slate-500",
          text: "text-slate-700",
          lightBg: "bg-slate-50",
          border: "border-slate-200",
          gradient: "from-slate-500 to-slate-600"
        };
    }
  };

  // Get GFR category color
  const getGFRCategoryColor = (category: string) => {
    switch (category) {
      case "G1": return "bg-emerald-100 text-emerald-800 border-emerald-300";
      case "G2": return "bg-lime-100 text-lime-800 border-lime-300";
      case "G3a": return "bg-amber-100 text-amber-800 border-amber-300";
      case "G3b": return "bg-orange-100 text-orange-800 border-orange-300";
      case "G4": return "bg-red-100 text-red-800 border-red-300";
      case "G5": return "bg-red-200 text-red-900 border-red-400";
      default: return "bg-slate-100 text-slate-800 border-slate-300";
    }
  };

  // Get Albuminuria category color
  const getAlbuminuriaCategoryColor = (category: string) => {
    switch (category) {
      case "A1": return "bg-emerald-100 text-emerald-800 border-emerald-300";
      case "A2": return "bg-amber-100 text-amber-800 border-amber-300";
      case "A3": return "bg-red-100 text-red-800 border-red-300";
      default: return "bg-slate-100 text-slate-800 border-slate-300";
    }
  };

  // KDIGO Heat Map cell colors
  const getHeatMapCellColor = (gfr: string, alb: string): string => {
    const heatMap: Record<string, Record<string, string>> = {
      G1: { A1: "bg-emerald-500", A2: "bg-amber-500", A3: "bg-orange-500" },
      G2: { A1: "bg-emerald-500", A2: "bg-amber-500", A3: "bg-orange-500" },
      G3a: { A1: "bg-amber-500", A2: "bg-orange-500", A3: "bg-red-500" },
      G3b: { A1: "bg-orange-500", A2: "bg-red-500", A3: "bg-red-600" },
      G4: { A1: "bg-red-500", A2: "bg-red-600", A3: "bg-red-700" },
      G5: { A1: "bg-red-600", A2: "bg-red-700", A3: "bg-red-800" }
    };
    return heatMap[gfr]?.[alb] || "bg-slate-300";
  };

  // Get eGFR decline trend styling
  const getDeclineTrendStyle = (trend: string) => {
    switch (trend) {
      case "stable":
        return { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", icon: "emerald" };
      case "slow_decline":
        return { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", icon: "amber" };
      case "moderate_decline":
        return { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", icon: "orange" };
      case "rapid_decline":
        return { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", icon: "red" };
      default:
        return { bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-200", icon: "slate" };
    }
  };

  const formatDeclineTrend = (trend: string): string => {
    switch (trend) {
      case "stable": return "Stable";
      case "slow_decline": return "Slow Decline";
      case "moderate_decline": return "Moderate Decline";
      case "rapid_decline": return "Rapid Decline";
      default: return trend;
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

  // Initial loading state
  if (isLoading && !analysis) {
    return (
      <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-50 to-white">
        <CardContent className="py-20">
          <div className="flex flex-col items-center gap-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-100 to-teal-100 flex items-center justify-center">
                <Brain className="w-10 h-10 text-cyan-600 animate-pulse" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-amber-500 animate-bounce" />
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-semibold text-slate-800 mb-2">Analyzing Your Kidney Health</h3>
              <p className="text-slate-500 max-w-md">
                Claude AI is reviewing your biomarker data to generate personalized kidney risk insights...
              </p>
            </div>
            <div className="flex items-center gap-2 text-cyan-600">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm font-medium">Processing</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state (only when no analysis exists)
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
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analysis) return null;

  const displayAnalysis = selectedHistoryItem || analysis;
  const riskLevel = getRiskLevel(displayAnalysis.overallRiskScore);
  const ckdStage = displayAnalysis.ckdStage;
  const eGFRDecline = displayAnalysis.eGFRDecline;

  return (
    <div className="space-y-6">
      {/* Premium Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Brain className="w-7 h-7 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-serif font-semibold text-slate-800">Kidney Health Risk Assessment</h2>
              <Badge className="bg-gradient-to-r from-amber-400 to-orange-400 text-white border-0 text-xs">
                <Sparkles className="w-3 h-3 mr-1" />
                Claude AI
              </Badge>
            </div>
            <p className="text-slate-500 text-sm mt-0.5">
              AI-powered analysis using KDIGO 2024 Clinical Practice Guidelines
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="ckd_staging">CKD Staging</SelectItem>
              <SelectItem value="albuminuria">Albuminuria</SelectItem>
              <SelectItem value="electrolyte">Electrolytes</SelectItem>
              <SelectItem value="anemia">Anemia</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Based-on-results notice (and stale-results recommendation) */}
      {!selectedHistoryItem && (
        <ReportDataDateNotice dataDate={analysis.dataDate} resultsStale={analysis.resultsStale} />
      )}

      {/* Error Banner */}
      {error && analysis && (
        <Card className="border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50">
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-orange-500" />
                <span className="text-orange-700 text-sm">{error}</span>
              </div>
              <Button onClick={() => setError(null)} variant="ghost" size="sm" className="text-orange-600 hover:text-orange-700">
                Dismiss
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Tabs */}
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

        {/* Current Analysis Tab */}
        <TabsContent value="current" className="mt-6 space-y-6">
          {/* Risk Score Hero Card */}
          <Card className="relative border-0 shadow-xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
            <div className="pointer-events-none absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
            <CardContent className="relative pt-8 pb-8">
              <div className="grid lg:grid-cols-3 gap-8">
                {/* Score Display */}
                <div className="lg:col-span-1">
                  <p className="text-slate-400 text-sm font-medium mb-3">Overall Kidney Risk Score</p>
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
                      Cached • Analyzed {formatDate(displayAnalysis.analyzedAt)}
                    </p>
                  )}
                </div>

                {/* Risk Bars */}
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
                            <div
                              className={`h-full rounded-full transition-all duration-700 ${level.bgColor}`}
                              style={{ width: `${risk.currentRisk}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* KDIGO CKD Staging Card - NEW SCIENTIFIC SECTION */}
          {ckdStage && (
            <Card className="border-0 shadow-lg overflow-hidden">
              <div className={`h-2 bg-gradient-to-r ${getKDIGORiskStyle(ckdStage.overallRisk.level).gradient}`} />
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Beaker className="w-5 h-5 text-cyan-600" />
                    KDIGO 2024 CKD Classification
                  </CardTitle>
                  <Badge variant="outline" className="text-xs font-normal">
                    <Info className="w-3 h-3 mr-1" />
                    Evidence-Based Staging
                  </Badge>
                </div>
                <CardDescription>
                  Chronic Kidney Disease classification based on Kidney Disease: Improving Global Outcomes guidelines
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Main Classification Grid */}
                <div className="grid md:grid-cols-3 gap-4">
                  {/* GFR Category */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">eGFR Stage</span>
                      <Badge className={`${getGFRCategoryColor(ckdStage.gfrCategory.category)} text-sm font-bold`}>
                        {ckdStage.gfrCategory.category}
                      </Badge>
                    </div>
                    <p className="text-2xl font-bold text-slate-800 mb-1">{ckdStage.gfrCategory.range}</p>
                    <p className="text-sm text-slate-600">{ckdStage.gfrCategory.description}</p>
                    <p className="text-xs text-slate-400 mt-2">mL/min/1.73m²</p>
                  </div>

                  {/* Albuminuria Category */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Albuminuria</span>
                      {ckdStage.albuminuriaCategory ? (
                        <Badge className={`${getAlbuminuriaCategoryColor(ckdStage.albuminuriaCategory.category)} text-sm font-bold`}>
                          {ckdStage.albuminuriaCategory.category}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-sm">Not Tested</Badge>
                      )}
                    </div>
                    {ckdStage.albuminuriaCategory ? (
                      <>
                        <p className="text-2xl font-bold text-slate-800 mb-1">{ckdStage.albuminuriaCategory.range}</p>
                        <p className="text-sm text-slate-600">{ckdStage.albuminuriaCategory.description}</p>
                        <p className="text-xs text-slate-400 mt-2">UACR (mg/g)</p>
                      </>
                    ) : (
                      <>
                        <p className="text-lg text-slate-500 mb-1">—</p>
                        <p className="text-sm text-slate-500">UACR test recommended for complete CKD staging</p>
                      </>
                    )}
                  </div>

                  {/* Overall CKD Risk */}
                  <div className={`p-4 rounded-xl ${getKDIGORiskStyle(ckdStage.overallRisk.level).lightBg} border ${getKDIGORiskStyle(ckdStage.overallRisk.level).border}`}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">CKD Risk</span>
                      <div className={`w-4 h-4 rounded-full ${getKDIGORiskStyle(ckdStage.overallRisk.level).bg}`} />
                    </div>
                    <p className={`text-2xl font-bold capitalize mb-1 ${getKDIGORiskStyle(ckdStage.overallRisk.level).text}`}>
                      {ckdStage.overallRisk.level.replace("_", " ")}
                    </p>
                    <p className="text-sm text-slate-600">{ckdStage.overallRisk.description}</p>
                    <div className="flex items-center gap-1.5 mt-3">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <p className="text-xs text-slate-500">{ckdStage.overallRisk.monitoringFrequency}</p>
                    </div>
                  </div>
                </div>

                {/* KDIGO Heat Map Legend */}
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">KDIGO Heat Map Risk Prognosis</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <div className="w-4 h-4 rounded bg-emerald-500" />
                      <span className="text-xs text-slate-600">Low Risk</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-4 h-4 rounded bg-amber-500" />
                      <span className="text-xs text-slate-600">Moderate Risk</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-4 h-4 rounded bg-orange-500" />
                      <span className="text-xs text-slate-600">High Risk</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-4 h-4 rounded bg-red-500" />
                      <span className="text-xs text-slate-600">Very High Risk</span>
                    </div>
                  </div>
                </div>

                {/* KFRE (Kidney Failure Risk Equation) if applicable */}
                {ckdStage.kfre && ckdStage.kfre.applicable && (
                  <div className="p-4 rounded-xl bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100">
                    <div className="flex items-center gap-2 mb-3">
                      <LineChart className="w-5 h-5 text-purple-600" />
                      <h4 className="font-semibold text-purple-800">Kidney Failure Risk Equation (KFRE)</h4>
                      <Badge variant="outline" className="text-xs border-purple-300 text-purple-700">Tangri et al.</Badge>
                    </div>
                    <p className="text-sm text-slate-600 mb-4">
                      Validated prediction model for progression to kidney failure requiring dialysis or transplant
                    </p>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="p-3 rounded-lg bg-white/60">
                        <p className="text-xs text-slate-500 mb-1">2-Year Risk</p>
                        <p className={`text-2xl font-bold ${ckdStage.kfre.twoYearRisk > 15 ? "text-red-600" : ckdStage.kfre.twoYearRisk > 5 ? "text-orange-600" : "text-emerald-600"}`}>
                          {ckdStage.kfre.twoYearRisk}%
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-white/60">
                        <p className="text-xs text-slate-500 mb-1">5-Year Risk</p>
                        <p className={`text-2xl font-bold ${ckdStage.kfre.fiveYearRisk > 15 ? "text-red-600" : ckdStage.kfre.fiveYearRisk > 5 ? "text-orange-600" : "text-emerald-600"}`}>
                          {ckdStage.kfre.fiveYearRisk}%
                        </p>
                      </div>
                    </div>
                    {ckdStage.kfre.fiveYearRisk > 3 && (
                      <p className="text-xs text-purple-700 mt-3 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Consider nephrology referral if 5-year risk &gt;3%
                      </p>
                    )}
                  </div>
                )}

                {/* KFRE Not Applicable message */}
                {ckdStage.kfre && !ckdStage.kfre.applicable && (
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex items-center gap-2">
                    <Info className="w-4 h-4 text-slate-400" />
                    <p className="text-sm text-slate-500">
                      {ckdStage.kfre.reason || "KFRE is calculated for eGFR <60 mL/min/1.73m²"}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Interactive KDIGO Heat Map */}
          {ckdStage && (
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-cyan-600" />
                    KDIGO CKD Heat Map
                  </CardTitle>
                  <Badge variant="outline" className="text-xs font-normal">
                    Your Position Highlighted
                  </Badge>
                </div>
                <CardDescription>
                  Risk of CKD progression based on GFR and Albuminuria categories
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="p-2 text-xs font-medium text-slate-500 text-left" rowSpan={2}>
                          GFR<br/>Category
                        </th>
                        <th className="p-2 text-xs font-medium text-slate-500 text-center" colSpan={3}>
                          Albuminuria Categories (UACR mg/g)
                        </th>
                      </tr>
                      <tr>
                        <th className="p-2 text-xs font-medium text-slate-600 text-center border border-slate-200">
                          A1<br/><span className="font-normal text-slate-400">&lt;30</span>
                        </th>
                        <th className="p-2 text-xs font-medium text-slate-600 text-center border border-slate-200">
                          A2<br/><span className="font-normal text-slate-400">30-300</span>
                        </th>
                        <th className="p-2 text-xs font-medium text-slate-600 text-center border border-slate-200">
                          A3<br/><span className="font-normal text-slate-400">&gt;300</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {(["G1", "G2", "G3a", "G3b", "G4", "G5"] as const).map((gfr) => {
                        const gfrRanges: Record<string, string> = {
                          G1: "≥90", G2: "60-89", G3a: "45-59", G3b: "30-44", G4: "15-29", G5: "<15"
                        };
                        return (
                          <tr key={gfr}>
                            <td className="p-2 text-xs font-medium text-slate-700 border border-slate-200 bg-slate-50">
                              {gfr}<br/>
                              <span className="font-normal text-slate-500">{gfrRanges[gfr]}</span>
                            </td>
                            {(["A1", "A2", "A3"] as const).map((alb) => {
                              const isCurrentPosition =
                                ckdStage.gfrCategory.category === gfr &&
                                (ckdStage.albuminuriaCategory?.category || "A1") === alb;

                              return (
                                <td
                                  key={alb}
                                  className={`p-3 text-center border border-slate-200 relative ${getHeatMapCellColor(gfr, alb)} ${isCurrentPosition ? "ring-4 ring-cyan-400 ring-offset-2" : ""}`}
                                >
                                  {isCurrentPosition && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                      <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-lg animate-pulse">
                                        <MapPin className="w-5 h-5 text-cyan-600" />
                                      </div>
                                    </div>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Legend */}
                <div className="mt-4 flex items-center justify-center gap-4 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded bg-emerald-500" />
                    <span className="text-xs text-slate-600">Low Risk</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded bg-amber-500" />
                    <span className="text-xs text-slate-600">Moderate</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded bg-orange-500" />
                    <span className="text-xs text-slate-600">High</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded bg-red-500" />
                    <span className="text-xs text-slate-600">Very High</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded-full border-2 border-cyan-400 flex items-center justify-center">
                      <MapPin className="w-3 h-3 text-cyan-600" />
                    </div>
                    <span className="text-xs text-slate-600">You</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* eGFR Decline Rate Tracking */}
          {eGFRDecline && (
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingDown className="w-5 h-5 text-cyan-600" />
                    eGFR Decline Tracking
                  </CardTitle>
                  <Badge
                    className={`${getDeclineTrendStyle(eGFRDecline.trend).bg} ${getDeclineTrendStyle(eGFRDecline.trend).text} border ${getDeclineTrendStyle(eGFRDecline.trend).border}`}
                  >
                    {formatDeclineTrend(eGFRDecline.trend)}
                  </Badge>
                </div>
                <CardDescription>
                  Kidney function trajectory over {eGFRDecline.timeSpanMonths} months ({eGFRDecline.dataPoints.length} measurements)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Key Metrics */}
                <div className="grid md:grid-cols-3 gap-4">
                  {/* Annual Decline Rate */}
                  <div className={`p-4 rounded-xl ${getDeclineTrendStyle(eGFRDecline.trend).bg} border ${getDeclineTrendStyle(eGFRDecline.trend).border}`}>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Annual Decline</p>
                    <p className={`text-3xl font-bold ${getDeclineTrendStyle(eGFRDecline.trend).text}`}>
                      {eGFRDecline.annualDeclineRate > 0 ? "-" : ""}{Math.abs(eGFRDecline.annualDeclineRate)}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">mL/min/1.73m²/year</p>
                  </div>

                  {/* Projected eGFR */}
                  {eGFRDecline.projectedEGFR12Months !== undefined && (
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Projected eGFR</p>
                      <p className="text-3xl font-bold text-slate-800">{eGFRDecline.projectedEGFR12Months}</p>
                      <p className="text-xs text-slate-500 mt-1">in 12 months</p>
                    </div>
                  )}

                  {/* Rapid Progression Warning */}
                  <div className={`p-4 rounded-xl ${eGFRDecline.isRapidProgression ? "bg-red-50 border-red-200" : "bg-emerald-50 border-emerald-200"} border`}>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Progression</p>
                    <p className={`text-lg font-bold ${eGFRDecline.isRapidProgression ? "text-red-700" : "text-emerald-700"}`}>
                      {eGFRDecline.isRapidProgression ? "Rapid" : "Not Rapid"}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {eGFRDecline.isRapidProgression ? ">5 mL/min/year" : "<5 mL/min/year"}
                    </p>
                  </div>
                </div>

                {/* eGFR Trend Chart */}
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-4">eGFR Trend Over Time</p>
                  <div className="h-40 relative">
                    {/* Simple line chart visualization */}
                    <div className="absolute inset-0 flex items-end justify-between gap-1 px-2">
                      {eGFRDecline.dataPoints.map((point, idx) => {
                        // Normalize to 0-100 scale (eGFR typically 0-120)
                        const height = Math.min(100, (point.value / 120) * 100);
                        const isLatest = idx === eGFRDecline.dataPoints.length - 1;

                        return (
                          <div
                            key={idx}
                            className="flex-1 flex flex-col items-center justify-end gap-1"
                          >
                            <div
                              className={`w-full max-w-12 rounded-t transition-all ${isLatest ? "bg-cyan-500" : "bg-cyan-300"}`}
                              style={{ height: `${height}%` }}
                            />
                            {(idx === 0 || isLatest || eGFRDecline.dataPoints.length <= 5) && (
                              <span className="text-[10px] text-slate-400 -rotate-45 origin-left whitespace-nowrap">
                                {new Date(point.date).toLocaleDateString("en-AU", { month: "short", year: "2-digit" })}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Y-axis labels */}
                    <div className="absolute left-0 top-0 bottom-8 flex flex-col justify-between text-xs text-slate-400 -ml-8">
                      <span>120</span>
                      <span>60</span>
                      <span>0</span>
                    </div>
                  </div>
                </div>

                {/* Clinical Significance */}
                {eGFRDecline.isRapidProgression && (
                  <div className="p-4 rounded-xl bg-red-50 border border-red-200">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-red-800">Rapid CKD Progression Detected</h4>
                        <p className="text-sm text-red-700 mt-1">
                          Your eGFR is declining at &gt;5 mL/min/1.73m²/year, which is considered rapid progression.
                          This may warrant closer monitoring and nephrology consultation.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Normal Decline Info */}
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex items-center gap-2">
                  <Info className="w-4 h-4 text-slate-400" />
                  <p className="text-xs text-slate-500">
                    Normal age-related eGFR decline is approximately 0.5-1 mL/min/1.73m² per year after age 40.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* AI Summary */}
          <Card className="border-0 shadow-md bg-gradient-to-r from-cyan-50 via-teal-50 to-cyan-50">
            <CardContent className="py-6">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-teal-400 flex items-center justify-center shadow-lg shadow-cyan-500/20 shrink-0">
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

          {/* Insights Grid */}
          {displayAnalysis.personalizedInsights && displayAnalysis.personalizedInsights.length > 0 && (
            <div className="grid md:grid-cols-3 gap-4">
              {displayAnalysis.personalizedInsights.map((insight, i) => (
                <Card key={i} className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow">
                  <CardContent className="py-5">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-100 to-teal-100 flex items-center justify-center shrink-0">
                        <span className="text-sm font-bold text-cyan-600">{i + 1}</span>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed">{insight}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Risk Factors Expandable */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-cyan-600" />
                Detailed Risk Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {filteredRisks.map(risk => {
                const level = getRiskLevel(risk.currentRisk);
                const isExpanded = expandedRisk === risk.id;

                return (
                  <div
                    key={risk.id}
                    className={`rounded-xl border transition-all ${isExpanded ? "border-cyan-200 bg-cyan-50/30" : "border-slate-100 bg-white hover:border-slate-200"}`}
                  >
                    <button
                      onClick={() => setExpandedRisk(isExpanded ? null : risk.id)}
                      className="w-full p-4 flex items-center justify-between text-left"
                    >
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
                          <Badge variant="outline" className={`text-xs ${level.color} border-current`}>
                            {level.label}
                          </Badge>
                        </div>
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5 text-slate-400" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-4 pb-4 space-y-4 border-t border-slate-100 pt-4">
                        {risk.explanation && (
                          <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">{risk.explanation}</p>
                        )}

                        <div>
                          <p className="text-xs font-medium text-slate-500 mb-2">Contributing Biomarkers</p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {risk.contributingBiomarkers.map(bio => (
                              <div key={bio.name} className="p-3 rounded-lg bg-white border border-slate-100">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs font-medium text-slate-700">{bio.name}</span>
                                  <Badge variant="outline" className={`text-[10px] ${getStatusColor(bio.status)}`}>
                                    {bio.status}
                                  </Badge>
                                </div>
                                <p className="text-sm font-semibold text-slate-800">
                                  {bio.value} <span className="text-xs font-normal text-slate-500">{bio.unit}</span>
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                          <div className="flex items-center gap-2">
                            <Shield className="w-5 h-5 text-emerald-600" />
                            <span className="text-sm text-emerald-700">
                              <strong>{risk.preventionPotential}%</strong> preventable with lifestyle changes
                            </span>
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
                  Future Kidney Health Predictions
                </CardTitle>
                <CardDescription>Potential outcomes based on current biomarker trends</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {displayAnalysis.predictions.map((pred, i) => {
                    const probLevel = pred.probability < 25 ? "emerald" : pred.probability < 50 ? "amber" : "orange";
                    return (
                      <div key={i} className="p-4 rounded-xl border border-slate-100 bg-white">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-medium text-slate-800">{pred.condition}</h4>
                            <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                              <Clock className="w-3 h-3" />
                              {pred.timeframe}
                            </p>
                          </div>
                          <Badge className={`bg-${probLevel}-100 text-${probLevel}-700 border-${probLevel}-200`}>
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
                              <Shield className="w-3 h-3" />
                              Preventable with lifestyle changes
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recommendations */}
          {displayAnalysis.lifestyleRecommendations && displayAnalysis.lifestyleRecommendations.length > 0 && (
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="w-5 h-5 text-cyan-600" />
                  Personalized Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-3">
                  {displayAnalysis.lifestyleRecommendations.map((rec, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 hover:bg-cyan-50 transition-colors">
                      <div className="w-6 h-6 rounded-full bg-cyan-100 flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle className="w-4 h-4 text-cyan-600" />
                      </div>
                      <p className="text-sm text-slate-700">{rec}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Health Status Card */}
          {displayAnalysis.overallRiskScore < 25 && (
            <Card className="bg-gradient-to-r from-cyan-500/10 to-teal-500/5 border-cyan-200/20">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-cyan-500/10 flex items-center justify-center">
                      <Target className="w-7 h-7 text-cyan-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Your Kidney Health is Excellent!</h3>
                      <p className="text-muted-foreground">Keep up the great work with hydration and regular monitoring</p>
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

        {/* History Tab */}
        <TabsContent value="history" className="mt-6">
          {history.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-16 text-center">
                <History className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-600 mb-2">No Analysis History</h3>
                <p className="text-slate-400 text-sm">
                  Your kidney analysis history will appear here after generating new reports.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid lg:grid-cols-3 gap-6">
              {/* History List */}
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
                            className={`w-full p-3 rounded-lg border text-left transition-all ${
                              isSelected
                                ? "border-cyan-300 bg-cyan-50"
                                : "border-slate-100 bg-white hover:border-slate-200"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <Badge className={`${level.bgColor} text-white text-xs`}>
                                Score: {item.overallScore}
                              </Badge>
                              <span className="text-xs text-slate-400">
                                {item.biomarkerCount} markers
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(item.createdAt)}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Selected History Detail */}
              <div className="lg:col-span-2">
                {selectedHistoryItem ? (
                  <Card className="border-0 shadow-md">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">Analysis from {formatDate(selectedHistoryItem.createdAt)}</CardTitle>
                          <CardDescription>{selectedHistoryItem.biomarkerCount} biomarkers analyzed</CardDescription>
                        </div>
                        <Badge className={`${getRiskLevel(selectedHistoryItem.overallScore).bgColor} text-white`}>
                          Score: {selectedHistoryItem.overallScore}
                        </Badge>
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
                                  <Badge variant="outline" className={level.color}>
                                    {risk.currentRisk}%
                                  </Badge>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          setSelectedHistoryItem(null);
                          setActiveTab("current");
                        }}
                      >
                        <ArrowRight className="w-4 h-4 mr-2" />
                        View Current Analysis
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="border-dashed h-full">
                    <CardContent className="py-16 text-center h-full flex flex-col items-center justify-center">
                      <FileText className="w-12 h-12 text-slate-300 mb-4" />
                      <h3 className="text-lg font-medium text-slate-600 mb-2">Select an Analysis</h3>
                      <p className="text-slate-400 text-sm">
                        Click on a past analysis to view details
                      </p>
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
