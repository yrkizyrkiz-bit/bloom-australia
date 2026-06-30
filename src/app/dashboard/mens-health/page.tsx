"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { usePortalContext } from "@/hooks/usePortalContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles, Heart, Zap, ChevronRight, Play,
  Shield, Award, Lightbulb,
  Sun, Pill, Camera, MessageCircle, CheckCircle2,
  Battery, Flame, Target, Loader2
} from "lucide-react";
import Link from "next/link";
import { MensHealthProgramModuleCard } from "@/components/dashboard/MensHealthProgramModuleCard";
import { isProgramEntitled } from "@/lib/membership/program-access";
import { PROGRAM_CARDS } from "@/lib/programs/catalog";
import { MEMBER_PROGRAMS_HOME } from "@/lib/portal/member-home";
import {
  loadVitalityCheckIns,
  computeVitalityStreak,
  getTodayVitalityCheckIn,
  computeWeeklyEnergyAverage,
} from "@/lib/mens-health/vitality-check-ins";
import { cn } from "@/lib/utils";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

const motivations = [
  "Taking charge of your health, one day at a time.",
  "Every healthy choice is a step toward your best self.",
  "Your commitment to wellness is inspiring.",
  "Building better habits for a stronger you.",
  "Real progress starts with showing up.",
];

const dailyTips = [
  { title: "Stay Hydrated", content: "Drinking 8 glasses of water daily supports overall vitality and hormone balance." },
  { title: "Quality Sleep", content: "Aim for 7-9 hours of sleep. It's crucial for testosterone production." },
  { title: "Stress Management", content: "High cortisol can impact your health goals. Try 10 minutes of daily meditation." },
  { title: "Protein Intake", content: "Adequate protein supports muscle maintenance and overall vitality." },
  { title: "Stay Active", content: "Regular exercise boosts energy, mood, and supports healthy hormone levels." },
];

type HairPortalSummary = {
  status: { hasActiveTreatment: boolean; label: string };
  progress: { currentDay: number };
  treatments: Array<{ medicationName: string }>;
  prescriptions: Array<{ medicationName: string; strength?: string; dosage?: string }>;
};

type SexualPortalSummary = {
  status: { label: string };
  treatment: { medicationName: string } | null;
  prescription: { medicationName: string } | null;
};

export default function MensHealthPage() {
  const { user } = useAuth();
  const { data: portal, isLoading: portalLoading } = usePortalContext();
  const [motivation, setMotivation] = useState(motivations[0]);
  const [dailyTip, setDailyTip] = useState(dailyTips[0]);
  const [hairData, setHairData] = useState<HairPortalSummary | null>(null);
  const [sexualData, setSexualData] = useState<SexualPortalSummary | null>(null);
  const [vitalityCheckIns, setVitalityCheckIns] = useState(loadVitalityCheckIns());
  const [dataLoading, setDataLoading] = useState(true);

  const hairEntitled = isProgramEntitled(portal?.membership, "HAIR_LOSS");
  const vitalityEntitled = isProgramEntitled(portal?.membership, "MENS_HEALTH_VITALITY");
  const sexualEntitled = isProgramEntitled(portal?.membership, "MENS_HEALTH_SEXUAL");

  const programQuizRoutes = useMemo(() => {
    const map = new Map<string, string>();
    for (const card of PROGRAM_CARDS) {
      map.set(card.key, card.quizRoute);
    }
    return map;
  }, []);

  useEffect(() => {
    setMotivation(motivations[Math.floor(Math.random() * motivations.length)]);
    const dayIndex = new Date().getDate() % dailyTips.length;
    setDailyTip(dailyTips[dayIndex]);
    setVitalityCheckIns(loadVitalityCheckIns());
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadProgramData() {
      setDataLoading(true);
      try {
        const [hairRes, sexualRes] = await Promise.all([
          hairEntitled ? fetch("/api/hair-loss/portal") : Promise.resolve(null),
          sexualEntitled ? fetch("/api/mens-health/sexual-health/portal") : Promise.resolve(null),
        ]);

        if (!cancelled && hairRes?.ok) {
          setHairData(await hairRes.json());
        } else if (!cancelled) {
          setHairData(null);
        }

        if (!cancelled && sexualRes?.ok) {
          setSexualData(await sexualRes.json());
        } else if (!cancelled) {
          setSexualData(null);
        }
      } finally {
        if (!cancelled) setDataLoading(false);
      }
    }

    if (!portalLoading) {
      loadProgramData();
    }

    return () => {
      cancelled = true;
    };
  }, [hairEntitled, sexualEntitled, portalLoading]);

  const todayVitality = getTodayVitalityCheckIn(vitalityCheckIns);
  const vitalityStreak = computeVitalityStreak(vitalityCheckIns);
  const weeklyEnergy = computeWeeklyEnergyAverage(vitalityCheckIns);
  const activeProgramCount = [hairEntitled, vitalityEntitled, sexualEntitled].filter(Boolean).length;

  const healthModules = useMemo(
    () => [
      {
        id: "hair-loss",
        title: "Hair Restoration",
        description: "Track progress & manage treatment",
        icon: Sparkles,
        href: "/dashboard/mens-health/hair-loss",
        quizRoute: programQuizRoutes.get("HAIR_LOSS") ?? "/dashboard/programs/hair_loss",
        gradient: "from-violet-600 to-purple-700",
        entitled: hairEntitled,
        stats: {
          label: hairData?.status.hasActiveTreatment
            ? `Day ${hairData.progress.currentDay}`
            : hairData?.status.label ?? "Enrolled",
          value: "Treatment",
        },
        image: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=200&h=150&fit=crop",
      },
      {
        id: "vitality",
        title: "Daily Vitality",
        description: "Energy, testosterone & wellness",
        icon: Zap,
        href: "/dashboard/mens-health/vitality",
        quizRoute: programQuizRoutes.get("MENS_HEALTH_VITALITY") ?? "/dashboard/programs/mens_health_vitality",
        gradient: "from-amber-500 to-orange-600",
        entitled: vitalityEntitled,
        stats: {
          label: todayVitality
            ? `${todayVitality.energy}%`
            : vitalityCheckIns.length > 0
              ? `${weeklyEnergy}% avg`
              : "Check in",
          value: "Energy",
        },
        image: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=200&h=150&fit=crop",
      },
      {
        id: "sexual-health",
        title: "Sexual Wellness",
        description: "Private, personalized care",
        icon: Heart,
        href: "/dashboard/mens-health/sexual-health",
        quizRoute: programQuizRoutes.get("MENS_HEALTH_SEXUAL") ?? "/dashboard/programs/mens_health_sexual",
        gradient: "from-slate-700 to-teal-800",
        entitled: sexualEntitled,
        stats: {
          label: sexualData?.status.label ?? "Enrolled",
          value: "Program",
        },
        image: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=200&h=150&fit=crop",
      },
    ],
    [hairEntitled, vitalityEntitled, sexualEntitled, hairData, sexualData, todayVitality, vitalityCheckIns.length, weeklyEnergy, programQuizRoutes]
  );

  const quickActions = [
    {
      label: "Log Progress",
      description: "Track hair growth",
      icon: Camera,
      href: "/dashboard/mens-health/hair-loss/track",
      color: "bg-violet-600",
      entitled: hairEntitled,
    },
    {
      label: "Check-in",
      description: "Daily vitality",
      icon: CheckCircle2,
      href: "/dashboard/mens-health/vitality/check-in",
      color: "bg-amber-500",
      entitled: vitalityEntitled,
    },
    {
      label: "Medication",
      description: "Log doses",
      icon: Pill,
      href: "/dashboard/mens-health/treatment",
      color: "bg-teal-600",
      entitled: hairEntitled || sexualEntitled || vitalityEntitled,
    },
    {
      label: "Care Team",
      description: "Get help",
      icon: MessageCircle,
      href: "/dashboard/mens-health/support",
      color: "bg-slate-600",
      entitled: true,
    },
  ];

  const treatmentItems = useMemo(() => {
    const items: Array<{
      id: string;
      name: string;
      program: string;
      taken: boolean;
      timeLabel?: string;
      color: string;
      icon: typeof Pill;
    }> = [];

    if (hairEntitled && hairData) {
      const hairMeds = hairData.treatments.length
        ? hairData.treatments
        : hairData.prescriptions;
      for (const med of hairMeds.slice(0, 1)) {
        items.push({
          id: `hair-${med.medicationName}`,
          name: med.medicationName,
          program: "Hair Loss Treatment",
          taken: false,
          color: "bg-violet-600",
          icon: Pill,
        });
      }
    }

    if (sexualEntitled && sexualData?.treatment) {
      items.push({
        id: `sexual-${sexualData.treatment.medicationName}`,
        name: sexualData.treatment.medicationName,
        program: "Sexual Wellness",
        taken: false,
        color: "bg-teal-600",
        icon: Heart,
      });
    } else if (sexualEntitled && sexualData?.prescription) {
      items.push({
        id: `sexual-${sexualData.prescription.medicationName}`,
        name: sexualData.prescription.medicationName,
        program: "Sexual Wellness",
        taken: false,
        color: "bg-teal-600",
        icon: Heart,
      });
    }

    return items;
  }, [hairEntitled, sexualEntitled, hairData, sexualData]);

  if (portalLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 p-6 text-white">
        <div className="absolute top-0 right-0 h-40 w-40 -translate-y-1/2 translate-x-1/3 rounded-full bg-teal-500/10" />
        <div className="absolute bottom-0 left-0 h-32 w-32 translate-y-1/2 -translate-x-1/3 rounded-full bg-cyan-500/10" />

        <div className="relative z-10">
          <div className="mb-1 flex items-center gap-2">
            <Sun className="h-4 w-4 text-teal-400" />
            <p className="text-sm text-teal-300">{getGreeting()}</p>
          </div>
          <h1 className="mb-2 font-serif text-2xl font-semibold md:text-3xl">
            {user?.firstName}
          </h1>
          <p className="text-sm text-slate-300">{motivation}</p>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-full bg-teal-500/20 px-3 py-1.5 text-sm text-teal-300">
              <Shield className="h-4 w-4" />
              <span>
                {activeProgramCount} Active Program{activeProgramCount === 1 ? "" : "s"}
              </span>
            </div>
            {vitalityEntitled && vitalityStreak > 0 && (
              <div className="flex items-center gap-2 rounded-full bg-amber-500/20 px-3 py-1.5 text-sm text-amber-300">
                <Flame className="h-4 w-4" />
                <span>{vitalityStreak} Day Streak</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-bold">
          <Target className="h-5 w-5 text-teal-600" />
          Your Programs
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {healthModules.map((module) => (
            <MensHealthProgramModuleCard
              key={module.id}
              module={module}
              entitled={module.entitled}
              unlockHref={module.quizRoute}
            />
          ))}
        </div>
        {activeProgramCount === 0 && (
          <Card className="mt-4 border-dashed">
            <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
              <p className="font-medium">No men&apos;s health programs enrolled yet</p>
              <p className="max-w-md text-sm text-muted-foreground">
                Browse hair, vitality, and sexual wellness programs from your programs hub.
              </p>
              <Button asChild>
                <Link href={MEMBER_PROGRAMS_HOME}>View programs</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {quickActions.map((action) => {
          const content = (
            <Card
              className={cn(
                "h-full overflow-hidden border-slate-200 transition-all dark:border-slate-800",
                action.entitled ? "cursor-pointer hover:shadow-md" : "opacity-45 grayscale"
              )}
            >
              <CardContent className="flex items-center gap-3 p-4">
                <div
                  className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-xl shadow-sm",
                    action.color
                  )}
                >
                  <action.icon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{action.label}</p>
                  <p className="text-xs text-muted-foreground">{action.description}</p>
                </div>
              </CardContent>
            </Card>
          );

          if (action.entitled) {
            return (
              <Link key={action.label} href={action.href}>
                {content}
              </Link>
            );
          }

          return (
            <Link key={action.label} href={MEMBER_PROGRAMS_HOME} title="Join a program to unlock">
              {content}
            </Link>
          );
        })}
      </div>

      <Card className="border-slate-200 bg-gradient-to-r from-slate-50 to-teal-50 dark:border-slate-800 dark:from-slate-900 dark:to-teal-950/30">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-teal-100 dark:bg-teal-900/50">
              <Lightbulb className="h-6 w-6 text-teal-600" />
            </div>
            <div className="flex-1">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-teal-700 dark:text-teal-400">
                Today&apos;s Tip
              </p>
              <p className="font-medium text-slate-900 dark:text-white">{dailyTip.title}</p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{dailyTip.content}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Pill className="h-5 w-5 text-teal-600" />
              Today&apos;s Treatments
            </CardTitle>
            {(hairEntitled || sexualEntitled) && (
              <Link href="/dashboard/mens-health/treatment">
                <Button variant="ghost" size="sm" className="text-teal-600">
                  View all <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {dataLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : treatmentItems.length > 0 ? (
            treatmentItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full ${item.color}`}>
                    <item.icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.program}</p>
                  </div>
                </div>
                <Badge variant="outline">
                  {item.timeLabel ?? "Scheduled"}
                </Badge>
              </div>
            ))
          ) : (
            <div className="rounded-xl border border-dashed p-6 text-center text-muted-foreground">
              <Pill className="mx-auto mb-2 h-8 w-8" />
              <p className="font-medium">No treatments to show yet</p>
              <p className="mt-1 text-sm">
                {activeProgramCount > 0
                  ? "Prescriptions will appear here once your doctor approves treatment."
                  : "Enrol in a program to start your care pathway."}
              </p>
              {activeProgramCount === 0 && (
                <Button asChild variant="outline" size="sm" className="mt-4">
                  <Link href={MEMBER_PROGRAMS_HOME}>Join program</Link>
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {(hairEntitled || vitalityEntitled) && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {hairEntitled && (
            <Card className="border-0 bg-gradient-to-br from-violet-500 to-purple-600 text-white">
              <CardContent className="p-4 text-center">
                <Sparkles className="mx-auto mb-2 h-6 w-6" />
                <p className="text-2xl font-bold">
                  {hairData?.status.hasActiveTreatment ? hairData.progress.currentDay : "—"}
                </p>
                <p className="text-xs text-white/80">Days on Treatment</p>
              </CardContent>
            </Card>
          )}
          {vitalityEntitled && (
            <>
              <Card className="border-0 bg-gradient-to-br from-amber-500 to-orange-600 text-white">
                <CardContent className="p-4 text-center">
                  <Battery className="mx-auto mb-2 h-6 w-6" />
                  <p className="text-2xl font-bold">
                    {todayVitality ? `${todayVitality.energy}%` : weeklyEnergy > 0 ? `${weeklyEnergy}%` : "—"}
                  </p>
                  <p className="text-xs text-white/80">Energy Level</p>
                </CardContent>
              </Card>
              <Card className="border-0 bg-gradient-to-br from-teal-500 to-cyan-600 text-white">
                <CardContent className="p-4 text-center">
                  <Award className="mx-auto mb-2 h-6 w-6" />
                  <p className="text-2xl font-bold">{vitalityStreak || "—"}</p>
                  <p className="text-xs text-white/80">Day Streak</p>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}

      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Play className="h-5 w-5 text-teal-600" />
              Learn & Understand
            </CardTitle>
            <Link href="/dashboard/mens-health/learn">
              <Button variant="ghost" size="sm" className="text-teal-600">
                See all <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { title: "Understanding DHT", description: "Learn how DHT affects hair loss", category: "Hair Loss", href: "/dashboard/mens-health/learn/dht" },
            { title: "Testosterone & Energy", description: "Natural ways to optimize levels", category: "Vitality", href: "/dashboard/mens-health/learn/testosterone" },
            { title: "ED: Causes & Solutions", description: "Evidence-based treatments", category: "Sexual Health", href: "/dashboard/mens-health/learn/ed-treatments" },
          ].map((content) => (
            <Link key={content.href} href={content.href}>
              <div className="flex cursor-pointer items-center gap-4 rounded-xl bg-slate-50 p-3 transition-colors hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-slate-200 dark:bg-slate-700">
                  <Play className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{content.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{content.description}</p>
                </div>
                <Badge variant="secondary" className="shrink-0 text-xs">
                  {content.category}
                </Badge>
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>

      <Card className="border-0 bg-gradient-to-r from-slate-800 to-slate-900 text-white">
        <CardContent className="flex items-center gap-4 p-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-teal-500/20">
            <Shield className="h-6 w-6 text-teal-400" />
          </div>
          <div className="flex-1">
            <p className="font-semibold">Private & Discreet</p>
            <p className="text-sm text-slate-300">
              Your health data is encrypted and never shared. All packages ship in plain packaging.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
