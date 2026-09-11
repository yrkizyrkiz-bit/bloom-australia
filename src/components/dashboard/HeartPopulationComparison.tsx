"use client";

import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, TrendingUp, Award } from "lucide-react";
import type { BiomarkerResult } from "@/types";
import {
  AU_CVD_POPULATION_SOURCE,
  AU_CVD_POPULATION_STATS,
} from "@/lib/australian-population-cvd";

interface HeartPopulationComparisonProps {
  results: BiomarkerResult[];
  gender: "male" | "female";
}

function calculatePercentile(
  value: number,
  mean: number,
  p25: number,
  p75: number,
  higherIsBetter: boolean
): number {
  const iqr = Math.max(p75 - p25, 0.01);
  const zScore = (value - mean) / (iqr / 1.35);
  let percentile = 50 + zScore * 15;
  percentile = Math.max(1, Math.min(99, percentile));
  if (!higherIsBetter) percentile = 100 - percentile;
  return Math.round(percentile);
}

function getStatus(percentile: number): "excellent" | "good" | "average" | "below_average" {
  if (percentile >= 75) return "excellent";
  if (percentile >= 50) return "good";
  if (percentile >= 25) return "average";
  return "below_average";
}

export function HeartPopulationComparison({ results, gender }: HeartPopulationComparisonProps) {
  const populationByMarker = AU_CVD_POPULATION_STATS[gender];

  const comparisonData = useMemo(() => {
    return results
      .filter((r) => populationByMarker[r.biomarkerId])
      .map((r) => {
        const pop = populationByMarker[r.biomarkerId];
        const percentile = calculatePercentile(
          r.value,
          pop.mean,
          pop.p25,
          pop.p75,
          pop.higherIsBetter
        );
        return {
          biomarkerId: r.biomarkerId,
          name: pop.name,
          userValue: r.value,
          unit: pop.unit,
          populationMean: pop.mean,
          percentile,
          status: getStatus(percentile),
        };
      })
      .sort((a, b) => b.percentile - a.percentile);
  }, [results, populationByMarker]);

  const excellentCount = comparisonData.filter((d) => d.status === "excellent").length;
  const avgPercentile =
    comparisonData.length > 0
      ? Math.round(comparisonData.reduce((s, d) => s + d.percentile, 0) / comparisonData.length)
      : 0;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "excellent":
        return <Badge className="bg-red-600">Top 25%</Badge>;
      case "good":
        return (
          <Badge variant="outline" className="border-green-500 text-green-600">
            Above Avg
          </Badge>
        );
      case "average":
        return <Badge variant="secondary">Average</Badge>;
      default:
        return (
          <Badge variant="outline" className="border-orange-500 text-orange-600">
            Below Avg
          </Badge>
        );
    }
  };

  const getPercentileColor = (percentile: number) => {
    if (percentile >= 75) return "bg-red-500";
    if (percentile >= 50) return "bg-green-500";
    if (percentile >= 25) return "bg-yellow-500";
    return "bg-orange-500";
  };

  if (comparisonData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Population Comparison
          </CardTitle>
          <CardDescription>Your cardiovascular markers compared to Australian adults</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No comparable heart markers found yet. Upload a lipid / metabolic panel to see how you
            compare with Australian adult averages.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-red-50 to-white dark:from-red-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <Award className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-red-600">{avgPercentile}th</p>
                <p className="text-sm text-muted-foreground">Average Percentile</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-green-600">{excellentCount}</p>
                <p className="text-sm text-muted-foreground">Top 25% Markers</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-3xl font-bold">
                  {
                    comparisonData.filter((d) => d.status === "excellent" || d.status === "good")
                      .length
                  }
                  /{comparisonData.length}
                </p>
                <p className="text-sm text-muted-foreground">Above Average</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Population Comparison
          </CardTitle>
          <CardDescription>
            Your cardiovascular markers compared to Australian adults (mmol/L where applicable)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {comparisonData.map((data) => (
              <div key={data.biomarkerId} className="p-4 rounded-lg border bg-muted/20">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-medium">{data.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      Your value:{" "}
                      <span className="font-medium text-foreground">
                        {data.userValue} {data.unit}
                      </span>{" "}
                      | AU avg: {data.populationMean} {data.unit}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(data.status)}
                    <span
                      className={`text-lg font-bold ${
                        data.percentile >= 50 ? "text-red-600" : "text-orange-600"
                      }`}
                    >
                      {data.percentile}%
                    </span>
                  </div>
                </div>
                <div className="relative h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`absolute inset-y-0 left-0 ${getPercentileColor(data.percentile)} transition-all`}
                    style={{ width: `${data.percentile}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
            {AU_CVD_POPULATION_SOURCE}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
