"use client";

import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardHomeRedirect } from "@/components/dashboard/DashboardHomeRedirect";
import { useDashboardStats } from "@/hooks/useApi";
import { usePortalContext } from "@/hooks/usePortalContext";
import { HealthScoreCard } from "@/components/dashboard/HealthScoreCard";
import { BiologicalAgeCard } from "@/components/dashboard/BiologicalAgeCard";
import { BiomarkerSummaryCard } from "@/components/dashboard/BiomarkerSummaryCard";
import { CategoryCard } from "@/components/dashboard/CategoryCard";
import { BiomarkerCard } from "@/components/dashboard/BiomarkerCard";
import { BiomarkerDetailDialog } from "@/components/dashboard/BiomarkerDetailDialog";
import { UnifiedHealthDashboard } from "@/components/dashboard/UnifiedHealthDashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { biomarkerDefinitions, getBiomarkerById } from "@/data/biomarkers";
import {
  bloodPanelConfig,
  getBiomarkerStatus,
  type BloodPanelCategoryKey,
} from "@/data/bloodPanelConfig";
import { calculateAllHealthTestScores } from "@/lib/healthTestScoring";
import { shouldShowPortalMarkerCard, CATEGORY_ORDER } from "@/lib/biomarkers/panel-biomarker-display";
import { isOrganCareEntitled } from "@/lib/membership/organ-care-access";
import type { BiomarkerDefinition, BiomarkerResult, HealthScore } from "@/types";
import { AlertTriangle, ArrowRight, Sparkles, LayoutGrid, List, Loader2, Zap } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { RemindersCard } from "@/components/dashboard/RemindersCard";
import { EnhancedAIReportDialog } from "@/components/dashboard/EnhancedAIReportDialog";

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: dashboardData, isLoading, error } = useDashboardStats();

  return (
    <>
      <DashboardHomeRedirect />
      <DashboardPageContent
        user={user}
        dashboardData={dashboardData}
        isLoading={isLoading}
        error={error}
      />
    </>
  );
}

function DashboardPageContent({
  user,
  dashboardData,
  isLoading,
  error,
}: {
  user: ReturnType<typeof useAuth>["user"];
  dashboardData: ReturnType<typeof useDashboardStats>["data"];
  isLoading: boolean;
  error: string | null;
}) {

  const [selectedBiomarker, setSelectedBiomarker] = useState<{
    biomarker: BiomarkerDefinition;
    result: BiomarkerResult;
  } | null>(null);
  const [showAIReport, setShowAIReport] = useState(false);
  const [viewMode, setViewMode] = useState<"tests" | "categories">("categories");

  const gender = user?.gender === "female" ? "female" : "male";
  const { data: portal } = usePortalContext();
  const organCareEntitled = isOrganCareEntitled(portal?.membership);

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

  // Results Summary totals must reflect ALL of the user's biomarker results,
  // not just the markers that belong to the 6 organ panels. Prefer the
  // server-computed stats (counted across every latest result); fall back to
  // counting the raw results client-side if stats aren't available.
  const totals = useMemo(() => {
    const stats = dashboardData?.biomarkerStats;
    if (stats) {
      return {
        optimal: stats.optimal ?? 0,
        normal: stats.normal ?? 0,
        outOfRange: (stats.outOfRange ?? 0) + (stats.critical ?? 0),
      };
    }
    // Fallback to raw biomarker calculation
    return {
      optimal: biomarkerResults.filter(r => r.status === "optimal").length,
      normal: biomarkerResults.filter(r => r.status === "normal").length,
      outOfRange: biomarkerResults.filter(r => r.status === "out_of_range" || r.status === "critical").length,
    };
  }, [dashboardData, biomarkerResults]);

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

  // Same blood-panel categories as /dashboard/biomarkers (not just the 6 organ tests).
  const bloodPanelCategories = useMemo(() => {
    const resultsById = new Map(
      biomarkerResults.map((result) => [result.biomarkerId, result] as const)
    );

    return CATEGORY_ORDER.flatMap((key) => {
      const config = bloodPanelConfig[key];
      let optimal = 0;
      let normal = 0;
      let outOfRange = 0;
      let visible = 0;

      for (const marker of config.biomarkers) {
        const result = resultsById.get(marker.id) ?? null;
        if (!shouldShowPortalMarkerCard(marker.id, result !== null)) continue;
        visible += 1;
        if (!result) continue;
        const status = getBiomarkerStatus(result.value, marker, gender).status;
        if (status === "Optimal") optimal += 1;
        else if (status === "Normal") normal += 1;
        else if (["Low", "High", "Critical Low", "Critical High"].includes(status)) {
          outOfRange += 1;
        }
      }

      if (visible === 0) return [];

      const tested = optimal + normal + outOfRange;
      const score =
        tested === 0
          ? 0
          : Math.round((optimal * 100 + normal * 70 + outOfRange * 25) / tested);

      return [
        {
          key,
          name: config.name,
          color: config.color,
          icon: config.icon,
          score,
          optimal,
          normal,
          outOfRange,
        },
      ];
    });
  }, [biomarkerResults, gender]);

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
    <div className="min-w-0 space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#04342C] to-[#065f46] rounded-3xl p-6 md:p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-white/20" />
          <div className="absolute -left-10 -bottom-10 w-60 h-60 rounded-full bg-white/10" />
        </div>
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-2xl md:text-3xl font-serif mb-1" suppressHydrationWarning>
                {getGreeting()}, {user?.firstName || dashboardData?.user?.firstName || "Member"}
              </h1>
              <p className="text-white/70" suppressHydrationWarning>
                Here&apos;s your health overview for {new Date().toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long" })}
                {error && <span className="text-yellow-300 text-xs ml-2">(Using cached data)</span>}
              </p>
            </div>
            <Button
              onClick={() => setShowAIReport(true)}
              className="bg-white text-[#04342C] hover:bg-white/90 gap-2 rounded-full px-6 shadow-lg shrink-0"
            >
              <Sparkles className="w-4 h-4" />
              AI-Powered Health Report
            </Button>
          </div>
        </div>
      </div>

      {/* View Toggle */}
      <div className="min-w-0">
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "tests" | "categories")} className="w-full min-w-0">
          <div className="mb-4 min-w-0 overflow-x-auto overscroll-x-contain pb-1">
            <TabsList className="dashboard-view-tabs">
              <TabsTrigger
                value="categories"
                className="dashboard-view-tab dashboard-view-tab-categories"
                style={
                  viewMode === "categories"
                    ? { backgroundColor: "#5c7a52", color: "#ffffff" }
                    : { backgroundColor: "#d7e3d0", color: "#3d4f38" }
                }
              >
                <List className="w-4 h-4" />
                Categories
              </TabsTrigger>
              <TabsTrigger
                value="tests"
                className="dashboard-view-tab dashboard-view-tab-organ"
                style={
                  viewMode === "tests"
                    ? { backgroundColor: "#c45c5c", color: "#ffffff" }
                    : { backgroundColor: "#f5e0e0", color: "#8a3d3d" }
                }
              >
                <LayoutGrid className="w-4 h-4" />
                Organ & Metabolic Health
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Health Tests View - Unified Dashboard */}
          <TabsContent value="tests" className="mt-0 min-w-0">
            <UnifiedHealthDashboard gender={gender} />
          </TabsContent>

          {/* Categories View - Classic Dashboard */}
          <TabsContent value="categories" className="mt-0 min-w-0 space-y-6">
            {/* Main Stats Grid */}
            <div className="grid min-w-0 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="min-w-0">
                <HealthScoreCard healthScore={healthScore} />
              </div>
              <div className="min-w-0">
                <BiologicalAgeCard healthScore={healthScore} />
              </div>
              <BiomarkerSummaryCard
                optimal={totals.optimal}
                normal={totals.normal}
                outOfRange={totals.outOfRange}
                lastUpdated={healthScore.lastUpdated}
                organCareEntitled={organCareEntitled}
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

            {/* Categories Overview — same set as /dashboard/biomarkers */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-serif text-foreground">Categories</h2>
                <Link href="/dashboard/biomarkers">
                  <Button
                    size="sm"
                    className="h-8 gap-1.5 rounded-full bg-green-600 px-3 text-xs font-medium text-white hover:bg-green-700"
                  >
                    View all
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {bloodPanelCategories.map((cat) => (
                  <Link key={cat.key} href={`/dashboard/biomarkers?category=${cat.key}#biomarker-results`}>
                    <CategoryCard
                      name={cat.name}
                      color={cat.color}
                      icon={cat.icon}
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
      {gender === "male" && (
        <div className="grid gap-6 md:grid-cols-1">
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
        </div>
      )}

      {/* Reminders */}
      <RemindersCard userId={user?.id || ""} compact />

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
