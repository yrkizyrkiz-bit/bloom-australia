"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  Heart,
  Flame,
  Droplets,
  Zap,
  Shield,
  Sparkles,
  Target,
  ArrowRight,
  Calendar,
  Info,
  RefreshCw,
  Loader2,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";
import { BiologicalAgeChart } from "@/components/dashboard/BiologicalAgeChart";
import { OrganAgeChart } from "@/components/dashboard/OrganAgeChart";

interface BiologicalAgeData {
  biologicalAge: number;
  chronologicalAge: number;
  ageDifference: number;
  phenotypicAge: number;
  healthStatus: string;
  confidence: number;
  biomarkersUsed: number;
  biomarkersAvailable: string[];
  organAges: {
    metabolic?: number;
    cardiovascular?: number;
    liver?: number;
    kidney?: number;
    immune?: number;
    blood?: number;
    inflammatory?: number;
    thyroid?: number;
    hormonal?: number;
  };
  contributingFactors: Array<{
    biomarker: string;
    biomarkerId: string;
    value: number;
    unit: string;
    impact: "positive" | "negative" | "neutral";
    contribution: number;
    recommendation?: string;
  }>;
  recommendations: string[];
  calculatedAt: string;
}

interface HealthScoreHistory {
  id: string;
  biologicalAge: number | null;
  chronologicalAge: number | null;
  calculatedAt: string;
}

const ORGAN_CONFIG: Record<string, { icon: typeof Heart; color: string; name: string; description: string }> = {
  metabolic: { icon: Flame, color: "#f97316", name: "Metabolic", description: "Glucose, HbA1c, insulin metabolism" },
  cardiovascular: { icon: Heart, color: "#ef4444", name: "Cardiovascular", description: "Heart & blood vessel health" },
  liver: { icon: Activity, color: "#84cc16", name: "Liver", description: "Liver function & detoxification" },
  kidney: { icon: Droplets, color: "#06b6d4", name: "Kidney", description: "Kidney filtration & function" },
  immune: { icon: Shield, color: "#8b5cf6", name: "Immune", description: "Immune system health" },
  blood: { icon: Zap, color: "#ec4899", name: "Blood", description: "Blood cell health & oxygen capacity" },
  inflammatory: { icon: Flame, color: "#f59e0b", name: "Inflammatory", description: "Chronic inflammation levels" },
  thyroid: { icon: Activity, color: "#3b82f6", name: "Thyroid", description: "Thyroid hormone balance" },
  hormonal: { icon: Sparkles, color: "#a855f7", name: "Hormonal", description: "Hormone levels & balance" },
};

export default function BiologicalAgePage() {
  const { user } = useAuth();
  const [bioAgeData, setBioAgeData] = useState<BiologicalAgeData | null>(null);
  const [history, setHistory] = useState<HealthScoreHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBiologicalAge();
    fetchHistory();
  }, []);

  const fetchBiologicalAge = async () => {
    try {
      const response = await fetch("/api/biological-age?includeFactors=true");
      if (!response.ok) {
        const data = await response.json();
        if (data.requiresDob) {
          setError("Please update your date of birth in settings to calculate biological age.");
        } else if (data.requiresBiomarkers) {
          setError("No biomarker results found. Upload blood test results to calculate biological age.");
        } else {
          throw new Error(data.error || "Failed to fetch biological age");
        }
        return;
      }
      const data = await response.json();
      setBioAgeData(data.biologicalAge);
    } catch (err) {
      console.error("Error fetching biological age:", err);
      setError("Failed to load biological age data");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await fetch("/api/health-scores?limit=12");
      if (response.ok) {
        const data = await response.json();
        setHistory(data.scores || []);
      }
    } catch (err) {
      console.error("Error fetching history:", err);
    }
  };

  const recalculateBioAge = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch("/api/biological-age", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ saveToHealthScore: true }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to recalculate");
      }

      const data = await response.json();
      setBioAgeData(data.biologicalAge);
      fetchHistory();
    } catch (err) {
      console.error("Error recalculating:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const getHealthStatusConfig = (status: string) => {
    switch (status) {
      case "excellent": return { color: "text-green-600", bg: "bg-green-500/10", label: "Excellent" };
      case "good": return { color: "text-emerald-600", bg: "bg-emerald-500/10", label: "Good" };
      case "average": return { color: "text-yellow-600", bg: "bg-yellow-500/10", label: "Average" };
      case "needs_attention": return { color: "text-orange-600", bg: "bg-orange-500/10", label: "Needs Attention" };
      case "concerning": return { color: "text-red-600", bg: "bg-red-500/10", label: "Concerning" };
      default: return { color: "text-gray-600", bg: "bg-gray-500/10", label: status };
    }
  };

  const chartData = useMemo(() => {
    return history
      .filter(h => h.biologicalAge != null && h.chronologicalAge != null)
      .map(h => ({
        date: new Date(h.calculatedAt).toLocaleDateString("en-AU", { month: "short", year: "2-digit" }),
        biologicalAge: h.biologicalAge!,
        chronologicalAge: h.chronologicalAge!,
      }))
      .reverse();
  }, [history]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Calculating your biological age...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif">Biological Age</h1>
          <p className="text-muted-foreground mt-1">Your body's true age based on biomarkers</p>
        </div>

        <Card className="border-orange-200 bg-orange-50/50 dark:bg-orange-950/10">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-8 h-8 text-orange-500 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-lg">Unable to Calculate Biological Age</h3>
                <p className="text-muted-foreground mt-1">{error}</p>
                <div className="flex gap-3 mt-4">
                  <Link href="/dashboard/settings">
                    <Button variant="outline">Update Settings</Button>
                  </Link>
                  <Button onClick={() => window.location.reload()}>Try Again</Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!bioAgeData) return null;

  const statusConfig = getHealthStatusConfig(bioAgeData.healthStatus);
  const positiveFactors = bioAgeData.contributingFactors.filter(f => f.impact === "positive");
  const negativeFactors = bioAgeData.contributingFactors.filter(f => f.impact === "negative");

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif">Biological Age</h1>
          <p className="text-muted-foreground mt-1">Your body's true age based on biomarkers</p>
        </div>
        <Button onClick={recalculateBioAge} disabled={isRefreshing} variant="outline" className="gap-2">
          {isRefreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Recalculate
        </Button>
      </div>

      {/* Main Stats */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Biological Age Card */}
        <Card className="md:col-span-2 bg-gradient-to-br from-purple-500/5 via-primary/5 to-purple-500/10 border-purple-500/20">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <div className="text-center md:text-left">
                <p className="text-sm text-muted-foreground mb-2">Your Biological Age</p>
                <div className="flex items-baseline gap-2 justify-center md:justify-start">
                  <span className="text-6xl md:text-7xl font-bold text-purple-600">
                    {Math.round(bioAgeData.biologicalAge)}
                  </span>
                  <span className="text-2xl text-muted-foreground">years</span>
                </div>
                <div className={`flex items-center gap-2 mt-3 justify-center md:justify-start ${
                  bioAgeData.ageDifference < 0 ? "text-green-600" :
                  bioAgeData.ageDifference > 0 ? "text-orange-600" : "text-gray-600"
                }`}>
                  {bioAgeData.ageDifference < 0 ? (
                    <TrendingDown className="w-5 h-5" />
                  ) : bioAgeData.ageDifference > 0 ? (
                    <TrendingUp className="w-5 h-5" />
                  ) : (
                    <Minus className="w-5 h-5" />
                  )}
                  <span className="text-lg font-medium">
                    {bioAgeData.ageDifference > 0 ? "+" : ""}{Math.round(bioAgeData.ageDifference)} years
                    {bioAgeData.ageDifference < 0 ? " younger" : bioAgeData.ageDifference > 0 ? " older" : ""}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  vs chronological age of {bioAgeData.chronologicalAge}
                </p>
              </div>

              <div className="flex-1 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Health Status</span>
                  <Badge className={`${statusConfig.bg} ${statusConfig.color}`}>
                    {statusConfig.label}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Confidence</span>
                    <span className="font-medium">{Math.round(bioAgeData.confidence * 100)}%</span>
                  </div>
                  <Progress value={bioAgeData.confidence * 100} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    Based on {bioAgeData.biomarkersUsed} biomarkers
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  <span>
                    Last calculated: {new Date(bioAgeData.calculatedAt).toLocaleDateString("en-AU", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" />
              Quick Stats
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <span className="text-sm">Phenotypic Age</span>
              <span className="font-bold">{Math.round(bioAgeData.phenotypicAge)} yrs</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <span className="text-sm">Biomarkers Used</span>
              <span className="font-bold">{bioAgeData.biomarkersUsed}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10">
              <span className="text-sm text-green-700">Positive Factors</span>
              <span className="font-bold text-green-600">{positiveFactors.length}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-orange-500/10">
              <span className="text-sm text-orange-700">Areas to Improve</span>
              <span className="font-bold text-orange-600">{negativeFactors.length}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for detailed info */}
      <Tabs defaultValue="trends" className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full max-w-lg">
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="organs">Organ Ages</TabsTrigger>
          <TabsTrigger value="factors">Factors</TabsTrigger>
          <TabsTrigger value="tips">Tips</TabsTrigger>
        </TabsList>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Biological Age Over Time</CardTitle>
              <CardDescription>Track your biological age improvement journey</CardDescription>
            </CardHeader>
            <CardContent>
              {chartData.length > 1 ? (
                <BiologicalAgeChart data={chartData} />
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p>Not enough data points yet</p>
                  <p className="text-sm mt-1">Your biological age history will appear here after multiple calculations</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Organ Ages Tab */}
        <TabsContent value="organs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Organ-Specific Biological Ages</CardTitle>
              <CardDescription>How each organ system is aging compared to your chronological age</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(bioAgeData.organAges).map(([organ, age]) => {
                  if (age == null) return null;
                  const config = ORGAN_CONFIG[organ] || { icon: Activity, color: "#6b7280", name: organ, description: "" };
                  const Icon = config.icon;
                  const diff = age - bioAgeData.chronologicalAge;

                  return (
                    <div
                      key={organ}
                      className="p-4 rounded-xl border bg-card hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: `${config.color}15` }}
                          >
                            <Icon className="w-5 h-5" style={{ color: config.color }} />
                          </div>
                          <div>
                            <p className="font-medium">{config.name}</p>
                            <p className="text-xs text-muted-foreground">{config.description}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-baseline justify-between">
                        <span className="text-3xl font-bold">{Math.round(age)}</span>
                        <div className={`flex items-center gap-1 text-sm ${
                          diff < -2 ? "text-green-600" :
                          diff > 2 ? "text-orange-600" : "text-gray-500"
                        }`}>
                          {diff < 0 ? <TrendingDown className="w-4 h-4" /> :
                           diff > 0 ? <TrendingUp className="w-4 h-4" /> : null}
                          <span>{diff > 0 ? "+" : ""}{Math.round(diff)} yrs</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Organ Age Chart */}
              <div className="mt-6">
                <OrganAgeChart
                  organAges={bioAgeData.organAges}
                  chronologicalAge={bioAgeData.chronologicalAge}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Factors Tab */}
        <TabsContent value="factors" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Positive Factors */}
            <Card className="border-green-200 bg-green-50/30 dark:bg-green-950/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2 text-green-700">
                  <CheckCircle className="w-5 h-5" />
                  Making You Younger ({positiveFactors.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px] pr-4">
                  <div className="space-y-3">
                    {positiveFactors.length > 0 ? positiveFactors.map((factor, i) => (
                      <div key={i} className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-green-200">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-sm">{factor.biomarker}</p>
                            <p className="text-xs text-muted-foreground">
                              {factor.value} {factor.unit}
                            </p>
                          </div>
                          <Badge className="bg-green-500/10 text-green-600">
                            {factor.contribution.toFixed(1)} yrs younger
                          </Badge>
                        </div>
                      </div>
                    )) : (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        No significant positive factors identified yet
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Negative Factors */}
            <Card className="border-orange-200 bg-orange-50/30 dark:bg-orange-950/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2 text-orange-700">
                  <AlertTriangle className="w-5 h-5" />
                  Areas to Improve ({negativeFactors.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px] pr-4">
                  <div className="space-y-3">
                    {negativeFactors.length > 0 ? negativeFactors.map((factor, i) => (
                      <div key={i} className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-orange-200">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-medium text-sm">{factor.biomarker}</p>
                            <p className="text-xs text-muted-foreground">
                              {factor.value} {factor.unit}
                            </p>
                          </div>
                          <Badge className="bg-orange-500/10 text-orange-600">
                            +{Math.abs(factor.contribution).toFixed(1)} yrs
                          </Badge>
                        </div>
                        {factor.recommendation && (
                          <p className="text-xs text-muted-foreground mt-2 pt-2 border-t">
                            {factor.recommendation}
                          </p>
                        )}
                      </div>
                    )) : (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        Great! No significant negative factors
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tips Tab */}
        <TabsContent value="tips" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Personalized Recommendations
              </CardTitle>
              <CardDescription>Based on your biomarker results and biological age calculation</CardDescription>
            </CardHeader>
            <CardContent>
              {bioAgeData.recommendations && bioAgeData.recommendations.length > 0 ? (
                <div className="space-y-4">
                  {bioAgeData.recommendations.map((rec, i) => (
                    <div key={i} className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 border">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-primary font-bold">{i + 1}</span>
                      </div>
                      <div>
                        <p className="text-sm">{rec}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p>No specific recommendations at this time</p>
                  <p className="text-sm mt-1">Keep up the great work!</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Goals CTA */}
          <Card className="bg-gradient-to-r from-primary/5 to-purple-500/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Target className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-lg">Set Biological Age Goals</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Track your progress toward reducing your biological age with personalized goals.
                  </p>
                  <Link href="/dashboard/biological-age/goals">
                    <Button className="mt-4 gap-2">
                      Set Goals <ChevronRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
