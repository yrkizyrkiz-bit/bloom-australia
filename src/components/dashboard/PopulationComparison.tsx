"use client";

import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, TrendingUp, TrendingDown, Info } from "lucide-react";
import type { BiomarkerResult } from "@/types";
import { getBiomarkerById } from "@/data/biomarkers";

interface PopulationStats {
  biomarkerId: string;
  mean: number;
  median: number;
  p25: number;
  p75: number;
  p10: number;
  p90: number;
}

const populationStats: Record<string, PopulationStats> = {
  alt: { biomarkerId: "alt", mean: 28, median: 24, p25: 18, p75: 35, p10: 12, p90: 48 },
  ast: { biomarkerId: "ast", mean: 26, median: 23, p25: 17, p75: 32, p10: 12, p90: 42 },
  ggt: { biomarkerId: "ggt", mean: 32, median: 26, p25: 18, p75: 42, p10: 12, p90: 58 },
  glucose: { biomarkerId: "glucose", mean: 98, median: 94, p25: 85, p75: 108, p10: 78, p90: 118 },
  hba1c: { biomarkerId: "hba1c", mean: 5.6, median: 5.4, p25: 5.1, p75: 6.0, p10: 4.8, p90: 6.4 },
  insulin: { biomarkerId: "insulin", mean: 9.5, median: 8, p25: 5, p75: 14, p10: 3, p90: 20 },
  total_cholesterol: { biomarkerId: "total_cholesterol", mean: 198, median: 195, p25: 170, p75: 225, p10: 150, p90: 250 },
  triglycerides: { biomarkerId: "triglycerides", mean: 135, median: 120, p25: 85, p75: 175, p10: 60, p90: 220 },
  ldl_cholesterol: { biomarkerId: "ldl_cholesterol", mean: 115, median: 110, p25: 85, p75: 140, p10: 65, p90: 165 },
  hdl_cholesterol: { biomarkerId: "hdl_cholesterol", mean: 52, median: 50, p25: 42, p75: 62, p10: 35, p90: 75 },
  crp: { biomarkerId: "crp", mean: 2.1, median: 1.5, p25: 0.6, p75: 3.2, p10: 0.3, p90: 5.5 },
  ferritin: { biomarkerId: "ferritin", mean: 85, median: 70, p25: 40, p75: 120, p10: 25, p90: 180 },
  uric_acid: { biomarkerId: "uric_acid", mean: 5.8, median: 5.5, p25: 4.5, p75: 6.8, p10: 3.5, p90: 7.8 }
};

function calculatePercentile(value: number, stats: PopulationStats): number {
  if (value <= stats.p10) return 10;
  if (value <= stats.p25) return 10 + ((value - stats.p10) / (stats.p25 - stats.p10)) * 15;
  if (value <= stats.median) return 25 + ((value - stats.p25) / (stats.median - stats.p25)) * 25;
  if (value <= stats.p75) return 50 + ((value - stats.median) / (stats.p75 - stats.median)) * 25;
  if (value <= stats.p90) return 75 + ((value - stats.p75) / (stats.p90 - stats.p75)) * 15;
  return 90;
}

interface PopulationComparisonProps {
  results: BiomarkerResult[];
  gender: "male" | "female";
}

export function PopulationComparison({ results, gender }: PopulationComparisonProps) {
  const comparisons = useMemo(() => {
    return results
      .map(result => {
        const stats = populationStats[result.biomarkerId];
        const biomarker = getBiomarkerById(result.biomarkerId);
        if (!stats || !biomarker) return null;
        const percentile = calculatePercentile(result.value, stats);
        const range = biomarker.ranges[gender];
        const isOptimal = result.value >= range.optimal_low && result.value <= range.optimal_high;
        return { biomarkerId: result.biomarkerId, biomarker, result, stats, percentile: Math.round(percentile), isOptimal };
      })
      .filter(Boolean);
  }, [results, gender]);

  const topPerformers = comparisons.filter(c => c && c.percentile >= 70 && c.isOptimal).slice(0, 3);
  const needsWork = comparisons.filter(c => c && c.percentile <= 40 && !c.isOptimal).slice(0, 3);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          Population Comparison
        </CardTitle>
        <CardDescription>How your biomarkers compare to Australian averages</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-4 gap-3 text-center">
          <div className="p-2 rounded-lg bg-green-500/10">
            <p className="text-xl font-bold text-green-600">{comparisons.filter(c => c && c.percentile >= 75).length}</p>
            <p className="text-xs text-muted-foreground">Top 25%</p>
          </div>
          <div className="p-2 rounded-lg bg-blue-500/10">
            <p className="text-xl font-bold text-blue-600">{comparisons.filter(c => c && c.percentile >= 50 && c.percentile < 75).length}</p>
            <p className="text-xs text-muted-foreground">Above Avg</p>
          </div>
          <div className="p-2 rounded-lg bg-yellow-500/10">
            <p className="text-xl font-bold text-yellow-600">{comparisons.filter(c => c && c.percentile >= 25 && c.percentile < 50).length}</p>
            <p className="text-xs text-muted-foreground">Below Avg</p>
          </div>
          <div className="p-2 rounded-lg bg-orange-500/10">
            <p className="text-xl font-bold text-orange-600">{comparisons.filter(c => c && c.percentile < 25).length}</p>
            <p className="text-xs text-muted-foreground">Bottom 25%</p>
          </div>
        </div>

        {topPerformers.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-green-600" />Your Strengths</h4>
            <div className="space-y-2">
              {topPerformers.map(comp => comp && (
                <div key={comp.biomarkerId} className="flex items-center gap-3 p-2 rounded-lg bg-green-50 dark:bg-green-950/20">
                  <span className="font-medium text-sm w-20">{comp.biomarker.shortName}</span>
                  <div className="flex-1 h-2 bg-muted rounded-full"><div className="h-full bg-green-500 rounded-full" style={{ width: `${comp.percentile}%` }} /></div>
                  <Badge className="bg-green-600 text-white text-xs">Top {100 - comp.percentile}%</Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {needsWork.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2"><TrendingDown className="w-4 h-4 text-orange-600" />Room for Improvement</h4>
            <div className="space-y-2">
              {needsWork.map(comp => comp && (
                <div key={comp.biomarkerId} className="flex items-center gap-3 p-2 rounded-lg bg-orange-50 dark:bg-orange-950/20">
                  <span className="font-medium text-sm w-20">{comp.biomarker.shortName}</span>
                  <div className="flex-1 h-2 bg-muted rounded-full"><div className="h-full bg-orange-500 rounded-full" style={{ width: `${comp.percentile}%` }} /></div>
                  <Badge variant="outline" className="border-orange-500 text-orange-600 text-xs">{comp.percentile}th %ile</Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <h4 className="text-sm font-medium mb-2">All Biomarkers</h4>
          <div className="space-y-1.5">
            {comparisons.map(comp => comp && (
              <div key={comp.biomarkerId} className="flex items-center gap-2 text-xs">
                <span className="w-16 truncate text-muted-foreground">{comp.biomarker.shortName}</span>
                <div className="flex-1 h-3 bg-muted rounded-full relative">
                  <div className="absolute top-0 bottom-0 w-px bg-gray-400" style={{ left: '50%' }} />
                  <div className={`absolute top-0.5 w-2 h-2 rounded-full ${comp.isOptimal ? 'bg-green-500' : 'bg-orange-500'}`} style={{ left: `calc(${comp.percentile}% - 4px)` }} />
                </div>
                <span className={`w-10 text-right ${comp.percentile >= 50 ? 'text-green-600' : 'text-orange-600'}`}>{comp.percentile}%</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1"><Info className="w-3 h-3" />Based on Australian adults aged 30-50</p>
        </div>
      </CardContent>
    </Card>
  );
}
