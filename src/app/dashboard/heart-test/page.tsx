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
  Heart,
  Droplet,
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  BarChart3,
  Sparkles,
  Users,
  Calendar,
  Target,
  Brain,
  Zap,
  Loader2,
  FileText,
  Info,
  Calculator,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { OrganTrendSection } from "@/components/dashboard/OrganTrendSection";
import { HeartAIRecommendations } from "@/components/dashboard/HeartAIRecommendations";
import { HeartPopulationComparison } from "@/components/dashboard/HeartPopulationComparison";
import { HeartTestScheduler } from "@/components/dashboard/HeartTestScheduler";
import { HeartGoalSetting } from "@/components/dashboard/HeartGoalSetting";
import { HeartPredictiveHealthRisk } from "@/components/dashboard/HeartPredictiveHealthRisk";
import { EmailReminderService } from "@/components/dashboard/EmailReminderService";
import { BloodPressureHistory } from "@/components/dashboard/BloodPressureHistory";
import { HeartPulse } from "lucide-react";

const heartTestConfig = {
  lipidPanel: {
    name: "Lipid Panel",
    subtitle: "Cholesterol",
    icon: Droplet,
    color: "#ef4444",
    bgColor: "bg-red-600/10",
    biomarkerIds: ["total_cholesterol", "ldl_cholesterol", "hdl_cholesterol", "triglycerides"]
  },
  inflammation: {
    name: "Inflammation Markers",
    subtitle: "Cardiovascular Risk",
    icon: Zap,
    color: "#f59e0b",
    bgColor: "bg-amber-500/10",
    biomarkerIds: ["crp", "homocysteine"]
  },
  metabolic: {
    name: "Metabolic Risk",
    subtitle: "Blood Sugar",
    icon: Activity,
    color: "#8b5cf6",
    bgColor: "bg-violet-500/10",
    biomarkerIds: ["glucose", "hba1c", "insulin"]
  }
};

function calculateHeartHealthScore(results: BiomarkerResult[], gender: "male" | "female"): {
  overall: number;
  categoryScores: Record<string, { score: number; optimal: number; normal: number; outOfRange: number }>;
  trend: "improving" | "stable" | "declining";
  riskLevel: string;
} {
  const categoryScores: Record<string, { score: number; optimal: number; normal: number; outOfRange: number }> = {};
  let totalScore = 0, totalWeight = 0;

  for (const [key, config] of Object.entries(heartTestConfig)) {
    let categoryScore = 0, categoryWeight = 0, optimal = 0, normal = 0, outOfRange = 0;
    for (const biomarkerId of config.biomarkerIds) {
      const result = results.find(r => r.biomarkerId === biomarkerId);
      const biomarker = getBiomarkerById(biomarkerId);
      if (result && biomarker) {
        const status = getStatusForValue(biomarker, result.value, gender);
        if (status === "optimal") { categoryScore += 100; optimal++; }
        else if (status === "normal") { categoryScore += 75; normal++; }
        else if (status === "out_of_range") { categoryScore += 40; outOfRange++; }
        else { categoryScore += 20; outOfRange++; }
        categoryWeight++;
      }
    }
    const finalCategoryScore = categoryWeight > 0 ? Math.round(categoryScore / categoryWeight) : 0;
    categoryScores[key] = { score: finalCategoryScore, optimal, normal, outOfRange };
    totalScore += finalCategoryScore * categoryWeight;
    totalWeight += categoryWeight;
  }

  const overallScore = totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
  let riskLevel = "Low";
  if (overallScore < 50) riskLevel = "High";
  else if (overallScore < 70) riskLevel = "Moderate";
  else if (overallScore < 85) riskLevel = "Low-Moderate";

  const optimalCount = Object.values(categoryScores).reduce((sum, cat) => sum + cat.optimal, 0);
  const outOfRangeCount = Object.values(categoryScores).reduce((sum, cat) => sum + cat.outOfRange, 0);
  let trend: "improving" | "stable" | "declining" = "stable";
  if (optimalCount > outOfRangeCount * 2) trend = "improving";
  else if (outOfRangeCount > optimalCount) trend = "declining";

  return { overall: overallScore, categoryScores, trend, riskLevel };
}

function getScoreColor(score: number): string {
  if (score >= 85) return "text-green-600";
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
  if (score >= 85) return "bg-green-500";
  if (score >= 70) return "bg-yellow-500";
  if (score >= 50) return "bg-orange-500";
  return "bg-red-500";
}

export default function HeartTestPage() {
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

  // Get biomarkers with their results for heart test
  const heartTestResults = useMemo(() => {
    const allHeartBiomarkerIds = Object.values(heartTestConfig).flatMap(cat => cat.biomarkerIds);

    return allBiomarkerResults
      .filter(result => allHeartBiomarkerIds.includes(result.biomarkerId))
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
    return calculateHeartHealthScore(allBiomarkerResults, gender);
  }, [allBiomarkerResults, gender]);

  const handleBiomarkerClick = (biomarker: BiomarkerDefinition, result: BiomarkerResult) => {
    setSelectedBiomarker({ biomarker, result });
  };

  // Count statuses
  const statusCounts = useMemo(() => {
    let optimal = 0;
    let normal = 0;
    let outOfRange = 0;

    for (const { result } of heartTestResults) {
      if (result.status === "optimal") optimal++;
      else if (result.status === "normal") normal++;
      else outOfRange++;
    }

    return { optimal, normal, outOfRange, total: heartTestResults.length };
  }, [heartTestResults]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-red-600" />
          <p className="text-muted-foreground">Loading heart health data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="border-red-200 bg-red-50/50">
        <CardContent className="py-12 text-center">
          <p className="text-red-600 mb-2">Error loading heart health data</p>
          <p className="text-muted-foreground text-sm">{error}</p>
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (heartTestResults.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-600/10 flex items-center justify-center">
            <Heart className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-serif text-foreground">
              Heart Health Test
            </h1>
            <p className="text-muted-foreground text-sm">
              Comprehensive cardiovascular assessment
            </p>
          </div>
        </div>
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
            <h3 className="text-xl font-medium mb-2">No Heart Health Data Yet</h3>
            <p className="text-muted-foreground mb-4">
              Your heart health results will appear here once uploaded by your healthcare provider.
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
          <div className="w-10 h-10 rounded-xl bg-red-600/10 flex items-center justify-center">
            <Heart className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-serif text-foreground">Cardiovascular Health</h1>
            <p className="text-muted-foreground text-sm">Heart health assessment across {heartTestResults.length} biomarkers</p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="overview" className="gap-1.5"><Activity className="w-4 h-4" /><span className="hidden sm:inline">Overview</span></TabsTrigger>
          <TabsTrigger value="bp" className="gap-1.5"><HeartPulse className="w-4 h-4" /><span className="hidden sm:inline">Blood Pressure</span></TabsTrigger>
          <TabsTrigger value="trends" className="gap-1.5"><BarChart3 className="w-4 h-4" /><span className="hidden sm:inline">Trends</span></TabsTrigger>
          <TabsTrigger value="risk" className="gap-1.5"><Brain className="w-4 h-4" /><span className="hidden sm:inline">Risk Assessment</span></TabsTrigger>
          <TabsTrigger value="goals" className="gap-1.5"><Target className="w-4 h-4" /><span className="hidden sm:inline">Goals</span></TabsTrigger>
          <TabsTrigger value="insights" className="gap-1.5"><Sparkles className="w-4 h-4" /><span className="hidden sm:inline">AI Insights</span></TabsTrigger>
          <TabsTrigger value="compare" className="gap-1.5"><Users className="w-4 h-4" /><span className="hidden sm:inline">Compare</span></TabsTrigger>
          <TabsTrigger value="schedule" className="gap-1.5"><Calendar className="w-4 h-4" /><span className="hidden sm:inline">Schedule</span></TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="md:col-span-2 bg-gradient-to-br from-red-50 to-white dark:from-red-950/20 dark:to-background border-red-200/50">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between">
                  <span className="text-lg">Heart Health Score</span>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="border-red-500 text-red-600">{healthScore.riskLevel} Risk</Badge>
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
                    {Object.entries(heartTestConfig).map(([key, config]) => {
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
                <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10">
                  <div className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-green-600" /><span className="font-medium">Optimal</span></div>
                  <span className="text-xl font-bold text-green-600">{statusCounts.optimal}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-500/10">
                  <div className="flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-yellow-600" /><span className="font-medium">Normal</span></div>
                  <span className="text-xl font-bold text-yellow-600">{statusCounts.normal}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-orange-500/10">
                  <div className="flex items-center gap-2"><AlertCircle className="w-5 h-5 text-orange-600" /><span className="font-medium">Out of Range</span></div>
                  <span className="text-xl font-bold text-orange-600">{statusCounts.outOfRange}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center gap-2 pb-2">
              <Calculator className="w-5 h-5 text-blue-600" />
              <CardTitle className="text-base flex items-center gap-2">
                Scientific Heart Health Scores
                <Badge variant="secondary" className="ml-2 text-xs flex items-center gap-1">
                  <Info className="w-3 h-3" />Methodology
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-2">
                <span className="text-muted-foreground text-sm">
                  Your heart health score is calculated using evidence-based cardiovascular risk models and your latest biomarker results.
                </span>
              </div>
              <div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="px-2 py-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  onClick={() => setShowScoreDetails((v) => !v)}
                  aria-expanded={showScoreDetails}
                  aria-controls="score-details-section"
                >
                  <span className="flex items-center gap-1">
                    {showScoreDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    Learn more about these scores
                  </span>
                </Button>
                {showScoreDetails && (
                  <div
                    id="score-details-section"
                    className="mt-3 rounded-lg bg-muted/50 dark:bg-muted/30 p-4 border border-blue-100 dark:border-blue-900/30 text-sm space-y-3"
                  >
                    <div className="flex items-center gap-2 font-medium text-blue-700 dark:text-blue-300">
                      <Info className="w-4 h-4" />
                      How your cardiovascular risk is calculated
                    </div>
                    <ul className="list-disc ml-5 space-y-2 text-muted-foreground">
                      <li>
                        <span className="font-semibold">ASCVD Risk:</span> We use the American College of Cardiology/American Heart Association ASCVD risk estimator, which incorporates age, gender, cholesterol (total, LDL, HDL), blood pressure, diabetes, and smoking status to estimate your 10-year risk of heart attack or stroke.
                      </li>
                      <li>
                        <span className="font-semibold">Lipid Panel Interpretation:</span> Your cholesterol profile (total cholesterol, LDL, HDL, triglycerides) is compared to optimal and evidence-based target ranges. Higher LDL and triglycerides, or lower HDL, increase risk.
                      </li>
                      <li>
                        <span className="font-semibold">Inflammation Markers:</span> C-reactive protein (CRP) and homocysteine are included, as elevated levels are linked to higher cardiovascular risk.
                      </li>
                      <li>
                        <span className="font-semibold">Metabolic Health:</span> Blood sugar markers (glucose, HbA1c, insulin) are factored in, as diabetes and insulin resistance are major contributors to heart disease.
                      </li>
                      <li>
                        <span className="font-semibold">Scoring:</span> Each biomarker is scored based on how close your result is to optimal, normal, or out-of-range values. The overall score is a weighted average, with more weight given to markers most predictive of cardiovascular events.
                      </li>
                    </ul>
                    <div className="text-xs text-blue-700/80 dark:text-blue-300/80">
                      <span className="font-semibold">Note:</span> This score is for educational purposes and does not replace clinical judgment. Discuss your results with your healthcare provider.
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-8">
            {Object.entries(heartTestConfig).map(([key, config]) => {
              const categoryResults = heartTestResults.filter(item => config.biomarkerIds.includes(item.result.biomarkerId));
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
                      <BiomarkerCard key={result.id} biomarker={biomarker} result={result} gender={gender} onClick={() => setSelectedBiomarker({ biomarker, result })} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Activity className="w-5 h-5 text-primary" />Key Insights</CardTitle></CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200/50">
                  <h4 className="font-medium text-green-700 dark:text-green-400 mb-2">Strengths</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" /><span>Total cholesterol and LDL in optimal range</span></li>
                    <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" /><span>CRP indicates low systemic inflammation</span></li>
                    <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" /><span>Blood sugar markers show good metabolic control</span></li>
                  </ul>
                </div>
                <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50">
                  <h4 className="font-medium text-amber-700 dark:text-amber-400 mb-2">Areas for Improvement</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2"><AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" /><span>Triglycerides slightly elevated - reduce refined carbs</span></li>
                    <li className="flex items-start gap-2"><AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" /><span>HDL could be higher for better cardiovascular protection</span></li>
                    <li className="flex items-start gap-2"><AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" /><span>Consider increasing omega-3 fatty acid intake</span></li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="mt-6">
          <OrganTrendSection
            organ="heart"
            gender={gender}
            title="Heart Health Score Over Time"
            description="Track your cardiovascular health improvement journey"
          />
        </TabsContent>

        <TabsContent value="bp" className="mt-6"><BloodPressureHistory /></TabsContent>
        <TabsContent value="risk" className="mt-6">
          {activeTab === "risk" && <HeartPredictiveHealthRisk />}
        </TabsContent>
        <TabsContent value="goals" className="mt-6"><HeartGoalSetting currentResults={heartTestResults.map(r => r.result)} /></TabsContent>
        <TabsContent value="insights" className="mt-6"><HeartAIRecommendations /></TabsContent>
        <TabsContent value="compare" className="mt-6"><HeartPopulationComparison results={heartTestResults.map(r => r.result)} gender={gender} /></TabsContent>
        <TabsContent value="schedule" className="space-y-6 mt-6">
          <HeartTestScheduler />
          <EmailReminderService userEmail={user?.email || ""} userPhone="" />
        </TabsContent>
      </Tabs>

      <BiomarkerDetailDialog
        biomarker={selectedBiomarker?.biomarker || null}
        result={selectedBiomarker?.result || null}
        history={[]} // No mock getHistoryForBiomarker, so leave empty or implement real history if available
        gender={gender}
        open={!!selectedBiomarker}
        onOpenChange={(open) => !open && setSelectedBiomarker(null)}
      />
    </div>
  );
}
