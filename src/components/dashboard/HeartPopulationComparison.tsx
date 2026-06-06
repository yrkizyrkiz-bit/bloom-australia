"use client";

import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Users, TrendingUp, Award } from "lucide-react";
import type { BiomarkerResult } from "@/types";

interface HeartPopulationComparisonProps {
  results: BiomarkerResult[];
  gender: "male" | "female";
}

const mockPopulationData: Record<string, { mean: number; p25: number; p75: number }> = {
  total_cholesterol: { mean: 200, p25: 170, p75: 230 },
  ldl_cholesterol: { mean: 120, p25: 90, p75: 150 },
  hdl_cholesterol: { mean: 52, p25: 42, p75: 62 },
  triglycerides: { mean: 150, p25: 100, p75: 200 },
  crp: { mean: 2.0, p25: 0.8, p75: 3.5 },
  homocysteine: { mean: 11, p25: 8, p75: 14 },
  glucose: { mean: 100, p25: 85, p75: 115 },
  hba1c: { mean: 5.6, p25: 5.2, p75: 6.0 },
};

const biomarkerNames: Record<string, { name: string; unit: string; higherIsBetter: boolean }> = {
  total_cholesterol: { name: "Total Cholesterol", unit: "mg/dL", higherIsBetter: false },
  ldl_cholesterol: { name: "LDL Cholesterol", unit: "mg/dL", higherIsBetter: false },
  hdl_cholesterol: { name: "HDL Cholesterol", unit: "mg/dL", higherIsBetter: true },
  triglycerides: { name: "Triglycerides", unit: "mg/dL", higherIsBetter: false },
  crp: { name: "CRP", unit: "mg/L", higherIsBetter: false },
  homocysteine: { name: "Homocysteine", unit: "μmol/L", higherIsBetter: false },
  glucose: { name: "Glucose", unit: "mg/dL", higherIsBetter: false },
  hba1c: { name: "HbA1c", unit: "%", higherIsBetter: false },
};

function calculatePercentile(value: number, mean: number, p25: number, p75: number, higherIsBetter: boolean): number {
  const iqr = p75 - p25;
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
  const comparisonData = useMemo(() => {
    return results
      .filter(r => mockPopulationData[r.biomarkerId])
      .map(r => {
        const pop = mockPopulationData[r.biomarkerId];
        const bio = biomarkerNames[r.biomarkerId];
        const percentile = calculatePercentile(r.value, pop.mean, pop.p25, pop.p75, bio.higherIsBetter);
        return { biomarkerId: r.biomarkerId, name: bio.name, userValue: r.value, unit: bio.unit, populationMean: pop.mean, percentile, status: getStatus(percentile) };
      })
      .sort((a, b) => b.percentile - a.percentile);
  }, [results]);

  const excellentCount = comparisonData.filter(d => d.status === "excellent").length;
  const avgPercentile = Math.round(comparisonData.reduce((s, d) => s + d.percentile, 0) / comparisonData.length);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "excellent": return <Badge className="bg-red-600">Top 25%</Badge>;
      case "good": return <Badge variant="outline" className="border-green-500 text-green-600">Above Avg</Badge>;
      case "average": return <Badge variant="secondary">Average</Badge>;
      default: return <Badge variant="outline" className="border-orange-500 text-orange-600">Below Avg</Badge>;
    }
  };

  const getPercentileColor = (percentile: number) => {
    if (percentile >= 75) return "bg-red-500";
    if (percentile >= 50) return "bg-green-500";
    if (percentile >= 25) return "bg-yellow-500";
    return "bg-orange-500";
  };

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-red-50 to-white dark:from-red-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center"><Award className="w-6 h-6 text-red-600" /></div>
              <div><p className="text-3xl font-bold text-red-600">{avgPercentile}th</p><p className="text-sm text-muted-foreground">Average Percentile</p></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center"><TrendingUp className="w-6 h-6 text-green-600" /></div>
              <div><p className="text-3xl font-bold text-green-600">{excellentCount}</p><p className="text-sm text-muted-foreground">Top 25% Markers</p></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center"><Users className="w-6 h-6 text-blue-600" /></div>
              <div><p className="text-3xl font-bold">{comparisonData.filter(d => d.status === "excellent" || d.status === "good").length}/{comparisonData.length}</p><p className="text-sm text-muted-foreground">Above Average</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5 text-primary" />Population Comparison</CardTitle>
          <CardDescription>Your cardiovascular markers compared to population</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {comparisonData.map((data) => (
              <div key={data.biomarkerId} className="p-4 rounded-lg border bg-muted/20">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-medium">{data.name}</h4>
                    <p className="text-sm text-muted-foreground">Your value: <span className="font-medium text-foreground">{data.userValue} {data.unit}</span> | Avg: {data.populationMean} {data.unit}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(data.status)}
                    <span className={`text-lg font-bold ${data.percentile >= 50 ? "text-red-600" : "text-orange-600"}`}>{data.percentile}%</span>
                  </div>
                </div>
                <div className="relative h-3 bg-muted rounded-full overflow-hidden">
                  <div className={`absolute inset-y-0 left-0 ${getPercentileColor(data.percentile)} transition-all`} style={{ width: `${data.percentile}%` }} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
