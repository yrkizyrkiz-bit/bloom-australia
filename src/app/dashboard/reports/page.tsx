"use client";

import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { biomarkerDefinitions, getBiomarkerById, categoryInfo } from "@/data/biomarkers";
import type { BiomarkerDefinition, BiomarkerResult, BiomarkerStatus } from "@/types";
import { BiomarkerHistoryDialog } from "@/components/dashboard/BiomarkerHistoryDialog";
import { TestComparisonDialog } from "@/components/dashboard/TestComparisonDialog";
import { MiniChart } from "@/components/dashboard/BiomarkerChart";
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus,
  Eye,
  Sparkles,
  Loader2,
  CheckCircle,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  ArrowLeftRight,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import { jsPDF } from "jspdf";

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

export default function ReportsPage() {
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedHistoryBiomarker, setSelectedHistoryBiomarker] = useState<BiomarkerDefinition | null>(null);
  const [showComparisonDialog, setShowComparisonDialog] = useState(false);

  // Real data state
  const [isLoading, setIsLoading] = useState(true);
  const [biomarkerData, setBiomarkerData] = useState<BiomarkerTrendData[]>([]);
  const [testDates, setTestDates] = useState<TestDateSummary[]>([]);
  const [statistics, setStatistics] = useState<HistoryApiResponse["statistics"] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const gender = user?.gender === "female" ? "female" : "male";

  // Fetch real biomarker data
  const fetchBiomarkerHistory = async () => {
    setIsLoading(true);
    setError(null);

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
      setError(err instanceof Error ? err.message : "Failed to load data");
      toast.error("Failed to load biomarker history");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBiomarkerHistory();
  }, []);

  // Convert API data to result format for display
  const allResults = useMemo((): BiomarkerResult[] => {
    const results: BiomarkerResult[] = [];

    biomarkerData.forEach(biomarker => {
      biomarker.history.forEach((h, idx) => {
        results.push({
          id: `${biomarker.biomarkerId}_${idx}`,
          biomarkerId: biomarker.biomarkerId,
          value: h.value,
          status: h.status as BiomarkerStatus,
          testedAt: h.date
        });
      });
    });

    return results.sort((a, b) =>
      new Date(b.testedAt).getTime() - new Date(a.testedAt).getTime()
    );
  }, [biomarkerData]);

  // Get results for a specific date
  const getResultsForDate = (date: string) => {
    return allResults.filter(r => r.testedAt.startsWith(date));
  };

  // Get trend info for a biomarker
  const getTrendForBiomarker = (biomarkerId: string) => {
    const biomarker = biomarkerData.find(b => b.biomarkerId === biomarkerId);
    if (!biomarker || biomarker.history.length < 2) return null;

    return {
      direction: biomarker.trend === "improving" ? "up" :
                 biomarker.trend === "worsening" ? "down" : "stable",
      percentChange: Math.abs(biomarker.changePercent),
      improved: biomarker.trend === "improving" ? true :
                biomarker.trend === "worsening" ? false : null
    };
  };

  // Get history for dialog
  const getHistoryForBiomarker = (biomarkerId: string) => {
    const biomarker = biomarkerData.find(b => b.biomarkerId === biomarkerId);
    if (!biomarker) return [];

    return biomarker.history.map(h => ({
      id: `${biomarkerId}_${h.date}`,
      biomarkerId,
      value: h.value,
      status: h.status as "optimal" | "normal" | "out_of_range",
      testedAt: h.date
    }));
  };

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 3000));
    setIsGenerating(false);
    setShowPdfPreview(true);
    toast.success("AI Report generated successfully!");
  };

  const handleDownloadPdf = async () => {
    setIsDownloading(true);
    try {
      const doc = new jsPDF();
      const userName = user?.firstName || "Member";
      const pageWidth = doc.internal.pageSize.getWidth();

      // Page 1 - Cover/Overview
      doc.setFillColor(255, 250, 245);
      doc.rect(0, 0, pageWidth, 297, "F");

      doc.setFontSize(32);
      doc.setTextColor(60, 80, 60);
      doc.text(`${userName}'s Health Report`, pageWidth / 2, 40, { align: "center" });

      doc.setFontSize(12);
      doc.setTextColor(120, 120, 120);
      doc.text(new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' }), pageWidth / 2, 50, { align: "center" });

      // Statistics
      if (statistics) {
        doc.setFontSize(14);
        doc.setTextColor(60, 60, 60);
        doc.text(`Total Biomarkers Tracked: ${statistics.totalBiomarkers}`, 25, 80);
        doc.text(`Test Dates: ${statistics.totalTestDates}`, 25, 95);
        doc.text(`Improving: ${statistics.improving}`, 25, 110);
        doc.text(`Stable: ${statistics.stable}`, 25, 125);
        doc.text(`Needs Attention: ${statistics.worsening}`, 25, 140);
      }

      // Page 2 - Results by Date
      doc.addPage();
      doc.setFontSize(18);
      doc.setTextColor(60, 80, 60);
      doc.text("Test Results by Date", 25, 30);

      let yPos = 50;
      for (const testDate of testDates.slice(0, 5)) {
        doc.setFontSize(12);
        doc.setTextColor(60, 60, 60);
        doc.text(new Date(testDate.date).toLocaleDateString('en-AU'), 25, yPos);
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(`${testDate.biomarkerCount} biomarkers - ${testDate.optimal} optimal, ${testDate.outOfRange} flagged`, 25, yPos + 10);
        yPos += 30;
      }

      doc.save(`${userName}_Health_Report_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success("Report downloaded successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF");
    } finally {
      setIsDownloading(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-serif text-foreground">Reports & History</h1>
            <p className="text-muted-foreground mt-1">Loading your biomarker data...</p>
          </div>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  // Empty state
  if (!isLoading && biomarkerData.length === 0) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-serif text-foreground">Reports & History</h1>
            <p className="text-muted-foreground mt-1">View your test history and generate AI-powered health reports</p>
          </div>
        </div>
        <Card>
          <CardContent className="py-16 text-center">
            <FileText className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-medium mb-2">No Test Results Yet</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Once your blood test results are uploaded and processed, they will appear here.
              You'll be able to view your history and track trends over time.
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
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif text-foreground">Reports & History</h1>
          <p className="text-muted-foreground mt-1">View your test history and generate AI-powered health reports</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={fetchBiomarkerHistory} title="Refresh data">
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button variant="outline" onClick={() => setShowComparisonDialog(true)} className="gap-2">
            <ArrowLeftRight className="w-4 h-4" />
            <span className="hidden sm:inline">Compare Tests</span>
          </Button>
          <Button onClick={handleGenerateReport} disabled={isGenerating} className="gap-2">
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="hidden sm:inline">Generating...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span className="hidden sm:inline">Generate AI Report</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Statistics Summary */}
      {statistics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-primary">{statistics.totalBiomarkers}</p>
              <p className="text-sm text-muted-foreground">Biomarkers Tracked</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-green-600">{statistics.improving}</p>
              <p className="text-sm text-muted-foreground">Improving</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-blue-600">{statistics.stable}</p>
              <p className="text-sm text-muted-foreground">Stable</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-orange-600">{statistics.worsening}</p>
              <p className="text-sm text-muted-foreground">Needs Attention</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="history" className="space-y-6">
        <TabsList>
          <TabsTrigger value="history">Test History</TabsTrigger>
          <TabsTrigger value="trends">Biomarker Trends</TabsTrigger>
          <TabsTrigger value="reports">Generated Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="space-y-6">
          {testDates.map((testDate) => {
            const results = getResultsForDate(testDate.date);

            return (
              <Card key={testDate.date}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          {new Date(testDate.date).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">{testDate.biomarkerCount} biomarkers tested</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-500/10 text-green-600">{testDate.optimal} optimal</Badge>
                      {testDate.outOfRange > 0 && (
                        <Badge className="bg-orange-500/10 text-orange-600">{testDate.outOfRange} flagged</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {results.slice(0, 6).map((result) => {
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
                            <div className={`w-2 h-2 rounded-full ${
                              result.status === "optimal" ? "bg-green-500" :
                              result.status === "normal" ? "bg-yellow-500" : "bg-orange-500"
                            }`} />
                            <div>
                              <p className="font-medium text-sm">{biomarker.shortName}</p>
                              <p className="text-xs text-muted-foreground">
                                {result.value} {biomarker.ranges[gender].unit}
                              </p>
                            </div>
                          </div>
                          {trend && (
                            <div className={`flex items-center gap-1 text-xs ${
                              trend.improved ? "text-green-600" : trend.improved === false ? "text-red-600" : "text-muted-foreground"
                            }`}>
                              {trend.direction === "up" ? <ArrowUpRight className="w-3 h-3" /> :
                               trend.direction === "down" ? <ArrowDownRight className="w-3 h-3" /> :
                               <Minus className="w-3 h-3" />}
                              <span>{trend.percentChange}%</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {results.length > 6 && (
                    <Button variant="ghost" size="sm" className="w-full mt-3">
                      View all {results.length} results
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
              <div className="space-y-4">
                {biomarkerData.map((biomarkerTrend) => {
                  const biomarkerDef = getBiomarkerById(biomarkerTrend.biomarkerId);
                  const category = biomarkerDef?.category || biomarkerTrend.category;
                  const categoryColor = categoryInfo[category as keyof typeof categoryInfo]?.color || "#6b7280";

                  return (
                    <div
                      key={biomarkerTrend.biomarkerId}
                      className="flex items-center justify-between p-4 rounded-lg border hover:border-primary/30 transition-colors cursor-pointer"
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
                      <div className="flex items-center gap-4">
                        {biomarkerTrend.history.length > 1 && (
                          <div className="w-24 h-10">
                            <MiniChart
                              history={biomarkerTrend.history.map(h => ({
                                id: h.date,
                                biomarkerId: biomarkerTrend.biomarkerId,
                                value: h.value,
                                status: h.status as "optimal" | "normal" | "out_of_range",
                                testedAt: h.date
                              }))}
                              color={
                                biomarkerTrend.trend === "improving" ? "#22c55e" :
                                biomarkerTrend.trend === "worsening" ? "#f97316" :
                                categoryColor
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
                          {biomarkerTrend.trend === "improving" ? <TrendingUp className="w-3 h-3 mr-1" /> :
                           biomarkerTrend.trend === "worsening" ? <TrendingDown className="w-3 h-3 mr-1" /> :
                           <Minus className="w-3 h-3 mr-1" />}
                          {biomarkerTrend.trend === "improving" ? "Improved" :
                           biomarkerTrend.trend === "worsening" ? "Needs Attention" : "Stable"}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardContent className="py-8 text-center">
              <Sparkles className="w-12 h-12 mx-auto text-primary/30 mb-4" />
              <h3 className="text-lg font-medium mb-2">Generate Your Health Report</h3>
              <p className="text-muted-foreground max-w-md mx-auto mb-6">
                Our AI will analyze your biomarker trends and generate a personalized health report with recommendations.
              </p>
              <Button onClick={handleGenerateReport} disabled={isGenerating}>
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate AI Report
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* PDF Preview Dialog */}
      <Dialog open={showPdfPreview} onOpenChange={setShowPdfPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              AI-Generated Health Report
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[70vh]">
            <div className="space-y-8 p-6 bg-white rounded-lg">
              <div className="text-center border-b pb-6">
                <h1 className="text-3xl font-serif text-foreground">{user?.firstName}'s Health Report</h1>
                <p className="text-muted-foreground mt-2">
                  {new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>

              {statistics && (
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="text-center p-6 rounded-xl bg-primary/5 border">
                    <p className="text-5xl font-serif font-bold text-primary">{statistics.totalBiomarkers}</p>
                    <p className="text-muted-foreground mt-2">Biomarkers Tracked</p>
                  </div>
                  <div className="text-center p-6 rounded-xl bg-green-500/5 border">
                    <p className="text-5xl font-serif font-bold text-green-600">{statistics.improving}</p>
                    <p className="text-muted-foreground mt-2">Improving</p>
                  </div>
                </div>
              )}

              <Separator />

              <div className="space-y-4">
                <h2 className="text-xl font-serif">Test History Summary</h2>
                {testDates.slice(0, 3).map(testDate => (
                  <div key={testDate.date} className="p-4 rounded-lg border">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">
                        {new Date(testDate.date).toLocaleDateString('en-AU')}
                      </span>
                      <div className="flex gap-2">
                        <Badge className="bg-green-500/10 text-green-600">{testDate.optimal} optimal</Badge>
                        <Badge className="bg-orange-500/10 text-orange-600">{testDate.outOfRange} flagged</Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="space-y-4">
                <h2 className="text-xl font-serif">Biomarkers Needing Attention</h2>
                {biomarkerData.filter(b => b.trend === "worsening").slice(0, 3).map(biomarker => {
                  const def = getBiomarkerById(biomarker.biomarkerId);
                  return (
                    <div key={biomarker.biomarkerId} className="p-4 rounded-lg border border-orange-200 bg-orange-50">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4 text-orange-600" />
                        <h4 className="font-medium text-orange-900">{biomarker.name}</h4>
                      </div>
                      <p className="text-sm text-orange-800">
                        Current: {biomarker.latestValue} {biomarker.unit}
                        {biomarker.previousValue && ` (was ${biomarker.previousValue})`}
                      </p>
                      {def?.whyItMatters && (
                        <p className="text-sm text-orange-700 mt-2">{def.whyItMatters}</p>
                      )}
                    </div>
                  );
                })}
                {biomarkerData.filter(b => b.trend === "worsening").length === 0 && (
                  <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <p className="text-green-800">All biomarkers are stable or improving!</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowPdfPreview(false)}>Close</Button>
            <Button onClick={handleDownloadPdf} disabled={isDownloading}>
              {isDownloading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Biomarker History Dialog */}
      <BiomarkerHistoryDialog
        biomarker={selectedHistoryBiomarker}
        history={selectedHistoryBiomarker ? getHistoryForBiomarker(selectedHistoryBiomarker.id) : []}
        gender={gender}
        open={!!selectedHistoryBiomarker}
        onOpenChange={(open) => !open && setSelectedHistoryBiomarker(null)}
      />

      {/* Test Comparison Dialog */}
      <TestComparisonDialog
        allResults={allResults}
        testDates={testDates.map(t => t.date)}
        gender={gender}
        open={showComparisonDialog}
        onOpenChange={setShowComparisonDialog}
      />
    </div>
  );
}
