"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  Camera,
  Pill,
  Calendar,
  Sparkles,
  CheckCircle2,
  Lightbulb,
  Target,
  BarChart3,
  Loader2,
  Stethoscope,
  MessageCircle,
  ChevronDown,
  BookOpen,
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
import {
  HairFirstDoseForm,
  HairTreatmentsList,
} from "@/components/dashboard/HairTreatmentDoseCard";
import { ProgramSubscriptionGate } from "@/components/portal/ProgramSubscriptionGate";
import {
  canLogDoseScheduledFor,
  formatNextDoseDateShort,
  getCalendarDateKey,
  isDoseOverdue,
} from "@/lib/program/dose-schedule";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/** WM sage + daily-ring accents (orange / teal / emerald / coral). */
const RING = {
  orange: "#F97316",
  teal: "#0D9488",
  emerald: "#059669",
  coral: "#F87171",
} as const;

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
    nextDose?: { id: string; scheduledAt: string; canLog: boolean; overdue?: boolean } | null;
    loggedToday?: boolean;
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
  const [progressionOpen, setProgressionOpen] = useState(false);
  const [doseDialogOpen, setDoseDialogOpen] = useState(false);
  const [loggingDose, setLoggingDose] = useState(false);
  const [setupFirstDose, setSetupFirstDose] = useState(false);

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
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#4a6243]" />
      </div>
    );
  }

  const progressData = data?.progress || emptyProgress;
  const hasActiveTreatment = data?.status.hasActiveTreatment || false;
  const hairJourneyStatus =
    data?.hairJourney?.status ||
    resolveHairJourneyStatus({
      journeyStatus: null,
      approvalStatus: null,
      hasUpcomingBooking: Boolean(data?.booking && !data.booking.completedAt),
      consultCompleted: Boolean(data?.booking?.completedAt),
      hasHairPrescription: (data?.prescriptions.length ?? 0) > 0,
      hasActiveTreatment: (data?.treatments.length ?? 0) > 0,
      hairOnly: false,
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
    isApproved: hairJourneyStatus === "APPROVED" || programActive,
    hasPrescription: (data?.prescriptions.length ?? 0) > 0,
    hasTestsTracking: false,
    consultation:
      showCountdown && data?.booking
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

  const milestones = [
    { day: 30, label: "Initial", description: "Treatment adapting", reached: progressData.currentDay >= 30 },
    { day: 90, label: "Early", description: "Shedding may slow", reached: progressData.currentDay >= 90 },
    { day: 180, label: "Visible", description: "New growth", reached: progressData.currentDay >= 180 },
    { day: 365, label: "Full", description: "Maximum benefit", reached: progressData.currentDay >= 365 },
  ];

  const stats = [
    {
      label: "Days on treatment",
      value: hasActiveTreatment ? String(progressData.currentDay) : "—",
      icon: Calendar,
      accent: RING.teal,
    },
    {
      label: "Adherence",
      value: progressData.treatmentAdherence != null ? `${progressData.treatmentAdherence}%` : "—",
      icon: CheckCircle2,
      accent: RING.emerald,
    },
    {
      label: "Photos logged",
      value: String(progressData.photosLogged),
      icon: Camera,
      accent: RING.orange,
    },
    {
      label: "Next milestone",
      value: hasActiveTreatment ? `Day ${progressData.nextMilestone}` : "After approval",
      icon: Target,
      accent: RING.coral,
    },
  ];

  if (!programActive) {
    return (
      <div className="space-y-6">
        <ProgramJourneyShell
          programKey="HAIR_LOSS"
          firstName={data?.user.firstName}
          greeting={getProgramJourneyGreeting()}
          journey={journeyView}
        >
          <Card className="border-[#cdd8c6] bg-[#f8f4ec]">
            <CardHeader className="pb-2">
              <CardTitle className="font-serif text-base text-[#2c3628]">While you wait</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <Link href="/dashboard/mens-health/support">
                <div className="group relative h-full overflow-hidden rounded-2xl bg-gradient-to-br from-[#f8f4ec] to-[#e6ebe3] p-4 transition-transform duration-300 md:hover:scale-[1.02]">
                  <div className="relative z-10 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#cdd8c6]/50">
                      <MessageCircle className="h-6 w-6 text-[#4a6243]" />
                    </div>
                    <div>
                      <p className="font-serif text-sm text-[#2c3628]">Message Care Team</p>
                      <p className="text-xs text-[#5c7a52]">Ask questions</p>
                    </div>
                  </div>
                </div>
              </Link>
              <Link href="/dashboard/mens-health/hair-loss/compare">
                <div className="group relative h-full overflow-hidden rounded-2xl bg-gradient-to-br from-[#f0e8d8] to-[#e5d7bf] p-4 transition-transform duration-300 md:hover:scale-[1.02]">
                  <div className="relative z-10 flex items-center gap-3">
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-full"
                      style={{ backgroundColor: `${RING.teal}22` }}
                    >
                      <BarChart3 className="h-6 w-6" style={{ color: RING.teal }} />
                    </div>
                    <div>
                      <p className="font-serif text-sm text-[#2c3628]">Compare</p>
                      <p className="text-xs text-[#5c7a52]">Photo timeline</p>
                    </div>
                  </div>
                </div>
              </Link>
            </CardContent>
          </Card>
          {(data?.prescriptions.length || data?.treatments.length) ? (
            <Card className="border-[#cdd8c6] bg-[#f8f4ec]">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 font-serif text-base text-[#2c3628]">
                  <Pill className="h-5 w-5" style={{ color: RING.coral }} />
                  My treatments
                </CardTitle>
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

  const progressPct = hasActiveTreatment
    ? Math.min(100, Math.round((progressData.currentDay / 365) * 100))
    : 0;

  const primaryTreatment = data?.treatments?.[0] ?? null;
  const needsFirstDoseRx =
    data?.prescriptions.find((rx) => rx.needsFirstDose) ?? null;
  const nextDose = primaryTreatment?.nextDose ?? null;
  const medsLogged = Boolean(primaryTreatment?.loggedToday);
  const medsDue = Boolean(nextDose?.canLog);
  const medsOverdue = Boolean(
    nextDose &&
      (nextDose.overdue ?? isDoseOverdue(nextDose.scheduledAt)) &&
      !medsLogged
  );
  const medsDueToday = Boolean(
    nextDose &&
      medsDue &&
      !medsOverdue &&
      getCalendarDateKey(new Date()) === getCalendarDateKey(new Date(nextDose.scheduledAt))
  );
  const nextDoseLabel = nextDose
    ? formatNextDoseDateShort(nextDose.scheduledAt)
    : null;
  const medsValue = needsFirstDoseRx
    ? "Set up"
    : medsLogged
      ? "Well done"
      : medsOverdue
        ? "Overdue"
        : medsDueToday
          ? "Due today"
          : nextDoseLabel
            ? nextDoseLabel
            : "Not due";
  const medsHint = needsFirstDoseRx
    ? "Enter first dose date"
    : medsLogged
      ? "Logged"
      : medsOverdue && nextDoseLabel
        ? `Was due ${nextDoseLabel}`
        : medsDueToday
          ? "Tap to log dose"
          : nextDoseLabel
            ? "Next dose"
            : primaryTreatment
              ? "No doses scheduled"
              : "Awaiting prescription";

  const openMedsAction = () => {
    if (needsFirstDoseRx) {
      setSetupFirstDose(true);
      return;
    }
    if (nextDose?.canLog) {
      setDoseDialogOpen(true);
      return;
    }
    if (nextDose) {
      toast.message(`Next dose ${formatNextDoseDateShort(nextDose.scheduledAt)}`);
    }
  };

  const logDoseTaken = async () => {
    if (!nextDose?.id) return;
    if (!canLogDoseScheduledFor(nextDose.scheduledAt)) {
      toast.error("You can log this dose on its scheduled date");
      return;
    }
    setLoggingDose(true);
    try {
      const res = await fetch(`/api/program/doses/${nextDose.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "taken", sideEffects: [] }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Failed to log dose");
      toast.success("Dose logged");
      setDoseDialogOpen(false);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not log dose");
    } finally {
      setLoggingDose(false);
    }
  };

  return (
    <ProgramSubscriptionGate programSlug="hair_loss">
    <div className="space-y-6">
      {/* Hero — active program (no journey shell) */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#4a6243] via-[#3d4f38] to-[#34412f] p-6 text-white">
        <div className="absolute top-0 right-0 h-40 w-40 -translate-y-1/2 translate-x-1/3 rounded-full bg-white/5" />
        <div className="absolute bottom-0 left-0 h-32 w-32 translate-y-1/2 -translate-x-1/3 rounded-full bg-white/5" />
        <div
          className="pointer-events-none absolute top-6 right-10 h-16 w-16 rounded-full opacity-30 blur-xl"
          style={{ backgroundColor: RING.orange }}
        />
        <div
          className="pointer-events-none absolute bottom-8 right-24 h-12 w-12 rounded-full opacity-25 blur-lg"
          style={{ backgroundColor: RING.teal }}
        />

        <div className="relative z-10">
          <p className="mb-1 text-sm text-[#cdd8c6]">Hair Restoration</p>
          <h1 className="mb-1 font-serif text-2xl font-semibold md:text-3xl">
            {data?.user.firstName || "Your"} hair journey
          </h1>
          <p className="text-sm text-[#a8bb9e]">Track progress and stay consistent with treatment</p>

          <div className="mt-4 flex flex-wrap items-end gap-6">
            <div>
              <p className="text-xs uppercase tracking-wider text-[#cdd8c6]">
                {hasActiveTreatment ? "Day" : "Status"}
              </p>
              <p className="text-3xl font-bold">
                {hasActiveTreatment ? progressData.currentDay : data?.status.label || "Active"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Journey progress — sage card with ring-coloured milestone dots */}
      <Card className="border-[#cdd8c6] bg-gradient-to-br from-[#f8f4ec] to-[#e6ebe3]">
        <CardContent className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[#4a6243]" />
              <span className="font-serif font-semibold text-[#2c3628]">Your year of growth</span>
            </div>
            <span className="text-xs font-medium text-[#4a6243]">{progressPct}%</span>
          </div>
          <div className="mb-4 h-2 overflow-hidden rounded-full bg-[#cdd8c6]">
            <div
              className="h-full rounded-full bg-[#4a6243] transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="flex justify-between gap-1">
            {milestones.map((milestone, index) => {
              const accents = [RING.orange, RING.teal, RING.emerald, RING.coral];
              const accent = accents[index];
              return (
                <div key={milestone.day} className="flex-1 text-center">
                  <div
                    className={cn(
                      "mx-auto mb-1 flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold",
                      milestone.reached ? "text-white" : "bg-[#cdd8c6]/40 text-[#5c7a52]"
                    )}
                    style={milestone.reached ? { backgroundColor: accent } : undefined}
                  >
                    {milestone.reached ? <CheckCircle2 className="h-4 w-4" /> : milestone.day}
                  </div>
                  <p
                    className={cn(
                      "text-[10px] font-medium",
                      milestone.reached ? "text-[#2c3628]" : "text-[#5c7a52]"
                    )}
                  >
                    {milestone.label}
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {!hasActiveTreatment && (
        <Card className="border-[#e5d7bf] bg-gradient-to-br from-[#f8f4ec] to-[#f0e8d8]">
          <CardContent className="flex gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#c17a58]/20">
              <Stethoscope className="h-5 w-5 text-[#c17a58]" />
            </div>
            <div>
              <p className="font-serif font-semibold text-[#2c3628]">No active hair treatment yet</p>
              <p className="mt-1 text-sm text-[#5c7a52]">
                Treatment, adherence and refill details appear here after your doctor approves your
                hair care plan.
              </p>
              {data?.booking && (
                <p className="mt-2 text-sm text-[#5c7a52]">
                  Consultation: {formatDate(data.booking.scheduledAt)}
                  {data.booking.doctorName ? ` with ${data.booking.doctorName}` : ""}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Primary actions — WM daily-log icon swatches */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/dashboard/mens-health/hair-loss/check-in">
          <div className="group relative flex h-full min-h-[140px] flex-col overflow-hidden rounded-2xl bg-gradient-to-br from-[#f0e8d8] to-[#e5d7bf] p-4 transition-transform duration-300 md:hover:scale-[1.02]">
            <div className="relative z-10 mb-auto flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-[#5c7a52]">This week</span>
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white"
                style={{ backgroundColor: RING.orange }}
              >
                <Camera className="h-4 w-4" strokeWidth={2.25} />
              </span>
            </div>
            <div className="relative z-10 mt-3">
              <h3 className="font-serif text-lg text-[#2c3628]">Weekly check-in</h3>
              <p className="text-sm text-[#5c7a52]">Photos and how you feel</p>
            </div>
          </div>
        </Link>

        <button
          type="button"
          onClick={openMedsAction}
          className="group relative flex h-full min-h-[140px] w-full flex-col overflow-hidden rounded-2xl bg-gradient-to-br from-[#4a6243] to-[#3d4f38] p-4 text-left transition-transform duration-300 md:hover:scale-[1.02]"
        >
          <div className="pointer-events-none absolute top-1 right-1 h-8 w-8 rounded-full bg-white/10 blur-md" />
          <div className="relative z-10 flex h-7 shrink-0 items-center justify-between gap-2">
            <p className="truncate text-xs leading-4 text-[#cdd8c6]">Meds</p>
            <span
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white"
              style={{ backgroundColor: RING.coral }}
              aria-hidden
            >
              <Pill className="h-3.5 w-3.5" strokeWidth={2.25} />
            </span>
          </div>
          <p
            className={cn(
              "relative z-10 mt-1 h-6 shrink-0 truncate text-sm font-medium leading-6 text-white",
              medsValue === "Well done" && "text-[#d8d6d2]",
              medsOverdue && "text-[#fecaca]"
            )}
          >
            {medsValue}
          </p>
          <p className="relative z-10 mt-auto h-8 shrink-0 text-[11px] leading-4 text-[#a8bb9e]">
            <span className="line-clamp-2">{medsHint}</span>
          </p>
          {(medsDue || medsOverdue) && (
            <span className="relative z-10 mt-2 inline-flex items-center gap-1 text-xs font-medium text-white">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Tap to log dose
            </span>
          )}
          {needsFirstDoseRx && (
            <span className="relative z-10 mt-2 inline-flex items-center gap-1 text-xs font-medium text-white">
              Tap to set first dose
            </span>
          )}
        </button>

        <Link href="/dashboard/mens-health/hair-loss/compare">
          <div className="group relative flex h-full min-h-[100px] flex-col overflow-hidden rounded-2xl bg-gradient-to-br from-[#e6ebe3] to-[#cdd8c6] p-4 transition-transform duration-300 md:hover:scale-[1.02]">
            <div className="relative z-10 mb-2 flex items-center justify-between gap-2">
              <p className="font-serif text-sm text-[#2c3628]">Compare</p>
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white"
                style={{ backgroundColor: RING.teal }}
              >
                <BarChart3 className="h-4 w-4" strokeWidth={2.25} />
              </span>
            </div>
            <p className="relative z-10 text-xs text-[#5c7a52]">Photo timeline</p>
          </div>
        </Link>

        <Link href="/dashboard/mens-health/support">
          <div className="group relative flex h-full min-h-[100px] flex-col overflow-hidden rounded-2xl bg-gradient-to-br from-[#cdd8c6] to-[#a8bb9e] p-4 transition-transform duration-300 md:hover:scale-[1.02]">
            <div className="relative z-10 mb-2 flex items-center justify-between gap-2">
              <p className="font-serif text-sm text-[#2c3628]">Care team</p>
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white"
                style={{ backgroundColor: RING.emerald }}
              >
                <MessageCircle className="h-4 w-4" strokeWidth={2.25} />
              </span>
            </div>
            <p className="relative z-10 text-xs text-[#5c7a52]">Get help</p>
          </div>
        </Link>
      </div>

      {/* Stats — ring accent icons */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-[#cdd8c6] bg-[#f8f4ec]">
            <CardContent className="p-4 text-center">
              <stat.icon className="mx-auto mb-2 h-5 w-5" style={{ color: stat.accent }} />
              <p className="font-serif text-xl font-semibold text-[#2c3628]">{stat.value}</p>
              <p className="text-[10px] text-[#5c7a52]">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-[#e5d7bf] bg-gradient-to-br from-[#f8f4ec] to-[#f0e8d8]">
        <Collapsible open={progressionOpen} onOpenChange={setProgressionOpen}>
          <CollapsibleTrigger className="flex w-full items-start justify-between gap-3 p-4 text-left">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#c17a58]/20">
                <BookOpen className="h-5 w-5 text-[#c17a58]" />
              </div>
              <div className="min-w-0">
                <p className="mb-1 text-xs font-bold uppercase tracking-wider text-[#c17a58]">
                  Learn
                </p>
                <p className="font-serif text-sm text-[#2c3628]">Typical progression</p>
                {!progressionOpen && (
                  <p className="mt-1 text-xs text-[#5c7a52]">
                    What to expect over the first year of treatment
                  </p>
                )}
              </div>
            </div>
            <ChevronDown
              className={cn(
                "mt-1 h-5 w-5 shrink-0 text-[#c17a58] transition-transform",
                progressionOpen && "rotate-180"
              )}
            />
          </CollapsibleTrigger>
          <CollapsibleContent className="overflow-hidden data-[state=closed]:hidden">
            <div className="space-y-3 px-4 pb-4">
              <p className="text-xs text-[#5c7a52]">
                Results vary. A typical program might look like this:
              </p>
              {[
                {
                  period: "Month 1–3",
                  title: "Initial phase",
                  description:
                    "Some people notice temporary shedding as weaker hairs make room for stronger ones.",
                  accent: RING.orange,
                },
                {
                  period: "Month 3–6",
                  title: "Stabilisation",
                  description: "Hair loss often slows. Fine new hairs may start to appear.",
                  accent: RING.teal,
                },
                {
                  period: "Month 6–12",
                  title: "Visible growth",
                  description:
                    "Density and thickness often improve for people who stay consistent.",
                  accent: RING.emerald,
                },
                {
                  period: "Month 12+",
                  title: "Maintenance",
                  description:
                    "Continue treatment to maintain results once benefits are established.",
                  accent: RING.coral,
                },
              ].map((phase, index) => {
                const reached = progressData.currentDay >= (index + 1) * 90;
                return (
                  <div
                    key={phase.period}
                    className={cn(
                      "flex gap-4 rounded-xl border p-3 transition-colors",
                      reached
                        ? "border-[#cdd8c6] bg-[#e6ebe3]/60"
                        : "border-transparent bg-[#f0e8d8]/50"
                    )}
                  >
                    <div
                      className="mt-0.5 h-3 w-3 shrink-0 rounded-full"
                      style={{
                        backgroundColor: phase.accent,
                        opacity: reached ? 1 : 0.45,
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <span className="font-serif text-sm text-[#2c3628]">{phase.title}</span>
                        <Badge
                          variant="outline"
                          className="border-[#cdd8c6] text-xs text-[#4a6243]"
                        >
                          {phase.period}
                        </Badge>
                      </div>
                      <p className="text-xs text-[#5c7a52]">{phase.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      <Card className="border-[#e5d7bf] bg-gradient-to-br from-[#f8f4ec] to-[#f0e8d8]">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#c17a58]/20">
              <Lightbulb className="h-5 w-5 text-[#c17a58]" />
            </div>
            <div>
              <p className="mb-1 text-xs font-bold uppercase tracking-wider text-[#c17a58]">
                Tip
              </p>
              <p className="font-serif text-sm text-[#2c3628]">Same light, same angle</p>
              <p className="mt-1 text-xs text-[#5c7a52]">
                Take progress photos at the same time of day, in the same lighting and position for
                clearer comparisons.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={doseDialogOpen} onOpenChange={setDoseDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Log this dose?</DialogTitle>
            <DialogDescription>
              Confirm you have taken{" "}
              {primaryTreatment
                ? `${primaryTreatment.medicationName} (${primaryTreatment.dosage})`
                : "your prescribed dose"}
              {nextDose ? ` on ${formatNextDoseDateShort(nextDose.scheduledAt)}` : ""}, as
              prescribed by your clinician.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            Only log doses taken as prescribed on or after the scheduled date.
          </div>
          <div className="flex flex-col gap-2 pt-2">
            <Button
              onClick={logDoseTaken}
              disabled={loggingDose}
              className="bg-[#4a6243] hover:bg-[#3d4f38]"
            >
              {loggingDose ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-2 h-4 w-4" />
              )}
              Yes, I took it
            </Button>
            <Button variant="outline" onClick={() => setDoseDialogOpen(false)}>
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={setupFirstDose} onOpenChange={setSetupFirstDose}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Set your first dose</DialogTitle>
            <DialogDescription>
              Enter when you took or will take the first dose. Later doses are calculated from
              this date.
            </DialogDescription>
          </DialogHeader>
          {needsFirstDoseRx ? (
            <HairFirstDoseForm
              prescriptionId={needsFirstDoseRx.id}
              onSaved={() => {
                setSetupFirstDose(false);
                void load();
              }}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
    </ProgramSubscriptionGate>
  );
}
