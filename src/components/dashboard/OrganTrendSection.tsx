"use client";

import { Loader2, BarChart3, Sun, Moon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OrganHealthTrendChart } from "@/components/dashboard/OrganHealthTrendChart";
import { OrganTrendIllustrationNotice } from "@/components/dashboard/OrganTrendIllustrationNotice";
import { useOrganTrendData } from "@/hooks/useOrganTrendData";
import {
  ORGAN_TREND_CONFIGS,
  computeOrganTrendMilestones,
  type OrganTrendId,
} from "@/lib/organ-trend-data";

interface OrganTrendSectionProps {
  organ: OrganTrendId;
  gender: "male" | "female";
  title: string;
  description: string;
  showMilestones?: boolean;
  height?: number;
}

function OrganHormoneTrendSummaryCards() {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Cortisol Rhythm</CardTitle>
          <CardDescription>Daily cortisol pattern</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="text-center">
              <Sun className="w-6 h-6 text-amber-500 mx-auto" />
              <p className="text-xs text-muted-foreground mt-1">Morning</p>
              <p className="font-bold">22 μg/dL</p>
            </div>
            <div className="flex-1 h-1 bg-gradient-to-r from-amber-500 via-yellow-300 to-blue-500 mx-4 rounded" />
            <div className="text-center">
              <Moon className="w-6 h-6 text-blue-500 mx-auto" />
              <p className="text-xs text-muted-foreground mt-1">Evening</p>
              <p className="font-bold">8 μg/dL</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground text-center">Normal rhythm: High AM, Low PM</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Hormone Balance Ratio</CardTitle>
          <CardDescription>Key hormone relationships</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">Cortisol:DHEA-S</span>
            <Badge variant="outline" className="text-green-600 border-green-500">
              Optimal
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Estrogen:Progesterone</span>
            <Badge variant="outline" className="text-green-600 border-green-500">
              Balanced
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">FSH:LH</span>
            <Badge variant="outline" className="text-green-600 border-green-500">
              Normal
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function OrganTrendMilestoneCards({
  organ,
  milestones,
  primaryColor,
}: {
  organ: OrganTrendId;
  milestones: NonNullable<ReturnType<typeof computeOrganTrendMilestones>>;
  primaryColor: string;
}) {
  const accentBgClass =
    organ === "liver"
      ? "bg-green-50 dark:bg-green-950/20"
      : organ === "kidney"
        ? "bg-cyan-50 dark:bg-cyan-950/20"
        : undefined;

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Score Milestones</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className={`flex items-center gap-3 p-3 rounded-lg ${accentBgClass ?? ""}`}
            style={accentBgClass ? undefined : { backgroundColor: `${primaryColor}15` }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
              style={{ backgroundColor: primaryColor }}
            >
              {milestones.currentScore}
            </div>
            <div>
              <p className="font-medium">Current Score</p>
              <p className="text-xs text-muted-foreground">{milestones.currentDate}</p>
            </div>
            {milestones.improvement !== 0 && (
              <Badge className="ml-auto" style={{ backgroundColor: primaryColor }}>
                {milestones.improvement > 0 ? "+" : ""}
                {milestones.improvement} pts
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <div className="w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center text-white font-bold">
              {milestones.startingScore}
            </div>
            <div>
              <p className="font-medium">Starting Score</p>
              <p className="text-xs text-muted-foreground">{milestones.startingDate}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold">
              {milestones.targetScore}
            </div>
            <div>
              <p className="font-medium">Target Score</p>
              <p className="text-xs text-muted-foreground">{milestones.targetDateLabel}</p>
            </div>
            {milestones.ptsToTarget > 0 && (
              <Badge variant="outline" className="ml-auto">
                {milestones.ptsToTarget} pts to go
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Biggest Improvements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {milestones.categoryImprovements.slice(0, 4).map((item) => (
            <div key={item.key} className="flex items-center justify-between p-2 rounded bg-muted/50">
              <span className="text-sm">{item.label}</span>
              <span className={`font-medium ${item.delta >= 0 ? "text-green-600" : "text-red-600"}`}>
                {item.delta >= 0 ? "+" : ""}
                {item.delta} pts
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export function OrganTrendSection({
  organ,
  gender,
  title,
  description,
  showMilestones = false,
  height = 320,
}: OrganTrendSectionProps) {
  const config = ORGAN_TREND_CONFIGS[organ];
  const { data, isIllustration, isLoading } = useOrganTrendData(organ, gender);
  const milestones = computeOrganTrendMilestones(
    data,
    config.categories,
    organ,
    isIllustration
  );

  return (
    <div className="space-y-6">
      {isIllustration && <OrganTrendIllustrationNotice />}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              Loading trend data…
            </div>
          ) : (
            <OrganHealthTrendChart
              data={data}
              categories={config.categories}
              primaryColor={config.primaryColor}
              height={height}
              showCategories
            />
          )}
        </CardContent>
      </Card>

      {showMilestones && milestones && (
        <OrganTrendMilestoneCards
          organ={organ}
          milestones={milestones}
          primaryColor={config.primaryColor}
        />
      )}

      {organ === "hormones" && <OrganHormoneTrendSummaryCards />}
    </div>
  );
}
