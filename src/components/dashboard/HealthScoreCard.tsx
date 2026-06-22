"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Hourglass, Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { EntitlementState } from "@/lib/membership/biomarker-readiness";
import type { HealthScore } from "@/types";

interface HealthScoreCardProps {
  healthScore: HealthScore;
  /** When set, replaces the numeric score with a portal insight state. */
  insightState?: EntitlementState | null;
}

export function HealthScoreCard({ healthScore, insightState }: HealthScoreCardProps) {
  const { percentage, strokeDashoffset } = useMemo(() => {
    const circumference = 2 * Math.PI * 85;
    const perc = healthScore.overall;
    const offset = circumference - (perc / 100) * circumference;
    return { percentage: perc, strokeDashoffset: offset };
  }, [healthScore.overall]);

  if (insightState && insightState !== "ready") {
    return (
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-br from-primary to-primary/80 p-4 text-white sm:p-6">
          <h3 className="text-sm font-medium uppercase tracking-wider opacity-80">
            Health Score
          </h3>
          <p className="mt-1 text-xs opacity-60">Whole-body wellness index</p>
        </div>
        <CardContent className="flex flex-col items-center px-6 pb-8 pt-10 text-center">
          {insightState === "pending_results" ? (
            <>
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-50">
                <Hourglass className="h-8 w-8 text-sky-600" />
              </div>
              <p className="text-lg font-medium text-foreground">Pending results</p>
              <p className="mt-2 max-w-xs text-sm text-muted-foreground">
                Your lab results are being processed. Your Health Score will appear once biomarkers
                are available.
              </p>
            </>
          ) : insightState === "locked_upgrade" ? (
            <>
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-50">
                <Lock className="h-8 w-8 text-violet-600" />
              </div>
              <p className="text-lg font-medium text-foreground">Health Score</p>
              <p className="mt-2 max-w-xs text-sm text-muted-foreground">
                Add Organ Care or a Complete Health plan to unlock your whole-body Health Score.
              </p>
              <Button asChild variant="outline" size="sm" className="mt-6">
                <Link href="/dashboard/biomarkers/quiz">View options</Link>
              </Button>
            </>
          ) : (
            <>
              <p className="text-lg font-medium text-foreground">Health Score unavailable</p>
              <p className="mt-2 max-w-xs text-sm text-muted-foreground">
                More biomarker coverage is needed before your Health Score can be calculated.
              </p>
            </>
          )}
        </CardContent>
      </Card>
    );
  }

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
      <div className="bg-gradient-to-br from-primary to-primary/80 p-4 text-white sm:p-6">
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
          <div className="relative h-36 w-36 sm:h-48 sm:w-48">
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
              <span className={`text-4xl font-serif font-bold sm:text-5xl ${getScoreColor(percentage)}`}>
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
