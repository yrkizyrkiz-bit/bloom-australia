"use client";

import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { getBiomarkerById, categoryInfo } from "@/data/biomarkers";
import type { BiomarkerDefinition, BiomarkerResult, BiomarkerStatus } from "@/types";
import { BiomarkerHistoryDialog } from "@/components/dashboard/BiomarkerHistoryDialog";
import { TestComparisonDialog } from "@/components/dashboard/TestComparisonDialog";
import { GeneratedAIReportPanel } from "@/components/dashboard/GeneratedAIReportPanel";
import { MiniChart } from "@/components/dashboard/BiomarkerChart";
import {
  FileText,
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  ArrowLeftRight,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

interface BiomarkerTrendData {
  biomarkerId: string;
  name: string;
  shortName: string;
  unit: string;
  category: string;
  history: Array<{ date: string; value: number; status: string }>;
  trend: "improving" | "stable" | "worsening";
  changePercent: number;
  latestValue: number;
  previousValue: number | null;
}

interface TestDateSummary {
  date: string;
  biomarkerCount: number;
  optimal: number;
  normal: number;
  outOfRange: number;
}

interface HistoryApiResponse {
  biomarkers: BiomarkerTrendData[];
  testDates: TestDateSummary[];
  statistics: {
    totalBiomarkers: number;
    improving: number;
    stable: number;
    worsening: number;
    totalTestDates: number;
  };
}

interface BiomarkerHistoryViewProps {
  /** When true, omits the page-level heading (e.g. embedded in Biomarkers tabs). */
  embedded?: boolean;
  pageTitle?: string;
}

export function BiomarkerHistoryView({ embedded = false, pageTitle = "History" }: BiomarkerHistoryViewProps) {
  const { user } = useAuth();
  const [selectedHistoryBiomarker, setSelectedHistoryBiomarker] = useState<BiomarkerDefinition | null>(null);
  const [showComparisonDialog, setShowComparisonDialog] = useState(false);
  const [expandedTestDates, setExpandedTestDates] = useState<Record<string, boolean>>({});
  const [trendFilter, setTrendFilter] = useState<"all" | "improving" | "stable" | "worsening">("all");
  const [activeTab, setActiveTab] = useState("history");

  const [isLoading, setIsLoading] = useState(true);
  const [biomarkerData, setBiomarkerData] = useState<BiomarkerTrendData[]>([]);
  const [testDates, setTestDates] = useState<TestDateSummary[]>([]);
  const [statistics, setStatistics] = useState<HistoryApiResponse["statistics"] | null>(null);

  const gender = user?.gender === "female" ? "female" : "male";

  const filteredBiomarkerData = useMemo(() => {
    if (trendFilter === "all") return biomarkerData;
    return biomarkerData.filter((b) => b.trend === trendFilter);
  }, [biomarkerData, trendFilter]);

  const filteredBiomarkerIds = useMemo(
    () => new Set(filteredBiomarkerData.map((b) => b.biomarkerId)),
    [filteredBiomarkerData]
  );

  const selectTrendFilter = (next: "all" | "improving" | "stable" | "worsening") => {
    setTrendFilter((prev) => (prev === next ? "all" : next));
    if (next !== "all") setActiveTab("trends");
  };

  const fetchBiomarkerHistory = async () => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/biomarkers/history?months=24&limit=20");
      if (!response.ok) {
        throw new Error("Failed to fetch biomarker history");
      }

      const data: HistoryApiResponse = await response.json();
      setBiomarkerData(data.biomarkers || []);
      setTestDates(data.testDates || []);
      setStatistics(data.statistics || null);
    } catch (err) {
      console.error("Error fetching biomarker history:", err);
      toast.error("Failed to load biomarker history");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBiomarkerHistory();
  }, []);

  const allResults = useMemo((): BiomarkerResult[] => {
    const results: BiomarkerResult[] = [];

    biomarkerData.forEach((biomarker) => {
      biomarker.history.forEach((h, idx) => {
        results.push({
          id: `${biomarker.biomarkerId}_${idx}`,
          biomarkerId: biomarker.biomarkerId,
          value: h.value,
          status: h.status as BiomarkerStatus,
          testedAt: h.date,
        });
      });
    });

    return results.sort(
      (a, b) => new Date(b.testedAt).getTime() - new Date(a.testedAt).getTime()
    );
  }, [biomarkerData]);

  const getResultsForDate = (date: string) => {
    const dateKey = date.slice(0, 10);
    return allResults.filter((r) => {
      if (r.testedAt.slice(0, 10) !== dateKey) return false;
      if (trendFilter === "all") return true;
      return filteredBiomarkerIds.has(r.biomarkerId);
    });
  };

  const getTrendForBiomarker = (biomarkerId: string) => {
    const biomarker = biomarkerData.find((b) => b.biomarkerId === biomarkerId);
    if (!biomarker || biomarker.history.length < 2) return null;

    return {
      direction:
        biomarker.trend === "improving"
          ? "up"
          : biomarker.trend === "worsening"
            ? "down"
            : "stable",
      percentChange: Math.abs(biomarker.changePercent),
      improved:
        biomarker.trend === "improving"
          ? true
          : biomarker.trend === "worsening"
            ? false
            : null,
    };
  };

  const getHistoryForBiomarker = (biomarkerId: string) => {
    const biomarker = biomarkerData.find((b) => b.biomarkerId === biomarkerId);
    if (!biomarker) return [];

    return biomarker.history.map((h) => ({
      id: `${biomarkerId}_${h.date}`,
      biomarkerId,
      value: h.value,
      status: h.status as "optimal" | "normal" | "out_of_range",
      testedAt: h.date,
    }));
  };


  if (isLoading) {
    return (
      <div className="space-y-6">
        {!embedded && (
          <div>
            <h1 className="text-2xl sm:text-3xl font-serif text-foreground">{pageTitle}</h1>
            <p className="text-muted-foreground mt-1">Loading your biomarker data...</p>
          </div>
        )}
        <div className="space-y-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (biomarkerData.length === 0) {
    return (
      <div className="space-y-6">
        {!embedded && (
          <div>
            <h1 className="text-2xl sm:text-3xl font-serif text-foreground">{pageTitle}</h1>
            <p className="text-muted-foreground mt-1">
              View your test history and generate AI-powered health reports
            </p>
          </div>
        )}
        <Card>
          <CardContent className="py-16 text-center">
            <FileText className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-medium mb-2">No Test Results Yet</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Once your blood test results are uploaded and processed, they will appear here.
            </p>
            <Button variant="outline" className="mt-6" onClick={fetchBiomarkerHistory}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {!embedded ? (
          <div>
            <h1 className="text-2xl sm:text-3xl font-serif text-foreground">{pageTitle}</h1>
            <p className="text-muted-foreground mt-1">
              View your test history and generate AI-powered health reports
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            View your test history and generate AI-powered health reports
          </p>
        )}
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
          <Button variant="outline" size="icon" onClick={fetchBiomarkerHistory} title="Refresh data" className="shrink-0">
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button variant="outline" onClick={() => setShowComparisonDialog(true)} className="w-full gap-2 sm:w-auto">
            <ArrowLeftRight className="w-4 h-4" />
            Compare Tests
          </Button>
          <Button
            onClick={() => setActiveTab("reports")}
            className="w-full gap-2 sm:w-auto bg-[#1D9E75] hover:bg-[#178a64]"
          >
            <Sparkles className="w-4 h-4" />
            AI Report
          </Button>
        </div>
      </div>

      {statistics && (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
          <Card
            role="button"
            tabIndex={0}
            onClick={() => selectTrendFilter("all")}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                selectTrendFilter("all");
              }
            }}
            className={`cursor-pointer transition-all hover:shadow-md ${
              trendFilter === "all" ? "ring-2 ring-primary border-primary/40" : ""
            }`}
          >
            <CardContent className="px-3 pt-4 pb-4 text-center sm:pt-6">
              <p className="text-2xl font-bold text-primary sm:text-3xl">{statistics.totalBiomarkers}</p>
              <p className="text-xs text-muted-foreground sm:text-sm">Biomarkers Tracked</p>
            </CardContent>
          </Card>
          <Card
            role="button"
            tabIndex={0}
            onClick={() => selectTrendFilter("improving")}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                selectTrendFilter("improving");
              }
            }}
            className={`cursor-pointer transition-all hover:shadow-md ${
              trendFilter === "improving" ? "ring-2 ring-green-500 border-green-500/40" : ""
            }`}
          >
            <CardContent className="px-3 pt-4 pb-4 text-center sm:pt-6">
              <p className="text-2xl font-bold text-green-600 sm:text-3xl">{statistics.improving}</p>
              <p className="text-xs text-muted-foreground sm:text-sm">Improving</p>
            </CardContent>
          </Card>
          <Card
            role="button"
            tabIndex={0}
            onClick={() => selectTrendFilter("stable")}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                selectTrendFilter("stable");
              }
            }}
            className={`cursor-pointer transition-all hover:shadow-md ${
              trendFilter === "stable" ? "ring-2 ring-blue-500 border-blue-500/40" : ""
            }`}
          >
            <CardContent className="px-3 pt-4 pb-4 text-center sm:pt-6">
              <p className="text-2xl font-bold text-blue-600 sm:text-3xl">{statistics.stable}</p>
              <p className="text-xs text-muted-foreground sm:text-sm">Stable</p>
            </CardContent>
          </Card>
          <Card
            role="button"
            tabIndex={0}
            onClick={() => selectTrendFilter("worsening")}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                selectTrendFilter("worsening");
              }
            }}
            className={`cursor-pointer transition-all hover:shadow-md ${
              trendFilter === "worsening" ? "ring-2 ring-orange-500 border-orange-500/40" : ""
            }`}
          >
            <CardContent className="px-3 pt-4 pb-4 text-center sm:pt-6">
              <p className="text-2xl font-bold text-orange-600 sm:text-3xl">{statistics.worsening}</p>
              <p className="text-xs text-muted-foreground sm:text-sm">Needs Attention</p>
            </CardContent>
          </Card>
        </div>
      )}

      {trendFilter !== "all" && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-sm">
          <p className="text-muted-foreground">
            Showing{" "}
            <span className="font-medium text-foreground">
              {trendFilter === "improving"
                ? "improving"
                : trendFilter === "worsening"
                  ? "needs attention"
                  : "stable"}
            </span>{" "}
            biomarkers ({filteredBiomarkerData.length})
          </p>
          <Button type="button" variant="ghost" size="sm" onClick={() => setTrendFilter("all")}>
            Clear filter
          </Button>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="overflow-x-auto pb-1">
          <TabsList className="inline-flex h-auto w-max min-w-full sm:min-w-0">
            <TabsTrigger value="history" className="text-xs sm:text-sm">Test History</TabsTrigger>
            <TabsTrigger value="trends" className="text-xs sm:text-sm">Biomarker Trends</TabsTrigger>
            <TabsTrigger value="reports" className="text-xs sm:text-sm">Generated Reports</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="history" className="space-y-6">
          {testDates.every((testDate) => getResultsForDate(testDate.date).length === 0) && (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                No biomarkers match this filter for your test history.
              </CardContent>
            </Card>
          )}
          {testDates.map((testDate) => {
            const results = getResultsForDate(testDate.date);
            if (results.length === 0) return null;
            const isExpanded = Boolean(expandedTestDates[testDate.date]);
            const visibleResults = isExpanded ? results : results.slice(0, 6);

            return (
              <Card key={testDate.date}>
                <CardHeader className="pb-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <Calendar className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="text-base sm:text-lg">
                          {new Date(testDate.date).toLocaleDateString("en-AU", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {testDate.biomarkerCount} biomarkers tested
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                      <Badge className="bg-green-500/10 text-green-600">{testDate.optimal} optimal</Badge>
                      {testDate.outOfRange > 0 && (
                        <Badge className="bg-orange-500/10 text-orange-600">
                          {testDate.outOfRange} flagged
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {visibleResults.map((result) => {
                      const biomarker = getBiomarkerById(result.biomarkerId);
                      const trend = getTrendForBiomarker(result.biomarkerId);
                      if (!biomarker) return null;

                      return (
                        <div
                          key={result.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                          onClick={() => setSelectedHistoryBiomarker(biomarker)}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-2 h-2 rounded-full ${
                                result.status === "optimal"
                                  ? "bg-green-500"
                                  : result.status === "normal"
                                    ? "bg-yellow-500"
                                    : "bg-orange-500"
                              }`}
                            />
                            <div>
                              <p className="font-medium text-sm">{biomarker.shortName}</p>
                              <p className="text-xs text-muted-foreground">
                                {result.value} {biomarker.ranges[gender].unit}
                              </p>
                            </div>
                          </div>
                          {trend && (
                            <div
                              className={`flex items-center gap-1 text-xs ${
                                trend.improved
                                  ? "text-green-600"
                                  : trend.improved === false
                                    ? "text-red-600"
                                    : "text-muted-foreground"
                              }`}
                            >
                              {trend.direction === "up" ? (
                                <ArrowUpRight className="w-3 h-3" />
                              ) : trend.direction === "down" ? (
                                <ArrowDownRight className="w-3 h-3" />
                              ) : (
                                <Minus className="w-3 h-3" />
                              )}
                              <span>{trend.percentChange}%</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {results.length > 6 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="w-full mt-3"
                      onClick={() =>
                        setExpandedTestDates((prev) => ({
                          ...prev,
                          [testDate.date]: !prev[testDate.date],
                        }))
                      }
                    >
                      {isExpanded
                        ? "Show fewer results"
                        : `View all ${results.length} results`}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Biomarker Trends Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredBiomarkerData.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No biomarkers match this filter.
                </p>
              ) : (
              <div className="space-y-4">
                {filteredBiomarkerData.map((biomarkerTrend) => {
                  const biomarkerDef = getBiomarkerById(biomarkerTrend.biomarkerId);
                  const category = biomarkerDef?.category || biomarkerTrend.category;
                  const categoryColor =
                    categoryInfo[category as keyof typeof categoryInfo]?.color || "#6b7280";

                  return (
                    <div
                      key={biomarkerTrend.biomarkerId}
                      className="flex flex-col gap-3 rounded-lg border p-4 transition-colors hover:border-primary/30 cursor-pointer sm:flex-row sm:items-center sm:justify-between"
                      onClick={() => biomarkerDef && setSelectedHistoryBiomarker(biomarkerDef)}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${categoryColor}20` }}
                        >
                          <span className="text-sm font-medium" style={{ color: categoryColor }}>
                            {biomarkerTrend.shortName.slice(0, 2)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{biomarkerTrend.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Current: {biomarkerTrend.latestValue} {biomarkerTrend.unit}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                        {biomarkerTrend.history.length > 1 && (
                          <div className="h-10 w-24">
                            <MiniChart
                              history={biomarkerTrend.history.map((h) => ({
                                id: h.date,
                                biomarkerId: biomarkerTrend.biomarkerId,
                                value: h.value,
                                status: h.status as "optimal" | "normal" | "out_of_range",
                                testedAt: h.date,
                              }))}
                              color={
                                biomarkerTrend.trend === "improving"
                                  ? "#22c55e"
                                  : biomarkerTrend.trend === "worsening"
                                    ? "#f97316"
                                    : categoryColor
                              }
                            />
                          </div>
                        )}
                        <Badge
                          variant="outline"
                          className={`${
                            biomarkerTrend.trend === "improving"
                              ? "border-green-500 text-green-600 bg-green-500/10"
                              : biomarkerTrend.trend === "worsening"
                                ? "border-orange-500 text-orange-600 bg-orange-500/10"
                                : "border-muted-foreground"
                          }`}
                        >
                          {biomarkerTrend.trend === "improving" ? (
                            <TrendingUp className="w-3 h-3 mr-1" />
                          ) : biomarkerTrend.trend === "worsening" ? (
                            <TrendingDown className="w-3 h-3 mr-1" />
                          ) : (
                            <Minus className="w-3 h-3 mr-1" />
                          )}
                          {biomarkerTrend.trend === "improving"
                            ? "Improved"
                            : biomarkerTrend.trend === "worsening"
                              ? "Needs Attention"
                              : "Stable"}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <GeneratedAIReportPanel />
        </TabsContent>
      </Tabs>

      <BiomarkerHistoryDialog
        biomarker={selectedHistoryBiomarker}
        history={
          selectedHistoryBiomarker ? getHistoryForBiomarker(selectedHistoryBiomarker.id) : []
        }
        gender={gender}
        open={!!selectedHistoryBiomarker}
        onOpenChange={(open) => !open && setSelectedHistoryBiomarker(null)}
      />

      <TestComparisonDialog
        allResults={allResults}
        testDates={testDates.map((t) => t.date)}
        gender={gender}
        open={showComparisonDialog}
        onOpenChange={setShowComparisonDialog}
      />
    </div>
  );
}
