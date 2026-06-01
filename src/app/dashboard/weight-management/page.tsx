"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Scale, Target, TrendingDown, TrendingUp, Flame,
  Apple, Dumbbell, Calendar, ChevronRight, Play,
  Settings, ChefHat, MessageCircle, Bookmark,
  Heart, Sparkles, Sun, Award, Lightbulb, Quote, Leaf, Brain, Footprints, Droplets, CalendarDays, Pill,
  Clock, Phone, CheckCircle2, FileText, Truck, Package, AlertCircle, Beaker, User
} from "lucide-react";
import Link from "next/link";
import { ProgressChart } from "@/components/weight-management/ProgressChart";
import { OnboardingFlow } from "@/components/weight-management/OnboardingFlow";
import { getRandomMotivation, getDailyTip, getDailyQuote } from "@/data/mealImages";

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
    targetWeight: number;
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

// GAP-009: Timeline step configuration
interface TimelineStep {
  key: string;
  label: string;
  description: string;
  icon: React.ElementType;
}

// UAT8-GAP-006: Updated timeline - blood tests are for monitoring, don't block
// UAT9-GAP-009: Updated copy - "first month" instead of "consultation fee"
const TIMELINE_STEPS: TimelineStep[] = [
  { key: "payment", label: "Payment received", description: "Your first month program payment has been received", icon: CheckCircle2 },
  { key: "consultation", label: "Doctor assessment", description: "Your doctor will call at your scheduled time", icon: Phone },
  { key: "pending_tests", label: "Health monitoring", description: "Blood tests ordered for ongoing monitoring — your program continues", icon: Beaker },
  { key: "results", label: "Results reviewed", description: "Your doctor reviews your health markers", icon: FileText },
  { key: "approved", label: "Program approved", description: "Your care partner is preparing your onboarding", icon: CheckCircle2 },
  { key: "script", label: "Treatment being prepared", description: "Your prescription is being prepared", icon: Package },
  { key: "shipped", label: "Treatment shipped", description: "Your treatment is on its way", icon: Truck },
  { key: "active", label: "Program active", description: "Track your progress and complete check-ins", icon: Sparkles },
];

// Map journey status to timeline step
// UAT8-GAP-006: Tests don't block progress - user proceeds to approved
function getTimelineProgress(journeyStatus: string, hasTestsTracking: boolean = false): { currentStep: number; steps: TimelineStep[] } {
  const statusToStep: Record<string, number> = {
    CONSULTATION_PAID: 0,
    PRE_TRIAGE_PENDING: 0,
    PRE_TRIAGE_COMPLETE: 1,
    AWAITING_DOCTOR_CALL: 1,
    CONSULT_COMPLETED: 1,
    AWAITING_DOCTOR_DECISION: 1,
    // UAT8-GAP-006: APPROVED_PENDING_TESTS now maps to approved (step 4) not blocking (step 2)
    APPROVED_PENDING_TESTS: 4,
    TESTS_ORDERED: 4,
    AWAITING_TESTS: 4,
    RESULTS_RECEIVED: 4,
    FINAL_DOCTOR_REVIEW: 4,
    APPROVED: 4,
    NO_TREATMENT: 4,
    SCRIPT_DRAFT: 5,
    SCRIPT_WRITTEN: 5,
    SCRIPT_SENT_TO_PHARMACY: 5,
    PHARMACY_PENDING: 5,
    DISPENSING: 5,
    SHIPPED: 6,
    DELIVERED: 7,
    ONBOARDING_PENDING: 7,
    ONBOARDING_COMPLETE: 7,
    ACTIVE: 7,
  };

  const currentStep = statusToStep[journeyStatus] ?? 0;

  // UAT8-GAP-006: Show blood tests step only if tests are being tracked
  // but they don't block - patient proceeds regardless
  const steps = hasTestsTracking
    ? TIMELINE_STEPS
    : TIMELINE_STEPS.filter(s => s.key !== "pending_tests" && s.key !== "results");

  return { currentStep, steps };
}

export default function WeightManagementPage() {
  const { user } = useAuth();
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [checkInStatus, setCheckInStatus] = useState<CheckInStatus | null>(null);
  const [journeyStatus, setJourneyStatus] = useState<JourneyStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [motivation, setMotivation] = useState("");
  const [dailyTip, setDailyTip] = useState<{ title: string; content: string; icon: string; category: string } | null>(null);
  const [dailyQuote, setDailyQuote] = useState<{ quote: string; author: string } | null>(null);

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

  useEffect(() => {
    // Set a random motivation message
    setMotivation(getRandomMotivation("greeting"));

    // Get daily tip and quote
    setDailyTip(getDailyTip());
    setDailyQuote(getDailyQuote());

    const init = async () => {
      try {
        // GAP-009: Fetch journey status first to determine what to show
        const journeyRes = await fetch("/api/weight-management/journey-status");
        if (journeyRes.ok) {
          const journeyData = await journeyRes.json();
          setJourneyStatus(journeyData);

          // Only fetch full progress data if user is ACTIVE
          if (journeyData.isActive) {
            // Check onboarding status
            const prefRes = await fetch("/api/weight-management/preferences");
            if (prefRes.ok) {
              const prefs = await prefRes.json();
              if (!prefs.hasCompletedOnboarding) {
                setShowOnboarding(true);
              }
            }

            // Check-in status
            const checkInRes = await fetch("/api/weight-management/check-in?limit=1");
            if (checkInRes.ok) {
              const data = await checkInRes.json();
              setCheckInStatus(data);
            }

            // Fetch progress data
            await fetchProgress();
          } else {
            setLoading(false);
          }
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error("Error initializing:", error);
        setLoading(false);
      }
    };

    init();
  }, [fetchProgress]);

  // Quick Action Cards - friendly descriptions
  const quickActions = [
    {
      label: "Track",
      description: "Log your weight",
      icon: Scale,
      href: "/dashboard/weight-management/track",
      color: "bg-emerald-600",
    },
    {
      label: "Eat",
      description: "Log a meal",
      icon: Apple,
      href: "/dashboard/weight-management/meals",
      color: "bg-orange-500",
    },
    {
      label: "Move",
      description: "Log activity",
      icon: Dumbbell,
      href: "/dashboard/weight-management/exercise",
      color: "bg-blue-500",
    },
    {
      label: "Reflect",
      description: "Weekly check-in",
      icon: Heart,
      href: "/dashboard/weight-management/check-in",
      color: "bg-rose-500",
    },
    {
      label: "Medication",
      description: "Manage treatment",
      icon: Pill,
      href: "/dashboard/weight-management/treatment",
      color: "bg-violet-500",
    },
  ];

  // Feature Cards with images for visual appeal
  const featureCards = [
    {
      label: "Meal Plan",
      description: "Plan your week",
      icon: CalendarDays,
      href: "/dashboard/weight-management/meal-plan",
      gradient: "from-emerald-500 to-teal-600",
      image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&h=150&fit=crop"
    },
    {
      label: "Recipes",
      description: "45+ healthy meals",
      icon: ChefHat,
      href: "/dashboard/weight-management/recipes",
      gradient: "from-orange-500 to-red-500",
      image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=200&h=150&fit=crop"
    },
    {
      label: "Progress",
      description: "View your journey",
      icon: TrendingDown,
      href: "/dashboard/weight-management/progress",
      gradient: "from-blue-500 to-indigo-600",
      image: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=200&h=150&fit=crop"
    },
    {
      label: "Goals",
      description: "Set targets",
      icon: Target,
      href: "/dashboard/weight-management/goals",
      gradient: "from-rose-500 to-pink-600",
      image: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=200&h=150&fit=crop"
    },
  ];

  // More Features
  const features = [
    { label: "Coach", icon: MessageCircle, href: "/dashboard/weight-management/coach", color: "text-pink-500" },
    { label: "Learn", icon: Play, href: "/dashboard/weight-management/learn", color: "text-violet-500" },
    { label: "Treatment", icon: Heart, href: "/dashboard/weight-management/treatment", color: "text-rose-500" },
    { label: "Saved", icon: Bookmark, href: "/dashboard/weight-management/saved", color: "text-amber-500" },
    { label: "Settings", icon: Settings, href: "/dashboard/weight-management/settings", color: "text-slate-600" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Preparing your journey...</p>
        </div>
      </div>
    );
  }

  // GAP-009: Status-aware pre-start dashboard
  // UAT8-GAP-006: Show timeline view for non-active users, tests don't block
  if (journeyStatus && !journeyStatus.isActive) {
    const { currentStep, steps } = getTimelineProgress(journeyStatus.journeyStatus, journeyStatus.hasTestsTracking);

    return (
      <div className="space-y-6 pb-8">
        {/* Personalized Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-600 p-6 text-white">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/3" />

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1">
              <Sun className="w-4 h-4 text-emerald-300" />
              <p className="text-emerald-200 text-sm">{getGreeting()}</p>
            </div>
            <h1 className="text-2xl md:text-3xl font-serif font-semibold mb-2">
              {user?.firstName}
            </h1>
            <p className="text-emerald-100 text-sm">
              {journeyStatus.stageDescription}
            </p>
          </div>
        </div>

        {/* Current Status Card */}
        <Card className="border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                {journeyStatus.stage === "consultation" ? (
                  <Phone className="w-7 h-7 text-emerald-600" />
                ) : journeyStatus.stage === "pending_tests" ? (
                  <Beaker className="w-7 h-7 text-amber-600" />
                ) : journeyStatus.stage === "approved" || journeyStatus.isApproved ? (
                  <CheckCircle2 className="w-7 h-7 text-emerald-600" />
                ) : journeyStatus.hasPrescription ? (
                  <Package className="w-7 h-7 text-blue-600" />
                ) : (
                  <Clock className="w-7 h-7 text-emerald-600" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-emerald-900 dark:text-emerald-100">
                  {journeyStatus.stageDescription}
                </h3>
                {journeyStatus.consultation && journeyStatus.stage === "consultation" && (
                  <p className="text-sm text-emerald-700 dark:text-emerald-300 mt-1">
                    {journeyStatus.consultation.doctorName || "Your doctor"} will call you on{" "}
                    <strong>{new Date(journeyStatus.consultation.date).toLocaleDateString()}</strong> at{" "}
                    <strong>{journeyStatus.consultation.time}</strong>
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* GAP-009: Status Timeline */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-600" />
              Your Journey
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {steps.map((step, index) => {
                const isComplete = index < currentStep;
                const isCurrent = index === currentStep;
                const isPending = index > currentStep;

                return (
                  <div key={step.key} className="flex items-start gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isComplete ? "bg-emerald-100 text-emerald-600" :
                        isCurrent ? "bg-emerald-600 text-white" :
                        "bg-gray-100 text-gray-400"
                      }`}>
                        {isComplete ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : (
                          <step.icon className="w-5 h-5" />
                        )}
                      </div>
                      {index < steps.length - 1 && (
                        <div className={`w-0.5 h-8 mt-2 ${
                          isComplete ? "bg-emerald-300" : "bg-gray-200"
                        }`} />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <p className={`font-medium ${
                        isComplete || isCurrent ? "text-foreground" : "text-muted-foreground"
                      }`}>
                        {step.label}
                      </p>
                      {(isComplete || isCurrent) && (
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {step.description}
                        </p>
                      )}
                      {isCurrent && (
                        <Badge className="mt-2 bg-emerald-600">Current step</Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* UAT8-GAP-006 + UAT9-GAP-009: Tests Tracking Info - approved with testing */}
        {journeyStatus.hasTestsTracking && journeyStatus.testsTrackingInfo && (
          <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center shrink-0">
                  <Beaker className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100">Health monitoring in progress</h4>
                    <Badge variant="outline" className="text-xs border-blue-300 text-blue-700">
                      Approved with testing
                    </Badge>
                  </div>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    {journeyStatus.testsTrackingInfo.message}. Your program is active — these tests help your doctor monitor your health markers.
                  </p>
                  {journeyStatus.testsTrackingInfo.tasks.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {journeyStatus.testsTrackingInfo.tasks.slice(0, 2).map((task) => (
                        <div key={task.id} className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
                          <Clock className="w-3 h-3" />
                          <span>{task.subject}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <Link href="/dashboard/messages">
                    <Button variant="outline" size="sm" className="mt-3 border-blue-300 text-blue-700">
                      Contact Care Team
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Meal Planning & Recipes - Available during waiting period */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <ChefHat className="w-5 h-5 text-emerald-600" />
              Start Planning Your Meals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Get a head start on your health journey by planning nutritious meals.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/dashboard/weight-management/meal-plan">
                <Card className="overflow-hidden hover:shadow-lg transition-all cursor-pointer group h-full border-emerald-200">
                  <div className="relative h-20 overflow-hidden">
                    <img
                      src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&h=100&fit=crop"
                      alt="Meal Plan"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-emerald-600 to-transparent opacity-80" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <CalendarDays className="w-8 h-8 text-white drop-shadow-lg" />
                    </div>
                  </div>
                  <CardContent className="p-3">
                    <p className="font-semibold text-sm">Weekly Meal Plan</p>
                    <p className="text-xs text-muted-foreground">Plan your week & shopping list</p>
                  </CardContent>
                </Card>
              </Link>
              <Link href="/dashboard/weight-management/recipes">
                <Card className="overflow-hidden hover:shadow-lg transition-all cursor-pointer group h-full border-orange-200">
                  <div className="relative h-20 overflow-hidden">
                    <img
                      src="https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=200&h=100&fit=crop"
                      alt="Recipes"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-orange-600 to-transparent opacity-80" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <ChefHat className="w-8 h-8 text-white drop-shadow-lg" />
                    </div>
                  </div>
                  <CardContent className="p-3">
                    <p className="font-semibold text-sm">Recipes</p>
                    <p className="text-xs text-muted-foreground">45+ healthy meals</p>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Quick Links */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">While you wait</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/dashboard/messages">
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center">
                      <MessageCircle className="w-5 h-5 text-pink-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Message Care Team</p>
                      <p className="text-xs text-muted-foreground">Ask questions</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
              <Link href="/dashboard/weight-management/learn">
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center">
                      <Play className="w-5 h-5 text-violet-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Learn</p>
                      <p className="text-xs text-muted-foreground">Get prepared</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Treatment Link */}
        <Link href="/dashboard/weight-management/treatment">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center">
                  <Pill className="w-5 h-5 text-violet-600" />
                </div>
                <div>
                  <p className="font-medium">Treatment</p>
                  <p className="text-xs text-muted-foreground">
                    {journeyStatus.hasPrescription ? "View treatment status" : "View treatment plan"}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>

        {/* Contact Info */}
        <Card className="bg-muted/30">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">
              Questions? Your care team is here to help.
            </p>
            <Link href="/dashboard/messages">
              <Button variant="link" className="text-emerald-600 p-0 h-auto mt-1">
                Send a message
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ==========================================
  // ACTIVE USER DASHBOARD (original code)
  // ==========================================

  // Get the appropriate icon for the daily tip
  const TipIcon = dailyTip ? (TIP_ICONS[dailyTip.icon] || Lightbulb) : Lightbulb;

  return (
    <div className="space-y-6 pb-8">
      {/* Personalized Header - Warm & Friendly */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-600 p-6 text-white">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/3" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <Sun className="w-4 h-4 text-emerald-300" />
            <p className="text-emerald-200 text-sm">{getGreeting()}</p>
          </div>
          <h1 className="text-2xl md:text-3xl font-serif font-semibold mb-2">
            {user?.firstName}
          </h1>
          <p className="text-emerald-100 text-sm">{motivation}</p>

          {/* Progress Summary */}
          {progress?.summary.currentWeight && (
            <div className="flex items-center gap-6 mt-4">
              <div>
                <p className="text-emerald-200 text-xs uppercase tracking-wider">Current</p>
                <p className="text-2xl font-bold">{progress.summary.currentWeight} kg</p>
              </div>
              {progress.summary.weightChange !== 0 && (
                <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                  progress.summary.weightChange <= 0
                    ? "bg-green-400/20 text-green-200"
                    : "bg-amber-400/20 text-amber-200"
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

      {/* Goal Progress Card - Encouraging */}
      {progress?.goalProgress && (
        <Card className="border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-600" />
                <span className="font-semibold">You&apos;re making progress!</span>
              </div>
              <Badge className="bg-emerald-600">{progress.goalProgress.percentComplete}%</Badge>
            </div>
            <Progress value={progress.goalProgress.percentComplete} className="h-2 mb-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{progress.goalProgress.actualLost} kg down - amazing!</span>
              <span>Just {progress.goalProgress.remainingToLose} kg to go</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Today's Actions - Visual Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Log Weight - Primary Action */}
        <Link href="/dashboard/weight-management/track" className="col-span-2">
          <Card className="overflow-hidden hover:shadow-lg transition-all cursor-pointer group border-2 border-emerald-200 hover:border-emerald-400">
            <CardContent className="p-0">
              <div className="flex items-center">
                <div className="flex-1 p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Scale className="w-5 h-5 text-emerald-600" />
                    <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Today</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Log your weight</h3>
                  <p className="text-sm text-muted-foreground">Track your progress</p>
                </div>
                <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Scale className="w-10 h-10 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Quick Actions */}
        {quickActions.slice(1).map((action) => (
          <Link key={action.label} href={action.href}>
            <Card className="overflow-hidden hover:shadow-md transition-all cursor-pointer group h-full">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`w-12 h-12 ${action.color} rounded-xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform`}>
                  <action.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{action.label}</p>
                  <p className="text-xs text-muted-foreground">{action.description}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Feature Cards with Images */}
      <div>
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-500" />
          Explore
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {featureCards.map((card) => (
            <Link key={card.label} href={card.href}>
              <Card className="overflow-hidden hover:shadow-lg transition-all cursor-pointer group h-full">
                <div className="relative h-24 overflow-hidden">
                  <img
                    src={card.image}
                    alt={card.label}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className={`absolute inset-0 bg-gradient-to-t ${card.gradient} opacity-70`} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <card.icon className="w-8 h-8 text-white drop-shadow-lg" />
                  </div>
                </div>
                <CardContent className="p-3">
                  <p className="font-semibold text-sm">{card.label}</p>
                  <p className="text-xs text-muted-foreground">{card.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Daily Tip - Compact */}
      {dailyTip && (
        <Card className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center shrink-0">
                <Lightbulb className="w-5 h-5 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wider mb-1">Daily Tip</p>
                <p className="font-medium text-sm text-amber-900 dark:text-amber-100">{dailyTip.title}</p>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-1 line-clamp-2">{dailyTip.content}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Weekly Check-in Reminder - Warm */}
      {checkInStatus?.checkInNeeded && (
        <Link href="/dashboard/weight-management/check-in">
          <Card className="bg-gradient-to-r from-violet-500 to-purple-600 text-white border-0 hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Heart className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold">How was your week?</h3>
                  <p className="text-sm text-white/80">Take a moment to reflect</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5" />
            </CardContent>
          </Card>
        </Link>
      )}

      {/* Streak Display - Celebratory */}
      {checkInStatus && checkInStatus.streaks.current > 0 && !checkInStatus.checkInNeeded && (
        <Card className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Flame className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold">{checkInStatus.streaks.current} week streak!</h3>
                <p className="text-sm text-white/80">You&apos;re on a roll - keep it up!</p>
              </div>
            </div>
            <Award className="w-8 h-8 text-white/60" />
          </CardContent>
        </Card>
      )}

      {/* Progress Chart Preview */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-emerald-600" />
              Your Journey
            </CardTitle>
            <Link href="/dashboard/weight-management/progress">
              <Button variant="ghost" size="sm" className="text-emerald-600">
                See more <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <ProgressChart data={progress?.weightProgress.weeklyAverages || []} />
        </CardContent>
      </Card>

      {/* Activity Summary - Encouraging */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <Dumbbell className="w-5 h-5 mx-auto mb-1 text-blue-600" />
            <p className="text-lg font-bold">{progress?.summary.exerciseDays || 0}</p>
            <p className="text-[10px] text-muted-foreground">Active Days</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Flame className="w-5 h-5 mx-auto mb-1 text-orange-600" />
            <p className="text-lg font-bold">{progress?.summary.totalCaloriesBurned?.toLocaleString() || 0}</p>
            <p className="text-[10px] text-muted-foreground">Calories Burned</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Award className="w-5 h-5 mx-auto mb-1 text-violet-600" />
            <p className="text-lg font-bold">{progress?.summary.consistencyScore || 0}%</p>
            <p className="text-[10px] text-muted-foreground">Consistency</p>
          </CardContent>
        </Card>
      </div>

      {/* Recommended for You - Friendly */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Play className="w-5 h-5 text-violet-600" />
            Made for you
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Link href="/dashboard/weight-management/learn">
            <div className="flex items-center gap-4 p-3 rounded-lg bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 hover:shadow-sm transition-all cursor-pointer">
              <div className="w-16 h-12 bg-emerald-600 rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=100&h=80&fit=crop"
                  alt="Healthy eating"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">Nourishing your body</p>
                <p className="text-xs text-muted-foreground">Simple tips for mindful eating</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
            </div>
          </Link>
          <Link href="/dashboard/weight-management/recipes">
            <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 hover:shadow-sm transition-all cursor-pointer">
              <div className="w-16 h-12 rounded-lg overflow-hidden shrink-0">
                <img
                  src="https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=100&h=80&fit=crop"
                  alt="Fresh salad"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">Try something new</p>
                <p className="text-xs text-muted-foreground">Delicious healthy recipes</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
            </div>
          </Link>
        </CardContent>
      </Card>

      {/* More Features */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Explore</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-2">
            {features.map((feature) => (
              <Link key={feature.label} href={feature.href}>
                <div className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                  <feature.icon className={`w-5 h-5 ${feature.color}`} />
                  <span className="text-[10px] text-muted-foreground">{feature.label}</span>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

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
