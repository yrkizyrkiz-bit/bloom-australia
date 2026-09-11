"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Lock } from "lucide-react";
import Link from "next/link";
import { ORGAN_METABOLIC_HEALTH_PANELS } from "@/components/dashboard/OrganMetabolicHealthPanels";
import { cn } from "@/lib/utils";
import { ORGAN_CARE_CARD } from "@/lib/programs/catalog";

interface BiomarkerSummaryCardProps {
  optimal: number;
  normal: number;
  outOfRange: number;
  lastUpdated: string;
  organCareEntitled?: boolean;
}

export function BiomarkerSummaryCard({
  optimal,
  normal,
  outOfRange,
  lastUpdated,
  organCareEntitled = true,
}: BiomarkerSummaryCardProps) {
  const total = optimal + normal + outOfRange;

  return (
    <Card className="min-w-0 max-w-full overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex min-w-0 items-center justify-between gap-2">
          <CardTitle className="text-lg font-medium">Results Summary</CardTitle>
          <span className="shrink-0 text-xs text-muted-foreground">
            As of{" "}
            {new Date(lastUpdated).toLocaleDateString("en-AU", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
        </div>
      </CardHeader>
      <CardContent className="min-w-0 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 rounded-xl bg-green-500/10 border border-green-500/20">
            <div className="text-3xl font-serif font-bold text-green-600">{optimal}</div>
            <div className="text-xs text-green-600/80 mt-1">Optimal</div>
          </div>
          <div className="text-center p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
            <div className="text-3xl font-serif font-bold text-yellow-600">{normal}</div>
            <div className="text-xs text-yellow-600/80 mt-1">Normal</div>
          </div>
          <div className="text-center p-4 rounded-xl bg-orange-500/10 border border-orange-500/20">
            <div className="text-3xl font-serif font-bold text-orange-600">{outOfRange}</div>
            <div className="text-xs text-orange-600/80 mt-1">Out of Range</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm gap-2">
            <span className="text-muted-foreground">Overall Status</span>
            <span className="font-medium shrink-0">{total} biomarkers tested</span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden flex">
            <div
              className="h-full bg-green-500 transition-all"
              style={{ width: `${total ? (optimal / total) * 100 : 0}%` }}
            />
            <div
              className="h-full bg-yellow-500 transition-all"
              style={{ width: `${total ? (normal / total) * 100 : 0}%` }}
            />
            <div
              className="h-full bg-orange-500 transition-all"
              style={{ width: `${total ? (outOfRange / total) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* CTA + organ tiles (scroll inside card — do not widen the page) */}
        <div className="min-w-0 space-y-3">
          <Link href="/dashboard/biomarkers">
            <Button
              variant="outline"
              className="w-full group border-green-600 bg-green-600 text-white hover:border-green-700 hover:bg-green-700 hover:text-white"
            >
              View all biomarkers
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>

          <div className="min-w-0 max-w-full overflow-x-auto overscroll-x-contain pb-1">
            <div className="flex w-max gap-2">
              {ORGAN_METABOLIC_HEALTH_PANELS.map((panel) => {
                const Icon = panel.icon;
                const unlocked = organCareEntitled || panel.alwaysAvailable;
                const href = unlocked ? panel.href : ORGAN_CARE_CARD.quizRoute;
                return (
                  <Link
                    key={panel.href}
                    href={href}
                    title={
                      unlocked
                        ? panel.label
                        : "Add Organ Care to unlock these dashboards"
                    }
                    className={cn(
                      "flex w-[4.5rem] shrink-0 flex-col items-center justify-center gap-1.5 rounded-xl border border-border bg-card p-2.5 transition-shadow",
                      unlocked
                        ? "hover:shadow-md"
                        : "opacity-45 grayscale"
                    )}
                  >
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-lg"
                      style={{ backgroundColor: `${panel.color}15` }}
                    >
                      {unlocked ? (
                        <Icon className="h-4 w-4" style={{ color: panel.color }} />
                      ) : (
                        <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                    </div>
                    <span className="text-center text-[11px] leading-tight text-muted-foreground">
                      {panel.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
