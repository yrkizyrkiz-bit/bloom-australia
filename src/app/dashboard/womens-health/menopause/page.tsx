"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  BarChart3,
  Brain,
  ChevronRight,
  Flame,
  HeartPulse,
  Loader2,
  Moon,
  TestTubes,
} from "lucide-react";
import { formatClinicalLabel, formatClinicalValue, type ClinicalMetadata } from "@/lib/womens-health-clinical-checkins";

type CheckIn = {
  id: string;
  careArea: string;
  periodStatus: string | null;
  cycleDay: number | null;
  energyLevel: number;
  moodLevel: number;
  sleepQuality: number;
  stressLevel: number;
  painLevel: number | null;
  libidoLevel: number | null;
  hotFlushesLevel: number | null;
  symptoms: string[];
  notes: string | null;
  treatmentSideEffectFlag: boolean;
  metadata?: {
    clinical?: ClinicalMetadata;
  } | null;
  checkedInAt: string;
};

const symptoms = [
  "Hot flushes or night sweats",
  "Sleep disruption",
  "Mood changes or anxiety",
  "Brain fog and concentration changes",
  "Weight, muscle or metabolic changes",
  "Vaginal dryness or libido changes",
];

const careAreas = [
  { title: "Symptom pattern", icon: Flame, text: "Map hot flushes, sleep, mood and cycle changes over time." },
  { title: "Metabolic context", icon: HeartPulse, text: "Review weight, lipids, glucose and cardiovascular risk markers." },
  { title: "Cognitive changes", icon: Brain, text: "Track brain fog, focus and sleep quality alongside biomarkers." },
];

const menopauseLogItems = [
  "Hot flushes, night sweats and sleep disruption",
  "Mood changes, anxiety, brain fog and focus changes",
  "Cycle changes, spotting or period status",
  "Pain, joint aches, libido and vaginal dryness",
  "Treatment side effects or HRT questions for the care team",
];

function formatSymptom(symptom: string) {
  return formatClinicalLabel(symptom);
}

export default function MenopausePage() {
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/womens-health/check-ins?limit=24")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const rows = (data?.checkIns || []) as CheckIn[];
        setCheckIns(rows.filter((row) => row.careArea === "menopause"));
      })
      .finally(() => setLoading(false));
  }, []);

  const analysis = useMemo(() => {
    const symptomCount = (names: string[]) =>
      checkIns.filter((entry) => names.some((name) => entry.symptoms.includes(name))).length;
    const avg = (values: Array<number | null | undefined>) => {
      const valid = values.filter((value): value is number => typeof value === "number");
      if (!valid.length) return 0;
      return Math.round((valid.reduce((sum, value) => sum + value, 0) / valid.length) * 10) / 10;
    };
    return {
      total: checkIns.length,
      latest: checkIns[0],
      latestClinical: checkIns[0]?.metadata?.clinical || {},
      vasomotorSignals: symptomCount(["hot_flushes", "night_sweats"]),
      sleepMoodSignals: symptomCount(["poor_sleep", "low_mood", "anxiety", "brain_fog"]),
      cycleChangeSignals: symptomCount(["irregular_cycle", "spotting"]),
      drynessLibidoSignals: symptomCount(["vaginal_dryness", "low_libido"]),
      sideEffectFlags: checkIns.filter((entry) => entry.treatmentSideEffectFlag).length,
      avgHotFlushes: avg(checkIns.map((entry) => entry.hotFlushesLevel)),
      avgSleep: avg(checkIns.map((entry) => entry.sleepQuality)),
    };
  }, [checkIns]);

  return (
    <div className="space-y-6 px-3 pb-20 sm:px-0 md:pb-8">
      <div className="flex items-start gap-3 sm:items-center sm:gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link href="/dashboard/womens-health">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div className="min-w-0">
          <h1 className="flex items-center gap-2 text-xl font-bold sm:text-2xl">
            <Moon className="w-6 h-6 shrink-0 text-purple-600" />
            Menopause & Perimenopause
          </h1>
          <p className="text-muted-foreground">Support for symptoms, sleep, mood and metabolic change.</p>
        </div>
      </div>

      <Card className="overflow-hidden border-0 bg-gradient-to-br from-purple-500 to-indigo-600 text-white">
        <CardContent className="p-4 sm:p-6">
          <Badge className="mb-4 bg-white/20 text-white border-white/20">Life stage care</Badge>
          <h2 className="text-xl font-serif mb-3 sm:text-2xl">Navigate hormonal transition with context</h2>
          <p className="text-white/85 max-w-2xl">
            This area brings together symptoms, hormone context, metabolic health and doctor-led
            options so care is guided by the full picture.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-purple-100 lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-600" />
              Menopause tracking analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            ) : analysis.total > 0 ? (
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <div className="rounded-xl border p-3 sm:p-4">
                  <p className="text-xs text-muted-foreground">Entries</p>
                  <p className="text-xl font-bold sm:text-2xl">{analysis.total}</p>
                </div>
                <div className="rounded-xl border p-3 sm:p-4">
                  <p className="text-xs text-muted-foreground">Flush/sweat signals</p>
                  <p className="text-xl font-bold sm:text-2xl">{analysis.vasomotorSignals}</p>
                </div>
                <div className="rounded-xl border p-3 sm:p-4">
                  <p className="text-xs text-muted-foreground">Sleep/mood signals</p>
                  <p className="text-xl font-bold sm:text-2xl">{analysis.sleepMoodSignals}</p>
                </div>
                <div className="rounded-xl border p-3 sm:p-4">
                  <p className="text-xs text-muted-foreground">Treatment flags</p>
                  <p className="text-xl font-bold sm:text-2xl">{analysis.sideEffectFlags}</p>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Log menopause check-ins to analyse hot flushes, night sweats,
                  sleep disruption, mood shifts, cycle changes and treatment flags.
                </p>
              </div>
            )}
            {analysis.latest && (
              <div className="mt-4 rounded-xl border border-purple-100 bg-purple-50 p-3 sm:p-4">
                <p className="text-sm font-medium text-purple-900">Latest menopause entry</p>
                <p className="text-xs text-purple-800 mt-1">
                  Sleep {analysis.latest.sleepQuality}/5 · Hot flushes {analysis.latest.hotFlushesLevel || "n/a"}/5 ·{" "}
                  {new Date(analysis.latest.checkedInAt).toLocaleDateString("en-AU")}
                </p>
                {analysis.latest.symptoms.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {analysis.latest.symptoms.slice(0, 6).map((symptom) => (
                      <Badge key={symptom} variant="outline" className="capitalize bg-white">
                        {formatSymptom(symptom)}
                      </Badge>
                    ))}
                  </div>
                )}
                {Object.keys(analysis.latestClinical).length > 0 && (
                  <div className="mt-3 grid gap-2 text-xs text-purple-900 sm:grid-cols-2">
                    {Object.entries(analysis.latestClinical)
                      .filter(([, value]) => formatClinicalValue(value).length > 0)
                      .slice(0, 4)
                      .map(([key, value]) => (
                        <div key={key} className="rounded-lg bg-white/80 px-3 py-2">
                          <span className="font-medium capitalize">{formatClinicalLabel(key)}:</span>{" "}
                          {formatClinicalValue(value)}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-purple-100 bg-purple-50/60">
          <CardHeader>
            <CardTitle>What to log</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {menopauseLogItems.map((item) => (
              <div key={item} className="flex items-start gap-2 text-sm">
                <span className="w-2 h-2 rounded-full bg-purple-500 mt-2 shrink-0" />
                {item}
              </div>
            ))}
            <Button asChild className="w-full bg-purple-600 hover:bg-purple-700 mt-2">
              <Link href="/dashboard/womens-health/check-in?area=menopause">
                Log menopause data <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Symptoms to monitor</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {symptoms.map((item) => (
              <div key={item} className="rounded-xl border border-purple-100 bg-purple-50/60 p-3 text-sm">
                {item}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTubes className="w-5 h-5 text-purple-600" />
              Biomarker context
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              Relevant markers include reproductive hormones, thyroid markers, iron stores,
              vitamin D, glucose, insulin, HOMA-IR and TyG Index.
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard/biomarkers?view=program&program=WOMENS_HEALTH&subcategory=menopause">
                View menopause biomarkers
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {careAreas.map((item) => (
          <Card key={item.title}>
            <CardContent className="p-5">
              <item.icon className="w-6 h-6 text-purple-600 mb-3" />
              <h3 className="font-semibold mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.text}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button asChild className="bg-purple-600 hover:bg-purple-700">
          <Link href="/dashboard/womens-health/check-in?area=menopause">
            Log menopause data <ChevronRight className="w-4 h-4 ml-1" />
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/dashboard/womens-health/care">
            Discuss menopause support
          </Link>
        </Button>
      </div>
    </div>
  );
}
