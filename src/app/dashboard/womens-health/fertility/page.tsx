"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  Baby,
  BarChart3,
  CalendarDays,
  ChevronRight,
  HeartHandshake,
  Loader2,
  Sparkles,
  TestTubes,
} from "lucide-react";
import { formatClinicalLabel, formatClinicalValue, type ClinicalMetadata } from "@/lib/womens-health-clinical-checkins";

type CheckIn = {
  id: string;
  careArea: string;
  periodStatus: string | null;
  cycleDay: number | null;
  lastPeriodDate: string | null;
  energyLevel: number;
  moodLevel: number;
  sleepQuality: number;
  stressLevel: number;
  symptoms: string[];
  notes: string | null;
  metadata?: {
    clinical?: ClinicalMetadata;
  } | null;
  checkedInAt: string;
};

const planningAreas = [
  "Cycle regularity and ovulation context",
  "Preconception health and nutrient status",
  "Thyroid and iron optimisation",
  "Reproductive hormone review",
  "PCOS or irregular-cycle support",
  "Doctor-guided next steps",
];

const timeline = [
  { title: "Understand your cycle", text: "Track timing, symptoms and cycle regularity." },
  { title: "Review biomarkers", text: "Use reproductive, thyroid, iron and metabolic markers for context." },
  { title: "Plan next steps", text: "Discuss preconception or fertility support with your care team." },
];

const fertilityLogItems = [
  "Last period date, cycle day and period status",
  "Ovulation pain, fertile mucus and LH test result",
  "Spotting, breast tenderness, cramps and mood changes",
  "Sleep, stress, energy and libido",
  "Preconception questions, supplements or treatment concerns",
];

function formatSymptom(symptom: string) {
  return formatClinicalLabel(symptom);
}

export default function FertilityPage() {
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/womens-health/check-ins?limit=24")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const rows = (data?.checkIns || []) as CheckIn[];
        setCheckIns(rows.filter((row) => row.careArea === "fertility"));
      })
      .finally(() => setLoading(false));
  }, []);

  const analysis = useMemo(() => {
    const symptomCount = (names: string[]) =>
      checkIns.filter((entry) => names.some((name) => entry.symptoms.includes(name))).length;
    const entriesWithCycleDay = checkIns.filter((entry) => typeof entry.cycleDay === "number");
    const latest = checkIns[0];
    return {
      total: checkIns.length,
      latest,
      latestClinical: latest?.metadata?.clinical || {},
      cycleLogged: entriesWithCycleDay.length,
      ovulationSignals: symptomCount(["ovulation_pain", "fertile_mucus", "positive_lh_test"]),
      bleedingSignals: symptomCount(["spotting", "cramps", "irregular_cycle"]),
      stressSleepSignals: checkIns.filter((entry) => entry.stressLevel >= 4 || entry.sleepQuality <= 2).length,
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
            <Baby className="w-6 h-6 shrink-0 text-emerald-600" />
            Fertility & Reproductive Health
          </h1>
          <p className="text-muted-foreground">Preconception, cycle and reproductive hormone support.</p>
        </div>
      </div>

      <Card className="overflow-hidden border-0 bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
        <CardContent className="p-4 sm:p-6">
          <Badge className="mb-4 bg-white/20 text-white border-white/20">Planning support</Badge>
          <h2 className="text-xl font-serif mb-3 sm:text-2xl">A structured view of reproductive health</h2>
          <p className="text-white/85 max-w-2xl">
            This area helps bring cycle information, symptoms and relevant biomarkers into
            one place for preconception and reproductive health conversations.
          </p>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 border-emerald-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-600" />
              Fertility tracking analysis
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
                  <p className="text-xs text-muted-foreground">Cycle day logged</p>
                  <p className="text-xl font-bold sm:text-2xl">{analysis.cycleLogged}</p>
                </div>
                <div className="rounded-xl border p-3 sm:p-4">
                  <p className="text-xs text-muted-foreground">Ovulation signals</p>
                  <p className="text-xl font-bold sm:text-2xl">{analysis.ovulationSignals}</p>
                </div>
                <div className="rounded-xl border p-3 sm:p-4">
                  <p className="text-xs text-muted-foreground">Stress/sleep flags</p>
                  <p className="text-xl font-bold sm:text-2xl">{analysis.stressSleepSignals}</p>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Log fertility check-ins to analyse cycle timing, ovulation signals,
                  bleeding patterns, sleep/stress load and questions for your care team.
                </p>
              </div>
            )}
            {analysis.latest && (
              <div className="mt-4 rounded-xl bg-emerald-50 border border-emerald-100 p-3 sm:p-4">
                <p className="text-sm font-medium text-emerald-900">Latest fertility entry</p>
                <p className="text-xs text-emerald-800 mt-1">
                  Cycle day {analysis.latest.cycleDay || "n/a"} · Sleep {analysis.latest.sleepQuality}/5 ·{" "}
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
                  <div className="mt-3 grid gap-2 text-xs text-emerald-900 sm:grid-cols-2">
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

        <Card className="border-emerald-100 bg-emerald-50/60">
          <CardHeader>
            <CardTitle>What to log</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {fertilityLogItems.map((item) => (
              <div key={item} className="flex items-start gap-2 text-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-500 mt-2 shrink-0" />
                {item}
              </div>
            ))}
            <Button asChild className="w-full bg-emerald-600 hover:bg-emerald-700 mt-2">
              <Link href="/dashboard/womens-health/check-in?area=fertility">
                Log fertility data <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-emerald-600" />
              Planning areas
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {planningAreas.map((item) => (
              <div key={item} className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3 text-sm">
                {item}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTubes className="w-5 h-5 text-emerald-600" />
              Biomarker context
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              Relevant markers may include FSH, LH, estradiol, progesterone, thyroid
              markers, iron stores, vitamin D, glucose, insulin and HOMA-IR.
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard/biomarkers?view=program&program=WOMENS_HEALTH&subcategory=fertility">
                View fertility biomarkers
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {timeline.map((item, index) => (
          <Card key={item.title}>
            <CardContent className="p-5">
              <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-semibold mb-3">
                {index + 1}
              </div>
              <h3 className="font-semibold mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.text}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
          <Link href="/dashboard/womens-health/check-in?area=fertility">
            Log fertility data <ChevronRight className="w-4 h-4 ml-1" />
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/dashboard/hormone-test">
            <Sparkles className="w-4 h-4 mr-2" />
            Open hormone panel
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/womens-health/assessment">
            <HeartHandshake className="w-4 h-4 mr-2" />
            Update assessment
          </Link>
        </Button>
      </div>
    </div>
  );
}
