"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, TrendingDown, TrendingUp, Scale, Dumbbell, Flame, Award, Loader2, Calendar, History } from "lucide-react";
import Link from "next/link";
import { FullProgressChart, ViewTrackingHistoryButton } from "@/components/weight-management/ProgressChart";
import { BodyMeasurements } from "@/components/weight-management/BodyMeasurements";
import { WeeklyProgressSummary } from "@/components/weight-management/WeeklyProgressSummary";
import { ProgressPhotos } from "@/components/weight-management/ProgressPhotos";

interface ProgressData {
  summary: {
    currentWeight: number | null;
    startWeight: number | null;
    weightChange: number;
    totalExerciseMinutes: number;
    totalCaloriesBurned: number;
    exerciseDays: number;
    totalMeals: number;
    avgDailyCalories: number;
    consistencyScore: number;
    daysTracked: number;
  };
  weightProgress: {
    logs: Array<{ measuredAt: string; weight: number; waistCircumference: number | null }>;
    weeklyAverages: Array<{ week: string; avgWeight: number }>;
  };
  checkInTrends: Array<{ week: number; feeling: number; energy: number; sleep: number; stress: number }>;
  goalProgress: {
    targetWeight: number;
    percentComplete: number;
    remainingToLose: number;
    actualLost: number;
    daysRemaining: number;
  } | null;
}

export default function ProgressPage() {
  const [data, setData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("90");
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    fetchProgress();
  }, [period]);

  const fetchProgress = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/weight-management/progress?days=${period}`);
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch (error) {
      console.error("Error fetching progress:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const weightChange = data?.summary.weightChange || 0;
  const isLoss = weightChange <= 0;

  // Calculate weekly change (approximate)
  const weeklyChange = data?.weightProgress.weeklyAverages && data.weightProgress.weeklyAverages.length >= 2
    ? data.weightProgress.weeklyAverages[data.weightProgress.weeklyAverages.length - 1].avgWeight -
      data.weightProgress.weeklyAverages[data.weightProgress.weeklyAverages.length - 2].avgWeight
    : 0;

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/weight-management">
          <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Progress Analytics</h1>
          <p className="text-muted-foreground">Track your journey over time</p>
        </div>
      </div>

      {/* Period Selector */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { value: "30", label: "30 Days" },
          { value: "90", label: "90 Days" },
          { value: "180", label: "6 Months" },
          { value: "365", label: "1 Year" },
        ].map((p) => (
          <Button
            key={p.value}
            variant={period === p.value ? "default" : "outline"}
            size="sm"
            onClick={() => setPeriod(p.value)}
            className="shrink-0"
          >
            {p.label}
          </Button>
        ))}
      </div>

      {/* Weekly Progress Summary - NEW */}
      <WeeklyProgressSummary
        currentWeight={data?.summary.currentWeight || null}
        startWeight={data?.summary.startWeight || null}
        weeklyChange={weeklyChange}
        exerciseDays={data?.summary.exerciseDays || 0}
        mealsLogged={data?.summary.totalMeals || 0}
        streakDays={data?.summary.daysTracked || 0}
        consistencyScore={data?.summary.consistencyScore || 0}
      />

      {/* Goal Progress */}
      {data?.goalProgress && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Goal Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span>Target: {data.goalProgress.targetWeight} kg</span>
                <span className="font-semibold">{data.goalProgress.percentComplete}% Complete</span>
              </div>
              <Progress value={data.goalProgress.percentComplete} className="h-3" />
              <div className="grid grid-cols-3 gap-4 text-center text-sm">
                <div>
                  <p className="font-semibold text-green-600">{data.goalProgress.actualLost} kg</p>
                  <p className="text-xs text-muted-foreground">Lost</p>
                </div>
                <div>
                  <p className="font-semibold">{data.goalProgress.remainingToLose} kg</p>
                  <p className="text-xs text-muted-foreground">Remaining</p>
                </div>
                <div>
                  <p className="font-semibold">{data.goalProgress.daysRemaining}</p>
                  <p className="text-xs text-muted-foreground">Days Left</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Weight Trend Chart - Juniper Style */}
      <div>
        <FullProgressChart
          data={data?.weightProgress.weeklyAverages || []}
          startingWeight={data?.summary.startWeight || undefined}
          targetWeight={data?.goalProgress?.targetWeight}
        />
        {/* View Tracking History Button - Juniper Style */}
        <ViewTrackingHistoryButton onClick={() => setShowHistory(true)} />
      </div>

      {/* Body Measurements - NEW */}
      <BodyMeasurements />

      {/* Progress Photos - NEW */}
      <ProgressPhotos />

      {/* Activity Summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Activity Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-muted/50 rounded-lg text-center">
              <Dumbbell className="w-5 h-5 mx-auto mb-2 text-blue-600" />
              <p className="text-xl font-bold">{data?.summary.exerciseDays || 0}</p>
              <p className="text-xs text-muted-foreground">Active Days</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg text-center">
              <Flame className="w-5 h-5 mx-auto mb-2 text-orange-600" />
              <p className="text-xl font-bold">{data?.summary.totalCaloriesBurned?.toLocaleString() || 0}</p>
              <p className="text-xs text-muted-foreground">Calories Burned</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg text-center">
              <Calendar className="w-5 h-5 mx-auto mb-2 text-teal-600" />
              <p className="text-xl font-bold">{data?.summary.totalMeals || 0}</p>
              <p className="text-xs text-muted-foreground">Meals Logged</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg text-center">
              <Flame className="w-5 h-5 mx-auto mb-2 text-amber-600" />
              <p className="text-xl font-bold">{data?.summary.avgDailyCalories || 0}</p>
              <p className="text-xs text-muted-foreground">Avg Daily Cal</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Well-being Trends */}
      {data?.checkInTrends && data.checkInTrends.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Well-being Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.checkInTrends.slice(-6).map((trend) => (
                <div key={trend.week} className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground w-16">Wk {trend.week}</span>
                  <div className="flex-1 grid grid-cols-4 gap-2">
                    <Badge variant="outline" className="justify-center text-xs">😊 {trend.feeling}</Badge>
                    <Badge variant="outline" className="justify-center text-xs">⚡ {trend.energy}</Badge>
                    <Badge variant="outline" className="justify-center text-xs">😴 {trend.sleep}</Badge>
                    <Badge variant="outline" className="justify-center text-xs">😤 {trend.stress}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tracking History Dialog */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5 text-emerald-600" />
              Weight Tracking History
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 pt-4">
            {data?.weightProgress.logs && data.weightProgress.logs.length > 0 ? (
              data.weightProgress.logs.slice().reverse().map((log, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    index === 0 ? 'bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800' : 'bg-muted/30'
                  }`}
                >
                  <div>
                    <p className="font-medium">{log.weight} kg</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(log.measuredAt).toLocaleDateString('en-AU', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {log.waistCircumference && (
                      <Badge variant="secondary" className="text-xs">
                        Waist: {log.waistCircumference} cm
                      </Badge>
                    )}
                    {index === 0 && (
                      <Badge className="bg-emerald-600">Latest</Badge>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Scale className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No weight entries yet</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
