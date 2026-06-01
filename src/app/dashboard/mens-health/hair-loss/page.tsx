"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft, Camera, TrendingUp, Pill, Calendar, ChevronRight,
  Sparkles, Clock, CheckCircle2, AlertCircle, Play, Award,
  Lightbulb, Target, BarChart3, ArrowUpRight, ArrowDownRight
} from "lucide-react";
import Link from "next/link";

// Mock data for hair progress
const mockProgressData = {
  currentDay: 45,
  totalDays: 365,
  startDate: "2024-01-01",
  treatmentAdherence: 92,
  photosLogged: 6,
  nextMilestone: 90,
};

export default function HairLossPage() {
  const [progressData, setProgressData] = useState(mockProgressData);

  // Treatment timeline milestones
  const milestones = [
    { day: 30, label: "Initial Phase", description: "Treatment adapting", reached: progressData.currentDay >= 30 },
    { day: 90, label: "Early Results", description: "Shedding may slow", reached: progressData.currentDay >= 90 },
    { day: 180, label: "Visible Progress", description: "New growth visible", reached: progressData.currentDay >= 180 },
    { day: 365, label: "Full Results", description: "Maximum benefit", reached: progressData.currentDay >= 365 },
  ];

  // Quick stats
  const stats = [
    { label: "Days on Treatment", value: progressData.currentDay, icon: Calendar, color: "text-violet-600" },
    { label: "Adherence Rate", value: `${progressData.treatmentAdherence}%`, icon: CheckCircle2, color: "text-green-600" },
    { label: "Photos Logged", value: progressData.photosLogged, icon: Camera, color: "text-blue-600" },
    { label: "Next Milestone", value: `Day ${progressData.nextMilestone}`, icon: Target, color: "text-amber-600" },
  ];

  // Current treatments
  const treatments = [
    {
      name: "Finasteride 1mg",
      type: "Oral",
      frequency: "Daily",
      status: "active",
      adherence: 95,
      daysRemaining: 25,
    },
    {
      name: "Minoxidil 5%",
      type: "Topical",
      frequency: "Twice daily",
      status: "active",
      adherence: 88,
      daysRemaining: 18,
    },
  ];

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/mens-health">
          <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-violet-600" />
            Hair Restoration
          </h1>
          <p className="text-muted-foreground">Track your progress & manage treatment</p>
        </div>
      </div>

      {/* Progress Overview Card */}
      <Card className="overflow-hidden bg-gradient-to-br from-violet-900 via-purple-900 to-slate-900 border-0 text-white">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-violet-300 text-sm uppercase tracking-wider mb-1">Your Journey</p>
              <p className="text-4xl font-bold">Day {progressData.currentDay}</p>
              <p className="text-violet-200 text-sm mt-1">of your hair restoration journey</p>
            </div>
            <div className="text-right">
              <Badge className="bg-green-500/20 text-green-300 border-0">
                <CheckCircle2 className="w-3 h-3 mr-1" /> On Track
              </Badge>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-xs text-violet-300 mb-2">
              <span>Progress to full results</span>
              <span>{Math.round((progressData.currentDay / 365) * 100)}%</span>
            </div>
            <div className="h-3 bg-violet-950 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-violet-500 to-purple-400 rounded-full transition-all"
                style={{ width: `${(progressData.currentDay / 365) * 100}%` }}
              />
            </div>
          </div>

          {/* Milestone Markers */}
          <div className="flex justify-between mt-4">
            {milestones.map((milestone, index) => (
              <div key={index} className="text-center">
                <div className={`w-8 h-8 rounded-full mx-auto mb-1 flex items-center justify-center text-xs font-bold ${
                  milestone.reached
                    ? 'bg-violet-500 text-white'
                    : 'bg-violet-950 text-violet-400 border border-violet-700'
                }`}>
                  {milestone.reached ? <CheckCircle2 className="w-4 h-4" /> : milestone.day}
                </div>
                <p className={`text-[10px] ${milestone.reached ? 'text-violet-200' : 'text-violet-400'}`}>
                  {milestone.label}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/dashboard/mens-health/hair-loss/track">
          <Card className="overflow-hidden hover:shadow-lg transition-all cursor-pointer group border-2 border-violet-200 dark:border-violet-900 hover:border-violet-400">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Camera className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-semibold">Log Progress</p>
                  <p className="text-xs text-muted-foreground">Take a photo</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/mens-health/hair-loss/compare">
          <Card className="overflow-hidden hover:shadow-lg transition-all cursor-pointer group border-slate-200 dark:border-slate-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                  <BarChart3 className="w-6 h-6 text-slate-600 dark:text-slate-300" />
                </div>
                <div>
                  <p className="font-semibold">Compare</p>
                  <p className="text-xs text-muted-foreground">Before & after</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((stat, index) => (
          <Card key={index} className="border-slate-200 dark:border-slate-800">
            <CardContent className="p-4 text-center">
              <stat.icon className={`w-5 h-5 mx-auto mb-2 ${stat.color}`} />
              <p className="text-xl font-bold">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Current Treatments */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Pill className="w-5 h-5 text-violet-600" />
              Active Treatments
            </CardTitle>
            <Link href="/dashboard/mens-health/treatment">
              <Button variant="ghost" size="sm" className="text-violet-600">
                Manage <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {treatments.map((treatment, index) => (
            <div
              key={index}
              className="p-4 rounded-xl bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-900"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold">{treatment.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">{treatment.type}</Badge>
                    <span className="text-xs text-muted-foreground">{treatment.frequency}</span>
                  </div>
                </div>
                <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  Active
                </Badge>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Adherence</span>
                  <span className="font-medium">{treatment.adherence}%</span>
                </div>
                <Progress value={treatment.adherence} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {treatment.daysRemaining} days until refill
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Expected Timeline */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-violet-600" />
            What to Expect
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { period: "Month 1-3", title: "Initial Phase", description: "Some may experience temporary shedding as weak hairs make room for stronger ones.", icon: "🌱" },
              { period: "Month 3-6", title: "Stabilization", description: "Hair loss slows significantly. New baby hairs may start appearing.", icon: "🌿" },
              { period: "Month 6-12", title: "Visible Growth", description: "Noticeable improvement in hair density and thickness.", icon: "🌳" },
              { period: "Month 12+", title: "Maintenance", description: "Continue treatment to maintain results. Full benefits achieved.", icon: "✨" },
            ].map((phase, index) => (
              <div
                key={index}
                className={`flex gap-4 p-3 rounded-xl transition-colors ${
                  progressData.currentDay >= (index + 1) * 90
                    ? 'bg-violet-50 dark:bg-violet-950/20'
                    : 'bg-slate-50 dark:bg-slate-900/50'
                }`}
              >
                <div className="text-2xl">{phase.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm">{phase.title}</span>
                    <Badge variant="outline" className="text-xs">{phase.period}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{phase.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pro Tips */}
      <Card className="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/20 dark:to-purple-950/20 border-violet-200 dark:border-violet-900">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center shrink-0">
              <Lightbulb className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <p className="font-semibold text-sm text-violet-900 dark:text-violet-100">Pro Tip</p>
              <p className="text-sm text-violet-700 dark:text-violet-300 mt-1">
                Take your progress photos at the same time of day, in the same lighting and position for accurate comparisons.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Learn More */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Play className="w-5 h-5 text-violet-600" />
            Understanding Hair Loss
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Link href="/dashboard/mens-health/learn/dht">
            <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
              <div className="w-12 h-12 rounded-lg bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center shrink-0">
                <Play className="w-5 h-5 text-violet-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">How DHT Causes Hair Loss</p>
                <p className="text-xs text-muted-foreground">5 min read</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </Link>
          <Link href="/dashboard/mens-health/learn/finasteride">
            <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
              <div className="w-12 h-12 rounded-lg bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center shrink-0">
                <Play className="w-5 h-5 text-violet-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">Finasteride: How It Works</p>
                <p className="text-xs text-muted-foreground">4 min read</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
