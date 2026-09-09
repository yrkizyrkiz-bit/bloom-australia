"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Activity,
  Baby,
  BarChart3,
  Bot,
  CalendarDays,
  ChevronRight,
  Heart,
  MessageCircle,
  Moon,
  Pill,
  Sparkles,
  Stethoscope,
  TestTubes,
} from "lucide-react";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

const focusAreas = [
  {
    title: "Hormone Health",
    description: "Cycle symptoms, mood, libido, fatigue and hormone balance.",
    href: "/dashboard/womens-health/hormones",
    biomarkerHref: "/dashboard/biomarkers?view=program&program=WOMENS_HEALTH&subcategory=hormones",
    icon: Sparkles,
    gradient: "from-rose-500 to-pink-600",
    badge: "Core area",
  },
  {
    title: "Menopause & Perimenopause",
    description: "Hot flushes, sleep, brain fog, mood and HRT support.",
    href: "/dashboard/womens-health/menopause",
    biomarkerHref: "/dashboard/biomarkers?view=program&program=WOMENS_HEALTH&subcategory=menopause",
    icon: Moon,
    gradient: "from-purple-500 to-indigo-600",
    badge: "Life stage",
  },
  {
    title: "PCOS & Metabolic Health",
    description: "Irregular cycles, acne, weight, insulin resistance and androgens.",
    href: "/dashboard/womens-health/pcos",
    biomarkerHref: "/dashboard/biomarkers?view=program&program=WOMENS_HEALTH&subcategory=pcos",
    icon: Activity,
    gradient: "from-orange-500 to-rose-600",
    badge: "Metabolic",
  },
  {
    title: "Fertility & Reproductive Health",
    description: "Preconception, cycle tracking and reproductive hormone context.",
    href: "/dashboard/womens-health/fertility",
    biomarkerHref: "/dashboard/biomarkers?view=program&program=WOMENS_HEALTH&subcategory=fertility",
    icon: Baby,
    gradient: "from-emerald-500 to-teal-600",
    badge: "Planning",
  },
];

const careSteps = [
  "Review symptoms and goals",
  "Check relevant biomarkers",
  "Doctor-guided care plan",
  "Track changes over time",
];

const functionalActions = [
  {
    title: "Log today’s data",
    description: "Record symptoms, cycle context, energy, sleep and treatment notes.",
    href: "/dashboard/womens-health/check-in",
    icon: CalendarDays,
  },
  {
    title: "View reports",
    description: "See symptom trends, care insights and biomarker report links.",
    href: "/dashboard/womens-health/reports",
    icon: BarChart3,
  },
  {
    title: "Talk to George",
    description: "Ask quick questions and get guidance to the right portal area.",
    href: "/dashboard/womens-health/care",
    icon: Bot,
  },
  {
    title: "Treatment",
    description: "View doctor-prescribed treatment, script status and follow-up.",
    href: "/dashboard/womens-health/treatment",
    icon: Pill,
  },
];

export default function WomensHealthPage() {
  const { user } = useAuth();
  const [todayFocus, setTodayFocus] = useState(focusAreas[0]);

  useEffect(() => {
    const dayIndex = new Date().getDate() % focusAreas.length;
    setTodayFocus(focusAreas[dayIndex]);
  }, []);

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-600 via-pink-600 to-purple-700 p-6 md:p-8 text-white">
        <div className="absolute -right-24 -top-24 w-72 h-72 rounded-full bg-white/10" />
        <div className="absolute -left-16 -bottom-16 w-56 h-56 rounded-full bg-white/10" />
        <div className="relative z-10 max-w-3xl">
          <Badge className="mb-4 bg-white/20 text-white border-white/20">
            Women&apos;s Health Portal
          </Badge>
          <h1 className="text-3xl md:text-4xl font-serif mb-3">
            {getGreeting()}, {user?.firstName || "there"}
          </h1>
          <p className="text-white/85 text-base md:text-lg max-w-2xl">
            Your dedicated space for hormone health, menopause support, PCOS and
            metabolic care, fertility planning and biomarker-guided insights.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Button asChild className="bg-white text-rose-700 hover:bg-white/90">
              <Link href="/dashboard/womens-health/check-in">
                <CalendarDays className="w-4 h-4 mr-2" />
                Log today&apos;s data
              </Link>
            </Button>
            <Button asChild variant="outline" className="border-white/40 text-white hover:bg-white/10">
              <Link href="/dashboard/womens-health/care">
                <MessageCircle className="w-4 h-4 mr-2" />
                Care support
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="grid md:grid-cols-4 gap-3">
        {careSteps.map((step, index) => (
          <Card key={step} className="border-rose-100 bg-white/80">
            <CardContent className="p-4">
              <div className="w-9 h-9 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center font-semibold mb-3">
                {index + 1}
              </div>
              <p className="text-sm font-medium text-slate-900">{step}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section>
        <h2 className="text-xl font-semibold flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-rose-600" />
          Portal tools
        </h2>
        <div className="grid md:grid-cols-4 gap-3">
          {functionalActions.map((action) => (
            <Link key={action.href} href={action.href}>
              <Card className="h-full border-rose-100 hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <action.icon className="w-5 h-5 text-rose-600 mb-3" />
                  <p className="text-sm font-semibold text-slate-900">{action.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{action.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold flex items-center gap-2 mb-3">
          <TestTubes className="w-5 h-5 text-rose-600" />
          Relevant biomarker views
        </h2>
        <div className="grid md:grid-cols-4 gap-3">
          {focusAreas.map((area) => (
            <Link key={area.biomarkerHref} href={area.biomarkerHref}>
              <Card className="h-full border-rose-100 hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <area.icon className="w-5 h-5 text-rose-600 mb-3" />
                  <p className="text-sm font-semibold text-slate-900">{area.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    View measured and calculated markers for this area.
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between gap-4 mb-3">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-600" />
            Your care areas
          </h2>
          <Badge variant="outline" className="border-rose-200 text-rose-700">
            4 focus areas
          </Badge>
        </div>
        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
          {focusAreas.map((area) => (
            <Link key={area.href} href={area.href}>
              <Card className="overflow-hidden h-full hover:shadow-lg transition-all border-0 group">
                <div className={`h-2 bg-gradient-to-r ${area.gradient}`} />
                <CardContent className="p-5">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${area.gradient} flex items-center justify-center text-white mb-4 group-hover:scale-105 transition-transform`}>
                    <area.icon className="w-6 h-6" />
                  </div>
                  <Badge variant="secondary" className="mb-3">{area.badge}</Badge>
                  <h3 className="font-semibold text-slate-900 mb-2">{area.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{area.description}</p>
                  <span className="inline-flex items-center text-sm font-medium text-rose-700">
                    Open area <ChevronRight className="w-4 h-4 ml-1" />
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 border-rose-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-rose-600" />
              Today&apos;s focus
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-4">
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${todayFocus.gradient} flex items-center justify-center text-white shrink-0`}>
                <todayFocus.icon className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">{todayFocus.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{todayFocus.description}</p>
                <Button asChild variant="link" className="px-0 text-rose-700">
                  <Link href={todayFocus.href}>Review this area</Link>
                </Button>
                <Button asChild variant="link" className="px-0 ml-4 text-rose-700">
                  <Link href={todayFocus.biomarkerHref}>View biomarkers</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-rose-100 bg-rose-50/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-rose-600" />
              Clinical support
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-slate-600">
              Your care team can help connect symptoms, cycle history, treatment options and biomarker results.
            </p>
            <Button asChild className="w-full bg-rose-600 hover:bg-rose-700">
              <Link href="/dashboard/messages">Contact care team</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
