"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import {
  ArrowLeft, Zap, Battery, Sun, Moon, Dumbbell, Brain,
  Droplets, Utensils, Clock, ChevronRight, CheckCircle2,
  TrendingUp, Flame, Target, Play, Sparkles, Heart, Shield
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface DailyCheckIn {
  date: string;
  energy: number;
  sleep: number;
  stress: number;
  mood: number;
  exercise: boolean;
  supplements: boolean;
  hydration: number;
}

export default function VitalityPage() {
  const [todayCheckIn, setTodayCheckIn] = useState<DailyCheckIn | null>(null);
  const [checkIns, setCheckIns] = useState<DailyCheckIn[]>([]);
  const [energyLevel, setEnergyLevel] = useState(70);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("vitalityCheckIns");
    if (saved) {
      const data = JSON.parse(saved);
      setCheckIns(data);

      // Check if today already has a check-in
      const today = new Date().toDateString();
      const todayData = data.find((c: DailyCheckIn) => new Date(c.date).toDateString() === today);
      if (todayData) {
        setTodayCheckIn(todayData);
        setEnergyLevel(todayData.energy);
      }
    }
  }, []);

  // Calculate weekly average
  const weeklyAverage = checkIns.length > 0
    ? Math.round(checkIns.slice(-7).reduce((sum, c) => sum + c.energy, 0) / Math.min(checkIns.length, 7))
    : 0;

  // Streak calculation
  const streak = checkIns.length > 0 ? Math.min(checkIns.length, 14) : 0;

  // Vitality supplements
  const supplements = [
    { name: "Vitamin D3", dosage: "4000 IU", time: "Morning", taken: true, benefit: "Immune & bone health" },
    { name: "Zinc", dosage: "30mg", time: "Evening", taken: false, benefit: "Testosterone support" },
    { name: "Magnesium", dosage: "400mg", time: "Evening", taken: false, benefit: "Sleep & recovery" },
    { name: "Ashwagandha", dosage: "600mg", time: "Morning", taken: true, benefit: "Stress & energy" },
  ];

  // Wellness habits
  const habits = [
    { id: "exercise", label: "30min Exercise", icon: Dumbbell, completed: true, color: "text-blue-600" },
    { id: "sleep", label: "7+ hrs Sleep", icon: Moon, completed: true, color: "text-indigo-600" },
    { id: "hydration", label: "8 Glasses Water", icon: Droplets, completed: false, color: "text-cyan-600" },
    { id: "nutrition", label: "Balanced Meals", icon: Utensils, completed: true, color: "text-green-600" },
  ];

  // Weekly energy data for mini chart
  const weeklyData = [65, 72, 68, 80, 75, 82, energyLevel];

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/mens-health">
          <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="w-6 h-6 text-amber-500" />
            Daily Vitality
          </h1>
          <p className="text-muted-foreground">Energy, wellness & testosterone support</p>
        </div>
      </div>

      {/* Energy Score Card */}
      <Card className="overflow-hidden bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 border-0 text-white">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-amber-100 text-sm uppercase tracking-wider mb-1">Today&apos;s Energy</p>
              <div className="flex items-end gap-2">
                <p className="text-5xl font-bold">{energyLevel}</p>
                <p className="text-xl text-amber-100 mb-1">/100</p>
              </div>
            </div>
            <div className="text-right">
              <Badge className={`${energyLevel >= 70 ? 'bg-green-500/20 text-green-100' : 'bg-amber-500/20 text-amber-100'} border-0`}>
                {energyLevel >= 80 ? 'Peak' : energyLevel >= 60 ? 'Good' : 'Building'}
              </Badge>
              <p className="text-amber-200 text-xs mt-2">
                Weekly avg: {weeklyAverage}%
              </p>
            </div>
          </div>

          {/* Energy Level Slider */}
          <div className="mb-4">
            <div className="flex justify-between text-xs text-amber-200 mb-2">
              <span>Low</span>
              <span>Optimal</span>
              <span>Peak</span>
            </div>
            <div className="relative h-4 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all"
                style={{ width: `${energyLevel}%` }}
              />
            </div>
          </div>

          {/* Mini Weekly Chart */}
          <div className="flex items-end gap-1 h-12 mt-4">
            {weeklyData.map((value, index) => (
              <div key={index} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className={`w-full rounded-t-sm ${index === weeklyData.length - 1 ? 'bg-white' : 'bg-white/40'}`}
                  style={{ height: `${(value / 100) * 100}%` }}
                />
                <span className="text-[10px] text-amber-200">
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'][index]}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/dashboard/mens-health/vitality/check-in">
          <Card className="overflow-hidden hover:shadow-lg transition-all cursor-pointer group border-2 border-amber-200 dark:border-amber-900 hover:border-amber-400">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                  <CheckCircle2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-semibold">Check In</p>
                  <p className="text-xs text-muted-foreground">Log today</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/mens-health/vitality/history">
          <Card className="overflow-hidden hover:shadow-lg transition-all cursor-pointer group border-slate-200 dark:border-slate-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                  <TrendingUp className="w-6 h-6 text-slate-600 dark:text-slate-300" />
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

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="p-4 text-center">
            <Flame className="w-5 h-5 mx-auto mb-1 text-orange-500" />
            <p className="text-xl font-bold">{streak}</p>
            <p className="text-[10px] text-muted-foreground">Day Streak</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="p-4 text-center">
            <Target className="w-5 h-5 mx-auto mb-1 text-teal-500" />
            <p className="text-xl font-bold">3/4</p>
            <p className="text-[10px] text-muted-foreground">Habits Today</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="p-4 text-center">
            <Shield className="w-5 h-5 mx-auto mb-1 text-violet-500" />
            <p className="text-xl font-bold">2/4</p>
            <p className="text-[10px] text-muted-foreground">Supplements</p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Supplements */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="w-5 h-5 text-amber-500" />
              Today&apos;s Supplements
            </CardTitle>
            <Link href="/dashboard/mens-health/treatment">
              <Button variant="ghost" size="sm" className="text-amber-600">
                Manage <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {supplements.map((supplement, index) => (
            <div
              key={index}
              className={`flex items-center justify-between p-3 rounded-xl border ${
                supplement.taken
                  ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900'
                  : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  supplement.taken ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-700'
                }`}>
                  {supplement.taken ? (
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  ) : (
                    <Clock className="w-5 h-5 text-slate-500" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-sm">{supplement.name}</p>
                  <p className="text-xs text-muted-foreground">{supplement.dosage} • {supplement.time}</p>
                </div>
              </div>
              <div className="text-right">
                <Badge variant={supplement.taken ? "default" : "outline"} className={supplement.taken ? "bg-green-600" : ""}>
                  {supplement.taken ? "Taken" : supplement.time}
                </Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Daily Habits */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            Daily Wellness Habits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {habits.map((habit) => (
              <div
                key={habit.id}
                className={`flex items-center gap-3 p-3 rounded-xl border ${
                  habit.completed
                    ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900'
                    : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  habit.completed ? 'bg-green-100 dark:bg-green-900/50' : 'bg-slate-200 dark:bg-slate-800'
                }`}>
                  <habit.icon className={`w-5 h-5 ${habit.completed ? habit.color : 'text-slate-400'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${habit.completed ? '' : 'text-muted-foreground'}`}>
                    {habit.label}
                  </p>
                  {habit.completed && (
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Testosterone Support Tips */}
      <Card className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200 dark:border-amber-900">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center shrink-0">
              <Brain className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="font-semibold text-sm text-amber-900 dark:text-amber-100">Optimize Naturally</p>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                Compound exercises like squats and deadlifts can boost testosterone naturally. Aim for 3-4 strength sessions per week.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Learn Section */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Play className="w-5 h-5 text-amber-500" />
              Learn & Optimize
            </CardTitle>
            <Link href="/dashboard/mens-health/learn">
              <Button variant="ghost" size="sm" className="text-amber-600">
                See all <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Link href="/dashboard/mens-health/learn/testosterone">
            <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
              <div className="w-12 h-12 rounded-lg bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center shrink-0">
                <Play className="w-5 h-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">Natural Testosterone Optimization</p>
                <p className="text-xs text-muted-foreground">Evidence-based strategies</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </Link>
          <Link href="/dashboard/mens-health/learn/sleep-energy">
            <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
              <div className="w-12 h-12 rounded-lg bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center shrink-0">
                <Play className="w-5 h-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">Sleep & Energy Connection</p>
                <p className="text-xs text-muted-foreground">Maximize recovery</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
