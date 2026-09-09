"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { ORGAN_METABOLIC_HEALTH_PANELS } from "@/components/dashboard/OrganMetabolicHealthPanels";

const ORGAN_SHORTCUTS = ["Liver", "Heart", "Kidney"] as const;

interface BiomarkerSummaryCardProps {
  optimal: number;
  normal: number;
  outOfRange: number;
  lastUpdated: string;
}

export function BiomarkerSummaryCard({ optimal, normal, outOfRange, lastUpdated }: BiomarkerSummaryCardProps) {
  const total = optimal + normal + outOfRange;
  const organShortcuts = ORGAN_SHORTCUTS.flatMap((label) => {
    const panel = ORGAN_METABOLIC_HEALTH_PANELS.find((p) => p.label === label);
    return panel ? [panel] : [];
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium">Results Summary</CardTitle>
          <span className="text-xs text-muted-foreground">
            As of {new Date(lastUpdated).toLocaleDateString('en-AU', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            })}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
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
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Overall Status</span>
            <span className="font-medium">{total} biomarkers tested</span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden flex">
            <div
              className="h-full bg-green-500 transition-all"
              style={{ width: `${(optimal / total) * 100}%` }}
            />
            <div
              className="h-full bg-yellow-500 transition-all"
              style={{ width: `${(normal / total) * 100}%` }}
            />
            <div
              className="h-full bg-orange-500 transition-all"
              style={{ width: `${(outOfRange / total) * 100}%` }}
            />
          </div>
        </div>

        {/* CTA */}
        <div className="space-y-3">
          <Link href="/dashboard/biomarkers">
            <Button variant="outline" className="w-full group">
              View all biomarkers
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>

          <div className="grid grid-cols-3 gap-2">
            {organShortcuts.map((panel) => {
              const Icon = panel.icon;
              return (
                <Link
                  key={panel.href}
                  href={panel.href}
                  className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-border bg-card p-2.5 transition-shadow hover:shadow-md"
                >
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${panel.color}15` }}
                  >
                    <Icon className="h-4 w-4" style={{ color: panel.color }} />
                  </div>
                  <span className="text-center text-[11px] leading-tight text-muted-foreground">
                    {panel.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
