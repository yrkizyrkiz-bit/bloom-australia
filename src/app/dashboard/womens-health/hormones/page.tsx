"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  Brain,
  ChevronRight,
  Heart,
  Moon,
  Sparkles,
  TestTubes,
} from "lucide-react";
import { formatClinicalLabel, formatClinicalValue, type ClinicalMetadata } from "@/lib/womens-health-clinical-checkins";

type CheckIn = {
  id: string;
  careArea: string;
  cycleDay: number | null;
  energyLevel: number;
  moodLevel: number;
  sleepQuality: number;
  symptoms: string[];
  metadata?: {
    clinical?: ClinicalMetadata;
  } | null;
  checkedInAt: string;
};

const focusItems = [
  "Cycle changes or irregular periods",
  "PMS, mood changes or irritability",
  "Fatigue, low libido or brain fog",
  "Skin, hair or weight changes",
];

const biomarkerItems = [
  "Estradiol",
  "Progesterone",
  "FSH and LH",
  "Testosterone and SHBG",
  "Free Androgen Index (calculated)",
  "TSH and Free T4",
  "Ferritin, iron and transferrin saturation (calculated)",
];

function formatSymptom(symptom: string) {
  return formatClinicalLabel(symptom);
}

export default function WomensHormonesPage() {
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/womens-health/check-ins?limit=24")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const rows = (data?.checkIns || []) as CheckIn[];
        setCheckIns(rows.filter((row) => row.careArea === "hormones"));
      })
      .finally(() => setLoading(false));
  }, []);

  const analysis = useMemo(() => {
    const symptomCount = (names: string[]) =>
      checkIns.filter((entry) => names.some((name) => entry.symptoms.includes(name))).length;
    return {
      total: checkIns.length,
      latest: checkIns[0],
      latestClinical: checkIns[0]?.metadata?.clinical || {},
      moodBrainSignals: symptomCount(["low_mood", "anxiety", "brain_fog", "mood_swings"]),
      libidoSignals: symptomCount(["low_libido", "breast_tenderness"]),
      skinHairSignals: symptomCount(["acne", "hair_changes", "oily_skin"]),
    };
  }, [checkIns]);

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
            <Sparkles className="w-6 h-6 text-rose-600" />
            Hormone Health
          </h1>
          <p className="text-muted-foreground">
            Understand cycle, mood, energy and hormone patterns.
          </p>
        </div>
      </div>

      <Card className="overflow-hidden border-0 bg-gradient-to-br from-rose-500 to-pink-600 text-white">
        <CardContent className="p-6">
          <Badge className="mb-4 bg-white/20 text-white border-white/20">Core area</Badge>
          <h2 className="text-2xl font-serif mb-3">Connect symptoms with hormones and biomarkers</h2>
          <p className="text-white/85 max-w-2xl">
            This area helps organise symptoms that may relate to estrogen, progesterone,
            androgens, thyroid function, stress and nutrient status.
          </p>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-rose-600" />
              Common focus points
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {focusItems.map((item) => (
              <div key={item} className="flex items-center gap-3 text-sm">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                {item}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-rose-600" />
              Hormone tracking analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading hormone check-ins...</p>
            ) : analysis.total > 0 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl border p-3">
                    <p className="text-xs text-muted-foreground">Entries</p>
                    <p className="text-xl font-bold">{analysis.total}</p>
                  </div>
                  <div className="rounded-xl border p-3">
                    <p className="text-xs text-muted-foreground">Mood/brain</p>
                    <p className="text-xl font-bold">{analysis.moodBrainSignals}</p>
                  </div>
                  <div className="rounded-xl border p-3">
                    <p className="text-xs text-muted-foreground">Skin/hair</p>
                    <p className="text-xl font-bold">{analysis.skinHairSignals}</p>
                  </div>
                </div>
                {Object.keys(analysis.latestClinical).length > 0 && (
                  <div className="grid gap-2 text-xs text-rose-900 sm:grid-cols-2">
                    {Object.entries(analysis.latestClinical)
                      .filter(([, value]) => formatClinicalValue(value).length > 0)
                      .slice(0, 4)
                      .map(([key, value]) => (
                        <div key={key} className="rounded-lg bg-rose-50 px-3 py-2">
                          <span className="font-medium capitalize">{formatClinicalLabel(key)}:</span>{" "}
                          {formatClinicalValue(value)}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Log hormone check-ins to analyse PMS, mood, libido, skin, hair and medication context.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTubes className="w-5 h-5 text-rose-600" />
              Relevant biomarkers
            </CardTitle>
          </CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-2">
            {biomarkerItems.map((item) => (
              <Badge key={item} variant="secondary" className="justify-center py-2">
                {item}
              </Badge>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {[
          { title: "Mood & brain fog", icon: Brain, text: "Track symptoms that often shift with hormones, sleep and iron status." },
          { title: "Sleep & recovery", icon: Moon, text: "Review sleep changes alongside thyroid, cortisol and cycle history." },
          { title: "Care plan", icon: Sparkles, text: "Bring symptoms and biomarkers together for doctor-guided next steps." },
        ].map((item) => (
          <Card key={item.title}>
            <CardContent className="p-5">
              <item.icon className="w-6 h-6 text-rose-600 mb-3" />
              <h3 className="font-semibold mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.text}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button asChild className="bg-rose-600 hover:bg-rose-700">
          <Link href="/dashboard/biomarkers?view=program&program=WOMENS_HEALTH&subcategory=hormones">
            View hormone biomarkers <ChevronRight className="w-4 h-4 ml-1" />
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/dashboard/hormone-test">Open hormone panel</Link>
        </Button>
      </div>
    </div>
  );
}
