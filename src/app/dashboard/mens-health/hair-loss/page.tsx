"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  ArrowLeft, Camera, TrendingUp, Pill, Calendar, ChevronRight,
  Sparkles, CheckCircle2,
  Lightbulb, Target, BarChart3, Loader2, Stethoscope, MessageCircle
} from "lucide-react";
import {
  ProgramJourneyShell,
  getProgramJourneyGreeting,
  type ProgramJourneyViewModel,
} from "@/components/dashboard/ProgramJourneyShell";
import {
  getHairJourneyStageDescription,
  resolveHairJourneyStatus,
} from "@/lib/program-journey/hair-journey";
import { isAwaitingDoctorConsultation } from "@/lib/program-journey/upcoming-consultation";
import { HairTreatmentsList } from "@/components/dashboard/HairTreatmentDoseCard";

type HairPortalData = {
  user: {
    firstName: string;
    subscriptionTier: string | null;
    journeyStatus: string | null;
    approvalStatus: string | null;
  };
  hairJourney?: {
    status: string;
    label: string;
  };
  status: {
    hasPaid: boolean;
    isApproved: boolean;
    hasActiveTreatment: boolean;
    label: string;
  };
  intake: Record<string, unknown> | null;
  booking: {
    id: string;
    status: string;
    scheduledAt: string;
    doctorName: string | null;
    appointmentType: string;
    completedAt: string | null;
  } | null;
  progress: {
    currentDay: number;
    totalDays: number;
    startDate: string | null;
    treatmentAdherence: number | null;
    photosLogged: number;
    nextMilestone: number;
  };
  prescriptions: Array<{
    id: string;
    medicationName: string;
    strength: string;
    dosage: string;
    frequency: string;
    status: string;
    scriptStatus: string;
    prescribedAt: string;
    startDate: string;
    nextRefillDate: string | null;
    refillsRemaining: number;
    needsFirstDose?: boolean;
  }>;
  treatments: Array<{
    id: string;
    prescriptionId?: string | null;
    medicationName: string;
    dosage: string;
    strength?: string;
    frequency: string;
    instructions: string | null;
    startDate: string;
    nextDoseDate: string | null;
    adherence: number | null;
    upcomingDoses?: Array<{ id: string; scheduledAt: string }>;
  }>;
};

const emptyProgress = {
  currentDay: 0,
  totalDays: 365,
  startDate: null,
  treatmentAdherence: null,
  photosLogged: 0,
  nextMilestone: 30,
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-AU", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export default function HairLossPage() {
  const [data, setData] = useState<HairPortalData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/hair-loss/portal");
      if (!res.ok) throw new Error("Failed to load");
      setData(await res.json());
    } catch (error) {
      console.error("Hair portal load error:", error);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    );
  }

  const progressData = data?.progress || emptyProgress;
  const hasActiveTreatment = data?.status.hasActiveTreatment || false;
  const hairJourneyStatus =
    data?.hairJourney?.status ||
    resolveHairJourneyStatus({
      journeyStatus: data?.user.journeyStatus,
      approvalStatus: data?.user.approvalStatus,
      hasUpcomingBooking: Boolean(data?.booking && !data.booking.completedAt),
      consultCompleted: Boolean(data?.booking?.completedAt),
      hasHairPrescription: (data?.prescriptions.length ?? 0) > 0,
      hasActiveTreatment: (data?.treatments.length ?? 0) > 0,
    });
  const hairJourneyLabel =
    data?.hairJourney?.label || getHairJourneyStageDescription(hairJourneyStatus);
  const programActive = hairJourneyStatus === "ACTIVE";

  const showCountdown =
    Boolean(data?.booking) &&
    !data?.booking?.completedAt &&
    isAwaitingDoctorConsultation(hairJourneyStatus);

  const journeyView: ProgramJourneyViewModel = {
    journeyStatus: hairJourneyStatus,
    stageDescription: data?.status.label || hairJourneyLabel,
    stage:
      hairJourneyStatus === "AWAITING_DOCTOR_CALL"
        ? "consultation"
        : hairJourneyStatus === "APPROVED" || programActive
          ? "approved"
          : "pre-consultation",
    isApproved: data?.status.isApproved || hairJourneyStatus === "APPROVED" || programActive,
    hasPrescription: (data?.prescriptions.length ?? 0) > 0,
    hasTestsTracking: false,
    consultation: showCountdown && data?.booking
      ? {
          date: data.booking.scheduledAt,
          time: new Date(data.booking.scheduledAt).toLocaleTimeString("en-AU", {
            hour: "numeric",
            minute: "2-digit",
          }),
          doctorName: data.booking.doctorName,
          completedAt: data.booking.completedAt,
        }
      : undefined,
  };

  if (!programActive) {
    return (
      <div className="space-y-6 pb-20 md:pb-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/mens-health">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="flex items-center gap-2 text-2xl font-bold">
              <Sparkles className="h-6 w-6 text-violet-600" />
              Hair Restoration
            </h1>
            <p className="text-muted-foreground">Track your progress & manage treatment</p>
          </div>
        </div>

        <ProgramJourneyShell
          programKey="HAIR_LOSS"
          firstName={data?.user.firstName}
          greeting={getProgramJourneyGreeting()}
          journey={journeyView}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">While you wait</CardTitle>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard/messages">
                <Card className="cursor-pointer transition-shadow hover:shadow-md">
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-pink-100">
                      <MessageCircle className="h-5 w-5 text-pink-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Message Care Team</p>
                      <p className="text-xs text-muted-foreground">Ask questions</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </CardContent>
          </Card>
          {(data?.prescriptions.length || data?.treatments.length) ? (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">My Treatments</CardTitle>
              </CardHeader>
              <CardContent>
                <HairTreatmentsList
                  prescriptions={data.prescriptions}
                  treatments={data.treatments}
                  onSaved={load}
                />
              </CardContent>
            </Card>
          ) : null}
        </ProgramJourneyShell>
      </div>
    );
  }

  // Treatment timeline milestones
  const milestones = [
    { day: 30, label: "Initial Phase", description: "Treatment adapting", reached: progressData.currentDay >= 30 },
    { day: 90, label: "Early Results", description: "Shedding may slow", reached: progressData.currentDay >= 90 },
    { day: 180, label: "Visible Progress", description: "New growth visible", reached: progressData.currentDay >= 180 },
    { day: 365, label: "Full Results", description: "Maximum benefit", reached: progressData.currentDay >= 365 },
  ];

  // Quick stats
  const stats = [
    { label: "Days on Treatment", value: hasActiveTreatment ? progressData.currentDay : "—", icon: Calendar, color: "text-violet-600" },
    { label: "Adherence Rate", value: progressData.treatmentAdherence != null ? `${progressData.treatmentAdherence}%` : "—", icon: CheckCircle2, color: "text-green-600" },
    { label: "Photos Logged", value: progressData.photosLogged, icon: Camera, color: "text-blue-600" },
    { label: "Next Milestone", value: hasActiveTreatment ? `Day ${progressData.nextMilestone}` : "After approval", icon: Target, color: "text-amber-600" },
  ];

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/mens-health">
          <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-violet-600" />
            Hair Restoration
          </h1>
          <p className="text-muted-foreground">Track your progress & manage treatment</p>
        </div>
      </div>

      <ProgramJourneyShell
        programKey="HAIR_LOSS"
        firstName={data?.user.firstName}
        greeting={getProgramJourneyGreeting()}
        journey={journeyView}
      />

      {/* Progress Overview Card */}
      <Card className="overflow-hidden bg-gradient-to-br from-violet-900 via-purple-900 to-slate-900 border-0 text-white">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-violet-300 text-sm uppercase tracking-wider mb-1">Your Journey</p>
              <p className="text-4xl font-bold">
                {hasActiveTreatment ? `Day ${progressData.currentDay}` : "Awaiting review"}
              </p>
              <p className="text-violet-200 text-sm mt-1">
                {hasActiveTreatment
                  ? "of your hair restoration journey"
                  : "your care team is preparing your hair care pathway"}
              </p>
            </div>
            <div className="text-right">
              <Badge className="bg-white/15 text-white border-0">
                <CheckCircle2 className="w-3 h-3 mr-1" /> {data?.status.label || "Pending"}
              </Badge>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-xs text-violet-300 mb-2">
              <span>Progress to full results</span>
              <span>{hasActiveTreatment ? Math.round((progressData.currentDay / 365) * 100) : 0}%</span>
            </div>
            <div className="h-3 bg-violet-950 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-violet-500 to-purple-400 rounded-full transition-all"
                style={{ width: `${hasActiveTreatment ? (progressData.currentDay / 365) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* Milestone Markers */}
          <div className="flex justify-between mt-4">
            {milestones.map((milestone, index) => (
              <div key={index} className="text-center">
                <div className={`w-8 h-8 rounded-full mx-auto mb-1 flex items-center justify-center text-xs font-bold ${
                  milestone.reached
                    ? 'bg-violet-500 text-white'
                    : 'bg-violet-950 text-violet-400 border border-violet-700'
                }`}>
                  {milestone.reached ? <CheckCircle2 className="w-4 h-4" /> : milestone.day}
                </div>
                <p className={`text-[10px] ${milestone.reached ? 'text-violet-200' : 'text-violet-400'}`}>
                  {milestone.label}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {!hasActiveTreatment && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="p-4 flex gap-3">
            <Stethoscope className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-900 dark:text-amber-100">
                No active hair treatment yet
              </p>
              <p className="text-sm text-amber-800 dark:text-amber-200 mt-1">
                Your portal is connected to your real record. Treatment, adherence and
                refill details will appear here only after your doctor approves and
                prescribes a hair care plan.
              </p>
              {data?.booking && (
                <p className="text-sm text-amber-800 dark:text-amber-200 mt-2">
                  Consultation: {formatDate(data.booking.scheduledAt)}
                  {data.booking.doctorName ? ` with ${data.booking.doctorName}` : ""}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/dashboard/mens-health/hair-loss/check-in">
          <Card className="overflow-hidden hover:shadow-lg transition-all cursor-pointer group border-2 border-violet-200 dark:border-violet-900 hover:border-violet-400">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Camera className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-semibold">Weekly Check-in</p>
                  <p className="text-xs text-muted-foreground">Photos & how you feel</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/mens-health/hair-loss/compare">
          <Card className="overflow-hidden hover:shadow-lg transition-all cursor-pointer group border-slate-200 dark:border-slate-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                  <BarChart3 className="w-6 h-6 text-slate-600 dark:text-slate-300" />
                </div>
                <div>
                  <p className="font-semibold">Compare</p>
                  <p className="text-xs text-muted-foreground">Before & after</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((stat, index) => (
          <Card key={index} className="border-slate-200 dark:border-slate-800">
            <CardContent className="p-4 text-center">
              <stat.icon className={`w-5 h-5 mx-auto mb-2 ${stat.color}`} />
              <p className="text-xl font-bold">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Current Treatments */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Pill className="w-5 h-5 text-violet-600" />
              Active Treatments
            </CardTitle>
            <Link href="/dashboard/mens-health/treatment">
              <Button variant="ghost" size="sm" className="text-violet-600">
                Manage <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <HairTreatmentsList
            prescriptions={data?.prescriptions || []}
            treatments={data?.treatments || []}
            onSaved={load}
          />
        </CardContent>
      </Card>

      {/* Typical progression */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-violet-600" />
            Typical progression
          </CardTitle>
          <p className="text-sm text-muted-foreground pt-1">
            Treatment differs from one person to another. A typical treatment program could result in the following progression:
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { period: "Month 1-3", title: "Initial Phase", description: "Some may experience temporary shedding as weak hairs make room for stronger ones.", icon: "🌱" },
              { period: "Month 3-6", title: "Stabilization", description: "Hair loss slows significantly. New baby hairs may start appearing.", icon: "🌿" },
              { period: "Month 6-12", title: "Visible Growth", description: "Noticeable improvement in hair density and thickness.", icon: "🌳" },
              { period: "Month 12+", title: "Maintenance", description: "Continue treatment to maintain results. Full benefits achieved.", icon: "✨" },
            ].map((phase, index) => (
              <div
                key={index}
                className={`flex gap-4 p-3 rounded-xl transition-colors ${
                  progressData.currentDay >= (index + 1) * 90
                    ? 'bg-violet-50 dark:bg-violet-950/20'
                    : 'bg-slate-50 dark:bg-slate-900/50'
                }`}
              >
                <div className="text-2xl">{phase.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm">{phase.title}</span>
                    <Badge variant="outline" className="text-xs">{phase.period}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{phase.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pro Tips */}
      <Card className="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/20 dark:to-purple-950/20 border-violet-200 dark:border-violet-900">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center shrink-0">
              <Lightbulb className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <p className="font-semibold text-sm text-violet-900 dark:text-violet-100">Pro Tip</p>
              <p className="text-sm text-violet-700 dark:text-violet-300 mt-1">
                Take your progress photos at the same time of day, in the same lighting and position for accurate comparisons.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
