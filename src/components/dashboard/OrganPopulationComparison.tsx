"use client";

import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, TrendingUp, Award } from "lucide-react";
import type { BiomarkerResult } from "@/types";
import {
  AU_POPULATION_DEFAULTS,
  ageBandForYears,
  ageBandLabel,
  ageYearsFromDob,
  compareResultToPopulation,
  type AuPopulationCategory,
  type AuSex,
} from "@/lib/au-population";
import { usePopulationDataset } from "@/hooks/usePopulationDataset";

type Accent = "red" | "cyan" | "green";

const ACCENT: Record<
  Accent,
  { bar: string; badge: string; score: string; iconBg: string; icon: string; card: string }
> = {
  red: {
    bar: "bg-red-500",
    badge: "bg-red-600",
    score: "text-red-600",
    iconBg: "bg-red-100 dark:bg-red-900/30",
    icon: "text-red-600",
    card: "bg-gradient-to-br from-red-50 to-white dark:from-red-950/20",
  },
  cyan: {
    bar: "bg-cyan-500",
    badge: "bg-cyan-600",
    score: "text-cyan-600",
    iconBg: "bg-cyan-100 dark:bg-cyan-900/30",
    icon: "text-cyan-600",
    card: "bg-gradient-to-br from-cyan-50 to-white dark:from-cyan-950/20",
  },
  green: {
    bar: "bg-green-500",
    badge: "bg-green-600",
    score: "text-green-600",
    iconBg: "bg-green-100 dark:bg-green-900/30",
    icon: "text-green-600",
    card: "bg-gradient-to-br from-green-50 to-white dark:from-green-950/20",
  },
};

function getStatus(percentile: number): "excellent" | "good" | "average" | "below_average" {
  if (percentile >= 75) return "excellent";
  if (percentile >= 50) return "good";
  if (percentile >= 25) return "average";
  return "below_average";
}

function qualityLabel(quality: string) {
  if (quality === "official") return "ABS mean";
  if (quality === "derived") return "From ABS age rates";
  return "Estimated";
}

export function OrganPopulationComparison({
  results,
  gender,
  dateOfBirth,
  category,
  accent = "red",
  title = "Population Comparison",
}: {
  results: BiomarkerResult[];
  gender: "male" | "female";
  dateOfBirth?: string | null;
  category: AuPopulationCategory;
  accent?: Accent;
  title?: string;
}) {
  const { data } = usePopulationDataset();
  const dataset = data?.dataset ?? AU_POPULATION_DEFAULTS;
  const sex: AuSex = gender === "female" ? "female" : "male";
  const age = ageYearsFromDob(dateOfBirth);
  const band = ageBandForYears(age);
  const bandKnown = age != null;
  const colors = ACCENT[accent];

  const comparisonData = useMemo(() => {
    return results
      .map((r) => {
        const compared = compareResultToPopulation({
          dataset,
          biomarkerId: r.biomarkerId,
          value: r.value,
          sex,
          ageBand: band,
        });
        if (!compared || compared.marker.category !== category) return null;
        return {
          biomarkerId: r.biomarkerId,
          name: compared.marker.name,
          userValue: r.value,
          unit: compared.marker.unit,
          populationMean: compared.stats.mean,
          absAbnormalPercent: compared.stats.absAbnormalPercent,
          quality: compared.stats.quality,
          percentile: compared.percentile,
          status: getStatus(compared.percentile),
        };
      })
      .filter(Boolean)
      .sort((a, b) => (b?.percentile ?? 0) - (a?.percentile ?? 0));
  }, [results, dataset, sex, band, category]);

  const excellentCount = comparisonData.filter((d) => d?.status === "excellent").length;
  const avgPercentile =
    comparisonData.length > 0
      ? Math.round(
          comparisonData.reduce((s, d) => s + (d?.percentile ?? 0), 0) / comparisonData.length
        )
      : 0;

  const source = dataset.sources[0];

  if (comparisonData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            {title}
          </CardTitle>
          <CardDescription>
            Compared with Australians in your age group ({ageBandLabel(band)})
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No comparable markers found yet for this panel.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-4">
        <Card className={colors.card}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full ${colors.iconBg} flex items-center justify-center`}>
                <Award className={`w-6 h-6 ${colors.icon}`} />
              </div>
              <div>
                <p className={`text-3xl font-bold ${colors.score}`}>{avgPercentile}th</p>
                <p className="text-sm text-muted-foreground">Average percentile</p>
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
                <p className="text-sm text-muted-foreground">Top 25% markers</p>
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
                  {age != null ? age : "—"}
                  <span className="text-base font-normal text-muted-foreground ml-1">yrs</span>
                </p>
                <p className="text-sm text-muted-foreground">{ageBandLabel(band)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {!bandKnown && (
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          Date of birth is missing, so this uses the 45–54 year Australian group. Add DOB on your
          profile for an age-matched comparison.
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            {title}
          </CardTitle>
          <CardDescription>
            Compared with Australian {sex === "female" ? "women" : "men"} aged {ageBandLabel(band)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {comparisonData.map(
              (row) =>
                row && (
                  <div key={row.biomarkerId} className="p-4 rounded-lg border bg-muted/20">
                    <div className="flex items-center justify-between mb-3 gap-3">
                      <div>
                        <h4 className="font-medium">{row.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Your value:{" "}
                          <span className="font-medium text-foreground">
                            {row.userValue} {row.unit}
                          </span>{" "}
                          | AU avg ({ageBandLabel(band)}): {row.populationMean} {row.unit}
                        </p>
                        {row.absAbnormalPercent != null && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {row.absAbnormalPercent}% of Australians in this age group are outside
                            the ABS clinical cut-off ({qualityLabel(row.quality)})
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {row.status === "excellent" ? (
                          <Badge className={colors.badge}>Top 25%</Badge>
                        ) : row.status === "good" ? (
                          <Badge variant="outline" className="border-green-500 text-green-600">
                            Above avg
                          </Badge>
                        ) : row.status === "average" ? (
                          <Badge variant="secondary">Average</Badge>
                        ) : (
                          <Badge variant="outline" className="border-orange-500 text-orange-600">
                            Below avg
                          </Badge>
                        )}
                        <span
                          className={`text-lg font-bold ${
                            row.percentile >= 50 ? colors.score : "text-orange-600"
                          }`}
                        >
                          {row.percentile}%
                        </span>
                      </div>
                    </div>
                    <div className="relative h-3 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`absolute inset-y-0 left-0 ${
                          row.percentile >= 75
                            ? colors.bar
                            : row.percentile >= 50
                              ? "bg-green-500"
                              : row.percentile >= 25
                                ? "bg-yellow-500"
                                : "bg-orange-500"
                        } transition-all`}
                        style={{ width: `${row.percentile}%` }}
                      />
                    </div>
                  </div>
                )
            )}
          </div>
          {source && (
            <div className="mt-4 rounded-lg border bg-muted/30 px-3 py-2.5 text-[11px] leading-relaxed text-muted-foreground">
              <p>
                Source: {source.name} ({source.surveyYears}), reviewed {source.lastReviewed}.
                Educational comparison — not a personalised clinical target.
              </p>
              <p className="mt-1">{source.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
