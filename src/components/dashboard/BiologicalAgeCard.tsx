"use client";

import { Card, CardContent } from "@/components/ui/card";
import type { HealthScore } from "@/types";

interface BiologicalAgeCardProps {
  healthScore: HealthScore;
}

export function BiologicalAgeCard({ healthScore }: BiologicalAgeCardProps) {
  // Round to whole number to avoid floating point imprecision
  const ageDifference = Math.round((healthScore.chronologicalAge || 0) - (healthScore.biologicalAge || 0));
  const isYounger = ageDifference > 0;

  return (
    <Card className="overflow-hidden">
      <div className="bg-gradient-to-br from-accent to-accent/80 p-6 text-white relative overflow-hidden">
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
            <span className="text-6xl font-serif font-bold text-foreground">
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
