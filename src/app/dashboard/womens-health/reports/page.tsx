"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  CalendarDays,
  ChevronRight,
  Loader2,
  Sparkles,
  TestTubes,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GeneratedAIReportPanel } from "@/components/dashboard/GeneratedAIReportPanel";
import { GeorgeMascot } from "@/components/george/GeorgeMascot";
import { GEORGE_NAME } from "@/lib/george";

type CheckIn = {
  id: string;
  careArea: string;
  energyLevel: number;
  moodLevel: number;
  sleepQuality: number;
  stressLevel: number;
  painLevel: number | null;
  hotFlushesLevel: number | null;
  symptoms: string[];
  notes: string | null;
  treatmentSideEffectFlag: boolean;
  checkedInAt: string;
};

type CheckInData = {
  checkIns: CheckIn[];
  summary: {
    total: number;
    sideEffectFlags: number;
    averages: Record<string, number>;
    symptomCounts: Array<{ symptom: string; count: number }>;
    trend: Array<{
      date: string;
      careArea: string;
      energy: number;
      mood: number;
      sleep: number;
      stress: number;
      pain: number | null;
      hotFlushes: number | null;
    }>;
  };
};

const biomarkerViews = [
  {
    label: "Menopause",
    href: "/dashboard/biomarkers?view=program&program=WOMENS_HEALTH&subcategory=menopause",
  },
];

function formatLabel(value: string) {
  return value.replace(/_/g, " ");
}

function TrendBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value || 0}/5</span>
      </div>
      <div className="h-2 rounded-full bg-rose-100 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-rose-500 to-purple-500"
          style={{ width: `${Math.min(100, ((value || 0) / 5) * 100)}%` }}
        />
      </div>
    </div>
  );
}

export default function WomensHealthReportsPage() {
  const [data, setData] = useState<CheckInData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/womens-health/check-ins?limit=24")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => setData(json))
      .finally(() => setLoading(false));
  }, []);

  const insightCards = useMemo(() => {
    if (!data) return [];
    const mostCommonSymptom = data.summary.symptomCounts[0];
    const latest = data.checkIns[0];
    return [
      {
        title: "Check-in coverage",
        value: `${data.summary.total}`,
        detail: "Women’s Health entries recorded",
      },
      {
        title: "Most common symptom",
        value: mostCommonSymptom ? formatLabel(mostCommonSymptom.symptom) : "Not enough data",
        detail: mostCommonSymptom
          ? `${mostCommonSymptom.count} recent entries`
          : "Log symptoms to build a trend",
      },
      {
        title: "Latest focus area",
        value: latest ? formatLabel(latest.careArea) : "No entry yet",
        detail: latest
          ? new Date(latest.checkedInAt).toLocaleDateString("en-AU")
          : "Start with a check-in",
      },
      {
        title: "Treatment flags",
        value: `${data.summary.sideEffectFlags}`,
        detail: "Entries marked as possible treatment-related symptoms",
      },
    ];
  }, [data]);

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link href="/dashboard/womens-health">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-rose-600" />
            Women&apos;s Health Reports
          </h1>
          <p className="text-muted-foreground">
            Symptom trends, {GEORGE_NAME} Insights and biomarker links.
          </p>
        </div>
      </div>

      {loading ? (
        <Card>
          <CardContent className="p-8 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid md:grid-cols-4 gap-4">
            {insightCards.map((card) => (
              <Card key={card.title} className="border-rose-100">
                <CardContent className="p-5">
                  <p className="text-xs uppercase tracking-wide text-rose-600 font-semibold">
                    {card.title}
                  </p>
                  <p className="text-2xl font-bold capitalize mt-2">{card.value}</p>
                  <p className="text-sm text-muted-foreground mt-1">{card.detail}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-rose-600" />
                  Recent averages
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <TrendBar label="Energy" value={data?.summary.averages.energy || 0} />
                <TrendBar label="Mood" value={data?.summary.averages.mood || 0} />
                <TrendBar label="Sleep" value={data?.summary.averages.sleep || 0} />
                <TrendBar label="Stress" value={data?.summary.averages.stress || 0} />
                <TrendBar label="Pain" value={data?.summary.averages.pain || 0} />
                <TrendBar label="Hot flushes" value={data?.summary.averages.hotFlushes || 0} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent entries</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data?.checkIns.length ? (
                  data.checkIns.slice(0, 6).map((entry) => (
                    <div key={entry.id} className="rounded-xl border p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-medium capitalize">{formatLabel(entry.careArea)}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(entry.checkedInAt).toLocaleDateString("en-AU", {
                              day: "numeric",
                              month: "short",
                            })}
                          </p>
                        </div>
                        {entry.treatmentSideEffectFlag && (
                          <Badge className="bg-amber-100 text-amber-800">Treatment flag</Badge>
                        )}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1">
                        {entry.symptoms.slice(0, 5).map((symptom) => (
                          <Badge key={symptom} variant="outline" className="capitalize">
                            {formatLabel(symptom)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-dashed p-6 text-center">
                    <CalendarDays className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      No data yet. Log a check-in to start reporting.
                    </p>
                    <Button asChild variant="link" className="text-rose-700">
                      <Link href="/dashboard/womens-health/check-in">Log check-in</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}

      <Card className="border-rose-200 bg-gradient-to-br from-rose-50 to-purple-50 overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GeorgeMascot size="xs" cropFace />
            {GEORGE_NAME} Insights
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Your doctor-reviewed holistic health report from your latest blood test — the same
            insights used in Organ Care.
          </p>
        </CardHeader>
        <CardContent>
          <GeneratedAIReportPanel />
        </CardContent>
      </Card>

      <Card className="border-rose-100 bg-rose-50/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTubes className="w-5 h-5 text-rose-600" />
            Biomarker report views
          </CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-4 gap-3">
          {biomarkerViews.map((view) => (
            <Button key={view.href} asChild variant="outline" className="justify-between bg-white">
              <Link href={view.href}>
                {view.label}
                <ChevronRight className="w-4 h-4" />
              </Link>
            </Button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
