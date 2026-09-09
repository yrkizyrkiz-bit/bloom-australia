"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Scale, Target, TrendingDown, TrendingUp, Flame,
  Apple, Dumbbell, ChevronRight,
  ChefHat, Heart, Sparkles, Sun, Award, Lightbulb, Quote, Leaf, Brain, Footprints, Droplets, CalendarDays, Pill,
  Clock, CheckCircle2, AlertCircle, Beaker, User,
} from "lucide-react";
import Link from "next/link";
import { OnboardingFlow } from "@/components/weight-management/OnboardingFlow";
import { ClinicalAssessmentPrompt } from "@/components/weight-management/ClinicalAssessmentPrompt";
import { GoalRings } from "@/components/weight-management/GoalRings";
import { JourneyProjectionChart } from "@/components/weight-management/JourneyProjectionChart";
import {
  averageDailyWeightLossKg,
  formatAverageDailyLoss,
} from "@/lib/weight-management/journey-projection";
import type { RingWeekScore } from "@/lib/weight-management/score-ring-week";
import { ProgramTodayCard } from "@/components/program/ProgramTodayCard";
import { ProgramBiomarkerStrip } from "@/components/program/ProgramBiomarkerStrip";
import {
  ProgramJourneyShell,
  getProgramJourneyGreeting,
} from "@/components/dashboard/ProgramJourneyShell";
import { getRandomMotivation, getDailyTip, getDailyQuote } from "@/data/mealImages";
import { cn } from "@/lib/utils";

// GAP-009: Journey status interface
// UAT8-GAP-006: Updated to include tests tracking (non-blocking)
interface JourneyStatusData {
  journeyStatus: string;
  stage: string;
  stageDescription: string;
  isApproved: boolean;
  approvalStatus?: string;
  hasPrescription: boolean;
  isActive: boolean;
  pendingTests: boolean; // Legacy - always false now
  hasTestsTracking: boolean; // UAT8-GAP-006: Tests are being tracked but don't block
  testsTrackingInfo?: {
    message: string;
    tasks: Array<{ id: string; subject: string; status: string; dueDate: string | null }>;
    count: number;
  } | null;
  consultation?: {
    date: string;
    time: string;
    status: string;
    doctorName: string | null;
    completedAt?: string | null;
  };
}

interface ProgressData {
  summary: {
    currentWeight: number | null;
    startWeight: number | null;
    weightChange: number;
    totalExerciseMinutes: number;
    totalCaloriesBurned: number;
    exerciseDays: number;
    consistencyScore: number;
  };
  goalProgress: {
    startWeight: number;
    targetWeight: number;
    startDate: string;
    targetDate: string;
    percentComplete: number;
    remainingToLose: number;
    actualLost: number;
  } | null;
  weightProgress: {
    logs: Array<{ measuredAt: string; weight: number }>;
    weeklyAverages: Array<{ week: string; avgWeight: number }>;
  };
  checkInTrends: Array<{ week: number; feeling: number; energy: number }>;
}

interface CheckInStatus {
  checkInNeeded: boolean;
  streaks: { current: number };
}

// Get time-based greeting
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

// Icon mapping for tip categories
const TIP_ICONS: Record<string, React.ElementType> = {
  nutrition: Apple,
  hydration: Droplets,
  movement: Footprints,
  mindset: Brain,
  wellness: Leaf,
};

export default function WeightManagementPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const isPostCheckout = searchParams.get("onboarding") === "post-checkout";
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [checkInStatus, setCheckInStatus] = useState<CheckInStatus | null>(null);
  const [journeyStatus, setJourneyStatus] = useState<JourneyStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [clinicalStatus, setClinicalStatus] = useState<"needed" | "deferred" | "complete" | null>(
    null
  );
  const [deferringClinical, setDeferringClinical] = useState(false);
  const [motivation, setMotivation] = useState("");
  const [dailyTip, setDailyTip] = useState<{ title: string; content: string; icon: string; category: string } | null>(null);
  const [dailyQuote, setDailyQuote] = useState<{ quote: string; author: string } | null>(null);
  const [ringWeek, setRingWeek] = useState<RingWeekScore | null>(null);

  const fetchProgress = useCallback(async () => {
    try {
      const res = await fetch("/api/weight-management/progress?days=90");
      if (res.ok) {
        const data = await res.json();
        setProgress(data);
      }
    } catch (error) {
      console.error("Error fetching progress:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRings = useCallback(async () => {
    try {
      const ringsRes = await fetch("/api/weight-management/rings", { cache: "no-store" });
      if (ringsRes.ok) {
        const rings = await ringsRes.json();
        if (rings.ringWeek) {
          setRingWeek(rings.ringWeek);
        }
      }
    } catch (error) {
      console.error("Error fetching rings:", error);
    }
  }, []);

  useEffect(() => {
    setMotivation(getRandomMotivation("greeting"));
    setDailyTip(getDailyTip());
    setDailyQuote(getDailyQuote());

    const init = async () => {
      try {
        const homeRes = await fetch("/api/weight-management/home");

        if (homeRes.ok) {
          const data = await homeRes.json();
          setJourneyStatus(data.journeyStatus);
          if (data.showOnboarding) {
            setShowOnboarding(true);
          }
          if (data.clinicalAssessment?.status) {
            setClinicalStatus(data.clinicalAssessment.status);
          }
          if (data.checkInStatus) {
            setCheckInStatus(data.checkInStatus);
          }
          if (data.progress) {
            setProgress(data.progress);
          }
          if (data.ringWeek) {
            setRingWeek(data.ringWeek);
          }
        }

        await fetchRings();
      } catch (error) {
        console.error("Error initializing:", error);
      } finally {
        setLoading(false);
      }
    };

    void init();
  }, [fetchRings]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void fetchRings();
      }
    };
    window.addEventListener("focus", onVisible);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("focus", onVisible);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [fetchRings]);

  const deferClinicalAssessment = async () => {
    setDeferringClinical(true);
    try {
      await fetch("/api/weight-management/clinical-assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "defer" }),
      });
      setClinicalStatus("deferred");
    } finally {
      setDeferringClinical(false);
    }
  };

  const clinicalPrompt = (embedded = false) =>
    !journeyStatus?.isApproved &&
    (clinicalStatus === "needed" || clinicalStatus === "deferred") ? (
      <ClinicalAssessmentPrompt
        variant={clinicalStatus}
        firstVisit={isPostCheckout && clinicalStatus === "needed"}
        onCompleteLater={clinicalStatus === "needed" ? deferClinicalAssessment : undefined}
        deferring={deferringClinical}
        embedded={embedded}
      />
    ) : null;

  const quickActions = [
    {
      label: "Track",
      description: "Log your weight",
      icon: Scale,
      href: "/dashboard/weight-management/track",
      gradient: "from-[#4a6243] to-[#3d4f38]",
      tone: "dark" as const,
      iconCircle: "bg-[#cdd8c6]/20",
      iconColor: "text-white",
    },
    {
      label: "Eat",
      description: "Log a meal",
      icon: Apple,
      href: "/dashboard/weight-management/meals",
      gradient: "from-[#f0e8d8] to-[#e5d7bf]",
      tone: "light" as const,
      iconCircle: "bg-[#c17a58]/20",
      iconColor: "text-[#c17a58]",
    },
    {
      label: "Move",
      description: "Log activity",
      icon: Dumbbell,
      href: "/dashboard/weight-management/exercise",
      gradient: "from-[#e6ebe3] to-[#cdd8c6]",
      tone: "light" as const,
      iconCircle: "bg-[#7e9a72]/25",
      iconColor: "text-[#5c7a52]",
    },
    {
      label: "Reflect",
      description: "Weekly check-in",
      icon: Heart,
      href: "/dashboard/weight-management/check-in",
      gradient: "from-[#cdd8c6] to-[#a8bb9e]",
      tone: "light" as const,
      iconCircle: "bg-[#7e9a72]/30",
      iconColor: "text-[#4a6243]",
    },
    {
      label: "Medication",
      description: "Manage treatment",
      icon: Pill,
      href: "/dashboard/weight-management/treatment",
      gradient: "from-[#34412f] to-[#2c3628]",
      tone: "dark" as const,
      iconCircle: "bg-[#cdd8c6]/20",
      iconColor: "text-white/80",
    },
  ];

  const featureCards = [
    {
      label: "Meal Plan",
      description: "Plan your week",
      icon: CalendarDays,
      href: "/dashboard/weight-management/meal-plan",
      gradient: "from-[#4a6243] to-[#3d4f38]",
      tone: "dark" as const,
      image: "/images/remote/unsplash/photo-1546069901-ba9599a7e63c.webp",
    },
    {
      label: "Recipes",
      description: "45+ healthy meals",
      icon: ChefHat,
      href: "/dashboard/weight-management/recipes",
      gradient: "from-[#f0e8d8] to-[#e5d7bf]",
      tone: "light" as const,
      image: "/images/remote/unsplash/photo-1512621776951-a57141f2eefd.webp",
    },
    {
      label: "Progress",
      description: "View your journey",
      icon: TrendingDown,
      href: "/dashboard/weight-management/progress",
      gradient: "from-[#e6ebe3] to-[#cdd8c6]",
      tone: "light" as const,
      image: "/images/remote/unsplash/photo-1571019614242-c5c5dee9f50b.webp",
    },
    {
      label: "Goals",
      description: "Set targets",
      icon: Target,
      href: "/dashboard/weight-management/goals",
      gradient: "from-[#cdd8c6] to-[#a8bb9e]",
      tone: "light" as const,
      image: "/images/remote/unsplash/photo-1518611012118-696072aa579a.webp",
    },
  ];

  if (loading && !journeyStatus) {
    if (isPostCheckout) {
      return (
        <ProgramJourneyShell
          programKey="WEIGHT_MANAGEMENT"
          firstName={user?.firstName}
          greeting={getGreeting()}
          journey={{
            journeyStatus: "LEAD",
            stage: "pre-consultation",
            stageDescription: "Your consultation is booked. We are preparing your program home",
          }}
        />
      );
    }

    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#4a6243] border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Preparing your journey...</p>
        </div>
      </div>
    );
  }

  // GAP-009: Status-aware pre-start dashboard
  if (journeyStatus && !journeyStatus.isActive) {
    return (
      <ProgramJourneyShell
        programKey="WEIGHT_MANAGEMENT"
        firstName={user?.firstName}
        greeting={getGreeting()}
        journey={{
          journeyStatus: journeyStatus.journeyStatus,
          stageDescription: journeyStatus.stageDescription,
          stage: journeyStatus.stage,
          isApproved: journeyStatus.isApproved,
          hasPrescription: journeyStatus.hasPrescription,
          hasTestsTracking: journeyStatus.hasTestsTracking,
          consultation: journeyStatus.consultation
            ? {
                date: journeyStatus.consultation.date,
                time: journeyStatus.consultation.time,
                doctorName: journeyStatus.consultation.doctorName,
                completedAt: journeyStatus.consultation.completedAt,
              }
            : undefined,
        }}
        consultationExtra={clinicalPrompt(true)}
      >
        {ringWeek ? <GoalRings week={ringWeek} /> : null}
        {journeyStatus.hasTestsTracking && journeyStatus.testsTrackingInfo && (
          <Card className="border-[#cdd8c6] bg-gradient-to-br from-[#f8f4ec] to-[#e6ebe3]">
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#cdd8c6]/50">
                  <Beaker className="h-6 w-6 text-[#4a6243]" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-[#2c3628]">
                      Health monitoring in progress
                    </h4>
                    <Badge variant="outline" className="border-[#cdd8c6] text-xs text-[#4a6243]">
                      Approved with testing
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-[#5c7a52]">
                    {journeyStatus.testsTrackingInfo.message}. Your program is active, these
                    tests help your doctor monitor your health markers.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border-[#cdd8c6] bg-[#f8f4ec]">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base text-[#2c3628]">
              <ChefHat className="h-5 w-5 text-[#4a6243]" />
              Start Planning Your Meals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-[#5c7a52]">
              Get a head start on your health journey by planning nutritious meals.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/dashboard/weight-management/meal-plan">
                <Card className="h-full cursor-pointer overflow-hidden border-[#cdd8c6] bg-[#f8f4ec] transition-all hover:shadow-lg">
                  <CardContent className="p-3">
                    <p className="text-sm font-semibold">Weekly Meal Plan</p>
                    <p className="text-xs text-[#5c7a52]">Plan your week & shopping list</p>
                  </CardContent>
                </Card>
              </Link>
              <Link href="/dashboard/weight-management/recipes">
                <Card className="h-full cursor-pointer overflow-hidden border-[#e5d7bf] bg-[#f0e8d8] transition-all hover:shadow-lg">
                  <CardContent className="p-3">
                    <p className="text-sm font-semibold">Recipes</p>
                    <p className="text-xs text-[#5c7a52]">45+ healthy meals</p>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Link href="/dashboard/weight-management/treatment">
          <Card className="cursor-pointer border-[#cdd8c6] bg-[#f8f4ec] transition-shadow hover:shadow-md">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#cdd8c6]/40">
                  <Pill className="h-5 w-5 text-[#4a6243]" />
                </div>
                <div>
                  <p className="font-serif text-[#2c3628]">Treatment</p>
                  <p className="text-xs text-[#5c7a52]">
                    {journeyStatus.hasPrescription
                      ? "View treatment status"
                      : "View treatment plan"}
                  </p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-[#4a6243]" />
            </CardContent>
          </Card>
        </Link>
      </ProgramJourneyShell>
    );
  }

  // ==========================================
  // ACTIVE USER DASHBOARD (original code)
  // ==========================================

  // Get the appropriate icon for the daily tip
  const TipIcon = dailyTip ? (TIP_ICONS[dailyTip.icon] || Lightbulb) : Lightbulb;

  return (
    <div className="space-y-6 pb-8">
      {clinicalPrompt()}
      {/* Personalized Header - Warm & Friendly */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#4a6243] via-[#3d4f38] to-[#34412f] p-6 text-white">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/3" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <Sun className="w-4 h-4 text-[#cdd8c6]" />
            <p className="text-[#cdd8c6] text-sm">{getGreeting()}</p>
          </div>
          <h1 className="text-2xl md:text-3xl font-serif font-semibold mb-2">
            {user?.firstName}
          </h1>
          <p className="text-[#a8bb9e] text-sm">{motivation}</p>

          {/* Progress Summary */}
          {progress?.summary.currentWeight && (
            <div className="flex items-center gap-6 mt-4">
              <div>
                <p className="text-[#cdd8c6] text-xs uppercase tracking-wider">Current</p>
                <p className="text-2xl font-bold">{progress.summary.currentWeight} kg</p>
              </div>
              {progress.summary.weightChange !== 0 && (
                <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                  progress.summary.weightChange <= 0
                    ? "bg-[#cdd8c6]/20 text-[#cdd8c6]"
                    : "bg-[#c17a58]/25 text-[#f0e8d8]"
                }`}>
                  {progress.summary.weightChange <= 0
                    ? <TrendingDown className="w-4 h-4" />
                    : <TrendingUp className="w-4 h-4" />
                  }
                  {Math.abs(progress.summary.weightChange)} kg
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {ringWeek ? <GoalRings week={ringWeek} /> : null}

      {/* Goal Progress Card - Encouraging */}
      {progress?.goalProgress && (
        <Card className="border-[#cdd8c6] bg-gradient-to-br from-[#f8f4ec] to-[#e6ebe3]">
          <CardContent className="p-4">
            {progress.goalProgress.actualLost > 0 ? (
              <>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#4a6243]" />
                    <span className="font-semibold text-[#2c3628]">You&apos;re making progress!</span>
                  </div>
                  <span className="text-xs font-medium text-[#4a6243]">
                    {formatAverageDailyLoss(
                      averageDailyWeightLossKg(
                        progress.goalProgress.actualLost,
                        progress.goalProgress.startDate
                      )
                    )}
                  </span>
                </div>
                <Progress value={progress.goalProgress.percentComplete} className="mb-2 h-2 bg-[#cdd8c6] [&>div]:bg-[#4a6243]" />
                <p className="text-xs text-[#5c7a52]">
                  {progress.goalProgress.actualLost} kg down — keep going!
                </p>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-5 h-5 text-[#4a6243]" />
                  <span className="font-semibold text-[#2c3628]">Your journey starts here</span>
                </div>
                <Progress value={0} className="mb-2 h-2 bg-[#cdd8c6] [&>div]:bg-[#4a6243]" />
                <p className="text-xs text-[#5c7a52]">
                  Log your weight as you go — we&apos;ll celebrate progress once it shows.
                </p>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Today's Actions - Visual Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Log Weight - Primary Action */}
        <Link href="/dashboard/weight-management/track" className="col-span-2">
          <div className="group relative flex overflow-hidden rounded-2xl bg-gradient-to-br from-[#4a6243] to-[#3d4f38] transition-transform duration-300 md:hover:scale-[1.01]">
            <div className="pointer-events-none absolute top-4 right-8 h-20 w-20 rounded-full bg-white/10 blur-xl" />
            <div className="relative z-10 flex flex-1 items-center">
              <div className="flex-1 p-4">
                <div className="mb-1 flex items-center gap-2">
                  <Scale className="h-5 w-5 text-[#cdd8c6]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-[#cdd8c6]">Today</span>
                </div>
                <h3 className="font-serif text-lg text-white">Log your weight</h3>
                <p className="text-sm text-[#a8bb9e]">Track your progress</p>
              </div>
              <div className="flex h-24 w-24 items-center justify-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#cdd8c6]/20">
                  <Scale className="h-7 w-7 text-white/70" />
                </div>
              </div>
            </div>
          </div>
        </Link>

        {quickActions.slice(1).map((action) => {
          const dark = action.tone === "dark";
          return (
            <Link key={action.label} href={action.href}>
              <div
                className={cn(
                  "group relative h-full overflow-hidden rounded-2xl bg-gradient-to-br p-4 transition-transform duration-300 md:hover:scale-[1.02]",
                  action.gradient
                )}
              >
                {dark ? (
                  <div className="pointer-events-none absolute top-2 right-2 h-10 w-10 rounded-full bg-white/10 blur-md" />
                ) : null}
                <div className="relative z-10 flex items-center gap-3">
                  <div className={cn("flex h-12 w-12 items-center justify-center rounded-full", action.iconCircle)}>
                    <action.icon className={cn("h-6 w-6", action.iconColor)} />
                  </div>
                  <div>
                    <p className={cn("font-serif text-sm", dark ? "text-white" : "text-[#2c3628]")}>{action.label}</p>
                    <p className={cn("text-xs", dark ? "text-[#a8bb9e]" : "text-[#5c7a52]")}>{action.description}</p>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Feature Cards with Images */}
      <div>
        <h2 className="mb-3 flex items-center gap-2 font-serif text-lg text-[#2c3628]">
          <Sparkles className="h-5 w-5 text-[#c17a58]" />
          Explore
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {featureCards.map((card) => {
            const dark = card.tone === "dark";
            return (
              <Link key={card.label} href={card.href}>
                <div className="group h-full overflow-hidden rounded-2xl border border-[#cdd8c6] bg-[#f8f4ec] transition-transform duration-300 md:hover:scale-[1.02]">
                  <div className="relative h-24 overflow-hidden">
                    <img
                      src={card.image}
                      alt={card.label}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    <div className={cn("absolute inset-0 bg-gradient-to-t opacity-40", card.gradient)} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className={cn(
                        "flex h-12 w-12 items-center justify-center rounded-full",
                        dark ? "bg-[#2c3628]/40" : "bg-white/50"
                      )}>
                        <card.icon className={cn("h-6 w-6", dark ? "text-white" : "text-[#2c3628]")} />
                      </div>
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="font-serif text-sm text-[#2c3628]">{card.label}</p>
                    <p className="text-xs text-[#5c7a52]">{card.description}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Daily Tip - Compact */}
      {dailyTip && (
        <Card className="border-[#e5d7bf] bg-gradient-to-br from-[#f8f4ec] to-[#f0e8d8]">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#c17a58]/20">
                <Lightbulb className="h-5 w-5 text-[#c17a58]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="mb-1 text-xs font-bold uppercase tracking-wider text-[#c17a58]">Daily Tip</p>
                <p className="font-serif text-sm text-[#2c3628]">{dailyTip.title}</p>
                <p className="mt-1 line-clamp-2 text-xs text-[#5c7a52]">{dailyTip.content}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Weekly Check-in Reminder - Warm */}
      {checkInStatus?.checkInNeeded && (
        <Link href="/dashboard/weight-management/check-in">
          <div className="cursor-pointer overflow-hidden rounded-2xl bg-gradient-to-br from-[#4a6243] to-[#3d4f38] text-white transition-transform duration-300 md:hover:scale-[1.01]">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#cdd8c6]/20">
                  <Heart className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-serif font-semibold">How was your week?</h3>
                  <p className="text-sm text-[#a8bb9e]">Take a moment to reflect</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-[#cdd8c6]" />
            </div>
          </div>
        </Link>
      )}

      {/* Streak Display - Celebratory (only after a real weekly check-in) */}
      {checkInStatus && checkInStatus.streaks.current > 0 && !checkInStatus.checkInNeeded && (
        <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-[#f0e8d8] to-[#e5d7bf]">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#c17a58]/20">
                <Flame className="h-6 w-6 text-[#c17a58]" />
              </div>
              <div>
                <h3 className="font-serif font-semibold text-[#2c3628]">
                  {checkInStatus.streaks.current === 1
                    ? "First weekly check-in done"
                    : `${checkInStatus.streaks.current} week streak!`}
                </h3>
                <p className="text-sm text-[#5c7a52]">
                  {checkInStatus.streaks.current === 1
                    ? "Nice start — come back next week to keep the habit going."
                    : checkInStatus.streaks.current === 2
                      ? "Two weeks in a row — a lovely rhythm."
                      : "You're on a roll — keep it up!"}
                </p>
              </div>
            </div>
            <Award className="h-8 w-8 text-[#c17a58]/50" />
          </div>
        </div>
      )}

      {/* Progress Chart Preview */}
      <Card className="border-[#cdd8c6] bg-[#f8f4ec]">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg text-[#2c3628]">
              <TrendingDown className="h-5 w-5 text-[#4a6243]" />
              Your Journey
            </CardTitle>
            <Link href="/dashboard/weight-management/progress">
              <Button variant="ghost" size="sm" className="text-[#4a6243]">
                See more <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="px-3 pb-4 sm:px-5">
          {progress?.goalProgress ? (
            <JourneyProjectionChart
              startWeight={progress.goalProgress.startWeight}
              targetWeight={progress.goalProgress.targetWeight}
              startDate={progress.goalProgress.startDate}
              targetDate={progress.goalProgress.targetDate}
              currentWeight={progress.summary.currentWeight}
              weeklyAverages={progress.weightProgress.weeklyAverages || []}
            />
          ) : (
            <div className="flex h-40 flex-col items-center justify-center text-[#7e9a72]">
              <Scale className="mb-2 h-8 w-8 opacity-40" />
              <p className="text-sm">Your program goal will sketch here once a target weight is set.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <ProgramTodayCard ringWeek={ringWeek} />

      {/* Onboarding Flow */}
      <OnboardingFlow
        open={showOnboarding}
        onComplete={() => {
          setShowOnboarding(false);
          fetchProgress();
        }}
      />
    </div>
  );
}
