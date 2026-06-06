"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  BarChart3,
  LineChart,
  Activity,
  Loader2,
  RefreshCw,
  ChevronRight,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Info
} from "lucide-react";

interface HistoricalDataPoint {
  date: string;
  value: number;
  status: string;
}

interface BiomarkerTrend {
  biomarkerId: string;
  name: string;
  shortName: string;
  unit: string;
  category: string;
  history: HistoricalDataPoint[];
  trend: "improving" | "stable" | "worsening";
  changePercent: number;
  latestValue: number;
  previousValue: number | null;
  optimalRange?: { min: number; max: number };
  normalRange?: { min: number; max: number };
}

interface TestDateSummary {
  date: string;
  biomarkerCount: number;
  optimal: number;
  normal: number;
  outOfRange: number;
}

interface BiomarkerHistoryData {
  biomarkers: BiomarkerTrend[];
  testDates: TestDateSummary[];
  statistics: {
    totalBiomarkers: number;
    improving: number;
    stable: number;
    worsening: number;
    totalTestDates: number;
    dateRange: { start: string; end: string };
  };
}

interface BiomarkerTrendChartProps {
  category?: string;
  biomarkerId?: string;
}

export function BiomarkerTrendChart({ category, biomarkerId }: BiomarkerTrendChartProps) {
  const [data, setData] = useState<BiomarkerHistoryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBiomarker, setSelectedBiomarker] = useState<BiomarkerTrend | null>(null);
  const [months, setMonths] = useState("12");
  const [activeTab, setActiveTab] = useState("overview");

  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (category) params.set("category", category);
      if (biomarkerId) params.set("biomarkerId", biomarkerId);
      params.set("months", months);
      params.set("limit", "20");

      const response = await fetch(`/api/biomarkers/history?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch history");
      }

      const result = await response.json();
      setData(result);

      // Auto-select first biomarker with history
      if (result.biomarkers?.length > 0 && !selectedBiomarker) {
        setSelectedBiomarker(result.biomarkers[0]);
      }
    } catch (err) {
      console.error("Error fetching biomarker history:", err);
      setError(err instanceof Error ? err.message : "Failed to load history");
    } finally {
      setIsLoading(false);
    }
  }, [category, biomarkerId, months, selectedBiomarker]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const getTrendIcon = (trend: string) => {
    if (trend === "improving") return <TrendingDown className="w-4 h-4 text-emerald-600" />;
    if (trend === "worsening") return <TrendingUp className="w-4 h-4 text-red-600" />;
    return <Minus className="w-4 h-4 text-slate-400" />;
  };

  const getTrendColor = (trend: string) => {
    if (trend === "improving") return "text-emerald-600 bg-emerald-50 border-emerald-200";
    if (trend === "worsening") return "text-red-600 bg-red-50 border-red-200";
    return "text-slate-600 bg-slate-50 border-slate-200";
  };

  const getStatusColor = (status: string) => {
    if (status === "optimal") return "bg-emerald-500";
    if (status === "normal") return "bg-amber-500";
    return "bg-red-500";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-AU", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  };

  const formatShortDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-AU", {
      day: "numeric",
      month: "short"
    });
  };

  if (isLoading) {
    return (
      <Card className="border-0 shadow-md">
        <CardContent className="py-12">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-slate-500">Loading historical data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-orange-200 bg-orange-50/50">
        <CardContent className="py-8 text-center">
          <AlertCircle className="w-10 h-10 text-orange-500 mx-auto mb-3" />
          <p className="text-orange-700 mb-4">{error}</p>
          <Button variant="outline" onClick={fetchHistory} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.biomarkers.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center">
          <BarChart3 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-600 mb-2">No Historical Data</h3>
          <p className="text-slate-400 text-sm">
            Historical trends will appear here once you have multiple test results.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
            <LineChart className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-800">Biomarker Trends</h2>
            <p className="text-sm text-slate-500">
              {data.statistics.totalBiomarkers} biomarkers tracked across {data.statistics.totalTestDates} test dates
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={months} onValueChange={setMonths}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">Last 3 months</SelectItem>
              <SelectItem value="6">Last 6 months</SelectItem>
              <SelectItem value="12">Last 12 months</SelectItem>
              <SelectItem value="24">Last 2 years</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={fetchHistory} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Statistics Summary */}
      <div className="grid sm:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Improving</p>
                <p className="text-3xl font-bold text-emerald-600">{data.statistics.improving}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Stable</p>
                <p className="text-3xl font-bold text-slate-700">{data.statistics.stable}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                <Minus className="w-6 h-6 text-slate-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Worsening</p>
                <p className="text-3xl font-bold text-red-600">{data.statistics.worsening}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Test Dates</p>
                <p className="text-3xl font-bold text-slate-700">{data.statistics.totalTestDates}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-100/80 p-1">
          <TabsTrigger value="overview" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="detail" className="gap-2">
            <LineChart className="w-4 h-4" />
            Detail View
          </TabsTrigger>
          <TabsTrigger value="dates" className="gap-2">
            <Calendar className="w-4 h-4" />
            Test Dates
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6">
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">All Biomarker Trends</CardTitle>
              <CardDescription>Click on a biomarker to see detailed history</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.biomarkers.map((biomarker) => (
                  <button
                    key={biomarker.biomarkerId}
                    onClick={() => {
                      setSelectedBiomarker(biomarker);
                      setActiveTab("detail");
                    }}
                    className={`w-full p-4 rounded-xl border transition-all text-left hover:shadow-md ${
                      selectedBiomarker?.biomarkerId === biomarker.biomarkerId
                        ? "border-primary bg-primary/5"
                        : "border-slate-100 bg-white hover:border-slate-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          {getTrendIcon(biomarker.trend)}
                          <div>
                            <p className="font-medium text-slate-800">{biomarker.name}</p>
                            <p className="text-xs text-slate-500">{biomarker.category}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-lg font-bold text-slate-800">
                            {biomarker.latestValue} <span className="text-xs font-normal text-slate-500">{biomarker.unit}</span>
                          </p>
                          {biomarker.previousValue !== null && (
                            <p className="text-xs text-slate-500">
                              from {biomarker.previousValue}
                            </p>
                          )}
                        </div>
                        <Badge className={`${getTrendColor(biomarker.trend)} border`}>
                          {biomarker.changePercent > 0 ? "+" : ""}{biomarker.changePercent}%
                        </Badge>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </div>
                    </div>

                    {/* Mini trend chart */}
                    {biomarker.history.length > 1 && (
                      <div className="mt-3 flex items-end gap-1 h-8">
                        {biomarker.history.map((point, idx) => {
                          // Normalize value for display
                          const allValues = biomarker.history.map(h => h.value);
                          const minVal = Math.min(...allValues);
                          const maxVal = Math.max(...allValues);
                          const range = maxVal - minVal || 1;
                          const height = ((point.value - minVal) / range) * 100;

                          return (
                            <div
                              key={idx}
                              className="flex-1 max-w-4 relative group"
                            >
                              <div
                                className={`w-full rounded-t transition-all ${getStatusColor(point.status)}`}
                                style={{ height: `${Math.max(10, height)}%` }}
                              />
                              <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:block z-10">
                                <div className="bg-slate-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                                  {point.value} {biomarker.unit}
                                  <br />
                                  {formatShortDate(point.date)}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Detail View Tab */}
        <TabsContent value="detail" className="mt-6">
          {selectedBiomarker ? (
            <Card className="border-0 shadow-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {selectedBiomarker.name}
                      <Badge variant="outline">{selectedBiomarker.shortName}</Badge>
                    </CardTitle>
                    <CardDescription>{selectedBiomarker.category} • {selectedBiomarker.unit}</CardDescription>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={`${getTrendColor(selectedBiomarker.trend)} border`}>
                      {getTrendIcon(selectedBiomarker.trend)}
                      <span className="ml-1 capitalize">{selectedBiomarker.trend}</span>
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Current vs Previous */}
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Latest Value</p>
                    <p className="text-3xl font-bold text-slate-800">
                      {selectedBiomarker.latestValue}
                      <span className="text-sm font-normal text-slate-500 ml-1">{selectedBiomarker.unit}</span>
                    </p>
                  </div>

                  {selectedBiomarker.previousValue !== null && (
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Previous Value</p>
                      <p className="text-3xl font-bold text-slate-600">
                        {selectedBiomarker.previousValue}
                        <span className="text-sm font-normal text-slate-500 ml-1">{selectedBiomarker.unit}</span>
                      </p>
                    </div>
                  )}

                  <div className={`p-4 rounded-xl border ${getTrendColor(selectedBiomarker.trend)}`}>
                    <p className="text-xs font-medium uppercase tracking-wide mb-2">Change</p>
                    <p className="text-3xl font-bold">
                      {selectedBiomarker.changePercent > 0 ? "+" : ""}{selectedBiomarker.changePercent}%
                    </p>
                  </div>
                </div>

                {/* Reference Ranges */}
                {(selectedBiomarker.optimalRange || selectedBiomarker.normalRange) && (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Reference Ranges</p>
                    <div className="flex items-center gap-4 flex-wrap">
                      {selectedBiomarker.optimalRange && (
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded bg-emerald-500" />
                          <span className="text-sm text-slate-600">
                            Optimal: {selectedBiomarker.optimalRange.min}-{selectedBiomarker.optimalRange.max} {selectedBiomarker.unit}
                          </span>
                        </div>
                      )}
                      {selectedBiomarker.normalRange && (
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded bg-amber-500" />
                          <span className="text-sm text-slate-600">
                            Normal: {selectedBiomarker.normalRange.min}-{selectedBiomarker.normalRange.max} {selectedBiomarker.unit}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Full Trend Chart */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-4">Historical Trend</p>
                  <div className="h-48 relative">
                    {/* Y-axis */}
                    <div className="absolute left-0 top-0 bottom-8 w-12 flex flex-col justify-between text-xs text-slate-400">
                      {(() => {
                        const allValues = selectedBiomarker.history.map(h => h.value);
                        const minVal = Math.min(...allValues);
                        const maxVal = Math.max(...allValues);
                        return (
                          <>
                            <span>{maxVal.toFixed(1)}</span>
                            <span>{((maxVal + minVal) / 2).toFixed(1)}</span>
                            <span>{minVal.toFixed(1)}</span>
                          </>
                        );
                      })()}
                    </div>

                    {/* Chart area */}
                    <div className="ml-14 h-full pb-8 relative">
                      {/* Reference lines */}
                      {selectedBiomarker.optimalRange && (
                        <div
                          className="absolute left-0 right-0 bg-emerald-100/50 border-y border-emerald-200"
                          style={{
                            top: (() => {
                              const allValues = selectedBiomarker.history.map(h => h.value);
                              const minVal = Math.min(...allValues, selectedBiomarker.optimalRange!.min);
                              const maxVal = Math.max(...allValues, selectedBiomarker.optimalRange!.max);
                              const range = maxVal - minVal || 1;
                              const topPos = 100 - ((selectedBiomarker.optimalRange!.max - minVal) / range) * 100;
                              const bottomPos = 100 - ((selectedBiomarker.optimalRange!.min - minVal) / range) * 100;
                              return `${topPos}%`;
                            })(),
                            height: (() => {
                              const allValues = selectedBiomarker.history.map(h => h.value);
                              const minVal = Math.min(...allValues, selectedBiomarker.optimalRange!.min);
                              const maxVal = Math.max(...allValues, selectedBiomarker.optimalRange!.max);
                              const range = maxVal - minVal || 1;
                              return `${((selectedBiomarker.optimalRange!.max - selectedBiomarker.optimalRange!.min) / range) * 100}%`;
                            })()
                          }}
                        />
                      )}

                      {/* Data bars */}
                      <div className="absolute inset-0 flex items-end justify-between gap-2 px-2">
                        {selectedBiomarker.history.map((point, idx) => {
                          const allValues = selectedBiomarker.history.map(h => h.value);
                          const minVal = Math.min(...allValues);
                          const maxVal = Math.max(...allValues);
                          const range = maxVal - minVal || 1;
                          const height = ((point.value - minVal) / range) * 100;

                          return (
                            <div key={idx} className="flex-1 flex flex-col items-center gap-1 relative group">
                              <div
                                className={`w-full max-w-8 rounded-t transition-all ${getStatusColor(point.status)}`}
                                style={{ height: `${Math.max(5, height)}%` }}
                              />

                              {/* Tooltip */}
                              <div className="absolute bottom-full mb-2 hidden group-hover:block z-10">
                                <div className="bg-slate-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                                  {point.value} {selectedBiomarker.unit}
                                  <br />
                                  {formatDate(point.date)}
                                </div>
                              </div>

                              {/* X-axis label */}
                              <span className="text-[10px] text-slate-400 -rotate-45 origin-left whitespace-nowrap absolute -bottom-6">
                                {formatShortDate(point.date)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* History Table */}
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">All Readings</p>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Date</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-slate-500">Value</th>
                          <th className="px-4 py-2 text-center text-xs font-medium text-slate-500">Status</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-slate-500">Change</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {[...selectedBiomarker.history].reverse().map((point, idx, arr) => {
                          const prevPoint = arr[idx + 1];
                          const change = prevPoint
                            ? ((point.value - prevPoint.value) / prevPoint.value) * 100
                            : 0;

                          return (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="px-4 py-3 text-sm text-slate-700">
                                {formatDate(point.date)}
                              </td>
                              <td className="px-4 py-3 text-sm text-right font-medium text-slate-800">
                                {point.value} {selectedBiomarker.unit}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <Badge
                                  className={
                                    point.status === "optimal"
                                      ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                                      : point.status === "normal"
                                      ? "bg-amber-100 text-amber-700 border-amber-200"
                                      : "bg-red-100 text-red-700 border-red-200"
                                  }
                                >
                                  {point.status}
                                </Badge>
                              </td>
                              <td className="px-4 py-3 text-sm text-right">
                                {idx < arr.length - 1 ? (
                                  <span className={change > 0 ? "text-red-600" : change < 0 ? "text-emerald-600" : "text-slate-500"}>
                                    {change > 0 ? "+" : ""}{change.toFixed(1)}%
                                  </span>
                                ) : (
                                  <span className="text-slate-400">—</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <Activity className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-600 mb-2">Select a Biomarker</h3>
                <p className="text-slate-400 text-sm">
                  Click on a biomarker in the Overview tab to see detailed history.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Test Dates Tab */}
        <TabsContent value="dates" className="mt-6">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">Test Date History</CardTitle>
              <CardDescription>Summary of biomarkers tested on each date</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {data.testDates.map((testDate, idx) => (
                    <div
                      key={testDate.date}
                      className="p-4 rounded-xl border border-slate-100 bg-white hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-800">{formatDate(testDate.date)}</p>
                            <p className="text-xs text-slate-500">{testDate.biomarkerCount} biomarkers tested</p>
                          </div>
                        </div>
                        {idx === 0 && (
                          <Badge className="bg-primary/10 text-primary border-primary/20">Latest</Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle className="w-4 h-4 text-emerald-600" />
                          <span className="text-sm text-slate-600">{testDate.optimal} optimal</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-amber-600" />
                          <span className="text-sm text-slate-600">{testDate.normal} normal</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <AlertCircle className="w-4 h-4 text-red-600" />
                          <span className="text-sm text-slate-600">{testDate.outOfRange} out of range</span>
                        </div>
                      </div>

                      {/* Progress bar showing distribution */}
                      <div className="mt-3 h-2 bg-slate-100 rounded-full overflow-hidden flex">
                        {testDate.optimal > 0 && (
                          <div
                            className="h-full bg-emerald-500"
                            style={{ width: `${(testDate.optimal / testDate.biomarkerCount) * 100}%` }}
                          />
                        )}
                        {testDate.normal > 0 && (
                          <div
                            className="h-full bg-amber-500"
                            style={{ width: `${(testDate.normal / testDate.biomarkerCount) * 100}%` }}
                          />
                        )}
                        {testDate.outOfRange > 0 && (
                          <div
                            className="h-full bg-red-500"
                            style={{ width: `${(testDate.outOfRange / testDate.biomarkerCount) * 100}%` }}
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Info Note */}
      <Card className="border-0 shadow-sm bg-slate-50">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-slate-400 mt-0.5" />
            <div className="text-sm text-slate-600">
              <p className="font-medium mb-1">Understanding Trends</p>
              <p className="text-slate-500">
                Trends are calculated based on how your values are moving towards or away from the optimal range.
                "Improving" means values are getting closer to optimal, while "Worsening" means they&apos;re moving further away.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
