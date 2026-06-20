"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Activity,
  ArrowLeft,
  BarChart3,
  ChevronRight,
  Flame,
  Loader2,
  Scale,
  Sparkles,
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
  cravingsLevel: number | null;
  symptoms: string[];
  notes: string | null;
  metadata?: {
    clinical?: ClinicalMetadata;
  } | null;
  checkedInAt: string;
};

const pcosSignals = [
  "Irregular or infrequent cycles",
  "Acne, oily skin or excess hair growth",
  "Weight gain or difficulty losing weight",
  "Insulin resistance or blood sugar changes",
  "High androgens or androgen symptoms",
  "Fatigue, cravings or energy crashes",
];

const biomarkerGroups = [
  { title: "Androgens", markers: "Testosterone, SHBG, Free Androgen Index (calculated)" },
  { title: "Metabolic", markers: "Glucose, HbA1c, insulin, HOMA-IR and TyG Index (calculated)" },
  { title: "Cycle hormones", markers: "FSH, LH, estradiol, progesterone" },
  { title: "Thyroid & iron", markers: "TSH, Free T4, ferritin, iron" },
];

const pcosLogItems = [
  "Cycle day, period status and irregular bleeding",
  "Acne, oily skin, hair changes and excess hair growth",
  "Cravings, energy crashes and appetite changes",
  "Mood, sleep, stress, pain and libido",
  "Treatment side effects or questions for the care team",
];

function formatSymptom(symptom: string) {
  return formatClinicalLabel(symptom);
}

export default function PcosPage() {
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/womens-health/check-ins?limit=24")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const rows = (data?.checkIns || []) as CheckIn[];
        setCheckIns(rows.filter((row) => row.careArea === "pcos"));
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
      irregularCycle: symptomCount(["irregular_cycle", "spotting"]),
      androgenPattern: symptomCount(["acne", "oily_skin", "excess_hair_growth", "hair_changes"]),
      metabolicPattern: symptomCount(["cravings", "energy_crash", "weight_change"]),
      avgCravings: avg(checkIns.map((entry) => entry.cravingsLevel)),
      avgEnergy: avg(checkIns.map((entry) => entry.energyLevel)),
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
            <Activity className="w-6 h-6 shrink-0 text-orange-600" />
            PCOS & Metabolic Health
          </h1>
          <p className="text-muted-foreground">Cycle, androgen and insulin-resistance context.</p>
        </div>
      </div>

      <Card className="overflow-hidden border-0 bg-gradient-to-br from-orange-500 to-rose-600 text-white">
        <CardContent className="p-4 sm:p-6">
          <Badge className="mb-4 bg-white/20 text-white border-white/20">Metabolic care</Badge>
          <h2 className="text-xl font-serif mb-3 sm:text-2xl">Connect PCOS symptoms with metabolic drivers</h2>
          <p className="text-white/85 max-w-2xl">
            This area helps organise cycle, skin, androgen, weight and energy symptoms
            alongside insulin, glucose, thyroid and reproductive hormone markers.
          </p>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 border-orange-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-orange-600" />
              PCOS tracking analysis
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
                  <p className="text-xs text-muted-foreground">Cycle irregularity signals</p>
                  <p className="text-xl font-bold sm:text-2xl">{analysis.irregularCycle}</p>
                </div>
                <div className="rounded-xl border p-3 sm:p-4">
                  <p className="text-xs text-muted-foreground">Androgen symptom signals</p>
                  <p className="text-xl font-bold sm:text-2xl">{analysis.androgenPattern}</p>
                </div>
                <div className="rounded-xl border p-3 sm:p-4">
                  <p className="text-xs text-muted-foreground">Metabolic signals</p>
                  <p className="text-xl font-bold sm:text-2xl">{analysis.metabolicPattern}</p>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Log PCOS check-ins to analyse cycle regularity, androgen-pattern symptoms,
                  cravings, energy crashes and treatment flags.
                </p>
              </div>
            )}
            {analysis.latest && (
              <div className="mt-4 rounded-xl bg-orange-50 border border-orange-100 p-3 sm:p-4">
                <p className="text-sm font-medium text-orange-900">Latest PCOS entry</p>
                <p className="text-xs text-orange-800 mt-1">
                  Energy {analysis.latest.energyLevel}/5 · Cravings {analysis.latest.cravingsLevel || "n/a"}/5 ·{" "}
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
                  <div className="mt-3 grid gap-2 text-xs text-orange-900 sm:grid-cols-2">
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

        <Card className="border-orange-100 bg-orange-50/60">
          <CardHeader>
            <CardTitle>What to log</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pcosLogItems.map((item) => (
              <div key={item} className="flex items-start gap-2 text-sm">
                <span className="w-2 h-2 rounded-full bg-orange-500 mt-2 shrink-0" />
                {item}
              </div>
            ))}
            <Button asChild className="w-full bg-orange-600 hover:bg-orange-700 mt-2">
              <Link href="/dashboard/womens-health/check-in?area=pcos">
                Log PCOS data <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Signals to review</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pcosSignals.map((item) => (
              <div key={item} className="flex items-start gap-3 text-sm">
                <span className="mt-2 w-2 h-2 shrink-0 rounded-full bg-orange-500" />
                {item}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTubes className="w-5 h-5 text-orange-600" />
              Biomarker groups
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {biomarkerGroups.map((group) => (
              <div key={group.title} className="rounded-xl border border-orange-100 p-3">
                <p className="font-medium text-sm">{group.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{group.markers}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {[
          { title: "Insulin resistance", icon: Flame, text: "Review glucose, HbA1c and insulin patterns linked to cravings and weight." },
          { title: "Weight context", icon: Scale, text: "Connect cycle and androgen symptoms with metabolic health data." },
          { title: "Hormone balance", icon: Sparkles, text: "Track androgen and reproductive hormone markers over time." },
        ].map((item) => (
          <Card key={item.title}>
            <CardContent className="p-5">
              <item.icon className="w-6 h-6 text-orange-600 mb-3" />
              <h3 className="font-semibold mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.text}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button asChild className="bg-orange-600 hover:bg-orange-700">
          <Link href="/dashboard/biomarkers?view=program&program=WOMENS_HEALTH&subcategory=pcos">
            View PCOS biomarkers <ChevronRight className="w-4 h-4 ml-1" />
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/dashboard/hormone-test">Open hormone panel</Link>
        </Button>
      </div>
    </div>
  );
}
