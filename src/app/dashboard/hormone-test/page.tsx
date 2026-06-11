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
import {
  Sparkles,
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  BarChart3,
  Users,
  Calendar,
  Target,
  Brain,
  Zap,
  Moon,
  Sun,
  Loader2,
  FileText,
  Info,
  Calculator,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmailReminderService } from "@/components/dashboard/EmailReminderService";
import { HormonePredictiveHealthRisk } from "@/components/dashboard/HormonePredictiveHealthRisk";
import { OrganAIInsights } from "@/components/dashboard/OrganAIInsights";
import { OrganTrendSection } from "@/components/dashboard/OrganTrendSection";
import { OrganGoalSetting } from "@/components/dashboard/OrganGoalSetting";

const hormoneTestConfig = {
  sexHormones: {
    name: "Sex Hormones",
    subtitle: "Reproductive Health",
    icon: Sparkles,
    color: "#a855f7",
    bgColor: "bg-purple-500/10",
    biomarkerIds: ["testosterone_total", "estradiol", "progesterone"]
  },
  fertilityHormones: {
    name: "Fertility Hormones",
    subtitle: "FSH & LH",
    icon: Activity,
    color: "#ec4899",
    bgColor: "bg-pink-500/10",
    biomarkerIds: ["fsh", "lh"]
  },
  stressHormones: {
    name: "Stress & Adrenal",
    subtitle: "Cortisol & DHEA",
    icon: Zap,
    color: "#f59e0b",
    bgColor: "bg-amber-500/10",
    biomarkerIds: ["cortisol", "dhea_s"]
  },
  thyroidHormones: {
    name: "Thyroid Hormones",
    subtitle: "Metabolism",
    icon: Sun,
    color: "#3b82f6",
    bgColor: "bg-blue-500/10",
    biomarkerIds: ["tsh", "free_t4"]
  }
};

function calculateHormoneHealthScore(results: BiomarkerResult[], gender: "male" | "female") {
  const categoryScores: Record<string, { score: number; optimal: number; normal: number; outOfRange: number }> = {};
  let totalScore = 0, totalWeight = 0;

  for (const [key, config] of Object.entries(hormoneTestConfig)) {
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

  let hormoneStatus = "Balanced";
  const cortisolResult = results.find(r => r.biomarkerId === "cortisol");
  if (cortisolResult && cortisolResult.value > 20) {
    hormoneStatus = "Elevated Stress";
  }

  const optimalCount = Object.values(categoryScores).reduce((sum, cat) => sum + cat.optimal, 0);
  const outOfRangeCount = Object.values(categoryScores).reduce((sum, cat) => sum + cat.outOfRange, 0);
  let trend: "improving" | "stable" | "declining" = "stable";
  if (optimalCount > outOfRangeCount * 2) trend = "improving";
  else if (outOfRangeCount > optimalCount) trend = "declining";

  return { overall: overallScore, categoryScores, trend, hormoneStatus };
}

function getScoreColor(score: number): string {
  if (score >= 85) return "text-purple-600";
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
  if (score >= 85) return "bg-purple-500";
  if (score >= 70) return "bg-yellow-500";
  if (score >= 50) return "bg-orange-500";
  return "bg-red-500";
}

export default function HormoneTestPage() {
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

  // Get biomarkers with their results for hormone test
  const hormoneTestResults = useMemo(() => {
    const allHormoneBiomarkerIds = Object.values(hormoneTestConfig).flatMap(cat => cat.biomarkerIds);

    return allBiomarkerResults
      .filter(result => allHormoneBiomarkerIds.includes(result.biomarkerId))
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
    return calculateHormoneHealthScore(allBiomarkerResults, gender);
  }, [allBiomarkerResults, gender]);

  const handleBiomarkerClick = (biomarker: BiomarkerDefinition, result: BiomarkerResult) => {
    setSelectedBiomarker({ biomarker, result });
  };

  // Count statuses
  const statusCounts = useMemo(() => {
    let optimal = 0;
    let normal = 0;
    let outOfRange = 0;

    for (const { result } of hormoneTestResults) {
      if (result.status === "optimal") optimal++;
      else if (result.status === "normal") normal++;
      else outOfRange++;
    }

    return { optimal, normal, outOfRange, total: hormoneTestResults.length };
  }, [hormoneTestResults]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-600" />
          <p className="text-muted-foreground">Loading hormone health data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="border-red-200 bg-red-50/50">
        <CardContent className="py-12 text-center">
          <p className="text-red-600 mb-2">Error loading hormone health data</p>
          <p className="text-muted-foreground text-sm">{error}</p>
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (hormoneTestResults.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600/10 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-serif text-foreground">
              Hormone Health Test
            </h1>
            <p className="text-muted-foreground text-sm">
              Comprehensive hormone panel assessment
            </p>
          </div>
        </div>
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
            <h3 className="text-xl font-medium mb-2">No Hormone Health Data Yet</h3>
            <p className="text-muted-foreground mb-4">
              Your hormone health results will appear here once uploaded by your healthcare provider.
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
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-purple-500" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-serif text-foreground">Hormone Health</h1>
            <p className="text-muted-foreground text-sm">Comprehensive hormone assessment across {hormoneTestResults.length} biomarkers</p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="overview" className="gap-1.5"><Activity className="w-4 h-4" /><span className="hidden sm:inline">Overview</span></TabsTrigger>
          <TabsTrigger value="trends" className="gap-1.5"><BarChart3 className="w-4 h-4" /><span className="hidden sm:inline">Trends</span></TabsTrigger>
          <TabsTrigger value="balance" className="gap-1.5"><Brain className="w-4 h-4" /><span className="hidden sm:inline">Balance Analysis</span></TabsTrigger>
          <TabsTrigger value="risk" className="gap-1.5"><AlertTriangle className="w-4 h-4" /><span className="hidden sm:inline">Risk Assessment</span></TabsTrigger>
          <TabsTrigger value="goals" className="gap-1.5"><Target className="w-4 h-4" /><span className="hidden sm:inline">Goals</span></TabsTrigger>
          <TabsTrigger value="insights" className="gap-1.5"><Sparkles className="w-4 h-4" /><span className="hidden sm:inline">AI Insights</span></TabsTrigger>
          <TabsTrigger value="schedule" className="gap-1.5"><Calendar className="w-4 h-4" /><span className="hidden sm:inline">Schedule</span></TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="md:col-span-2 bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/20 dark:to-background border-purple-200/50">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between">
                  <span className="text-lg">Hormone Health Score</span>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="border-purple-500 text-purple-600">{healthScore.hormoneStatus}</Badge>
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
                    {Object.entries(hormoneTestConfig).map(([key, config]) => {
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
                <CardDescription>{statusCounts.total} hormones analyzed</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-purple-500/10">
                  <div className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-purple-600" /><span className="font-medium">Optimal</span></div>
                  <span className="text-xl font-bold text-purple-600">{statusCounts.optimal}</span>
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

          {/* Scientific Hormone Scores Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-purple-600" />
                Scientific Hormone Scores
                <Badge variant="outline" className="border-purple-500 text-purple-600">Endocrine Society Guidelines</Badge>
              </CardTitle>
              <CardDescription>
                Scores are calculated using evidence-based clinical guidelines for hormone health.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-2">
                <Info className="w-4 h-4 text-purple-600" />
                <span className="text-sm text-muted-foreground">
                  Your hormone health score is based on the Endocrine Society Clinical Practice Guidelines and sex-specific reference ranges.
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-2 px-2 py-1 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/20"
                onClick={() => setShowScoreDetails((prev) => !prev)}
                aria-expanded={showScoreDetails}
                aria-controls="hormone-score-details"
              >
                {showScoreDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                Learn more about these scores
              </Button>
              {showScoreDetails && (
                <div id="hormone-score-details" className="mt-3 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200/50 p-4 text-sm text-muted-foreground">
                  <h4 className="font-medium text-purple-700 dark:text-purple-400 mb-2">Endocrine Society Guidelines for Hormone Scoring</h4>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>
                      <span className="font-semibold">Sex-Specific Panels:</span> Hormone reference ranges differ significantly between males and females. Your scores use gender-appropriate optimal and normal ranges based on clinical guidelines.
                    </li>
                    <li>
                      <span className="font-semibold">Sex Hormones (Testosterone, Estradiol, Progesterone):</span> These are evaluated based on age, sex, and reproductive status. Optimal levels support energy, mood, bone health, and metabolic function.
                    </li>
                    <li>
                      <span className="font-semibold">Fertility Hormones (FSH, LH):</span> Follicle-stimulating hormone and luteinizing hormone are assessed for pituitary function and reproductive health.
                    </li>
                    <li>
                      <span className="font-semibold">Stress & Adrenal (Cortisol, DHEA-S):</span> These markers reflect adrenal function and stress response. Elevated cortisol or low DHEA-S may indicate chronic stress or adrenal imbalance.
                    </li>
                    <li>
                      <span className="font-semibold">Thyroid Hormones (TSH, Free T4):</span> Included to assess metabolic regulation and thyroid-pituitary axis function.
                    </li>
                    <li>
                      <span className="font-semibold">Menstrual Cycle Awareness:</span> For females, hormone levels can vary significantly across the menstrual cycle. Interpreting results in the context of cycle phase (follicular, ovulatory, luteal) is recommended.
                    </li>
                    <li>
                      <span className="font-semibold">Scoring:</span> Each biomarker is scored as Optimal, Normal, or Out of Range based on clinical reference intervals. The overall score is a weighted average reflecting overall hormone balance.
                    </li>
                  </ul>
                  <div className="mt-3 text-xs text-purple-700 dark:text-purple-400">
                    References: <a href="https://www.endocrine.org/clinical-practice-guidelines" target="_blank" rel="noopener noreferrer" className="underline">Endocrine Society Clinical Practice Guidelines</a>, <a href="https://pubmed.ncbi.nlm.nih.gov/" target="_blank" rel="noopener noreferrer" className="underline ml-2">PubMed</a>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-8">
            {Object.entries(hormoneTestConfig).map(([key, config]) => {
              const categoryResults = hormoneTestResults.filter(item => config.biomarkerIds.includes(item.result.biomarkerId));
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
                      <BiomarkerCard key={result.id} biomarker={biomarker} result={result} gender={gender} onClick={() => setSelectedBiomarker({ biomarker, result })} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-purple-500" />Hormone Health Insights</CardTitle></CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200/50">
                  <h4 className="font-medium text-purple-700 dark:text-purple-400 mb-2">What Your Results Mean</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" /><span>Sex hormones are well balanced for your age and gender</span></li>
                    <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" /><span>FSH and LH indicate normal pituitary function</span></li>
                    <li className="flex items-start gap-2"><AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" /><span>Cortisol is slightly elevated - focus on stress management</span></li>
                  </ul>
                </div>
                <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50">
                  <h4 className="font-medium text-amber-700 dark:text-amber-400 mb-2">Optimization Tips</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2"><Target className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" /><span>Practice daily stress reduction techniques</span></li>
                    <li className="flex items-start gap-2"><Target className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" /><span>Prioritize 7-9 hours of quality sleep</span></li>
                    <li className="flex items-start gap-2"><Target className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" /><span>Consider adaptogens like ashwagandha for adrenal support</span></li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="mt-6">
          <OrganTrendSection
            organ="hormones"
            gender={gender}
            title="Hormone Trends Over Time"
            description="Track your hormone balance journey"
          />
        </TabsContent>

        <TabsContent value="balance" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Brain className="w-5 h-5 text-purple-500" />Hormone Balance Analysis</CardTitle>
              <CardDescription>Understanding your hormonal health</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 rounded-lg border bg-green-50 dark:bg-green-950/20">
                  <h4 className="font-medium text-green-700 mb-2">Reproductive Health</h4>
                  <p className="text-3xl font-bold text-green-600">Optimal</p>
                  <p className="text-sm text-muted-foreground mt-1">Sex hormones well balanced</p>
                </div>
                <div className="p-4 rounded-lg border bg-yellow-50 dark:bg-yellow-950/20">
                  <h4 className="font-medium text-yellow-700 mb-2">Stress Response</h4>
                  <p className="text-3xl font-bold text-yellow-600">Elevated</p>
                  <p className="text-sm text-muted-foreground mt-1">Cortisol above optimal range</p>
                </div>
                <div className="p-4 rounded-lg border bg-green-50 dark:bg-green-950/20">
                  <h4 className="font-medium text-green-700 mb-2">Thyroid Function</h4>
                  <p className="text-3xl font-bold text-green-600">Normal</p>
                  <p className="text-sm text-muted-foreground mt-1">TSH and T4 in range</p>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-950/20">
                <h4 className="font-medium mb-3">Personalized Recommendations</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium mb-2">To Lower Cortisol:</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• 10-20 min daily meditation</li>
                      <li>• Limit caffeine after 2pm</li>
                      <li>• Ashwagandha 300-600mg daily</li>
                      <li>• Regular moderate exercise</li>
                    </ul>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-2">To Support DHEA:</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Prioritize quality sleep</li>
                      <li>• Manage chronic stress</li>
                      <li>• Ensure adequate protein</li>
                      <li>• Consider vitamin D optimization</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risk" className="mt-6">
          <HormonePredictiveHealthRisk
            biomarkerResults={allBiomarkerResults}
            gender={gender}
            historicalData={[]}
          />
        </TabsContent>

        <TabsContent value="goals" className="mt-6">
          <OrganGoalSetting organ="hormone" currentResults={allBiomarkerResults} gender={gender} />
        </TabsContent>

        <TabsContent value="insights" className="mt-6">
          <OrganAIInsights organ="hormone" />
        </TabsContent>

        <TabsContent value="schedule" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Calendar className="w-5 h-5 text-primary" />Hormone Test Scheduling</CardTitle>
              <CardDescription>Schedule your next hormone panel</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-950/20 mb-4">
                <h4 className="font-medium mb-2">Testing Recommendations</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• <strong>Cortisol:</strong> Retest in 3 months after implementing stress management</li>
                  <li>• <strong>Sex Hormones:</strong> Annual testing unless symptoms change</li>
                  <li>• <strong>Thyroid:</strong> Every 6-12 months if stable</li>
                  <li>• <strong>Best time:</strong> Morning (7-9am) for accurate cortisol reading</li>
                </ul>
              </div>
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
