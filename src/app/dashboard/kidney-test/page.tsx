"use client";

import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useBiomarkerResults } from "@/hooks/useApi";
import { BiomarkerCard } from "@/components/dashboard/BiomarkerCard";
import { BiomarkerDetailDialog } from "@/components/dashboard/BiomarkerDetailDialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { biomarkerDefinitions, getBiomarkerById, getStatusForValue } from "@/data/biomarkers";
import type { BiomarkerDefinition, BiomarkerResult } from "@/types";
import {
  Droplets,
  Beaker,
  Zap,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Activity,
  BarChart3,
  Sparkles,
  Users,
  Calendar,
  Target,
  Brain,
  TestTube,
  FlaskConical,
  Loader2,
  FileText,
  Info,
  Calculator,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { OrganTrendSection } from "@/components/dashboard/OrganTrendSection";
import { KidneyAIRecommendations } from "@/components/dashboard/KidneyAIRecommendations";
import { KidneyPopulationComparison } from "@/components/dashboard/KidneyPopulationComparison";
import { KidneyTestScheduler } from "@/components/dashboard/KidneyTestScheduler";
import { KidneyGoalSetting } from "@/components/dashboard/KidneyGoalSetting";
import { KidneyPredictiveHealthRisk } from "@/components/dashboard/KidneyPredictiveHealthRisk";
import { EmailReminderService } from "@/components/dashboard/EmailReminderService";

// Define kidney test biomarkers grouped by category
const kidneyTestConfig = {
  kidneyFunction: {
    name: "Kidney Function",
    subtitle: "Filtration",
    icon: Droplets,
    color: "#0ea5e9",
    bgColor: "bg-cyan-600/10",
    biomarkerIds: ["creatinine", "egfr", "bun", "cystatin_c"]
  },
  urineMarkers: {
    name: "Urine Markers",
    subtitle: "Protein & Albumin",
    icon: TestTube,
    color: "#8b5cf6",
    bgColor: "bg-violet-500/10",
    biomarkerIds: ["uacr"]
  },
  electrolytes: {
    name: "Electrolytes",
    subtitle: "Mineral Balance",
    icon: Zap,
    color: "#f59e0b",
    bgColor: "bg-amber-500/10",
    biomarkerIds: ["potassium", "sodium", "bicarbonate"]
  },
  boneMineral: {
    name: "Bone & Mineral",
    subtitle: "Calcium-Phosphorus",
    icon: FlaskConical,
    color: "#10b981",
    bgColor: "bg-emerald-500/10",
    biomarkerIds: ["calcium", "phosphorus", "pth"]
  }
};

// Calculate kidney health score
function calculateKidneyHealthScore(
  results: BiomarkerResult[],
  gender: "male" | "female"
): {
  overall: number;
  categoryScores: Record<string, { score: number; optimal: number; normal: number; outOfRange: number }>;
  trend: "improving" | "stable" | "declining";
  ckdStage: string;
} {
  const categoryScores: Record<string, { score: number; optimal: number; normal: number; outOfRange: number }> = {};
  let totalScore = 0;
  let totalWeight = 0;

  for (const [key, config] of Object.entries(kidneyTestConfig)) {
    let categoryScore = 0;
    let categoryWeight = 0;
    let optimal = 0;
    let normal = 0;
    let outOfRange = 0;

    for (const biomarkerId of config.biomarkerIds) {
      const result = results.find(r => r.biomarkerId === biomarkerId);
      const biomarker = getBiomarkerById(biomarkerId);

      if (result && biomarker) {
        const status = getStatusForValue(biomarker, result.value, gender);

        if (status === "optimal") {
          categoryScore += 100;
          optimal++;
        } else if (status === "normal") {
          categoryScore += 75;
          normal++;
        } else if (status === "out_of_range") {
          categoryScore += 40;
          outOfRange++;
        } else {
          categoryScore += 20;
          outOfRange++;
        }
        categoryWeight++;
      }
    }

    const finalCategoryScore = categoryWeight > 0 ? Math.round(categoryScore / categoryWeight) : 0;
    categoryScores[key] = { score: finalCategoryScore, optimal, normal, outOfRange };
    totalScore += finalCategoryScore * categoryWeight;
    totalWeight += categoryWeight;
  }

  const overallScore = totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;

  // Calculate CKD stage based on eGFR
  const egfrResult = results.find(r => r.biomarkerId === "egfr");
  let ckdStage = "Normal";
  if (egfrResult) {
    const egfr = egfrResult.value;
    if (egfr >= 90) ckdStage = "Normal (G1)";
    else if (egfr >= 60) ckdStage = "Mild (G2)";
    else if (egfr >= 45) ckdStage = "Moderate (G3a)";
    else if (egfr >= 30) ckdStage = "Moderate (G3b)";
    else if (egfr >= 15) ckdStage = "Severe (G4)";
    else ckdStage = "Kidney Failure (G5)";
  }

  let trend: "improving" | "stable" | "declining" = "stable";
  const optimalCount = Object.values(categoryScores).reduce((sum, cat) => sum + cat.optimal, 0);
  const outOfRangeCount = Object.values(categoryScores).reduce((sum, cat) => sum + cat.outOfRange, 0);

  if (optimalCount > outOfRangeCount * 2) {
    trend = "improving";
  } else if (outOfRangeCount > optimalCount) {
    trend = "declining";
  }

  return { overall: overallScore, categoryScores, trend, ckdStage };
}

function getScoreColor(score: number): string {
  if (score >= 85) return "text-cyan-600";
  if (score >= 70) return "text-yellow-600";
  if (score >= 50) return "text-orange-600";
  return "text-red-600";
}

function getScoreLabel(score: number): string {
  if (score >= 90) return "Excellent";
  if (score >= 80) return "Very Good";
  if (score >= 70) return "Good";
  if (score >= 60) return "Fair";
  if (score >= 50) return "Needs Attention";
  return "Requires Action";
}

function getProgressColor(score: number): string {
  if (score >= 85) return "bg-cyan-500";
  if (score >= 70) return "bg-yellow-500";
  if (score >= 50) return "bg-orange-500";
  return "bg-red-500";
}

export default function KidneyTestPage() {
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

  // Get biomarkers with their results for kidney test
  const kidneyTestResults = useMemo(() => {
    const allKidneyBiomarkerIds = Object.values(kidneyTestConfig).flatMap(cat => cat.biomarkerIds);

    return allBiomarkerResults
      .filter(result => allKidneyBiomarkerIds.includes(result.biomarkerId))
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
    return calculateKidneyHealthScore(allBiomarkerResults, gender);
  }, [allBiomarkerResults, gender]);

  const handleBiomarkerClick = (biomarker: BiomarkerDefinition, result: BiomarkerResult) => {
    setSelectedBiomarker({ biomarker, result });
  };

  // Count statuses
  const statusCounts = useMemo(() => {
    let optimal = 0;
    let normal = 0;
    let outOfRange = 0;

    for (const { result } of kidneyTestResults) {
      if (result.status === "optimal") optimal++;
      else if (result.status === "normal") normal++;
      else outOfRange++;
    }

    return { optimal, normal, outOfRange, total: kidneyTestResults.length };
  }, [kidneyTestResults]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-cyan-600" />
          <p className="text-muted-foreground">Loading kidney function data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="border-red-200 bg-red-50/50">
        <CardContent className="py-12 text-center">
          <p className="text-red-600 mb-2">Error loading kidney function data</p>
          <p className="text-muted-foreground text-sm">{error}</p>
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (kidneyTestResults.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-600/10 flex items-center justify-center">
            <Droplets className="w-5 h-5 text-cyan-600" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-serif text-foreground">
              Kidney Function Test
            </h1>
            <p className="text-muted-foreground text-sm">
              Comprehensive kidney health assessment
            </p>
          </div>
        </div>
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
            <h3 className="text-xl font-medium mb-2">No Kidney Function Data Yet</h3>
            <p className="text-muted-foreground mb-4">
              Your kidney function results will appear here once uploaded by your healthcare provider.
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-600/10 flex items-center justify-center">
            <Droplets className="w-5 h-5 text-cyan-600" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-serif text-foreground">
              Kidney Function Test
            </h1>
            <p className="text-muted-foreground text-sm">
              Comprehensive kidney health assessment across {kidneyTestResults.length} biomarkers
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="overview" className="gap-1.5">
            <Activity className="w-4 h-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="trends" className="gap-1.5">
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">Trends</span>
          </TabsTrigger>
          <TabsTrigger value="risk" className="gap-1.5">
            <Brain className="w-4 h-4" />
            <span className="hidden sm:inline">Risk Assessment</span>
          </TabsTrigger>
          <TabsTrigger value="goals" className="gap-1.5">
            <Target className="w-4 h-4" />
            <span className="hidden sm:inline">Goals</span>
          </TabsTrigger>
          <TabsTrigger value="insights" className="gap-1.5">
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline">AI Insights</span>
          </TabsTrigger>
          <TabsTrigger value="compare" className="gap-1.5">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Compare</span>
          </TabsTrigger>
          <TabsTrigger value="schedule" className="gap-1.5">
            <Calendar className="w-4 h-4" />
            <span className="hidden sm:inline">Schedule</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Health Score Overview */}
          <div className="grid gap-6 md:grid-cols-3">
            {/* Main Score Card */}
            <Card className="md:col-span-2 bg-gradient-to-br from-cyan-50 to-white dark:from-cyan-950/20 dark:to-background border-cyan-200/50">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between">
                  <span className="text-lg">Kidney Health Score</span>
                  <div className="flex gap-2">
                    <Badge
                      variant="outline"
                      className="border-cyan-500 text-cyan-600"
                    >
                      {healthScore.ckdStage}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={`${
                        healthScore.trend === "improving"
                          ? "border-green-500 text-green-600"
                          : healthScore.trend === "declining"
                          ? "border-red-500 text-red-600"
                          : "border-gray-500 text-gray-600"
                      }`}
                    >
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
                    <div className={`text-6xl font-bold ${getScoreColor(healthScore.overall)}`}>
                      {healthScore.overall}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {getScoreLabel(healthScore.overall)}
                    </div>
                  </div>
                  <div className="flex-1 space-y-3">
                    {Object.entries(kidneyTestConfig).map(([key, config]) => {
                      const score = healthScore.categoryScores[key]?.score || 0;
                      return (
                        <div key={key} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-2">
                              <config.icon className="w-4 h-4" style={{ color: config.color }} />
                              {config.name}
                            </span>
                            <span className={`font-medium ${getScoreColor(score)}`}>{score}</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${getProgressColor(score)}`}
                              style={{ width: `${score}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Status Summary */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Biomarker Status</CardTitle>
                <CardDescription>{statusCounts.total} biomarkers analyzed</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-cyan-500/10">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-cyan-600" />
                    <span className="font-medium">Optimal</span>
                  </div>
                  <span className="text-xl font-bold text-cyan-600">{statusCounts.optimal}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-500/10">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                    <span className="font-medium">Normal</span>
                  </div>
                  <span className="text-xl font-bold text-yellow-600">{statusCounts.normal}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-orange-500/10">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-orange-600" />
                    <span className="font-medium">Out of Range</span>
                  </div>
                  <span className="text-xl font-bold text-orange-600">{statusCounts.outOfRange}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Scientific Kidney Scores Documentation */}
          <Card>
            <CardHeader className="flex flex-row items-center gap-2 pb-2">
              <Calculator className="w-5 h-5 text-cyan-600" />
              <CardTitle className="text-lg flex-1">Scientific Kidney Scores</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                aria-label={showScoreDetails ? "Hide details" : "Show details"}
                onClick={() => setShowScoreDetails((v) => !v)}
              >
                <Info className="w-5 h-5 text-muted-foreground" />
                {showScoreDetails ? (
                  <ChevronUp className="w-4 h-4 ml-1" />
                ) : (
                  <ChevronDown className="w-4 h-4 ml-1" />
                )}
              </Button>
            </CardHeader>
            <CardContent>
              <div className="text-muted-foreground text-sm">
                Your Kidney Health Score is calculated using internationally recognized clinical guidelines.
              </div>
              {showScoreDetails && (
                <div className="mt-4 text-sm space-y-3">
                  <div>
                    <span className="font-semibold">Methodology:</span> The score is based on the <span className="font-semibold">KDIGO (Kidney Disease: Improving Global Outcomes)</span> 2022 guidelines, which integrate multiple biomarkers to assess kidney function, filtration, proteinuria, and mineral balance.
                  </div>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>
                      <span className="font-medium">eGFR</span> (estimated Glomerular Filtration Rate) is the primary marker for kidney filtration, calculated from creatinine, age, sex, and sometimes cystatin C.
                    </li>
                    <li>
                      <span className="font-medium">UACR</span> (Urine Albumin-to-Creatinine Ratio) detects early kidney damage by measuring protein leakage.
                    </li>
                    <li>
                      <span className="font-medium">Electrolytes</span> (Sodium, Potassium, Bicarbonate) and <span className="font-medium">Minerals</span> (Calcium, Phosphorus, PTH) are included to assess overall kidney and bone-mineral health.
                    </li>
                  </ul>
                  <div>
                    Each biomarker is scored as <span className="font-semibold">Optimal</span>, <span className="font-semibold">Normal</span>, or <span className="font-semibold">Out of Range</span> based on KDIGO reference intervals. The overall score is a weighted average, with higher scores indicating better kidney health.
                  </div>
                  <div>
                    <span className="font-semibold">References:</span>
                    <ul className="list-disc pl-5 mt-1">
                      <li>
                        KDIGO 2022 Clinical Practice Guideline for Diabetes Management in Chronic Kidney Disease. <a href="https://kdigo.org/guidelines/diabetes-ckd/" target="_blank" rel="noopener noreferrer" className="underline text-cyan-700">kdigo.org</a>
                      </li>
                      <li>
                        Levey AS, et al. "Definition and classification of chronic kidney disease: a position statement from Kidney Disease: Improving Global Outcomes (KDIGO)." <span className="italic">Kidney Int</span>. 2005.
                      </li>
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Biomarker Categories */}
          <div className="space-y-8">
            {Object.entries(kidneyTestConfig).map(([key, config]) => {
              const categoryResults = kidneyTestResults.filter(
                item => config.biomarkerIds.includes(item.result.biomarkerId)
              );
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
                        {categoryScore && (
                          <Badge variant="outline" className={`${getScoreColor(categoryScore.score)} border-current`}>
                            Score: {categoryScore.score}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {categoryScore?.optimal || 0} optimal, {categoryScore?.normal || 0} normal, {categoryScore?.outOfRange || 0} out of range
                      </p>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {categoryResults.map(({ biomarker, result }) => (
                      <BiomarkerCard
                        key={result.id}
                        biomarker={biomarker}
                        result={result}
                        gender={gender}
                        onClick={() => handleBiomarkerClick(biomarker, result)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Key Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Key Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 rounded-lg bg-cyan-50 dark:bg-cyan-950/20 border border-cyan-200/50">
                  <h4 className="font-medium text-cyan-700 dark:text-cyan-400 mb-2">Strengths</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-cyan-600 mt-0.5 flex-shrink-0" />
                      <span>eGFR at 98 mL/min indicates excellent kidney filtration capacity</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-cyan-600 mt-0.5 flex-shrink-0" />
                      <span>Electrolyte balance (Na, K, HCO3) within optimal ranges</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-cyan-600 mt-0.5 flex-shrink-0" />
                      <span>Calcium-phosphorus metabolism well balanced</span>
                    </li>
                  </ul>
                </div>
                <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50">
                  <h4 className="font-medium text-amber-700 dark:text-amber-400 mb-2">Recommendations</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                      <span>Continue hydration to maintain optimal kidney function</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                      <span>Monitor blood pressure regularly to protect kidney health</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                      <span>Retest UACR in 6 months to ensure protein levels stay optimal</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="mt-6">
          <OrganTrendSection
            organ="kidney"
            gender={gender}
            title="Kidney Health Score Over Time"
            description="Track your kidney health improvement journey"
            showMilestones
          />
        </TabsContent>

        {/* Risk Assessment Tab */}
        <TabsContent value="risk" className="mt-6">
          {activeTab === "risk" && <KidneyPredictiveHealthRisk />}
        </TabsContent>

        {/* Goals Tab */}
        <TabsContent value="goals" className="mt-6">
          <KidneyGoalSetting currentResults={kidneyTestResults.map(r => r.result)} />
        </TabsContent>

        {/* AI Insights Tab */}
        <TabsContent value="insights" className="mt-6">
          <KidneyAIRecommendations />
        </TabsContent>

        {/* Compare Tab */}
        <TabsContent value="compare" className="mt-6">
          <KidneyPopulationComparison
            results={kidneyTestResults.map(r => r.result)}
            gender={gender}
          />
        </TabsContent>

        {/* Schedule Tab */}
        <TabsContent value="schedule" className="space-y-6 mt-6">
          <KidneyTestScheduler />
          <EmailReminderService
            userEmail="sarah.johnson@example.com"
            userPhone="+61 412 345 678"
          />
        </TabsContent>
      </Tabs>

      {/* Biomarker Detail Dialog */}
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
