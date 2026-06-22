"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Zap, Sun, Moon, Dumbbell, Brain,
  Droplets, Utensils, ChevronRight, CheckCircle2,
  TrendingUp, Flame, Target, Play, Sparkles, Shield, Lock, Loader2
} from "lucide-react";
import Link from "next/link";
import { usePortalContext } from "@/hooks/usePortalContext";
import { isProgramEntitled } from "@/lib/membership/program-access";
import { MEMBER_PROGRAMS_HOME } from "@/lib/portal/member-home";
import { ProgramSubscriptionGate } from "@/components/portal/ProgramSubscriptionGate";
import {
  loadVitalityCheckIns,
  getTodayVitalityCheckIn,
  computeVitalityStreak,
  computeWeeklyEnergyAverage,
  buildWeeklyEnergySeries,
  countCompletedHabits,
  type VitalityCheckIn,
} from "@/lib/mens-health/vitality-check-ins";

export default function VitalityPage() {
  const { data: portal, isLoading: portalLoading } = usePortalContext();
  const vitalityEntitled = isProgramEntitled(portal?.membership, "MENS_HEALTH_VITALITY");

  const [checkIns, setCheckIns] = useState<VitalityCheckIn[]>([]);
  const [todayCheckIn, setTodayCheckIn] = useState<VitalityCheckIn | null>(null);

  useEffect(() => {
    const saved = loadVitalityCheckIns();
    setCheckIns(saved);
    setTodayCheckIn(getTodayVitalityCheckIn(saved));
  }, []);

  const energyLevel = todayCheckIn?.energy ?? 0;
  const weeklyAverage = computeWeeklyEnergyAverage(checkIns);
  const streak = computeVitalityStreak(checkIns);
  const weeklyData = useMemo(() => buildWeeklyEnergySeries(checkIns), [checkIns]);
  const habitsCompleted = countCompletedHabits(todayCheckIn);
  const hasCheckInData = checkIns.length > 0;

  const habits = useMemo(
    () => [
      {
        id: "exercise",
        label: "30min Exercise",
        icon: Dumbbell,
        completed: todayCheckIn?.exercise ?? false,
        color: "text-blue-600",
      },
      {
        id: "sleep",
        label: "7+ hrs Sleep",
        icon: Moon,
        completed: (todayCheckIn?.sleep ?? 0) >= 7,
        color: "text-indigo-600",
      },
      {
        id: "hydration",
        label: "8 Glasses Water",
        icon: Droplets,
        completed: (todayCheckIn?.hydration ?? 0) >= 8,
        color: "text-cyan-600",
      },
      {
        id: "nutrition",
        label: "Balanced Mood",
        icon: Utensils,
        completed: (todayCheckIn?.mood ?? 0) >= 6,
        color: "text-green-600",
      },
    ],
    [todayCheckIn]
  );

  if (portalLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (!vitalityEntitled) {
    return (
      <div className="space-y-6 pb-20 md:pb-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/mens-health">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold">
              <Zap className="h-6 w-6 text-amber-500" />
              Daily Vitality
            </h1>
            <p className="text-muted-foreground">Energy, wellness & testosterone support</p>
          </div>
        </div>

        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center px-6 py-12 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-50">
              <Lock className="h-8 w-8 text-violet-600" />
            </div>
            <p className="text-lg font-medium">Daily Vitality is not active yet</p>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Enrol in the Vitality program to track energy, habits, and wellness check-ins.
            </p>
            <Button asChild className="mt-6">
              <Link href={MEMBER_PROGRAMS_HOME}>Join program</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <ProgramSubscriptionGate programSlug="mens_health_vitality">
    <div className="space-y-6 pb-20 md:pb-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/mens-health">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Zap className="h-6 w-6 text-amber-500" />
            Daily Vitality
          </h1>
          <p className="text-muted-foreground">Energy, wellness & testosterone support</p>
        </div>
      </div>

      <Card className="overflow-hidden border-0 bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 text-white">
        <CardContent className="p-6">
          <div className="mb-6 flex items-start justify-between">
            <div>
              <p className="mb-1 text-sm uppercase tracking-wider text-amber-100">
                Today&apos;s Energy
              </p>
              {todayCheckIn ? (
                <div className="flex items-end gap-2">
                  <p className="text-5xl font-bold">{energyLevel}</p>
                  <p className="mb-1 text-xl text-amber-100">/100</p>
                </div>
              ) : (
                <p className="text-2xl font-semibold">No check-in yet</p>
              )}
            </div>
            <div className="text-right">
              {todayCheckIn ? (
                <Badge
                  className={`border-0 ${
                    energyLevel >= 70
                      ? "bg-green-500/20 text-green-100"
                      : "bg-amber-500/20 text-amber-100"
                  }`}
                >
                  {energyLevel >= 80 ? "Peak" : energyLevel >= 60 ? "Good" : "Building"}
                </Badge>
              ) : (
                <Badge className="border-0 bg-white/20 text-white">Pending</Badge>
              )}
              <p className="mt-2 text-xs text-amber-200">
                Weekly avg: {hasCheckInData ? `${weeklyAverage}%` : "—"}
              </p>
            </div>
          </div>

          {todayCheckIn ? (
            <div className="mb-4">
              <div className="mb-2 flex justify-between text-xs text-amber-200">
                <span>Low</span>
                <span>Optimal</span>
                <span>Peak</span>
              </div>
              <div className="relative h-4 overflow-hidden rounded-full bg-white/20">
                <div
                  className="h-full rounded-full bg-white transition-all"
                  style={{ width: `${energyLevel}%` }}
                />
              </div>
            </div>
          ) : (
            <p className="mb-4 text-sm text-amber-100">
              Complete your daily check-in to track energy and build your streak.
            </p>
          )}

          <div className="mt-4 flex h-12 items-end gap-1">
            {weeklyData.map((value, index) => (
              <div key={index} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className={`w-full rounded-t-sm ${
                    value > 0 ? (index === weeklyData.length - 1 ? "bg-white" : "bg-white/40") : "bg-white/10"
                  }`}
                  style={{ height: value > 0 ? `${(value / 100) * 100}%` : "8%" }}
                />
                <span className="text-[10px] text-amber-200">
                  {["M", "T", "W", "T", "F", "S", "S"][index]}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Link href="/dashboard/mens-health/vitality/check-in">
          <Card className="cursor-pointer overflow-hidden border-2 border-amber-200 transition-all hover:border-amber-400 hover:shadow-lg dark:border-amber-900">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600">
                  <CheckCircle2 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="font-semibold">{todayCheckIn ? "Update check-in" : "Check in"}</p>
                  <p className="text-xs text-muted-foreground">Log today</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/mens-health/vitality/history">
          <Card className="cursor-pointer overflow-hidden border-slate-200 transition-all hover:shadow-lg dark:border-slate-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
                  <TrendingUp className="h-6 w-6 text-slate-600 dark:text-slate-300" />
                </div>
                <div>
                  <p className="font-semibold">Trends</p>
                  <p className="text-xs text-muted-foreground">View history</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="p-4 text-center">
            <Flame className="mx-auto mb-1 h-5 w-5 text-orange-500" />
            <p className="text-xl font-bold">{streak || "—"}</p>
            <p className="text-[10px] text-muted-foreground">Day Streak</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="p-4 text-center">
            <Target className="mx-auto mb-1 h-5 w-5 text-teal-500" />
            <p className="text-xl font-bold">
              {todayCheckIn ? `${habitsCompleted}/4` : "—"}
            </p>
            <p className="text-[10px] text-muted-foreground">Habits Today</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="p-4 text-center">
            <Sun className="mx-auto mb-1 h-5 w-5 text-amber-500" />
            <p className="text-xl font-bold">
              {todayCheckIn ? `${todayCheckIn.sleep}h` : "—"}
            </p>
            <p className="text-[10px] text-muted-foreground">Sleep</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="h-5 w-5 text-amber-500" />
              Prescribed Supplements
            </CardTitle>
            <Link href="/dashboard/mens-health/treatment">
              <Button variant="ghost" size="sm" className="text-amber-600">
                Manage <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-dashed p-6 text-center text-muted-foreground">
            <Shield className="mx-auto mb-2 h-8 w-8" />
            <p className="font-medium">No supplements prescribed yet</p>
            <p className="mt-1 text-sm">
              Doctor-approved supplements will appear here once your treatment plan is active.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-amber-500" />
            Daily Wellness Habits
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!todayCheckIn ? (
            <div className="rounded-xl border border-dashed p-6 text-center text-muted-foreground">
              <p className="font-medium">Complete a check-in to track habits</p>
              <Link href="/dashboard/mens-health/vitality/check-in" className="mt-4 inline-block">
                <Button size="sm">Start check-in</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {habits.map((habit) => (
                <div
                  key={habit.id}
                  className={`flex items-center gap-3 rounded-xl border p-3 ${
                    habit.completed
                      ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/20"
                      : "border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900"
                  }`}
                >
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full ${
                      habit.completed
                        ? "bg-green-100 dark:bg-green-900/50"
                        : "bg-slate-200 dark:bg-slate-800"
                    }`}
                  >
                    <habit.icon
                      className={`h-5 w-5 ${habit.completed ? habit.color : "text-slate-400"}`}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className={`truncate text-sm font-medium ${
                        habit.completed ? "" : "text-muted-foreground"
                      }`}
                    >
                      {habit.label}
                    </p>
                    {habit.completed && (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 dark:border-amber-900 dark:from-amber-950/20 dark:to-orange-950/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/50">
              <Brain className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                Optimize Naturally
              </p>
              <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
                Compound exercises like squats and deadlifts can boost testosterone naturally.
                Aim for 3-4 strength sessions per week.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Play className="h-5 w-5 text-amber-500" />
              Learn & Optimize
            </CardTitle>
            <Link href="/dashboard/mens-health/learn">
              <Button variant="ghost" size="sm" className="text-amber-600">
                See all <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Link href="/dashboard/mens-health/learn/testosterone">
            <div className="flex cursor-pointer items-center gap-4 rounded-xl bg-slate-50 p-3 transition-colors hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/50">
                <Play className="h-5 w-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Natural Testosterone Optimization</p>
                <p className="text-xs text-muted-foreground">Evidence-based strategies</p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </Link>
        </CardContent>
      </Card>
    </div>
    </ProgramSubscriptionGate>
  );
}
