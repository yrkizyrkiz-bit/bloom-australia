"use client";

import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import type { HealthScore } from "@/types";

interface HealthScoreCardProps {
  healthScore: HealthScore;
}

export function HealthScoreCard({ healthScore }: HealthScoreCardProps) {
  const { percentage, strokeDashoffset } = useMemo(() => {
    const circumference = 2 * Math.PI * 85;
    const perc = healthScore.overall;
    const offset = circumference - (perc / 100) * circumference;
    return { percentage: perc, strokeDashoffset: offset };
  }, [healthScore.overall]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    if (score >= 40) return "text-orange-500";
    return "text-red-500";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Fair";
    return "Needs Attention";
  };

  return (
    <Card className="overflow-hidden">
      <div className="bg-gradient-to-br from-primary to-primary/80 p-6 text-white">
        <h3 className="text-sm font-medium uppercase tracking-wider opacity-80">
          Health Score
        </h3>
        <p className="text-xs opacity-60 mt-1">
          Based on {healthScore.categories.reduce((acc, c) => acc + c.optimal + c.normal + c.outOfRange, 0)} biomarkers
        </p>
      </div>
      <CardContent className="pt-6 pb-8">
        <div className="flex flex-col items-center">
          {/* Circular Progress */}
          <div className="relative w-48 h-48">
            <svg className="w-full h-full" viewBox="0 0 200 200">
              {/* Background circle */}
              <circle
                cx="100"
                cy="100"
                r="85"
                fill="none"
                stroke="currentColor"
                strokeWidth="12"
                className="text-muted/30"
              />
              {/* Progress circle */}
              <circle
                cx="100"
                cy="100"
                r="85"
                fill="none"
                stroke="currentColor"
                strokeWidth="12"
                strokeDasharray={2 * Math.PI * 85}
                strokeDashoffset={strokeDashoffset}
                className={`health-score-ring ${getScoreColor(percentage)}`}
              />
            </svg>
            {/* Score text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-5xl font-serif font-bold ${getScoreColor(percentage)}`}>
                {percentage}
              </span>
              <span className="text-sm text-muted-foreground mt-1">out of 100</span>
            </div>
          </div>

          {/* Score Label */}
          <div className="mt-4 text-center">
            <span className={`text-lg font-medium ${getScoreColor(percentage)}`}>
              {getScoreLabel(percentage)}
            </span>
            <p className="text-sm text-muted-foreground mt-1">
              Keep optimizing for better results
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
