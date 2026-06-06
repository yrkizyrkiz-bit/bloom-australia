"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Bean,
  Droplets,
  Heart,
  Activity,
  Flame,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Sparkles,
  Target,
  Calendar,
  BarChart3,
  FileText,
  LineChart
} from "lucide-react";
import { useDashboardStats } from "@/hooks/useApi";
import { getBiomarkerById, getStatusForValue } from "@/data/biomarkers";
import { HealthScoreRadarChart } from "./HealthScoreRadarChart";
import {
  healthTestsConfig as sharedHealthTestsConfig,
  calculateTestScore,
  getScoreColor,
  getProgressColor
} from "@/lib/healthTestScoring";

interface BiomarkerResult {
  id: string;
  biomarkerId: string;
  value: number;
  status: string;
  testedAt: string;
}

interface HealthTestScore {
  id: string;
  name: string;
  icon: typeof Heart;
  color: string;
  bgColor: string;
  score: number;
  trend: "improving" | "stable" | "declining";
  optimal: number;
  normal: number;
  outOfRange: number;
  href: string;
  lastTested: string;
  biomarkerIds: string[];
  hasData?: boolean;
}

// Map icons to the shared health test config
const healthTestIcons: Record<string, typeof Heart> = {
  liver: Bean,
  kidney: Droplets,
  heart: Heart,
  thyroid: Activity,
  hormones: Sparkles,
  metabolic: Flame,
};

// Extend shared config with icons for UI rendering
const healthTestsWithIcons = sharedHealthTestsConfig.map(test => ({
  ...test,
  icon: healthTestIcons[test.id] || Activity,
}));

interface UnifiedHealthDashboardProps {
  gender?: "male" | "female";
}

export function UnifiedHealthDashboard({ gender = "female" }: UnifiedHealthDashboardProps) {
  // Fetch real biomarker data from API
  const { data: dashboardData, isLoading } = useDashboardStats();

  // Map API data to BiomarkerResult format
  const biomarkerResults: BiomarkerResult[] = useMemo(() => {
    if (dashboardData?.biomarkerResults && dashboardData.biomarkerResults.length > 0) {
      return dashboardData.biomarkerResults.map((r: any) => ({
        id: r.id,
        biomarkerId: r.biomarkerId,
        value: r.value,
        status: r.status?.toLowerCase() || "normal",
        testedAt: r.testedAt,
      }));
    }
    return [];
  }, [dashboardData]);

  const testScores = useMemo(() => {
    return healthTestsWithIcons.map(test => {
      const { score, optimal, normal, outOfRange, trend, hasData, lastTested } = calculateTestScore(test.id, test.biomarkerIds, gender, biomarkerResults);
      return { ...test, score, optimal, normal, outOfRange, trend, hasData, lastTested: lastTested || new Date().toISOString() };
    });
  }, [gender, biomarkerResults]);

  // Only count tests that have data
  const testsWithData = testScores.filter(t => t.hasData);

  const overallScore = useMemo(() => {
    if (testsWithData.length === 0) return 0;
    const total = testsWithData.reduce((sum, test) => sum + test.score, 0);
    return Math.round(total / testsWithData.length);
  }, [testsWithData]);

  const totalOptimal = testScores.reduce((sum, t) => sum + t.optimal, 0);
  const totalNormal = testScores.reduce((sum, t) => sum + t.normal, 0);
  const totalOutOfRange = testScores.reduce((sum, t) => sum + t.outOfRange, 0);
  const totalBiomarkers = totalOptimal + totalNormal + totalOutOfRange;

  const sortedTests = [...testScores].sort((a, b) => b.score - a.score);
  const needsAttention = testScores.filter(t => t.hasData && t.score < 70);

  // Show empty state if no data
  if (!isLoading && totalBiomarkers === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-16 text-center">
          <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
          <h3 className="text-xl font-medium mb-2">No Health Data Yet</h3>
          <p className="text-muted-foreground mb-4">
            Your biomarker results will appear here once uploaded by your healthcare provider.
          </p>
          <p className="text-sm text-muted-foreground">
            Contact your clinic to upload your blood test results.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Health Score Card */}
      <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-0 overflow-hidden">
        <CardContent className="pt-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-slate-400 text-sm mb-2">Your Overall Health Score</p>
              <div className="flex items-end gap-3 mb-4">
                <span className="text-6xl font-bold">{overallScore}</span>
                <span className="text-slate-400 text-xl mb-2">/100</span>
              </div>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-slate-300">{totalOptimal} optimal</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm text-slate-300">{totalNormal} normal</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-orange-400" />
                  <span className="text-sm text-slate-300">{totalOutOfRange} out of range</span>
                </div>
              </div>
              <p className="text-slate-400 text-sm">
                Based on {totalOptimal + totalNormal + totalOutOfRange} biomarkers across 6 health categories
              </p>
            </div>
            <div className="space-y-3">
              {testScores.map(test => (
                <div key={test.id} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <test.icon className="w-4 h-4" style={{ color: test.color }} />
                      {test.name}
                    </span>
                    <span className={getScoreColor(test.score)}>{test.score}</span>
                  </div>
                  <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${getProgressColor(test.score)}`}
                      style={{ width: `${test.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Health Score Visualization */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Radar Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Health Score Overview
            </CardTitle>
            <CardDescription>Visual comparison across all health categories</CardDescription>
          </CardHeader>
          <CardContent>
            <HealthScoreRadarChart
              scores={testScores.map(t => ({ category: t.name, score: t.score }))}
              height={250}
              color="#10b981"
            />
          </CardContent>
        </Card>

        {/* Current Scores Summary */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Current Scores
            </CardTitle>
            <CardDescription>Health scores based on your latest biomarker results</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {testScores.slice(0, 5).map((test) => (
                <div key={test.id} className="flex items-center gap-3">
                  <div className="w-28 flex items-center gap-2 text-sm">
                    <test.icon className="w-4 h-4 flex-shrink-0" style={{ color: test.color }} />
                    <span className="truncate">{test.name.split(' ')[0]}</span>
                  </div>
                  <div className="flex-1">
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${getProgressColor(test.score)}`}
                        style={{ width: `${test.score}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium w-8 text-right ${getScoreColor(test.score)}`}>
                      {test.score}
                    </span>
                    {test.trend === "improving" && <TrendingUp className="w-3 h-3 text-green-500" />}
                    {test.trend === "declining" && <TrendingDown className="w-3 h-3 text-red-500" />}
                    {test.trend === "stable" && <Minus className="w-3 h-3 text-muted-foreground" />}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Individual Test Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedTests.map(test => (
          <Link key={test.id} href={test.href}>
            <Card className={`h-full hover:shadow-lg transition-all cursor-pointer border-l-4`} style={{ borderLeftColor: test.color }}>
              <CardContent className="pt-5">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl ${test.bgColor} flex items-center justify-center`}>
                    <test.icon className="w-6 h-6" style={{ color: test.color }} />
                  </div>
                  <div className="text-right">
                    <p className={`text-3xl font-bold ${getScoreColor(test.score)}`}>{test.score}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      {test.trend === "improving" && <TrendingUp className="w-3 h-3 text-green-600" />}
                      {test.trend === "declining" && <TrendingDown className="w-3 h-3 text-red-600" />}
                      {test.trend === "stable" && <Minus className="w-3 h-3" />}
                      <span className="capitalize">{test.trend}</span>
                    </div>
                  </div>
                </div>
                <h3 className="font-semibold mb-2">{test.name}</h3>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                  <span className="flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-green-600" />
                    {test.optimal} optimal
                  </span>
                  <span className="flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-yellow-600" />
                    {test.normal} normal
                  </span>
                  <span className="flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 text-orange-600" />
                    {test.outOfRange} out
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Last: {new Date(test.lastTested).toLocaleDateString('en-AU', { month: 'short', day: 'numeric' })}
                  </span>
                  <span className="flex items-center gap-1 text-primary">
                    View details <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Areas Needing Attention */}
      {needsAttention.length > 0 && (
        <Card className="border-orange-200 bg-orange-50/50 dark:bg-orange-950/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              Areas Needing Attention
            </CardTitle>
            <CardDescription>These health categories have lower scores and may benefit from focused improvement</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-3">
              {needsAttention.map(test => (
                <Link key={test.id} href={test.href}>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-slate-900/50 border hover:shadow-md transition-all cursor-pointer">
                    <div className="flex items-center gap-3">
                      <test.icon className="w-5 h-5" style={{ color: test.color }} />
                      <div>
                        <p className="font-medium text-sm">{test.name}</p>
                        <p className="text-xs text-muted-foreground">{test.outOfRange} biomarkers need attention</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-lg font-bold ${getScoreColor(test.score)}`}>{test.score}</span>
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h4 className="font-medium">AI Health Insights</h4>
                <p className="text-xs text-muted-foreground">Get personalized recommendations</p>
              </div>
            </div>
            <Link href="/dashboard/reports">
              <Button variant="outline" size="sm" className="w-full">
                View AI Report <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                <LineChart className="w-5 h-5 text-cyan-600" />
              </div>
              <div>
                <h4 className="font-medium">Historical Trends</h4>
                <p className="text-xs text-muted-foreground">Track changes over time</p>
              </div>
            </div>
            <Link href="/dashboard/trends">
              <Button variant="outline" size="sm" className="w-full">
                View Trends <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Target className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h4 className="font-medium">Health Goals</h4>
                <p className="text-xs text-muted-foreground">Track your progress</p>
              </div>
            </div>
            <Link href="/dashboard/goals">
              <Button variant="outline" size="sm" className="w-full">
                View Goals <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h4 className="font-medium">Next Test</h4>
                <p className="text-xs text-muted-foreground">Schedule your follow-up</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="w-full">
              Schedule Test <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
