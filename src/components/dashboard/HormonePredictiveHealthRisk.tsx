"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sparkles,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  Loader2,
  Brain,
  Activity,
  Calendar,
  Target,
  Pill,
  Apple,
  Dumbbell,
  Stethoscope,
  FlaskConical,
  Clock,
  ChevronRight,
  Info,
  ArrowRight,
  Moon,
  Sun,
  History,
  FileText
} from "lucide-react";
import type { BiomarkerResult } from "@/types";
import { ReportDataDateNotice } from "@/components/dashboard/ReportDataDateNotice";

interface HormoneAnalysis {
  overallRisk: "low" | "moderate" | "elevated" | "high";
  riskScore: number;
  summary: string;
  hormoneBalance: { category: string; status: "optimal" | "suboptimal" | "imbalanced"; description: string }[];
  riskFactors: { factor: string; severity: "low" | "moderate" | "high"; explanation: string; biomarkers: string[] }[];
  predictions: { condition: string; likelihood: "unlikely" | "possible" | "likely"; timeframe: string; preventable: boolean }[];
  insights: string[];
  recommendations: { category: "lifestyle" | "nutrition" | "supplement" | "medical" | "testing"; priority: "high" | "medium" | "low"; action: string; rationale: string }[];
  cyclePhaseAnalysis?: {
    estimatedPhase: "follicular" | "ovulatory" | "luteal" | "menstrual" | "perimenopausal" | "menopausal" | "unknown";
    confidence: number;
    interpretation: string;
    expectedRanges: { biomarker: string; expectedRange: string; actualValue: number; status: "within" | "above" | "below" }[];
  };
  urgentActions: string[];
  analysisTimestamp: string;
}

interface HormoneHistoryItem extends HormoneAnalysis {
  id: string;
  overallScore: number;
  riskLevel: string;
  biomarkerCount: number;
  createdAt: string;
}

interface HormonePredictiveHealthRiskProps {
  biomarkerResults: BiomarkerResult[];
  gender: "male" | "female";
  historicalData?: BiomarkerResult[];
}

const HORMONE_RANGES = {
  male: {
    testosterone_total: { min: 8, optimal: { low: 14, high: 28 }, max: 35, unit: "nmol/L" },
    estradiol: { min: 40, optimal: { low: 70, high: 150 }, max: 200, unit: "pmol/L" },
    cortisol: { min: 150, optimal: { low: 300, high: 500 }, max: 700, unit: "nmol/L" },
    dhea_s: { min: 2, optimal: { low: 4, high: 10 }, max: 15, unit: "µmol/L" },
  },
  female: {
    estradiol: { min: 50, optimal: { low: 200, high: 600 }, max: 1500, unit: "pmol/L" },
    progesterone: { min: 0.5, optimal: { low: 16, high: 85 }, max: 100, unit: "nmol/L" },
    cortisol: { min: 150, optimal: { low: 300, high: 500 }, max: 700, unit: "nmol/L" },
    fsh: { min: 1, optimal: { low: 3, high: 10 }, max: 50, unit: "IU/L" },
    lh: { min: 1, optimal: { low: 2, high: 10 }, max: 70, unit: "IU/L" },
  }
};

const CYCLE_PHASES: Record<string, { day: string; color: string; icon: string }> = {
  menstrual: { day: "1-5", color: "#ef4444", icon: "🩸" },
  follicular: { day: "1-14", color: "#3b82f6", icon: "🌱" },
  ovulatory: { day: "14-16", color: "#a855f7", icon: "✨" },
  luteal: { day: "16-28", color: "#f59e0b", icon: "🌙" },
  perimenopausal: { day: "Varies", color: "#6b7280", icon: "🔄" },
  menopausal: { day: "Post", color: "#9ca3af", icon: "🌺" },
  unknown: { day: "Unknown", color: "#d1d5db", icon: "❓" }
};

export function HormonePredictiveHealthRisk({ biomarkerResults, gender, historicalData = [] }: HormonePredictiveHealthRiskProps) {
  const [analysis, setAnalysis] = useState<HormoneAnalysis | null>(null);
  const [history, setHistory] = useState<HormoneHistoryItem[]>([]);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<HormoneHistoryItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCached, setIsCached] = useState(false);
  const [dataDate, setDataDate] = useState<string | null>(null);
  const [resultsStale, setResultsStale] = useState(false);
  const [activeTab, setActiveTab] = useState("analysis");

  const fetchHistory = useCallback(async () => {
    try {
      const response = await fetch("/api/hormone-analysis/history");
      if (response.ok) {
        const data = await response.json();
        setHistory(data.history || []);
      }
    } catch (err) {
      console.error("Error fetching hormone history:", err);
    }
  }, []);

  const fetchAnalysis = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/hormone-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.requiresBiomarkers ? "No hormone biomarker results found." : data.error);
        return;
      }
      setAnalysis(data.analysis);
      setIsCached(data.cached);
      setDataDate(data.dataDate ?? null);
      setResultsStale(data.resultsStale ?? false);
      fetchHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load analysis");
    } finally {
      setIsLoading(false);
    }
  }, [fetchHistory]);

  useEffect(() => { fetchAnalysis(); }, [fetchAnalysis]);

  const hormoneBalanceData = useMemo(() => {
    const ranges = HORMONE_RANGES[gender];
    return Object.entries(ranges).map(([id, range]) => {
      const result = biomarkerResults.find(r => r.biomarkerId === id);
      if (!result) return null;
      const pct = ((result.value - range.min) / (range.max - range.min)) * 100;
      const status = result.value >= range.optimal.low && result.value <= range.optimal.high ? "optimal" : result.value < range.optimal.low ? "low" : "high";
      const names: Record<string, string> = { testosterone_total: "Testosterone", estradiol: "Estradiol", progesterone: "Progesterone", cortisol: "Cortisol", dhea_s: "DHEA-S", fsh: "FSH", lh: "LH" };
      return { id, name: names[id] || id, value: result.value, ...range, percentage: Math.max(0, Math.min(100, pct)), status };
    }).filter(Boolean);
  }, [biomarkerResults, gender]);

  const getRiskColor = (risk: string) => {
    const colors: Record<string, string> = { low: "text-green-600 bg-green-500/10", moderate: "text-yellow-600 bg-yellow-500/10", elevated: "text-orange-600 bg-orange-500/10", high: "text-red-600 bg-red-500/10" };
    return colors[risk] || "text-gray-600 bg-gray-500/10";
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = { optimal: "text-green-600 bg-green-500/10 border-green-500/30", suboptimal: "text-yellow-600 bg-yellow-500/10 border-yellow-500/30", imbalanced: "text-red-600 bg-red-500/10 border-red-500/30", low: "text-orange-600 bg-orange-500/10", high: "text-red-600 bg-red-500/10" };
    return colors[status] || "text-gray-600 bg-gray-500/10";
  };

  const getCategoryIcon = (cat: string) => {
    const icons: Record<string, JSX.Element> = { lifestyle: <Dumbbell className="w-4 h-4" />, nutrition: <Apple className="w-4 h-4" />, supplement: <Pill className="w-4 h-4" />, medical: <Stethoscope className="w-4 h-4" />, testing: <FlaskConical className="w-4 h-4" /> };
    return icons[cat] || <Target className="w-4 h-4" />;
  };

  if (isLoading && !analysis) {
    return (
      <Card className="border-purple-200/50 bg-gradient-to-br from-purple-50/50 to-pink-50/50">
        <CardContent className="py-12">
          <div className="flex flex-col items-center gap-4">
            <div className="relative"><div className="w-16 h-16 rounded-full border-4 border-purple-200 animate-pulse" /><Brain className="w-8 h-8 text-purple-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" /></div>
            <p className="font-medium text-purple-700">AI Analyzing Your Hormones...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error && !analysis) {
    return (
      <Card className="border-orange-200/50 bg-orange-50/50">
        <CardContent className="py-12 text-center">
          <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
          <p className="font-medium text-orange-700 mb-4">{error}</p>
          <Button variant="outline" size="sm" onClick={() => fetchAnalysis()}><RefreshCw className="w-4 h-4 mr-2" />Retry</Button>
        </CardContent>
      </Card>
    );
  }

  if (!analysis) return null;

  const displayAnalysis = selectedHistoryItem || analysis;

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-AU", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });

  return (
    <div className="space-y-6">
      {!selectedHistoryItem && (
        <ReportDataDateNotice dataDate={dataDate} resultsStale={resultsStale} />
      )}

      {/* Header */}
      <Card className="border-purple-200/50 bg-gradient-to-br from-purple-50/50 to-pink-50/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center"><Sparkles className="w-5 h-5 text-purple-600" /></div>
              <div>
                <CardTitle className="flex items-center gap-2">AI Hormone Analysis<Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-600 border-purple-500/30">Claude AI</Badge></CardTitle>
                <CardDescription>Personalized {gender === "female" ? "cycle-aware " : ""}hormone assessment</CardDescription>
              </div>
            </div>
            {isCached && <Badge variant="outline" className="text-xs"><Clock className="w-3 h-3 mr-1" />Saved report</Badge>}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20">
                <svg className="w-full h-full transform -rotate-90"><circle cx="40" cy="40" r="32" stroke="currentColor" strokeWidth="8" fill="none" className="text-muted/20" /><circle cx="40" cy="40" r="32" stroke="currentColor" strokeWidth="8" fill="none" strokeLinecap="round" className={displayAnalysis.riskScore <= 30 ? "text-green-500" : displayAnalysis.riskScore <= 50 ? "text-yellow-500" : "text-orange-500"} strokeDasharray={`${(100 - displayAnalysis.riskScore) * 2.01} 201`} /></svg>
                <div className="absolute inset-0 flex items-center justify-center"><span className="text-2xl font-bold">{100 - displayAnalysis.riskScore}</span></div>
              </div>
              <div><p className="text-sm text-muted-foreground">Health Score</p><Badge className={getRiskColor(displayAnalysis.overallRisk)}>{displayAnalysis.overallRisk} Risk</Badge></div>
            </div>
            {gender === "female" && displayAnalysis.cyclePhaseAnalysis && (
              <div className="p-4 rounded-lg border bg-white/50">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{CYCLE_PHASES[displayAnalysis.cyclePhaseAnalysis.estimatedPhase]?.icon}</span>
                  <div><p className="font-medium capitalize">{displayAnalysis.cyclePhaseAnalysis.estimatedPhase} Phase</p><p className="text-xs text-muted-foreground">Day {CYCLE_PHASES[displayAnalysis.cyclePhaseAnalysis.estimatedPhase]?.day}</p></div>
                </div>
                <div className="flex items-center gap-1"><Progress value={displayAnalysis.cyclePhaseAnalysis.confidence} className="h-1.5 flex-1" /><span className="text-xs text-muted-foreground">{displayAnalysis.cyclePhaseAnalysis.confidence}%</span></div>
              </div>
            )}
            <div className={gender === "female" ? "" : "md:col-span-2"}>
              <p className="text-sm text-muted-foreground leading-relaxed">{displayAnalysis.summary}</p>
              <p className="text-xs text-muted-foreground mt-2">Last analyzed: {new Date(displayAnalysis.analysisTimestamp).toLocaleString()}</p>
            </div>
          </div>
          {displayAnalysis.urgentActions.length > 0 && (
            <div className="mt-4 p-4 rounded-lg bg-red-50 border border-red-200">
              <div className="flex items-center gap-2 text-red-700 mb-2"><AlertTriangle className="w-5 h-5" /><span className="font-semibold">Urgent Actions</span></div>
              <ul className="space-y-1">{displayAnalysis.urgentActions.map((a, i) => <li key={i} className="text-sm text-red-600 flex items-start gap-2"><ChevronRight className="w-4 h-4 mt-0.5" />{a}</li>)}</ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className={`grid w-full ${gender === "female" ? "grid-cols-5" : "grid-cols-4"}`}>
          <TabsTrigger value="analysis" className="gap-1.5"><Brain className="w-4 h-4" /><span className="hidden sm:inline">Analysis</span></TabsTrigger>
          <TabsTrigger value="balance" className="gap-1.5"><Activity className="w-4 h-4" /><span className="hidden sm:inline">Balance</span></TabsTrigger>
          {gender === "female" && <TabsTrigger value="cycle" className="gap-1.5"><Calendar className="w-4 h-4" /><span className="hidden sm:inline">Cycle</span></TabsTrigger>}
          <TabsTrigger value="recommendations" className="gap-1.5"><Target className="w-4 h-4" /><span className="hidden sm:inline">Actions</span></TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5"><History className="w-4 h-4" /><span className="hidden sm:inline">History</span>{history.length > 0 && <Badge variant="secondary" className="ml-1 text-xs">{history.length}</Badge>}</TabsTrigger>
        </TabsList>

        <TabsContent value="analysis" className="space-y-6 mt-6">
          <Card><CardHeader><CardTitle className="text-lg flex items-center gap-2"><Activity className="w-5 h-5 text-purple-500" />Hormone Balance Status</CardTitle></CardHeader>
            <CardContent><div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{displayAnalysis.hormoneBalance.map((item, i) => (<div key={i} className={`p-4 rounded-lg border ${getStatusColor(item.status)}`}><div className="flex items-center justify-between mb-2"><span className="font-medium">{item.category}</span><Badge variant="outline" className="capitalize">{item.status}</Badge></div><p className="text-sm text-muted-foreground">{item.description}</p></div>))}</div></CardContent>
          </Card>
          <Card><CardHeader><CardTitle className="text-lg flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-orange-500" />Risk Factors</CardTitle></CardHeader>
            <CardContent><div className="space-y-4">{displayAnalysis.riskFactors.length > 0 ? displayAnalysis.riskFactors.map((r, i) => (<div key={i} className="p-4 rounded-lg border"><div className="flex items-start justify-between mb-2"><span className="font-medium">{r.factor}</span><Badge className={r.severity === "high" ? "bg-red-500" : r.severity === "moderate" ? "bg-yellow-500" : "bg-green-500"}>{r.severity}</Badge></div><p className="text-sm text-muted-foreground">{r.explanation}</p></div>)) : <div className="text-center py-6 text-muted-foreground"><CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" /><p>No significant risk factors</p></div>}</div></CardContent>
          </Card>
          <Card><CardHeader><CardTitle className="text-lg flex items-center gap-2"><Sparkles className="w-5 h-5 text-purple-500" />Personalized Insights</CardTitle></CardHeader>
            <CardContent><ul className="space-y-3">{displayAnalysis.insights.map((insight, i) => (<li key={i} className="flex items-start gap-3 p-3 rounded-lg bg-purple-50"><Info className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" /><span className="text-sm">{insight}</span></li>))}</ul></CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="balance" className="mt-6">
          <Card><CardHeader><CardTitle className="text-lg flex items-center gap-2"><Activity className="w-5 h-5 text-purple-500" />Hormone Balance Chart</CardTitle><CardDescription>Visual representation of hormone levels vs optimal ranges</CardDescription></CardHeader>
            <CardContent><div className="space-y-6">
              {hormoneBalanceData.map((h: any) => h && (
                <div key={h.id} className="space-y-2">
                  <div className="flex items-center justify-between"><div className="flex items-center gap-2"><span className="font-medium">{h.name}</span><Badge variant="outline" className={getStatusColor(h.status)}>{h.status}</Badge></div><span className="text-sm font-medium">{h.value} {h.unit}</span></div>
                  <div className="relative h-8 bg-muted/30 rounded-full overflow-hidden">
                    <div className="absolute h-full bg-green-500/20 border-l-2 border-r-2 border-green-500" style={{ left: `${((h.optimal.low - h.min) / (h.max - h.min)) * 100}%`, width: `${((h.optimal.high - h.optimal.low) / (h.max - h.min)) * 100}%` }} />
                    <div className={`absolute top-1 bottom-1 w-3 rounded-full shadow-md ${h.status === "optimal" ? "bg-green-500" : h.status === "low" ? "bg-orange-500" : "bg-red-500"}`} style={{ left: `calc(${h.percentage}% - 6px)` }} />
                    <div className="absolute inset-0 flex items-center justify-between px-2 text-xs text-muted-foreground"><span>{h.min}</span><span>{h.max}</span></div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground"><div className="w-3 h-3 bg-green-500/20 border border-green-500 rounded" /><span>Optimal: {h.optimal.low}-{h.optimal.high} {h.unit}</span></div>
                </div>
              ))}
              {hormoneBalanceData.length === 0 && <div className="text-center py-12 text-muted-foreground"><FlaskConical className="w-12 h-12 mx-auto mb-3 opacity-20" /><p>No hormone data available</p></div>}
            </div></CardContent>
          </Card>
        </TabsContent>

        {gender === "female" && (
          <TabsContent value="cycle" className="mt-6">
            <Card><CardHeader><CardTitle className="text-lg flex items-center gap-2"><Calendar className="w-5 h-5 text-pink-500" />Menstrual Cycle Phase Analysis</CardTitle></CardHeader>
              <CardContent>{displayAnalysis.cyclePhaseAnalysis ? (
                <div className="space-y-6">
                  <div className="p-4 rounded-lg bg-pink-50 border border-pink-200">
                    <h4 className="font-medium mb-2 flex items-center gap-2"><span className="text-xl">{CYCLE_PHASES[displayAnalysis.cyclePhaseAnalysis.estimatedPhase]?.icon}</span>{displayAnalysis.cyclePhaseAnalysis.estimatedPhase.charAt(0).toUpperCase() + displayAnalysis.cyclePhaseAnalysis.estimatedPhase.slice(1)} Phase</h4>
                    <p className="text-sm text-muted-foreground">{displayAnalysis.cyclePhaseAnalysis.interpretation}</p>
                  </div>
                  <div><h4 className="font-medium mb-3">Expected Ranges for This Phase</h4><div className="space-y-3">{displayAnalysis.cyclePhaseAnalysis.expectedRanges.map((r, i) => (<div key={i} className="flex items-center justify-between p-3 rounded-lg border"><div><span className="font-medium">{r.biomarker}</span><p className="text-xs text-muted-foreground">Expected: {r.expectedRange}</p></div><div className="flex items-center gap-2"><span className="font-mono">{r.actualValue}</span><Badge className={r.status === "within" ? "bg-green-500/10 text-green-600" : r.status === "above" ? "bg-orange-500/10 text-orange-600" : "bg-blue-500/10 text-blue-600"}>{r.status}</Badge></div></div>))}</div></div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg border"><h5 className="font-medium mb-2 flex items-center gap-2"><Sun className="w-4 h-4 text-amber-500" />What to Expect</h5><ul className="text-sm text-muted-foreground space-y-1"><li>• {displayAnalysis.cyclePhaseAnalysis.estimatedPhase === "follicular" ? "Rising energy levels" : displayAnalysis.cyclePhaseAnalysis.estimatedPhase === "ovulatory" ? "Peak energy" : displayAnalysis.cyclePhaseAnalysis.estimatedPhase === "luteal" ? "Rising progesterone" : "Hormone levels lowest"}</li></ul></div>
                    <div className="p-4 rounded-lg border"><h5 className="font-medium mb-2 flex items-center gap-2"><Moon className="w-4 h-4 text-purple-500" />Self-Care Tips</h5><ul className="text-sm text-muted-foreground space-y-1"><li>• {displayAnalysis.cyclePhaseAnalysis.estimatedPhase === "follicular" ? "Start new projects" : displayAnalysis.cyclePhaseAnalysis.estimatedPhase === "ovulatory" ? "Schedule important meetings" : displayAnalysis.cyclePhaseAnalysis.estimatedPhase === "luteal" ? "Focus on stress management" : "Prioritize rest"}</li></ul></div>
                  </div>
                </div>
              ) : <div className="text-center py-12 text-muted-foreground"><Calendar className="w-12 h-12 mx-auto mb-3 opacity-20" /><p>Cycle phase analysis requires FSH, LH, Estradiol, and Progesterone</p></div>}</CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="recommendations" className="mt-6">
          <Card><CardHeader><CardTitle className="text-lg flex items-center gap-2"><Target className="w-5 h-5 text-green-500" />Personalized Action Plan</CardTitle></CardHeader>
            <CardContent><div className="space-y-6">
              {["high", "medium", "low"].map(priority => {
                const items = displayAnalysis.recommendations.filter(r => r.priority === priority);
                if (items.length === 0) return null;
                return (
                  <div key={priority}>
                    <h4 className={`font-medium mb-3 flex items-center gap-2 ${priority === "high" ? "text-red-600" : priority === "medium" ? "text-yellow-600" : "text-blue-600"}`}>
                      {priority === "high" && <AlertTriangle className="w-4 h-4" />}{priority === "medium" && <AlertCircle className="w-4 h-4" />}{priority === "low" && <Info className="w-4 h-4" />}
                      {priority.charAt(0).toUpperCase() + priority.slice(1)} Priority
                    </h4>
                    <div className="space-y-3">{items.map((rec, i) => (
                      <div key={i} className="p-4 rounded-lg border hover:border-purple-300 transition-colors">
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${rec.category === "lifestyle" ? "bg-blue-500/10 text-blue-600" : rec.category === "nutrition" ? "bg-green-500/10 text-green-600" : rec.category === "supplement" ? "bg-purple-500/10 text-purple-600" : rec.category === "medical" ? "bg-red-500/10 text-red-600" : "bg-yellow-500/10 text-yellow-600"}`}>{getCategoryIcon(rec.category)}</div>
                          <div className="flex-1"><div className="flex items-center gap-2 mb-1"><span className="font-medium">{rec.action}</span><Badge variant="outline" className="text-xs capitalize">{rec.category}</Badge></div><p className="text-sm text-muted-foreground">{rec.rationale}</p></div>
                          <ArrowRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                        </div>
                      </div>
                    ))}</div>
                  </div>
                );
              })}
            </div></CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          {history.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-16 text-center">
                <History className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-600 mb-2">No Analysis History</h3>
                <p className="text-slate-400 text-sm">
                  Past hormone analyses will appear here when new blood test results generate an updated report.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-1 border-0 shadow-md">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Analysis History</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {history.map((item) => {
                    const isSelected = selectedHistoryItem?.id === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setSelectedHistoryItem(item)}
                        className={`w-full p-3 rounded-lg border text-left transition-all ${
                          isSelected
                            ? "border-purple-300 bg-purple-50"
                            : "border-slate-100 bg-white hover:border-slate-200"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <Badge className="bg-purple-500 text-white text-xs">
                            Score: {item.overallScore}
                          </Badge>
                          <span className="text-xs text-slate-400">{item.biomarkerCount} markers</span>
                        </div>
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(item.createdAt)}
                        </p>
                      </button>
                    );
                  })}
                </CardContent>
              </Card>

              <div className="lg:col-span-2">
                {selectedHistoryItem ? (
                  <Card className="border-0 shadow-md">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">
                            Analysis from {formatDate(selectedHistoryItem.createdAt)}
                          </CardTitle>
                          <CardDescription>{selectedHistoryItem.biomarkerCount} biomarkers analyzed</CardDescription>
                        </div>
                        <Badge className="bg-purple-500 text-white capitalize">
                          {selectedHistoryItem.riskLevel} risk
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-4 rounded-lg bg-slate-50">
                        <h4 className="text-sm font-medium text-slate-700 mb-2">Summary</h4>
                        <p className="text-sm text-slate-600">{selectedHistoryItem.summary}</p>
                      </div>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          setSelectedHistoryItem(null);
                          setActiveTab("analysis");
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
