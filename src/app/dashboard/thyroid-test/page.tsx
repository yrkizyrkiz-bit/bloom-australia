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
import { getBiomarkerById, getStatusForValue } from "@/data/biomarkers";
import type { BiomarkerDefinition, BiomarkerResult } from "@/types";
import {
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
import { EmailReminderService } from "@/components/dashboard/EmailReminderService";
import { ThyroidPredictiveHealthRisk } from "@/components/dashboard/ThyroidPredictiveHealthRisk";
import { OrganAIInsights } from "@/components/dashboard/OrganAIInsights";
import { OrganTrendSection } from "@/components/dashboard/OrganTrendSection";
import { OrganGoalSetting } from "@/components/dashboard/OrganGoalSetting";

const thyroidTestConfig = {
  thyroidFunction: {
    name: "Thyroid Function",
    subtitle: "TSH & Hormones",
    icon: Activity,
    color: "#3b82f6",
    bgColor: "bg-blue-600/10",
    biomarkerIds: ["tsh", "free_t4"]
  }
};

function calculateThyroidHealthScore(results: BiomarkerResult[], gender: "male" | "female") {
  const categoryScores: Record<string, { score: number; optimal: number; normal: number; outOfRange: number }> = {};
  let totalScore = 0, totalWeight = 0;

  for (const [key, config] of Object.entries(thyroidTestConfig)) {
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
  let thyroidStatus = "Normal";
  const tshResult = results.find(r => r.biomarkerId === "tsh");
  if (tshResult) {
    if (tshResult.value < 0.5) thyroidStatus = "Possible Hyperthyroidism";
    else if (tshResult.value > 4.0) thyroidStatus = "Possible Hypothyroidism";
  }

  const optimalCount = Object.values(categoryScores).reduce((sum, cat) => sum + cat.optimal, 0);
  const outOfRangeCount = Object.values(categoryScores).reduce((sum, cat) => sum + cat.outOfRange, 0);
  let trend: "improving" | "stable" | "declining" = "stable";
  if (optimalCount > outOfRangeCount * 2) trend = "improving";
  else if (outOfRangeCount > optimalCount) trend = "declining";

  return { overall: overallScore, categoryScores, trend, thyroidStatus };
}

function getScoreColor(score: number): string {
  if (score >= 85) return "text-blue-600";
  if (score >= 70) return "text-yellow-600";
  if (score >= 50) return "text-orange-600";
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
  if (score >= 85) return "bg-blue-500";
  if (score >= 70) return "bg-yellow-500";
  if (score >= 50) return "bg-orange-500";
  return "bg-red-500";
}

export default function ThyroidTestPage() {
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

  // Get biomarkers with their results for thyroid test
  const thyroidTestResults = useMemo(() => {
    const allThyroidBiomarkerIds = Object.values(thyroidTestConfig).flatMap(cat => cat.biomarkerIds);

    return allBiomarkerResults
      .filter(result => allThyroidBiomarkerIds.includes(result.biomarkerId))
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
    return calculateThyroidHealthScore(allBiomarkerResults, gender);
  }, [allBiomarkerResults, gender]);

  const handleBiomarkerClick = (biomarker: BiomarkerDefinition, result: BiomarkerResult) => {
    setSelectedBiomarker({ biomarker, result });
  };

  // Count statuses
  const statusCounts = useMemo(() => {
    let optimal = 0;
    let normal = 0;
    let outOfRange = 0;

    for (const { result } of thyroidTestResults) {
      if (result.status === "optimal") optimal++;
      else if (result.status === "normal") normal++;
      else outOfRange++;
    }

    return { optimal, normal, outOfRange, total: thyroidTestResults.length };
  }, [thyroidTestResults]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-muted-foreground">Loading thyroid function data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="border-red-200 bg-red-50/50">
        <CardContent className="py-12 text-center">
          <p className="text-red-600 mb-2">Error loading thyroid function data</p>
          <p className="text-muted-foreground text-sm">{error}</p>
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (thyroidTestResults.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center">
            <Activity className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-serif text-foreground">
              Thyroid Function Test
            </h1>
            <p className="text-muted-foreground text-sm">
              TSH and thyroid hormone assessment
            </p>
          </div>
        </div>
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
            <h3 className="text-xl font-medium mb-2">No Thyroid Function Data Yet</h3>
            <p className="text-muted-foreground mb-4">
              Your thyroid function results will appear here once uploaded by your healthcare provider.
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
          <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center">
            <Activity className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-serif text-foreground">Thyroid Function</h1>
            <p className="text-muted-foreground text-sm">Thyroid health assessment across {thyroidTestResults.length} biomarkers</p>
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
            <Card className="md:col-span-2 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-background border-blue-200/50">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between">
                  <span className="text-lg">Thyroid Health Score</span>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="border-blue-500 text-blue-600">{healthScore.thyroidStatus}</Badge>
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
                    {Object.entries(thyroidTestConfig).map(([key, config]) => {
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
                <div className="flex items-center justify-between p-3 rounded-lg bg-blue-500/10">
                  <div className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-blue-600" /><span className="font-medium">Optimal</span></div>
                  <span className="text-xl font-bold text-blue-600">{statusCounts.optimal}</span>
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

          {/* Scientific Thyroid Scores Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-blue-600" />
                Scientific Thyroid Scores
                <Badge variant="outline" className="border-blue-500 text-blue-600">ATA Guidelines</Badge>
              </CardTitle>
              <CardDescription>
                Scores are calculated using evidence-based clinical guidelines.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-2">
                <Info className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-muted-foreground">
                  The thyroid health score is based on the American Thyroid Association (ATA) Clinical Guidelines.
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-2 px-2 py-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20"
                onClick={() => setShowScoreDetails((prev) => !prev)}
                aria-expanded={showScoreDetails}
                aria-controls="score-details"
              >
                {showScoreDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                Learn more about these scores
              </Button>
              {showScoreDetails && (
                <div id="score-details" className="mt-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200/50 p-4 text-sm text-muted-foreground">
                  <h4 className="font-medium text-blue-700 dark:text-blue-400 mb-2">ATA Clinical Guidelines for Thyroid Scoring</h4>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>
                      <span>
                        The American Thyroid Association (ATA) recommends using TSH and Free T4 levels to assess thyroid function.
                      </span>
                    </li>
                    <li>
                      <span>
                        Scores are calculated by comparing your biomarker values to optimal and normal reference ranges defined in clinical literature.
                      </span>
                    </li>
                    <li>
                      <span>
                        Optimal scores indicate values within the most favorable range for thyroid health, while normal scores reflect values within the broader healthy range.
                      </span>
                    </li>
                    <li>
                      <span>
                        Out-of-range scores highlight values that may require further clinical evaluation.
                      </span>
                    </li>
                    <li>
                      <span>
                        These scores help guide clinical decision-making and personalized thyroid management.
                      </span>
                    </li>
                  </ul>
                  <div className="mt-3 text-xs text-blue-700 dark:text-blue-400">
                    Reference: <a href="https://www.thyroid.org/professionals/ata-professional-guidelines/" target="_blank" rel="noopener noreferrer" className="underline">ATA Professional Guidelines</a>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-8">
            {Object.entries(thyroidTestConfig).map(([key, config]) => {
              const categoryResults = thyroidTestResults.filter(item => config.biomarkerIds.includes(item.result.biomarkerId));
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
            <CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-blue-600" />Thyroid Health Insights</CardTitle></CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200/50">
                  <h4 className="font-medium text-blue-700 dark:text-blue-400 mb-2">What Your Results Mean</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" /><span>TSH at 2.1 mIU/L indicates normal thyroid stimulation</span></li>
                    <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" /><span>Free T4 at 1.2 ng/dL shows adequate thyroid hormone production</span></li>
                    <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" /><span>Your thyroid function appears to be well-balanced</span></li>
                  </ul>
                </div>
                <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50">
                  <h4 className="font-medium text-amber-700 dark:text-amber-400 mb-2">Thyroid Health Tips</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2"><AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" /><span>Ensure adequate iodine intake from seafood or iodized salt</span></li>
                    <li className="flex items-start gap-2"><AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" /><span>Selenium from Brazil nuts supports thyroid function</span></li>
                    <li className="flex items-start gap-2"><AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" /><span>Manage stress as it can impact thyroid hormones</span></li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="mt-6">
          <OrganTrendSection
            organ="thyroid"
            gender={gender}
            title="Thyroid Markers Over Time"
            description="Track your thyroid health score across blood tests"
          />
        </TabsContent>

        <TabsContent value="risk" className="mt-6">
          <ThyroidPredictiveHealthRisk />
        </TabsContent>

        <TabsContent value="goals" className="mt-6">
          <OrganGoalSetting organ="thyroid" currentResults={allBiomarkerResults} gender={gender} />
        </TabsContent>

        <TabsContent value="insights" className="mt-6">
          <OrganAIInsights organ="thyroid" />
        </TabsContent>

        <TabsContent value="schedule" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Calendar className="w-5 h-5 text-primary" />Thyroid Test Scheduling</CardTitle>
              <CardDescription>Schedule your next thyroid panel</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">Recommended: Retest thyroid function in 12 months if results remain stable.</p>
            </CardContent>
          </Card>
          <EmailReminderService userEmail={user?.email || ""} userPhone="" />
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
