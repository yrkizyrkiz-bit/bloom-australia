"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  BarChart3,
  Bot,
  CalendarDays,
  MessageCircle,
  Moon,
  Pill,
  Sparkles,
  TestTubes,
} from "lucide-react";
import { AwaitingConsultationHeroNote } from "@/components/portal/AwaitingConsultationHeroNote";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

const focusAreas = [
  {
    title: "Menopause & Perimenopause",
    description: "Hot flushes, sleep, brain fog, mood and HRT support.",
    href: "/dashboard/womens-health/menopause",
    biomarkerHref: "/dashboard/biomarkers?view=program&program=WOMENS_HEALTH&subcategory=menopause",
    icon: Moon,
    gradient: "from-purple-500 to-indigo-600",
  },
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
            Your dedicated space for menopause support and biomarker-guided insights.
          </p>
          <AwaitingConsultationHeroNote
            programKeys={["WOMENS_HEALTH_SEXUAL", "WOMENS_HEALTH_VITALITY"]}
          />
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Button asChild className="bg-white text-rose-700 hover:bg-white/90">
              <Link href="/dashboard/womens-health/check-in">
                <CalendarDays className="w-4 h-4 mr-2" />
                Log today&apos;s data
              </Link>
            </Button>
            <Button
              asChild
              className="border border-white/70 bg-rose-950/40 text-white hover:bg-rose-950/55 hover:text-white"
            >
              <Link href="/dashboard/womens-health/care">
                <MessageCircle className="mr-2 h-4 w-4 text-white" />
                Care support
              </Link>
            </Button>
          </div>
        </div>
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

      <section className="grid items-stretch gap-4 lg:grid-cols-2">
        <div className="flex h-full flex-col">
          <h2 className="mb-3 flex items-center gap-2 text-xl font-semibold">
            <CalendarDays className="h-5 w-5 text-rose-600" />
            Today&apos;s focus
          </h2>
          <Card className="flex flex-1 flex-col border-rose-100">
            <CardContent className="flex flex-1 flex-col p-5">
              <div className="flex flex-1 items-start gap-4">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${todayFocus.gradient} text-white`}
                >
                  <todayFocus.icon className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900">{todayFocus.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{todayFocus.description}</p>
                  <Button asChild variant="link" className="mt-3 h-auto px-0 text-rose-700">
                    <Link href={todayFocus.href}>Review this area</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex h-full flex-col">
          <h2 className="mb-3 flex items-center gap-2 text-xl font-semibold">
            <TestTubes className="h-5 w-5 text-rose-600" />
            Relevant biomarker views
          </h2>
          <Link href={todayFocus.biomarkerHref} className="flex flex-1 flex-col">
            <Card className="flex flex-1 flex-col border-rose-100 transition-shadow hover:shadow-md">
              <CardContent className="flex flex-1 flex-col p-5">
                <div className="flex flex-1 items-start gap-4">
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${todayFocus.gradient} text-white`}
                  >
                    <todayFocus.icon className="h-6 w-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900">{todayFocus.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      View measured and calculated markers for this area.
                    </p>
                    <span className="mt-3 inline-flex text-sm font-medium text-rose-700">
                      View biomarkers
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </section>
    </div>
  );
}
