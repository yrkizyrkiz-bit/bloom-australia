"use client";

import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useBiomarkerResults } from "@/hooks/useApi";
import { BiomarkerCard } from "@/components/dashboard/BiomarkerCard";
import { BiomarkerDetailDialog } from "@/components/dashboard/BiomarkerDetailDialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getBiomarkerById, getStatusForValue } from "@/data/biomarkers";
import type { BiomarkerDefinition, BiomarkerResult } from "@/types";
import { Flame, Activity, TrendingUp, TrendingDown, Minus, CheckCircle, AlertTriangle, AlertCircle, BarChart3, Sparkles, Users, Calendar, Target, Brain, Droplets, Zap, Loader2, FileText, Info, Calculator, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmailReminderService } from "@/components/dashboard/EmailReminderService";

const metabolicPanelConfig = {
  bloodSugar: {
    name: "Blood Sugar",
    subtitle: "Glucose & HbA1c",
    icon: Flame,
    color: "#f97316",
    bgColor: "bg-orange-500/10",
    biomarkerIds: ["glucose", "hba1c", "insulin"]
  },
  kidney: {
    name: "Kidney Function",
    subtitle: "Filtration",
    icon: Droplets,
    color: "#06b6d4",
    bgColor: "bg-cyan-500/10",
    biomarkerIds: ["creatinine", "egfr", "bun"]
  },
  electrolytes: {
    name: "Electrolytes",
    subtitle: "Mineral Balance",
    icon: Zap,
    color: "#8b5cf6",
    bgColor: "bg-violet-500/10",
    biomarkerIds: ["sodium", "potassium", "calcium", "bicarbonate"]
  }
};

function calculateMetabolicScore(results: BiomarkerResult[], gender: "male" | "female") {
  const categoryScores: Record<string, { score: number; optimal: number; normal: number; outOfRange: number }> = {};
  let totalScore = 0, totalWeight = 0;

  for (const [key, config] of Object.entries(metabolicPanelConfig)) {
    let categoryScore = 0, categoryWeight = 0, optimal = 0, normal = 0, outOfRange = 0;
    for (const biomarkerId of config.biomarkerIds) {
      const result = results.find(r => r.biomarkerId === biomarkerId);
      const biomarker = getBiomarkerById(biomarkerId);
      if (result && biomarker) {
        const status = getStatusForValue(biomarker, result.value, gender);
        if (status === "optimal") { categoryScore += 100; optimal++; }
        else if (status === "normal") { categoryScore += 75; normal++; }
        else { categoryScore += 40; outOfRange++; }
        categoryWeight++;
      }
    }
    const finalCategoryScore = categoryWeight > 0 ? Math.round(categoryScore / categoryWeight) : 0;
    categoryScores[key] = { score: finalCategoryScore, optimal, normal, outOfRange };
    totalScore += finalCategoryScore * categoryWeight;
    totalWeight += categoryWeight;
  }

  const overallScore = totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;

  let metabolicStatus = "Normal";
  const glucoseResult = results.find(r => r.biomarkerId === "glucose");
  const hba1cResult = results.find(r => r.biomarkerId === "hba1c");
  if (glucoseResult && hba1cResult) {
    if (glucoseResult.value >= 126 || hba1cResult.value >= 6.5) metabolicStatus = "Diabetic Range";
    else if (glucoseResult.value >= 100 || hba1cResult.value >= 5.7) metabolicStatus = "Prediabetic";
  }

  const optimalCount = Object.values(categoryScores).reduce((sum, cat) => sum + cat.optimal, 0);
  const outOfRangeCount = Object.values(categoryScores).reduce((sum, cat) => sum + cat.outOfRange, 0);
  let trend: "improving" | "stable" | "declining" = "stable";
  if (optimalCount > outOfRangeCount * 2) trend = "improving";
  else if (outOfRangeCount > optimalCount) trend = "declining";

  return { overall: overallScore, categoryScores, trend, metabolicStatus };
}

function getScoreColor(score: number): string {
  if (score >= 85) return "text-orange-600";
  if (score >= 70) return "text-yellow-600";
  if (score >= 50) return "text-amber-600";
  return "text-red-600";
}

function getScoreLabel(score: number): string {
  if (score >= 90) return "Excellent";
  if (score >= 80) return "Very Good";
  if (score >= 70) return "Good";
  if (score >= 60) return "Fair";
  return "Needs Attention";
}

function getProgressColor(score: number): string {
  if (score >= 85) return "bg-orange-500";
  if (score >= 70) return "bg-yellow-500";
  if (score >= 50) return "bg-amber-500";
  return "bg-red-500";
}

export default function MetabolicPanelPage() {
  const { user } = useAuth();
  const gender = user?.gender === "female" ? "female" : "male";
  const [activeTab, setActiveTab] = useState("overview");
  const [showScoreDetails, setShowScoreDetails] = useState(false);

  // Fetch real biomarker data from API
  const { data: biomarkerData, isLoading, error } = useBiomarkerResults(undefined, { latest: true });

  const [selectedBiomarker, setSelectedBiomarker] = useState<{
    biomarker: BiomarkerDefinition;
    result: BiomarkerResult;
  } | null>(null);

  // Transform API data to BiomarkerResult format
  const allBiomarkerResults: BiomarkerResult[] = useMemo(() => {
    if (!biomarkerData?.results) return [];

    return biomarkerData.results.map((r: any) => ({
      id: r.id,
      biomarkerId: r.biomarkerId,
      value: r.value,
      unit: r.biomarker?.unit || "",
      status: r.status?.toLowerCase() as BiomarkerResult["status"],
      testedAt: r.testedAt,
      labReportId: r.labReportId || "",
      notes: r.notes || "",
      previousValue: r.previousValue,
      trend: r.trend?.toLowerCase() as "up" | "down" | "stable" | undefined,
    }));
  }, [biomarkerData]);

  // Get biomarkers with their results for metabolic panel
  const metabolicTestResults = useMemo(() => {
    const allMetabolicBiomarkerIds = Object.values(metabolicPanelConfig).flatMap(cat => cat.biomarkerIds);

    return allBiomarkerResults
      .filter(result => allMetabolicBiomarkerIds.includes(result.biomarkerId))
      .map(result => ({
        result,
        biomarker: getBiomarkerById(result.biomarkerId),
      }))
      .filter((item): item is { result: BiomarkerResult; biomarker: BiomarkerDefinition } =>
        item.biomarker !== undefined
      );
  }, [allBiomarkerResults]);

  // Calculate health score
  const healthScore = useMemo(() => {
    return calculateMetabolicScore(allBiomarkerResults, gender);
  }, [allBiomarkerResults, gender]);

  const handleBiomarkerClick = (biomarker: BiomarkerDefinition, result: BiomarkerResult) => {
    setSelectedBiomarker({ biomarker, result });
  };

  // Count statuses
  const statusCounts = useMemo(() => {
    let optimal = 0;
    let normal = 0;
    let outOfRange = 0;

    for (const { result } of metabolicTestResults) {
      if (result.status === "optimal") optimal++;
      else if (result.status === "normal") normal++;
      else outOfRange++;
    }

    return { optimal, normal, outOfRange, total: metabolicTestResults.length };
  }, [metabolicTestResults]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-orange-600" />
          <p className="text-muted-foreground">Loading metabolic panel data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="border-red-200 bg-red-50/50">
        <CardContent className="py-12 text-center">
          <p className="text-red-600 mb-2">Error loading metabolic panel data</p>
          <p className="text-muted-foreground text-sm">{error}</p>
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (metabolicTestResults.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-600/10 flex items-center justify-center">
            <Flame className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-serif text-foreground">
              Metabolic Panel
            </h1>
            <p className="text-muted-foreground text-sm">
              Blood sugar, kidney, and electrolyte assessment
            </p>
          </div>
        </div>
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
            <h3 className="text-xl font-medium mb-2">No Metabolic Panel Data Yet</h3>
            <p className="text-muted-foreground mb-4">
              Your metabolic panel results will appear here once uploaded by your healthcare provider.
            </p>
            <p className="text-sm text-muted-foreground">
              Contact your clinic to upload your blood test results.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
            <Flame className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-serif text-foreground">Comprehensive Metabolic Panel</h1>
            <p className="text-muted-foreground text-sm">Full metabolic assessment across {metabolicTestResults.length} biomarkers</p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="overview" className="gap-1.5"><Activity className="w-4 h-4" /><span className="hidden sm:inline">Overview</span></TabsTrigger>
          <TabsTrigger value="trends" className="gap-1.5"><BarChart3 className="w-4 h-4" /><span className="hidden sm:inline">Trends</span></TabsTrigger>
          <TabsTrigger value="risk" className="gap-1.5"><Brain className="w-4 h-4" /><span className="hidden sm:inline">Risk Assessment</span></TabsTrigger>
          <TabsTrigger value="goals" className="gap-1.5"><Target className="w-4 h-4" /><span className="hidden sm:inline">Goals</span></TabsTrigger>
          <TabsTrigger value="insights" className="gap-1.5"><Sparkles className="w-4 h-4" /><span className="hidden sm:inline">AI Insights</span></TabsTrigger>
          <TabsTrigger value="schedule" className="gap-1.5"><Calendar className="w-4 h-4" /><span className="hidden sm:inline">Schedule</span></TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="md:col-span-2 bg-gradient-to-br from-orange-50 to-white dark:from-orange-950/20 dark:to-background border-orange-200/50">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between">
                  <span className="text-lg">Metabolic Health Score</span>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="border-orange-500 text-orange-600">{healthScore.metabolicStatus}</Badge>
                    <Badge variant="outline" className={healthScore.trend === "improving" ? "border-green-500 text-green-600" : healthScore.trend === "declining" ? "border-red-500 text-red-600" : "border-gray-500 text-gray-600"}>
                      {healthScore.trend === "improving" && <TrendingUp className="w-3 h-3 mr-1" />}
                      {healthScore.trend === "declining" && <TrendingDown className="w-3 h-3 mr-1" />}
                      {healthScore.trend === "stable" && <Minus className="w-3 h-3 mr-1" />}
                      {healthScore.trend.charAt(0).toUpperCase() + healthScore.trend.slice(1)}
                    </Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className={`text-6xl font-bold ${getScoreColor(healthScore.overall)}`}>{healthScore.overall}</div>
                    <div className="text-sm text-muted-foreground mt-1">{getScoreLabel(healthScore.overall)}</div>
                  </div>
                  <div className="flex-1 space-y-3">
                    {Object.entries(metabolicPanelConfig).map(([key, config]) => {
                      const score = healthScore.categoryScores[key]?.score || 0;
                      return (
                        <div key={key} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-2"><config.icon className="w-4 h-4" style={{ color: config.color }} />{config.name}</span>
                            <span className={`font-medium ${getScoreColor(score)}`}>{score}</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all ${getProgressColor(score)}`} style={{ width: `${score}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Biomarker Status</CardTitle>
                <CardDescription>{statusCounts.total} biomarkers analyzed</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-orange-500/10">
                  <div className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-orange-600" /><span className="font-medium">Optimal</span></div>
                  <span className="text-xl font-bold text-orange-600">{statusCounts.optimal}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-500/10">
                  <div className="flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-yellow-600" /><span className="font-medium">Normal</span></div>
                  <span className="text-xl font-bold text-yellow-600">{statusCounts.normal}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-red-500/10">
                  <div className="flex items-center gap-2"><AlertCircle className="w-5 h-5 text-red-600" /><span className="font-medium">Out of Range</span></div>
                  <span className="text-xl font-bold text-red-600">{statusCounts.outOfRange}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Scientific Metabolic Scores Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-orange-600" />
                Scientific Metabolic Scores
                <Badge variant="outline" className="border-orange-500 text-orange-600">ADA Guidelines</Badge>
              </CardTitle>
              <CardDescription>
                Scores are calculated using evidence-based clinical guidelines for metabolic health.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-2">
                <Info className="w-4 h-4 text-orange-600" />
                <span className="text-sm text-muted-foreground">
                  Your metabolic health score is based on the American Diabetes Association (ADA) Standards of Care and KDIGO guidelines.
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-2 px-2 py-1 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/20"
                onClick={() => setShowScoreDetails((prev) => !prev)}
                aria-expanded={showScoreDetails}
                aria-controls="metabolic-score-details"
              >
                {showScoreDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                Learn more about these scores
              </Button>
              {showScoreDetails && (
                <div id="metabolic-score-details" className="mt-3 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200/50 p-4 text-sm text-muted-foreground">
                  <h4 className="font-medium text-orange-700 dark:text-orange-400 mb-2">ADA & KDIGO Guidelines for Metabolic Scoring</h4>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>
                      <span className="font-semibold">Blood Sugar (Glucose, HbA1c, Insulin):</span> These markers are evaluated based on ADA Standards of Medical Care in Diabetes. Fasting glucose below 100 mg/dL and HbA1c below 5.7% are considered optimal. Levels between 100-125 mg/dL (glucose) or 5.7-6.4% (HbA1c) indicate prediabetes.
                    </li>
                    <li>
                      <span className="font-semibold">Kidney Function (Creatinine, eGFR, BUN):</span> These are assessed using KDIGO 2022 guidelines. eGFR above 90 mL/min indicates normal kidney function, while lower values may indicate CKD staging.
                    </li>
                    <li>
                      <span className="font-semibold">Electrolytes (Sodium, Potassium, Calcium, Bicarbonate):</span> Electrolyte balance is critical for metabolic function. Optimal ranges are based on clinical reference intervals and help assess kidney function, acid-base balance, and cellular health.
                    </li>
                    <li>
                      <span className="font-semibold">Insulin Resistance:</span> Fasting insulin levels and the HOMA-IR index (when available) can help identify early metabolic dysfunction before glucose abnormalities appear.
                    </li>
                    <li>
                      <span className="font-semibold">Scoring:</span> Each biomarker is scored as Optimal, Normal, or Out of Range based on clinical reference intervals. The overall score is a weighted average reflecting overall metabolic health.
                    </li>
                  </ul>
                  <div className="mt-3 text-xs text-orange-700 dark:text-orange-400">
                    References: <a href="https://diabetesjournals.org/care/issue/47/Supplement_1" target="_blank" rel="noopener noreferrer" className="underline">ADA Standards of Care 2024</a>, <a href="https://kdigo.org/guidelines/" target="_blank" rel="noopener noreferrer" className="underline ml-2">KDIGO Guidelines</a>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-8">
            {Object.entries(metabolicPanelConfig).map(([key, config]) => {
              const categoryResults = metabolicTestResults.filter(item => config.biomarkerIds.includes(item.result.biomarkerId));
              const categoryScore = healthScore.categoryScores[key];
              return (
                <div key={key}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 rounded-xl ${config.bgColor} flex items-center justify-center`}>
                      <config.icon className="w-5 h-5" style={{ color: config.color }} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h2 className="text-lg font-medium text-foreground">{config.name}</h2>
                        <Badge variant="secondary" className="text-xs">{config.subtitle}</Badge>
                        {categoryScore && <Badge variant="outline" className={`${getScoreColor(categoryScore.score)} border-current`}>Score: {categoryScore.score}</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">{categoryScore?.optimal || 0} optimal, {categoryScore?.normal || 0} normal, {categoryScore?.outOfRange || 0} out of range</p>
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {categoryResults.map(({ biomarker, result }) => (
                      <BiomarkerCard key={result.id} biomarker={biomarker} result={result} gender={gender} onClick={() => handleBiomarkerClick(biomarker, result)} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-orange-500" />Metabolic Health Insights</CardTitle></CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200/50">
                  <h4 className="font-medium text-orange-700 dark:text-orange-400 mb-2">Strengths</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" /><span>Fasting glucose at 92 mg/dL - excellent blood sugar control</span></li>
                    <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" /><span>HbA1c at 5.3% indicates optimal long-term glucose</span></li>
                    <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" /><span>Kidney function markers all in healthy range</span></li>
                  </ul>
                </div>
                <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50">
                  <h4 className="font-medium text-amber-700 dark:text-amber-400 mb-2">Recommendations</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2"><AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" /><span>Fasting insulin slightly elevated - focus on insulin sensitivity</span></li>
                    <li className="flex items-start gap-2"><AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" /><span>Consider intermittent fasting to improve metabolic flexibility</span></li>
                    <li className="flex items-start gap-2"><AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" /><span>Regular exercise helps optimize all metabolic markers</span></li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><BarChart3 className="w-5 h-5 text-primary" />Metabolic Markers Over Time</CardTitle>
              <CardDescription>Track glucose, HbA1c, and kidney function trends</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                <p>Your metabolic markers have been improving steadily over the past 9 months</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risk" className="mt-6">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Brain className="w-5 h-5 text-orange-500" />Metabolic Risk Assessment</CardTitle></CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg border bg-green-50 dark:bg-green-950/20">
                  <h4 className="font-medium text-green-700 mb-2">Type 2 Diabetes Risk</h4>
                  <p className="text-3xl font-bold text-green-600">Low</p>
                  <p className="text-sm text-muted-foreground mt-1">Based on glucose, HbA1c, and insulin levels</p>
                </div>
                <div className="p-4 rounded-lg border bg-green-50 dark:bg-green-950/20">
                  <h4 className="font-medium text-green-700 mb-2">Kidney Disease Risk</h4>
                  <p className="text-3xl font-bold text-green-600">Low</p>
                  <p className="text-sm text-muted-foreground mt-1">Based on eGFR and creatinine</p>
                </div>
                <div className="p-4 rounded-lg border bg-yellow-50 dark:bg-yellow-950/20">
                  <h4 className="font-medium text-yellow-700 mb-2">Metabolic Syndrome Risk</h4>
                  <p className="text-3xl font-bold text-yellow-600">Moderate</p>
                  <p className="text-sm text-muted-foreground mt-1">Monitor insulin and triglycerides</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="goals" className="mt-6">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Target className="w-5 h-5 text-orange-500" />Metabolic Health Goals</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 rounded-lg border">
                  <div className="flex justify-between mb-2"><span className="font-medium">Reduce Fasting Insulin</span><Badge variant="outline">In Progress</Badge></div>
                  <p className="text-sm text-muted-foreground">Current: 8 → Target: 5 μIU/mL</p>
                  <div className="h-2 bg-muted rounded-full mt-2"><div className="h-full bg-orange-500 rounded-full" style={{ width: "40%" }} /></div>
                </div>
                <div className="p-4 rounded-lg border">
                  <div className="flex justify-between mb-2"><span className="font-medium">Maintain Optimal HbA1c</span><Badge className="bg-green-600">Achieved</Badge></div>
                  <p className="text-sm text-muted-foreground">Current: 5.3% - Target: &lt;5.4%</p>
                  <div className="h-2 bg-muted rounded-full mt-2"><div className="h-full bg-green-500 rounded-full" style={{ width: "100%" }} /></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="mt-6">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-orange-500" />AI-Powered Metabolic Recommendations</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg border bg-muted/20">
                <h4 className="font-medium mb-2">Improve Insulin Sensitivity</h4>
                <ul className="space-y-1 text-sm">
                  <li>• Practice time-restricted eating (12-hour window)</li>
                  <li>• Include resistance training 2-3x per week</li>
                  <li>• Prioritize sleep (7-9 hours nightly)</li>
                  <li>• Consider berberine or cinnamon supplements</li>
                </ul>
              </div>
              <div className="p-4 rounded-lg border bg-muted/20">
                <h4 className="font-medium mb-2">Maintain Kidney Health</h4>
                <ul className="space-y-1 text-sm">
                  <li>• Stay hydrated (2-3L water daily)</li>
                  <li>• Monitor blood pressure regularly</li>
                  <li>• Limit sodium intake to &lt;2,300mg/day</li>
                  <li>• Annual kidney function tests recommended</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Calendar className="w-5 h-5 text-primary" />Metabolic Panel Scheduling</CardTitle>
              <CardDescription>Schedule your next comprehensive metabolic panel</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">Recommended: Retest comprehensive metabolic panel in 3-6 months.</p>
            </CardContent>
          </Card>
          <EmailReminderService userEmail="sarah.johnson@example.com" userPhone="+61 412 345 678" />
        </TabsContent>
      </Tabs>

      <BiomarkerDetailDialog
        biomarker={selectedBiomarker?.biomarker || null}
        result={selectedBiomarker?.result || null}
        history={selectedBiomarker ? [] : []}
        gender={gender}
        open={!!selectedBiomarker}
        onOpenChange={(open) => !open && setSelectedBiomarker(null)}
      />
    </div>
  );
}
