"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertTriangle, TrendingUp, TrendingDown, Activity, Shield, Brain,
  ChevronRight, ChevronDown, CheckCircle, Clock, Target, LineChart, ArrowRight,
  Loader2, RefreshCw, Sparkles, AlertCircle, Lightbulb, History, Calendar, BarChart3, FileText, Zap, ThermometerSun
} from "lucide-react";

interface ThyroidRiskFactor {
  id: string;
  name: string;
  category: "hypothyroid" | "hyperthyroid" | "autoimmune" | "metabolic";
  currentRisk: number;
  previousRisk: number;
  trend: "improving" | "stable" | "worsening";
  contributingBiomarkers: { name: string; value: number; unit: string; status: "optimal" | "borderline" | "elevated" | "critical"; impact: number }[];
  timeToRisk?: string;
  preventionPotential: number;
  explanation?: string;
}

interface ThyroidPrediction {
  condition: string;
  probability: number;
  timeframe: string;
  preventable: boolean;
  keyFactors: string[];
  recommendations: string[];
}

interface ThyroidAnalysisResult {
  overallRiskScore: number;
  previousOverallRisk: number;
  summary: string;
  thyroidStatus: string;
  riskFactors: ThyroidRiskFactor[];
  predictions: ThyroidPrediction[];
  personalizedInsights: string[];
  urgentActions: string[];
  lifestyleRecommendations: string[];
  analyzedAt: string;
  cached?: boolean;
  cacheExpiresAt?: string;
}

interface HistoryItem extends ThyroidAnalysisResult {
  id: string;
  overallScore: number;
  riskLevel: string;
  biomarkerCount: number;
  createdAt: string;
}

export function ThyroidPredictiveHealthRisk() {
  const [activeTab, setActiveTab] = useState("current");
  const [expandedRisk, setExpandedRisk] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<ThyroidAnalysisResult | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<HistoryItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    try {
      const response = await fetch("/api/thyroid-analysis/history");
      if (response.ok) {
        const data = await response.json();
        setHistory(data.history || []);
      }
    } catch (err) {
      console.error("Error fetching thyroid history:", err);
    }
  }, []);

  const fetchAnalysis = useCallback(async (forceRefresh = false) => {
    if (forceRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const url = forceRefresh ? "/api/thyroid-analysis?refresh=true" : "/api/thyroid-analysis";
      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || "Failed to fetch analysis");
      }

      const data = await response.json();
      setAnalysis(data);

      if (forceRefresh) {
        fetchHistory();
      }
    } catch (err) {
      console.error("Error fetching thyroid analysis:", err);
      setError(err instanceof Error ? err.message : "Failed to load analysis");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [fetchHistory]);

  useEffect(() => {
    fetchAnalysis();
    fetchHistory();
  }, [fetchAnalysis, fetchHistory]);

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
      case "hypothyroid": return <TrendingDown className="w-4 h-4" />;
      case "hyperthyroid": return <TrendingUp className="w-4 h-4" />;
      case "autoimmune": return <Shield className="w-4 h-4" />;
      case "metabolic": return <Zap className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getThyroidStatusColor = (status: string) => {
    if (status === "Normal") return "bg-emerald-100 text-emerald-700";
    if (status.includes("Subclinical")) return "bg-amber-100 text-amber-700";
    if (status.includes("Autoimmune")) return "bg-purple-100 text-purple-700";
    return "bg-orange-100 text-orange-700";
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

  if (isLoading && !analysis) {
    return (
      <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-50 to-white">
        <CardContent className="py-20">
          <div className="flex flex-col items-center gap-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                <Brain className="w-10 h-10 text-blue-600 animate-pulse" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-amber-500 animate-bounce" />
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-semibold text-slate-800 mb-2">Analyzing Your Thyroid Health</h3>
              <p className="text-slate-500 max-w-md">
                Claude AI is reviewing your biomarker data to generate personalized thyroid risk insights...
              </p>
            </div>
            <div className="flex items-center gap-2 text-blue-600">
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
            <Button onClick={() => fetchAnalysis(true)} variant="outline" className="gap-2 border-orange-300 text-orange-700 hover:bg-orange-100">
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Brain className="w-7 h-7 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-serif font-semibold text-slate-800">Thyroid Health Risk Assessment</h2>
              <Badge className="bg-gradient-to-r from-amber-400 to-orange-400 text-white border-0 text-xs">
                <Sparkles className="w-3 h-3 mr-1" />
                Claude AI
              </Badge>
            </div>
            <p className="text-slate-500 text-sm mt-0.5">
              AI-powered analysis of your thyroid function
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchAnalysis(true)}
          disabled={isRefreshing}
          className="gap-2 border-slate-200"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
          {isRefreshing ? "Analyzing..." : "New Analysis"}
        </Button>
      </div>

      {isRefreshing && (
        <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardContent className="py-4">
            <div className="flex items-center justify-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              <span className="text-blue-700 font-medium">Generating new AI analysis...</span>
            </div>
          </CardContent>
        </Card>
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
                  <p className="text-slate-400 text-sm font-medium mb-3">Overall Thyroid Risk Score</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-6xl font-bold tracking-tight">{displayAnalysis.overallRiskScore}</span>
                    <span className="text-slate-400 text-2xl">/100</span>
                  </div>
                  <div className="flex items-center gap-2 mt-3 flex-wrap">
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
                  {displayAnalysis.thyroidStatus && (
                    <Badge className={`mt-3 ${getThyroidStatusColor(displayAnalysis.thyroidStatus)}`}>
                      <ThermometerSun className="w-3 h-3 mr-1" />
                      {displayAnalysis.thyroidStatus}
                    </Badge>
                  )}
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

          {/* AI Summary */}
          <Card className="border-0 shadow-md bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50">
            <CardContent className="py-6">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-400 flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
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
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center shrink-0">
                        <span className="text-sm font-bold text-blue-600">{i + 1}</span>
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
                <BarChart3 className="w-5 h-5 text-blue-600" />
                Detailed Risk Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {displayAnalysis.riskFactors.map(risk => {
                const level = getRiskLevel(risk.currentRisk);
                const isExpanded = expandedRisk === risk.id;

                return (
                  <div key={risk.id} className={`rounded-xl border transition-all ${isExpanded ? "border-blue-200 bg-blue-50/30" : "border-slate-100 bg-white hover:border-slate-200"}`}>
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
                            {risk.timeToRisk && ` • ${risk.timeToRisk}`}
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
                  Future Thyroid Health Predictions
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
                  <Target className="w-5 h-5 text-blue-600" />
                  Personalized Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-3">
                  {displayAnalysis.lifestyleRecommendations.map((rec, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 hover:bg-blue-50 transition-colors">
                      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle className="w-4 h-4 text-blue-600" />
                      </div>
                      <p className="text-sm text-slate-700">{rec}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {displayAnalysis.overallRiskScore < 25 && (
            <Card className="bg-gradient-to-r from-blue-500/10 to-indigo-500/5 border-blue-200/20">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-blue-500/10 flex items-center justify-center">
                      <Target className="w-7 h-7 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Your Thyroid Health is Looking Good!</h3>
                      <p className="text-muted-foreground">Continue supporting your thyroid with proper nutrition</p>
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
                            className={`w-full p-3 rounded-lg border text-left transition-all ${isSelected ? "border-blue-300 bg-blue-50" : "border-slate-100 bg-white hover:border-slate-200"}`}
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
