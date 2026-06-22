"use client";

import Link from "next/link";
import { Hourglass, Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { EntitlementState } from "@/lib/membership/biomarker-readiness";
import type { HealthScore } from "@/types";

interface BiologicalAgeCardProps {
  healthScore: HealthScore;
  /** When set, replaces the numeric age with a portal insight state. */
  insightState?: EntitlementState | null;
}

export function BiologicalAgeCard({ healthScore, insightState }: BiologicalAgeCardProps) {
  if (insightState && insightState !== "ready") {
    return (
      <Card className="overflow-hidden">
        <div className="relative overflow-hidden bg-gradient-to-br from-accent to-accent/80 p-4 text-white sm:p-6">
          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
          <h3 className="text-sm font-medium uppercase tracking-wider opacity-80">
            Biological Age
          </h3>
          <p className="mt-1 text-xs opacity-60">vs. chronological age</p>
        </div>
        <CardContent className="flex flex-col items-center px-6 pb-8 pt-10 text-center">
          {insightState === "pending_results" ? (
            <>
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-50">
                <Hourglass className="h-8 w-8 text-sky-600" />
              </div>
              <p className="text-lg font-medium text-foreground">Pending results</p>
              <p className="mt-2 max-w-xs text-sm text-muted-foreground">
                Your Biological Age will be calculated once your biomarker panel results are in.
              </p>
            </>
          ) : insightState === "locked_upgrade" ? (
            <>
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-50">
                <Lock className="h-8 w-8 text-violet-600" />
              </div>
              <p className="text-lg font-medium text-foreground">Biological Age</p>
              <p className="mt-2 max-w-xs text-sm text-muted-foreground">
                Subscribe to a biomarker panel to unlock your Biological Age estimate.
              </p>
              <Button asChild variant="outline" size="sm" className="mt-6">
                <Link href="/dashboard/biomarkers/quiz">Get tested</Link>
              </Button>
            </>
          ) : (
            <>
              <p className="text-lg font-medium text-foreground">Biological Age unavailable</p>
              <p className="mt-2 max-w-xs text-sm text-muted-foreground">
                More biomarker coverage is needed before your Biological Age can be estimated.
              </p>
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  // Round to whole number to avoid floating point imprecision
  const ageDifference = Math.round((healthScore.chronologicalAge || 0) - (healthScore.biologicalAge || 0));
  const isYounger = ageDifference > 0;

  return (
    <Card className="overflow-hidden">
      <div className="bg-gradient-to-br from-accent to-accent/80 p-4 text-white relative overflow-hidden sm:p-6">
        {/* Decorative blur */}
        <div className="absolute -right-10 -top-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />

        <h3 className="text-sm font-medium uppercase tracking-wider opacity-80">
          Biological Age
        </h3>
        <p className="text-xs opacity-60 mt-1">
          vs. chronological age
        </p>
      </div>
      <CardContent className="pt-6 pb-8">
        <div className="flex flex-col items-center">
          {/* Age Display */}
          <div className="text-center">
            <span className="text-5xl font-serif font-bold text-foreground sm:text-6xl">
              {healthScore.biologicalAge}
            </span>
            <span className="text-lg text-muted-foreground ml-1">years</span>
          </div>

          {/* Comparison */}
          <div className="mt-6 text-center">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
              isYounger
                ? "bg-green-500/10 text-green-600"
                : "bg-orange-500/10 text-orange-600"
            }`}>
              <span className="font-semibold">
                {Math.abs(ageDifference)} years {isYounger ? "younger" : "older"}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              than your chronological age of {healthScore.chronologicalAge}
            </p>
          </div>

          {/* Visual comparison bar */}
          <div className="w-full mt-6 space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Biological</span>
              <span>Chronological</span>
            </div>
            <div className="relative h-3 bg-muted rounded-full overflow-hidden">
              <div
                className="absolute left-0 top-0 h-full bg-gradient-to-r from-primary to-primary/70 rounded-full"
                style={{ width: `${(healthScore.biologicalAge / healthScore.chronologicalAge) * 100}%` }}
              />
              <div
                className="absolute top-0 h-full w-0.5 bg-foreground"
                style={{ left: `${100}%`, transform: 'translateX(-100%)' }}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
