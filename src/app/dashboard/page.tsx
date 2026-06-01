"use client";

import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useDashboardStats } from "@/hooks/useApi";
import { HealthScoreCard } from "@/components/dashboard/HealthScoreCard";
import { BiologicalAgeCard } from "@/components/dashboard/BiologicalAgeCard";
import { BiomarkerSummaryCard } from "@/components/dashboard/BiomarkerSummaryCard";
import { CategoryCard } from "@/components/dashboard/CategoryCard";
import { BiomarkerCard } from "@/components/dashboard/BiomarkerCard";
import { BiomarkerDetailDialog } from "@/components/dashboard/BiomarkerDetailDialog";
import { UnifiedHealthDashboard } from "@/components/dashboard/UnifiedHealthDashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { biomarkerDefinitions, getBiomarkerById } from "@/data/biomarkers";
import { calculateAllHealthTestScores } from "@/lib/healthTestScoring";
// Mock data imports removed - using real API data only
import type { BiomarkerDefinition, BiomarkerResult, HealthScore } from "@/types";
import { AlertTriangle, TrendingUp, Clock, ArrowRight, Sparkles, LayoutGrid, List, Loader2, Scale, Heart, Zap } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { RemindersCard } from "@/components/dashboard/RemindersCard";
import { EnhancedAIReportDialog } from "@/components/dashboard/EnhancedAIReportDialog";

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: dashboardData, isLoading, error } = useDashboardStats();

  const [selectedBiomarker, setSelectedBiomarker] = useState<{
    biomarker: BiomarkerDefinition;
    result: BiomarkerResult;
  } | null>(null);
  const [showAIReport, setShowAIReport] = useState(false);
  const [viewMode, setViewMode] = useState<"tests" | "categories">("tests");

  const gender = user?.gender === "female" ? "female" : "male";

  // Map API data to component format - NO mock data fallback for real users
  const biomarkerResults: BiomarkerResult[] = useMemo(() => {
    if (dashboardData?.biomarkerResults && dashboardData.biomarkerResults.length > 0) {
      return dashboardData.biomarkerResults.map((r: any) => ({
        id: r.id,
        biomarkerId: r.biomarkerId,
        userId: r.userId,
        value: r.value,
        status: r.status?.toLowerCase() || "normal",
        testedAt: r.testedAt,
        uploadedAt: r.uploadedAt,
        uploadedBy: r.uploadedBy,
      }));
    }
    // Return empty array for real users - no mock data
    return [];
  }, [dashboardData]);

  // Calculate health score from the 6 health test categories
  const healthTestScores = useMemo(() => {
    if (biomarkerResults.length === 0) return null;
    return calculateAllHealthTestScores(gender, biomarkerResults);
  }, [biomarkerResults, gender]);

  // Build the healthScore object from the 6 health test categories
  const healthScore: HealthScore = useMemo(() => {
    // If we have calculated health test scores, use them
    if (healthTestScores) {
      return {
        overall: healthTestScores.overall,
        biologicalAge: dashboardData?.biologicalAge?.biologicalAge || null,
        chronologicalAge: dashboardData?.biologicalAge?.chronologicalAge || null,
        categories: healthTestScores.categories.map(c => ({
          category: c.id, // Use the test ID (e.g., "liver", "heart") to match categoryInfo keys
          score: c.score,
          optimal: c.optimal,
          normal: c.normal,
          outOfRange: c.outOfRange,
        })),
        lastUpdated: healthTestScores.lastUpdated,
      };
    }

    // Fallback to API health score if available
    if (dashboardData?.healthScore) {
      const hs = dashboardData.healthScore;
      return {
        overall: hs.overall || 0,
        biologicalAge: hs.biologicalAge || dashboardData.biologicalAge?.biologicalAge,
        chronologicalAge: hs.chronologicalAge || dashboardData.biologicalAge?.chronologicalAge,
        categories: (hs.categoryScores || []).map((c: { category?: string; score?: number; optimal?: number; normal?: number; outOfRange?: number }) => ({
          category: c.category || "",
          score: c.score || 0,
          optimal: c.optimal || 0,
          normal: c.normal || 0,
          outOfRange: c.outOfRange || 0,
        })),
        lastUpdated: hs.calculatedAt || new Date().toISOString(),
      };
    }

    // No data at all - return empty health score
    return {
      overall: 0,
      biologicalAge: null,
      chronologicalAge: null,
      categories: [],
      lastUpdated: new Date().toISOString(),
    };
  }, [healthTestScores, dashboardData]);

  // Calculate totals from the 6 health test categories
  const totals = useMemo(() => {
    if (healthTestScores) {
      return {
        optimal: healthTestScores.totalOptimal,
        normal: healthTestScores.totalNormal,
        outOfRange: healthTestScores.totalOutOfRange,
      };
    }
    // Fallback to raw biomarker calculation
    return {
      optimal: biomarkerResults.filter(r => r.status === "optimal").length,
      normal: biomarkerResults.filter(r => r.status === "normal").length,
      outOfRange: biomarkerResults.filter(r => r.status === "out_of_range" || r.status === "critical").length,
    };
  }, [healthTestScores, biomarkerResults]);

  // Get out of range biomarkers for attention section
  const outOfRangeBiomarkers = useMemo(() => {
    return biomarkerResults
      .filter(r => r.status === "out_of_range" || r.status === "critical")
      .map(result => ({
        result,
        biomarker: getBiomarkerById(result.biomarkerId),
      }))
      .filter((item): item is { result: BiomarkerResult; biomarker: BiomarkerDefinition } =>
        item.biomarker !== undefined
      );
  }, [biomarkerResults]);

  const handleBiomarkerClick = (biomarker: BiomarkerDefinition, result: BiomarkerResult) => {
    setSelectedBiomarker({ biomarker, result });
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading your health data...</p>
        </div>
      </div>
    );
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#04342C] to-[#065f46] rounded-3xl p-6 md:p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-white/20" />
          <div className="absolute -left-10 -bottom-10 w-60 h-60 rounded-full bg-white/10" />
        </div>
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-serif mb-1">
                {getGreeting()}, {user?.firstName || dashboardData?.user?.firstName || "Member"}
              </h1>
              <p className="text-white/70">
                Here&apos;s your health overview for {new Date().toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long" })}
                {error && <span className="text-yellow-300 text-xs ml-2">(Using cached data)</span>}
              </p>
            </div>
            <Button
              onClick={() => setShowAIReport(true)}
              className="bg-white text-[#04342C] hover:bg-white/90 gap-2 rounded-full px-6 shadow-lg"
            >
              <Sparkles className="w-4 h-4" />
              AI Health Report
            </Button>
          </div>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex items-center gap-2">
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "tests" | "categories")} className="w-full">
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger value="tests" className="gap-2">
                <LayoutGrid className="w-4 h-4" />
                Health Tests
              </TabsTrigger>
              <TabsTrigger value="categories" className="gap-2">
                <List className="w-4 h-4" />
                Categories
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Health Tests View - Unified Dashboard */}
          <TabsContent value="tests" className="mt-0">
            <UnifiedHealthDashboard gender={gender} />
          </TabsContent>

          {/* Categories View - Classic Dashboard */}
          <TabsContent value="categories" className="mt-0 space-y-6">
            {/* Main Stats Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <HealthScoreCard healthScore={healthScore} />
              <BiologicalAgeCard healthScore={healthScore} />
              <BiomarkerSummaryCard
                optimal={totals.optimal}
                normal={totals.normal}
                outOfRange={totals.outOfRange}
                lastUpdated={healthScore.lastUpdated}
              />
            </div>

            {/* Needs Attention Section */}
            {outOfRangeBiomarkers.length > 0 && (
              <Card className="border-orange-500/30 bg-orange-500/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-medium flex items-center gap-2 text-orange-600">
                    <AlertTriangle className="w-5 h-5" />
                    Needs Your Attention
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {outOfRangeBiomarkers.map(({ biomarker, result }) => (
                      <BiomarkerCard
                        key={result.id}
                        biomarker={biomarker}
                        result={result}
                        gender={gender}
                        onClick={() => handleBiomarkerClick(biomarker, result)}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Categories Overview */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-serif text-foreground">Categories</h2>
                <Link href="/dashboard/biomarkers">
                  <Button variant="ghost" size="sm" className="gap-2">
                    View all
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {healthScore.categories.slice(0, 8).map((cat) => (
                  <Link key={cat.category} href={`/dashboard/biomarkers?category=${cat.category}`}>
                    <CategoryCard
                      category={cat.category}
                      score={cat.score}
                      optimal={cat.optimal}
                      normal={cat.normal}
                      outOfRange={cat.outOfRange}
                    />
                  </Link>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Specialized Health Programs */}
      <div className={`grid gap-6 ${gender === "male" ? "md:grid-cols-2" : "md:grid-cols-1"}`}>
        <Link href="/dashboard/weight-management">
          <Card className="overflow-hidden hover:shadow-lg transition-all cursor-pointer group border-emerald-200 dark:border-emerald-900 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center group-hover:scale-105 transition-transform shadow-lg">
                  <Scale className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-emerald-900 dark:text-emerald-100">Weight Management</h3>
                  <p className="text-sm text-emerald-700 dark:text-emerald-300">Track weight, meals, and exercise</p>
                </div>
                <ArrowRight className="w-5 h-5 text-emerald-600 group-hover:translate-x-1 transition-transform" />
              </div>
            </CardContent>
          </Card>
        </Link>
        {/* Only show Men's Health for male users */}
        {gender === "male" && (
          <Link href="/dashboard/mens-health">
            <Card className="overflow-hidden hover:shadow-lg transition-all cursor-pointer group border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-50 to-teal-50 dark:from-slate-900 dark:to-teal-950/20">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-700 to-teal-600 flex items-center justify-center group-hover:scale-105 transition-transform shadow-lg">
                    <Zap className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-100">Men&apos;s Health</h3>
                    <p className="text-sm text-slate-700 dark:text-slate-300">Hair, vitality & wellness</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-teal-600 group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          </Link>
        )}
        {/* Only show Women's Health for female users */}
        {gender === "female" && (
          <Link href="/womens-health">
            <Card className="overflow-hidden hover:shadow-lg transition-all cursor-pointer group border-rose-200 dark:border-rose-900/50 bg-gradient-to-br from-rose-50 to-purple-50 dark:from-rose-950/30 dark:to-purple-950/30">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 to-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform shadow-lg">
                    <Heart className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-rose-900 dark:text-rose-100">Women&apos;s Health</h3>
                    <p className="text-sm text-rose-700 dark:text-rose-300">Cycle, fertility & wellness</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-purple-600 group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          </Link>
        )}
      </div>

      {/* Recent Activity */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Tests */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData?.recentActivity && dashboardData.recentActivity.length > 0 ? (
                dashboardData.recentActivity.slice(0, 3).map((activity: any, index: number) => (
                  <div key={activity.id || index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{activity.action?.replace(/_/g, " ") || "Activity"}</p>
                        <p className="text-xs text-muted-foreground">{activity.entity || ""}</p>
                      </div>
                    </div>
                    <Badge variant="secondary">
                      {new Date(activity.createdAt).toLocaleDateString()}
                    </Badge>
                  </div>
                ))
              ) : (
                <>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Lab Results Uploaded</p>
                        <p className="text-xs text-muted-foreground">{biomarkerResults.length} biomarkers updated</p>
                      </div>
                    </div>
                    <Badge variant="secondary">Recent</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-green-500" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Health Score Calculated</p>
                        <p className="text-xs text-muted-foreground">Overall score: {healthScore.overall}</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-green-500/10 text-green-600">Updated</Badge>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Reminders */}
        <RemindersCard userId={user?.id || ""} compact />
      </div>

      {/* Personalized Tips */}
      {outOfRangeBiomarkers.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium">Personalized Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-4">
              {outOfRangeBiomarkers.slice(0, 4).map(({ biomarker }) => (
                <div key={biomarker.id} className="p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
                  <p className="text-sm font-medium text-foreground mb-1">
                    Improve your {biomarker.shortName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {biomarker.improvementTips[0]}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Biomarker Detail Dialog */}
      <BiomarkerDetailDialog
        biomarker={selectedBiomarker?.biomarker || null}
        result={selectedBiomarker?.result || null}
        history={[]}
        gender={gender}
        open={!!selectedBiomarker}
        onOpenChange={(open) => !open && setSelectedBiomarker(null)}
      />

      {/* Enhanced AI Report Dialog */}
      <EnhancedAIReportDialog
        userId={user?.id || ""}
        userName={user?.firstName || "Member"}
        open={showAIReport}
        onOpenChange={setShowAIReport}
      />
    </div>
  );
}
