"use client";

import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingDown, TrendingUp, Flame, Award, Target,
  Sparkles, Heart, Zap, Star, CheckCircle2
} from "lucide-react";

interface WeeklySummaryProps {
  currentWeight: number | null;
  startWeight: number | null;
  weeklyChange: number;
  exerciseDays: number;
  mealsLogged: number;
  streakDays: number;
  consistencyScore: number;
}

interface Insight {
  icon: React.ReactNode;
  title: string;
  message: string;
  type: "success" | "encourage" | "tip";
}

function generateInsights(data: WeeklySummaryProps): Insight[] {
  const insights: Insight[] = [];

  if (data.weeklyChange < 0) {
    if (data.weeklyChange <= -0.5) {
      insights.push({
        icon: <Star className="w-5 h-5 text-amber-500" />,
        title: "Amazing Progress!",
        message: `You've lost ${Math.abs(data.weeklyChange).toFixed(1)} kg this week. Keep it up!`,
        type: "success"
      });
    } else {
      insights.push({
        icon: <TrendingDown className="w-5 h-5 text-emerald-500" />,
        title: "Steady Progress",
        message: `Down ${Math.abs(data.weeklyChange).toFixed(1)} kg. Slow and steady wins!`,
        type: "success"
      });
    }
  } else if (data.weeklyChange > 0) {
    insights.push({
      icon: <Heart className="w-5 h-5 text-rose-500" />,
      title: "Be Kind to Yourself",
      message: "Weight fluctuates naturally. Focus on healthy habits.",
      type: "encourage"
    });
  }

  if (data.exerciseDays >= 5) {
    insights.push({
      icon: <Flame className="w-5 h-5 text-orange-500" />,
      title: "Exercise Champion!",
      message: `${data.exerciseDays} active days! Your dedication is inspiring.`,
      type: "success"
    });
  } else if (data.exerciseDays >= 3) {
    insights.push({
      icon: <Zap className="w-5 h-5 text-yellow-500" />,
      title: "Great Activity",
      message: `${data.exerciseDays} workout days. Building great habits!`,
      type: "success"
    });
  }

  if (data.consistencyScore >= 80) {
    insights.push({
      icon: <Award className="w-5 h-5 text-violet-500" />,
      title: "Super Consistent!",
      message: `${data.consistencyScore}% consistency. You're crushing it!`,
      type: "success"
    });
  }

  if (data.streakDays >= 7) {
    insights.push({
      icon: <Sparkles className="w-5 h-5 text-amber-500" />,
      title: `${data.streakDays} Day Streak!`,
      message: "Consistency is the key to lasting results.",
      type: "success"
    });
  }

  if (insights.length === 0) {
    insights.push({
      icon: <Heart className="w-5 h-5 text-rose-500" />,
      title: "You're Doing Great",
      message: "Every healthy choice matters. Keep going!",
      type: "encourage"
    });
  }

  return insights.slice(0, 3);
}

export function WeeklyProgressSummary({
  currentWeight,
  startWeight,
  weeklyChange,
  exerciseDays,
  mealsLogged,
  streakDays,
  consistencyScore,
}: WeeklySummaryProps) {
  const insights = useMemo(() => generateInsights({
    currentWeight, startWeight, weeklyChange, exerciseDays, mealsLogged, streakDays, consistencyScore,
  }), [currentWeight, startWeight, weeklyChange, exerciseDays, mealsLogged, streakDays, consistencyScore]);

  const totalChange = startWeight && currentWeight ? currentWeight - startWeight : 0;
  const isLoss = totalChange <= 0;

  return (
    <Card className="overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white border-0">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">This Week</p>
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              Your Progress
            </h3>
          </div>
          <Badge className={`${isLoss ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'} border-0`}>
            {isLoss ? <TrendingDown className="w-3 h-3 mr-1" /> : <TrendingUp className="w-3 h-3 mr-1" />}
            {Math.abs(totalChange).toFixed(1)} kg total
          </Badge>
        </div>

        <div className="grid grid-cols-4 gap-3 mb-5">
          <div className="text-center p-3 bg-white/5 rounded-xl">
            <p className={`text-lg font-bold ${weeklyChange <= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {weeklyChange > 0 ? '+' : ''}{weeklyChange.toFixed(1)}
            </p>
            <p className="text-[10px] text-slate-400">This Week</p>
          </div>
          <div className="text-center p-3 bg-white/5 rounded-xl">
            <p className="text-lg font-bold text-orange-400">{exerciseDays}</p>
            <p className="text-[10px] text-slate-400">Active Days</p>
          </div>
          <div className="text-center p-3 bg-white/5 rounded-xl">
            <p className="text-lg font-bold text-violet-400">{mealsLogged}</p>
            <p className="text-[10px] text-slate-400">Meals</p>
          </div>
          <div className="text-center p-3 bg-white/5 rounded-xl">
            <p className="text-lg font-bold text-amber-400">{streakDays}</p>
            <p className="text-[10px] text-slate-400">Streak</p>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-xs text-slate-400 uppercase tracking-wider">Insights for You</p>
          {insights.map((insight, index) => (
            <div
              key={index}
              className={`flex items-start gap-3 p-3 rounded-xl ${
                insight.type === "success" ? "bg-emerald-500/10 border border-emerald-500/20"
                : insight.type === "encourage" ? "bg-rose-500/10 border border-rose-500/20"
                : "bg-blue-500/10 border border-blue-500/20"
              }`}
            >
              <div className="shrink-0 mt-0.5">{insight.icon}</div>
              <div>
                <p className="font-medium text-sm">{insight.title}</p>
                <p className="text-xs text-slate-300 mt-0.5">{insight.message}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
