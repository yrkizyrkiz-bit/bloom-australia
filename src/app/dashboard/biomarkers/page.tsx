"use client";

import { Suspense, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useBiomarkerResults, useDashboardStats } from "@/hooks/useApi";
import { usePortalContext } from "@/hooks/usePortalContext";
import { BiomarkerCard } from "@/components/dashboard/BiomarkerCard";
import { BiomarkerDetailDialog } from "@/components/dashboard/BiomarkerDetailDialog";
import { HealthScoreCard } from "@/components/dashboard/HealthScoreCard";
import { BiologicalAgeCard } from "@/components/dashboard/BiologicalAgeCard";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { biomarkerDefinitions, getBiomarkerById, categoryInfo } from "@/data/biomarkers";
import {
  bloodPanelConfig,
  bloodPanelCategoryInfo,
  getBiomarkerStatus,
  type BloodPanelCategoryKey,
  type BloodPanelBiomarker,
  type Gender
} from "@/data/bloodPanelConfig";
import type { BiomarkerDefinition, BiomarkerResult, HealthScore } from "@/types";
import { BiomarkerProgramEssentialView } from "@/components/dashboard/BiomarkerProgramEssentialView";
import { BiomarkerHistoryView } from "@/components/dashboard/BiomarkerHistoryView";
import { OrganMetabolicHealthPanels } from "@/components/dashboard/OrganMetabolicHealthPanels";
import { UntestedBiomarkerCard } from "@/components/dashboard/UntestedBiomarkerCard";
import { isOrganCareEntitled } from "@/lib/membership/organ-care-access";
import { resolveInsightDisplayState } from "@/lib/membership/insight-display";
import { isCatalogBiomarker } from "@/lib/catalog-biomarkers";
import { calculateAllHealthTestScores } from "@/lib/healthTestScoring";
import {
  isProgramEssentialSlug,
  type ProgramEssentialSlug,
} from "@/lib/program-essential-panels";
import { getWomensHealthSubcategory } from "@/lib/womens-health-biomarker-subcategories";
import { Search, Filter, X, Loader2, Info, User, BookOpen, LayoutGrid, Stethoscope, History } from "lucide-react";

type FilterStatus = "all" | "optimal" | "normal" | "out_of_range" | "not_tested";
type BiomarkerViewMode = "all" | "program" | "history";

export default function BiomarkersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <BiomarkersPageContent />
    </Suspense>
  );
}

function BiomarkersPageContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams?.get("category") as BloodPanelCategoryKey | null;
  const initialView: BiomarkerViewMode =
    searchParams?.get("view") === "program"
      ? "program"
      : searchParams?.get("view") === "history"
        ? "history"
        : "all";
  const programParam = searchParams?.get("program");
  const womensHealthSubcategory = getWomensHealthSubcategory(searchParams?.get("subcategory"));
  const initialProgram: ProgramEssentialSlug =
    programParam && isProgramEssentialSlug(programParam)
      ? programParam
      : "WEIGHT_MANAGEMENT";

  const { user } = useAuth();
  const { data: portal } = usePortalContext();
  const { data: biomarkerData, isLoading, error } = useBiomarkerResults(undefined, {
    latest: true,
    ensureDerived: true,
  });
  const { data: dashboardData } = useDashboardStats();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<BloodPanelCategoryKey | null>(initialCategory);
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [selectedBiomarker, setSelectedBiomarker] = useState<{
    biomarker: BiomarkerDefinition;
    result: BiomarkerResult | null;
    panelBiomarker?: BloodPanelBiomarker;
  } | null>(null);
  const [viewMode, setViewMode] = useState<BiomarkerViewMode>(initialView);
  const [selectedProgram, setSelectedProgram] = useState<ProgramEssentialSlug>(initialProgram);

  // Get user gender for gender-specific ranges
  const gender: Gender = user?.gender === "female" ? "female" : "male";

  const healthScore: HealthScore = useMemo(() => {
    const biomarkerResults: BiomarkerResult[] =
      dashboardData?.biomarkerResults?.length
        ? dashboardData.biomarkerResults.map((r: {
            id: string;
            biomarkerId: string;
            value: number;
            status?: string;
            testedAt: string;
          }) => ({
            id: r.id,
            biomarkerId: r.biomarkerId,
            value: r.value,
            status: (r.status?.toLowerCase() || "normal") as BiomarkerResult["status"],
            testedAt: r.testedAt,
          }))
        : [];

    const healthTestScores =
      biomarkerResults.length > 0 ? calculateAllHealthTestScores(gender, biomarkerResults) : null;

    if (healthTestScores) {
      return {
        overall: healthTestScores.overall,
        biologicalAge: dashboardData?.biologicalAge?.biologicalAge ?? null,
        chronologicalAge: dashboardData?.biologicalAge?.chronologicalAge ?? null,
        categories: healthTestScores.categories.map((c) => ({
          category: c.id,
          score: c.score,
          optimal: c.optimal,
          normal: c.normal,
          outOfRange: c.outOfRange,
        })),
        lastUpdated: healthTestScores.lastUpdated,
      };
    }

    if (dashboardData?.healthScore) {
      const hs = dashboardData.healthScore;
      return {
        overall: hs.overall || 0,
        biologicalAge: hs.biologicalAge ?? dashboardData.biologicalAge?.biologicalAge ?? null,
        chronologicalAge: hs.chronologicalAge ?? dashboardData.biologicalAge?.chronologicalAge ?? null,
        categories: (hs.categoryScores || []).map(
          (c: { category?: string; score?: number; optimal?: number; normal?: number; outOfRange?: number }) => ({
            category: c.category || "",
            score: c.score || 0,
            optimal: c.optimal || 0,
            normal: c.normal || 0,
            outOfRange: c.outOfRange || 0,
          })
        ),
        lastUpdated: hs.calculatedAt || new Date().toISOString(),
      };
    }

    return {
      overall: 0,
      biologicalAge: dashboardData?.biologicalAge?.biologicalAge ?? null,
      chronologicalAge: dashboardData?.biologicalAge?.chronologicalAge ?? null,
      categories: [],
      lastUpdated: new Date().toISOString(),
    };
  }, [dashboardData, gender]);

  // Transform API data to a lookup map by biomarkerId (derived values persisted server-side)
  const biomarkerResultsMap = useMemo(() => {
    const map: Record<string, BiomarkerResult> = {};
    if (biomarkerData?.results) {
      for (const r of biomarkerData.results) {
        if (!isCatalogBiomarker(r.biomarkerId)) continue;
        map[r.biomarkerId] = {
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
        };
      }
    }
    return map;
  }, [biomarkerData]);

  // Get all biomarkers with their results (or null if not tested)
  const allBiomarkersWithResults = useMemo(() => {
    const items: {
      category: BloodPanelCategoryKey;
      categoryName: string;
      biomarker: BloodPanelBiomarker;
      result: BiomarkerResult | null;
      biomarkerDef: BiomarkerDefinition | undefined;
    }[] = [];

    for (const [category, config] of Object.entries(bloodPanelConfig)) {
      for (const biomarker of config.biomarkers) {
        const result = biomarkerResultsMap[biomarker.id] || null;
        const biomarkerDef = getBiomarkerById(biomarker.id);
        items.push({
          category: category as BloodPanelCategoryKey,
          categoryName: config.name,
          biomarker,
          result,
          biomarkerDef,
        });
      }
    }

    return items;
  }, [biomarkerResultsMap]);

  // Filter biomarkers
  const filteredBiomarkers = useMemo(() => {
    return allBiomarkersWithResults.filter(({ category, biomarker, result }) => {
      // Category filter
      if (selectedCategory && category !== selectedCategory) {
        return false;
      }

      // Status filter
      if (statusFilter !== "all") {
        if (statusFilter === "not_tested") {
          if (result !== null) return false;
        } else if (statusFilter === "out_of_range") {
          if (!result) return false;
          const status = getBiomarkerStatus(result.value, biomarker, gender);
          if (!["Low", "High", "Critical Low", "Critical High"].includes(status.status)) {
            return false;
          }
        } else if (statusFilter === "optimal") {
          if (!result) return false;
          const status = getBiomarkerStatus(result.value, biomarker, gender);
          if (status.status !== "Optimal") return false;
        } else if (statusFilter === "normal") {
          if (!result) return false;
          const status = getBiomarkerStatus(result.value, biomarker, gender);
          if (status.status !== "Normal") return false;
        }
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          biomarker.name.toLowerCase().includes(query) ||
          biomarker.shortName.toLowerCase().includes(query) ||
          category.toLowerCase().includes(query)
        );
      }

      return true;
    });
  }, [allBiomarkersWithResults, selectedCategory, statusFilter, searchQuery, gender]);

  // Group by category
  const groupedBiomarkers = useMemo(() => {
    const groups: Record<BloodPanelCategoryKey, typeof filteredBiomarkers> = {} as Record<BloodPanelCategoryKey, typeof filteredBiomarkers>;

    for (const item of filteredBiomarkers) {
      if (!groups[item.category]) {
        groups[item.category] = [];
      }
      groups[item.category].push(item);
    }

    return groups;
  }, [filteredBiomarkers]);

  // Calculate counts - based on ACTUAL test results from database
  const counts = useMemo(() => {
    let optimal = 0;
    let normal = 0;
    let outOfRange = 0;
    let tested = 0;

    // Count from actual database results
    for (const item of allBiomarkersWithResults) {
      if (item.result) {
        tested++;
        const status = getBiomarkerStatus(item.result.value, item.biomarker, gender);
        if (status.status === "Optimal") {
          optimal++;
        } else if (status.status === "Normal") {
          normal++;
        } else {
          outOfRange++;
        }
      }
    }

    // Not tested = total biomarkers in panel minus those tested
    const totalInPanel = allBiomarkersWithResults.length;
    const notTested = totalInPanel - tested;

    return {
      optimal,
      normal,
      outOfRange,
      notTested,
      tested,
      totalInPanel
    };
  }, [allBiomarkersWithResults, gender]);

  const organCareEntitled = isOrganCareEntitled(portal?.membership);

  const hasHealthScoreData =
    healthScore.overall > 0 &&
    healthScore.categories.some((c) => c.optimal + c.normal + c.outOfRange > 0);

  const hasBiologicalAgeData =
    healthScore.biologicalAge != null &&
    healthScore.biologicalAge > 0 &&
    healthScore.chronologicalAge != null &&
    healthScore.chronologicalAge > 0;

  const noResultsYet = counts.tested === 0;

  const healthScoreInsightState = resolveInsightDisplayState(
    portal?.membership?.scopes?.HEALTH_SCORE,
    hasHealthScoreData,
    { noResultsYet }
  );

  const biologicalAgeInsightState = resolveInsightDisplayState(
    portal?.membership?.scopes?.BIOLOGICAL_CLOCK,
    hasBiologicalAgeData,
    { noResultsYet }
  );

  const handleBiomarkerClick = (biomarkerDef: BiomarkerDefinition | undefined, result: BiomarkerResult | null, panelBiomarker?: BloodPanelBiomarker) => {
    if (biomarkerDef) {
      setSelectedBiomarker({ biomarker: biomarkerDef, result, panelBiomarker });
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory(null);
    setStatusFilter("all");
  };

  const hasActiveFilters = searchQuery || selectedCategory || statusFilter !== "all";

  // Loading state (history tab loads its own data)
  if (isLoading && viewMode !== "history") {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading your biomarker results...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && viewMode !== "history") {
    return (
      <Card className="border-red-200 bg-red-50/50">
        <CardContent className="py-12 text-center">
          <p className="text-red-600 mb-2">Error loading biomarkers</p>
          <p className="text-muted-foreground text-sm">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif text-foreground">
            Biomarkers
          </h1>
          <p className="text-muted-foreground mt-1">
            {viewMode === "program"
              ? "Essential monitoring panels by clinical program — toggle Weight, Hair, Men's or Women's"
              : viewMode === "history"
                ? "View your test history and generate AI-powered health reports"
                : `View and explore all ${counts.totalInPanel} biomarkers across ${Object.keys(bloodPanelConfig).length} health categories`}
          </p>
        </div>
        <Link
          href="/dashboard/biomarkers/learn"
          className="hidden sm:flex items-center gap-2 px-4 py-2 bg-primary/5 border border-primary/20 rounded-lg text-sm font-medium text-primary hover:bg-primary/10 transition-colors flex-shrink-0"
        >
          <BookOpen className="w-4 h-4" />
          Learn about Biomarkers
        </Link>
      </div>

      {/* Mobile Learn Link */}
      <Link
        href="/dashboard/biomarkers/learn"
        className="sm:hidden flex items-center justify-center gap-2 px-4 py-3 bg-primary/5 border border-primary/20 rounded-xl text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
      >
        <BookOpen className="w-4 h-4" />
        Learn about Biomarkers
      </Link>

      {/* View mode: full catalog vs program essential panels */}
      <Tabs
        value={viewMode}
        onValueChange={(v) => setViewMode(v as BiomarkerViewMode)}
      >
        <TabsList className="grid h-auto w-full grid-cols-3 gap-1 p-1">
          <TabsTrigger value="all" className="gap-1.5 px-2 py-2 text-xs sm:gap-2 sm:px-3 sm:text-sm">
            <LayoutGrid className="h-4 w-4 shrink-0" />
            <span className="truncate sm:hidden">All</span>
            <span className="hidden truncate sm:inline">All biomarkers</span>
          </TabsTrigger>
          <TabsTrigger value="program" className="gap-1.5 px-2 py-2 text-xs sm:gap-2 sm:px-3 sm:text-sm">
            <Stethoscope className="h-4 w-4 shrink-0" />
            <span className="truncate sm:hidden">Program</span>
            <span className="hidden truncate sm:inline">By program</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5 px-2 py-2 text-xs sm:gap-2 sm:px-3 sm:text-sm">
            <History className="h-4 w-4 shrink-0" />
            History
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {viewMode === "program" ? (
        <BiomarkerProgramEssentialView
          program={selectedProgram}
          onProgramChange={setSelectedProgram}
          rows={allBiomarkersWithResults}
          gender={gender}
          womensHealthSubcategory={
            selectedProgram === "WOMENS_HEALTH" ? womensHealthSubcategory : undefined
          }
          onBiomarkerClick={handleBiomarkerClick}
        />
      ) : viewMode === "history" ? (
        <BiomarkerHistoryView embedded />
      ) : (
        <>
      <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2">
        <HealthScoreCard healthScore={healthScore} insightState={healthScoreInsightState} />
        <BiologicalAgeCard healthScore={healthScore} insightState={biologicalAgeInsightState} />
      </div>

      <OrganMetabolicHealthPanels organCareEntitled={organCareEntitled} />

      {/* Summary Stats - Based on Your Test Results */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="py-3 px-4 text-center">
            <p className="text-2xl font-bold text-primary">{counts.tested}</p>
            <p className="text-xs text-muted-foreground">Tested</p>
          </CardContent>
        </Card>
        <Card className="bg-green-50/50 border-green-200/50">
          <CardContent className="py-3 px-4 text-center">
            <p className="text-2xl font-bold text-green-600">{counts.optimal}</p>
            <p className="text-xs text-muted-foreground">Optimal</p>
          </CardContent>
        </Card>
        <Card className="bg-yellow-50/50 border-yellow-200/50">
          <CardContent className="py-3 px-4 text-center">
            <p className="text-2xl font-bold text-yellow-600">{counts.normal}</p>
            <p className="text-xs text-muted-foreground">Normal</p>
          </CardContent>
        </Card>
        <Card className="bg-orange-50/50 border-orange-200/50">
          <CardContent className="py-3 px-4 text-center">
            <p className="text-2xl font-bold text-orange-600">{counts.outOfRange}</p>
            <p className="text-xs text-muted-foreground">Attention</p>
          </CardContent>
        </Card>
        <Card className="bg-gray-50/50">
          <CardContent className="py-3 px-4 text-center">
            <p className="text-2xl font-bold text-gray-500">{counts.notTested}</p>
            <p className="text-xs text-muted-foreground">Not Tested</p>
          </CardContent>
        </Card>
      </div>
      {/* Panel coverage info */}
      <p className="text-xs text-muted-foreground">
        Your results: {counts.tested} of {counts.totalInPanel} biomarkers tested ({Math.round((counts.tested / counts.totalInPanel) * 100)}% coverage)
      </p>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search biomarkers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <span className="text-sm text-muted-foreground">Status:</span>
              <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as FilterStatus)}>
                <div className="overflow-x-auto pb-1 sm:overflow-visible sm:pb-0">
                  <TabsList className="w-max sm:w-auto sm:flex-wrap sm:h-auto gap-1">
                    <TabsTrigger value="all" className="text-xs sm:text-sm">All</TabsTrigger>
                    <TabsTrigger value="optimal" className="text-xs sm:text-sm data-[state=active]:bg-green-500/20 data-[state=active]:text-green-600">
                      Optimal ({counts.optimal})
                    </TabsTrigger>
                    <TabsTrigger value="normal" className="text-xs sm:text-sm data-[state=active]:bg-yellow-500/20 data-[state=active]:text-yellow-600">
                      Normal ({counts.normal})
                    </TabsTrigger>
                    <TabsTrigger value="out_of_range" className="text-xs sm:text-sm data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-600">
                      Attention ({counts.outOfRange})
                    </TabsTrigger>
                    <TabsTrigger value="not_tested" className="text-xs sm:text-sm data-[state=active]:bg-gray-500/20 data-[state=active]:text-gray-600">
                      Not Tested ({counts.notTested})
                    </TabsTrigger>
                  </TabsList>
                </div>
              </Tabs>
            </div>

            {/* Category Pills */}
            <div className="space-y-2">
              <span className="text-sm text-muted-foreground">Category:</span>
              <div className="overflow-x-auto pb-1 sm:overflow-visible sm:pb-0">
                <div className="flex w-max sm:w-auto sm:flex-wrap items-center gap-2">
                  <Button
                    variant={selectedCategory === null ? "secondary" : "ghost"}
                    size="sm"
                    className="shrink-0"
                    onClick={() => setSelectedCategory(null)}
                  >
                    All
                  </Button>
                  {Object.entries(bloodPanelConfig).map(([key, config]) => {
                    const catKey = key as BloodPanelCategoryKey;
                    return (
                      <Button
                        key={key}
                        variant={selectedCategory === catKey ? "secondary" : "ghost"}
                        size="sm"
                        className="shrink-0"
                        onClick={() => setSelectedCategory(catKey)}
                        style={selectedCategory === catKey ? {
                          backgroundColor: `${config.color}15`,
                          color: config.color
                        } : undefined}
                      >
                        {config.name}
                      </Button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Active Filters */}
            {hasActiveFilters && (
              <div className="flex items-center gap-2 pt-2 border-t border-border">
                <span className="text-sm text-muted-foreground">Active filters:</span>
                {searchQuery && (
                  <Badge variant="secondary" className="gap-1">
                    Search: {searchQuery}
                    <X
                      className="w-3 h-3 cursor-pointer hover:text-foreground"
                      onClick={() => setSearchQuery("")}
                    />
                  </Badge>
                )}
                {selectedCategory && (
                  <Badge variant="secondary" className="gap-1">
                    {bloodPanelConfig[selectedCategory]?.name || selectedCategory}
                    <X
                      className="w-3 h-3 cursor-pointer hover:text-foreground"
                      onClick={() => setSelectedCategory(null)}
                    />
                  </Badge>
                )}
                {statusFilter !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    {statusFilter.replace("_", " ")}
                    <X
                      className="w-3 h-3 cursor-pointer hover:text-foreground"
                      onClick={() => setStatusFilter("all")}
                    />
                  </Badge>
                )}
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear all
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results Count with Gender Indicator */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {filteredBiomarkers.length} of {counts.totalInPanel} biomarkers
        </p>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <User className="w-3 h-3" />
            <span>{gender === 'male' ? 'Male' : 'Female'} ranges</span>
          </div>
          <div className="flex items-center gap-1">
            <Info className="w-3 h-3" />
            <span>Australian SI units</span>
          </div>
        </div>
      </div>

      {/* Biomarkers Grid - Grouped by Category */}
      {Object.entries(groupedBiomarkers).length > 0 ? (
        <div className="space-y-8">
          {Object.entries(groupedBiomarkers).map(([category, items]) => {
            const catKey = category as BloodPanelCategoryKey;
            const config = bloodPanelConfig[catKey];
            const Icon = config.icon;
            const testedCount = items.filter(i => i.result !== null).length;
            const notTestedCount = items.length - testedCount;

            return (
              <div key={category}>
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${config.color}15` }}
                  >
                    <Icon className="w-5 h-5" style={{ color: config.color }} />
                  </div>
                  <div>
                    <h2 className="text-lg font-medium text-foreground">
                      {config.name}
                    </h2>
                    <p className="text-xs text-muted-foreground">{config.description}</p>
                  </div>
                  <div className="flex gap-2 ml-auto">
                    <Badge variant="secondary">{testedCount} tested</Badge>
                    {notTestedCount > 0 && (
                      <Badge variant="outline" className="text-gray-500">{notTestedCount} pending</Badge>
                    )}
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {items.map(({ biomarker, result, biomarkerDef }) =>
                    result && biomarkerDef ? (
                      <BiomarkerCard
                        key={biomarker.id}
                        biomarker={biomarkerDef}
                        result={result}
                        gender={gender}
                        panelBiomarker={biomarker}
                        onClick={() => handleBiomarkerClick(biomarkerDef, result, biomarker)}
                      />
                    ) : (
                      <UntestedBiomarkerCard
                        key={biomarker.id}
                        biomarker={biomarker}
                        gender={gender}
                        categoryColor={config.color}
                        onClick={
                          biomarkerDef
                            ? () => handleBiomarkerClick(biomarkerDef, null, biomarker)
                            : undefined
                        }
                      />
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <Card className="py-12">
          <CardContent className="text-center">
            <Filter className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No biomarkers found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your filters or search query
            </p>
            <Button onClick={clearFilters}>Clear filters</Button>
          </CardContent>
        </Card>
      )}
        </>
      )}

      {/* Biomarker Detail Dialog */}
      <BiomarkerDetailDialog
        biomarker={selectedBiomarker?.biomarker || null}
        result={selectedBiomarker?.result || null}
        history={[]}
        gender={gender}
        panelBiomarker={selectedBiomarker?.panelBiomarker}
        open={!!selectedBiomarker}
        onOpenChange={(open) => !open && setSelectedBiomarker(null)}
      />
    </div>
  );
}
