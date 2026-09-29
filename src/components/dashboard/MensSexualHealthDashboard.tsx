"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Heart,
  Lightbulb,
  Loader2,
  MessageCircle,
  Pill,
  Sparkles,
  Stethoscope,
  Target,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  ProgramJourneyShell,
  getProgramJourneyGreeting,
  type ProgramJourneyViewModel,
} from "@/components/dashboard/ProgramJourneyShell";
import {
  getSexualJourneyStageDescription,
  resolveSexualJourneyStatus,
} from "@/lib/program-journey/sexual-journey";
import { ProgramSubscriptionGate } from "@/components/portal/ProgramSubscriptionGate";
import { cn } from "@/lib/utils";

const RING = {
  orange: "#F97316",
  teal: "#0D9488",
  emerald: "#059669",
  coral: "#F87171",
} as const;

type PortalData = {
  user: {
    firstName: string | null;
    journeyStatus: string | null;
    approvalStatus: string | null;
  };
  isMember: boolean;
  sexualJourney?: { status: string; label: string };
  focus: { id: string | null; label: string; summary: string };
  status: {
    phase: string;
    label: string;
    description: string;
    hasPaid: boolean;
    isApproved: boolean;
    hasActiveTreatment: boolean;
  };
  booking: {
    id: string;
    status: string;
    scheduledAt: string;
    doctorName: string | null;
    completedAt: string | null;
  } | null;
  progress: {
    currentDay: number;
    totalDays: number;
    startDate: string | null;
    treatmentAdherence: number | null;
    usesLogged: number;
    nextMilestone: number;
  };
  prescriptions: Array<{
    id: string;
    medicationName: string;
    dosage: string;
    frequency: string;
    scriptStatus: string;
    label?: string;
    description?: string;
    needsFirstDose?: boolean;
  }>;
  prescription: {
    id: string;
    medicationName: string;
    dosage: string;
    frequency: string;
    scriptStatus: string;
    label: string;
    description: string;
  } | null;
  treatments: Array<{
    id: string;
    medicationName: string;
    dosage: string;
    frequency: string;
  }>;
  treatment: {
    id: string;
    medicationName: string;
    dosage: string;
    frequency: string;
  } | null;
  recentUses: Array<{
    id: string;
    takenAt: string;
    effectiveness: string | null;
    detail: string | null;
  }>;
  useStats: {
    totalLogged: number;
    last30Days: number;
    effectiveRate: number | null;
  };
  canLogUse: boolean;
};

const emptyProgress = {
  currentDay: 0,
  totalDays: 90,
  startDate: null,
  treatmentAdherence: null,
  usesLogged: 0,
  nextMilestone: 7,
};

const EFFECTIVENESS_LABELS: Record<string, string> = {
  excellent: "Excellent",
  good: "Good",
  limited: "Limited",
  none: "No response",
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-AU", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function MensSexualHealthDashboard() {
  const [data, setData] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [learnOpen, setLearnOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/mens-health/sexual-health/portal");
      if (!res.ok) throw new Error("Failed to load");
      setData(await res.json());
    } catch (error) {
      console.error("Sexual health portal load error:", error);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#4a6243]" />
      </div>
    );
  }

  const progressData = data?.progress || emptyProgress;
  const hasActiveTreatment = data?.status.hasActiveTreatment || Boolean(data?.treatment);
  const sexualJourneyStatus =
    data?.sexualJourney?.status ||
    resolveSexualJourneyStatus({
      journeyStatus: null,
      approvalStatus: null,
      hasUpcomingBooking: Boolean(data?.booking && !data.booking.completedAt),
      consultCompleted: Boolean(data?.booking?.completedAt),
      hasSexualPrescription: (data?.prescriptions?.length ?? 0) > 0 || Boolean(data?.prescription),
      hasActiveTreatment,
      sexualOnly: false,
    });
  const sexualJourneyLabel =
    data?.sexualJourney?.label || getSexualJourneyStageDescription(sexualJourneyStatus);
  const programActive = sexualJourneyStatus === "ACTIVE";

  const showCountdown =
    Boolean(data?.booking) &&
    !data?.booking?.completedAt &&
    (sexualJourneyStatus === "AWAITING_DOCTOR_CALL" ||
      sexualJourneyStatus === "CONSULTATION_PAID");

  const journeyView: ProgramJourneyViewModel = {
    journeyStatus: sexualJourneyStatus,
    stageDescription: data?.status.label || sexualJourneyLabel,
    stage:
      sexualJourneyStatus === "AWAITING_DOCTOR_CALL"
        ? "consultation"
        : sexualJourneyStatus === "APPROVED" || programActive
          ? "approved"
          : "pre-consultation",
    isApproved: sexualJourneyStatus === "APPROVED" || programActive,
    hasPrescription: (data?.prescriptions?.length ?? 0) > 0 || Boolean(data?.prescription),
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
    { day: 7, label: "Week 1", description: "Getting started", reached: progressData.currentDay >= 7 },
    { day: 14, label: "Week 2", description: "Settling in", reached: progressData.currentDay >= 14 },
    { day: 30, label: "Month 1", description: "Review response", reached: progressData.currentDay >= 30 },
    { day: 90, label: "Month 3", description: "Optimise plan", reached: progressData.currentDay >= 90 },
  ];

  const stats = [
    {
      label: "Days on treatment",
      value: hasActiveTreatment ? String(progressData.currentDay) : "—",
      icon: Calendar,
      accent: RING.teal,
    },
    {
      label: "30-day response",
      value:
        progressData.treatmentAdherence != null ? `${progressData.treatmentAdherence}%` : "—",
      icon: CheckCircle2,
      accent: RING.emerald,
    },
    {
      label: "Uses logged",
      value: String(progressData.usesLogged),
      icon: Pill,
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
      <ProgramSubscriptionGate programSlug="mens_health_sexual">
        <div className="space-y-6">
          <ProgramJourneyShell
            programKey="MENS_HEALTH_SEXUAL"
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
                        <p className="text-xs text-[#5c7a52]">Private questions</p>
                      </div>
                    </div>
                  </div>
                </Link>
                <Link href="/dashboard/mens-health/sexual-health/log">
                  <div className="group relative h-full overflow-hidden rounded-2xl bg-gradient-to-br from-[#f0e8d8] to-[#e5d7bf] p-4 transition-transform duration-300 md:hover:scale-[1.02]">
                    <div className="relative z-10 flex items-center gap-3">
                      <div
                        className="flex h-12 w-12 items-center justify-center rounded-full"
                        style={{ backgroundColor: `${RING.teal}22` }}
                      >
                        <Pill className="h-6 w-6" style={{ color: RING.teal }} />
                      </div>
                      <div>
                        <p className="font-serif text-sm text-[#2c3628]">Log use</p>
                        <p className="text-xs text-[#5c7a52]">Available after script</p>
                      </div>
                    </div>
                  </div>
                </Link>
              </CardContent>
            </Card>

            {(data?.prescriptions?.length || data?.prescription) && (
              <Card className="border-[#cdd8c6] bg-[#f8f4ec]">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 font-serif text-base text-[#2c3628]">
                    <Pill className="h-5 w-5" style={{ color: RING.coral }} />
                    Your prescription
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(data.prescriptions?.length
                    ? data.prescriptions
                    : data.prescription
                      ? [data.prescription]
                      : []
                  ).map((rx) => (
                    <div key={rx.id} className="rounded-xl border border-[#cdd8c6] bg-white/70 p-3">
                      <p className="font-medium text-[#2c3628]">{rx.medicationName}</p>
                      <p className="text-sm text-[#5c7a52]">
                        {rx.dosage} · {rx.frequency}
                      </p>
                      {"label" in rx && rx.label ? (
                        <Badge className="mt-2 bg-[#e6ebe3] text-[#4a6243]">{rx.label}</Badge>
                      ) : null}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </ProgramJourneyShell>
        </div>
      </ProgramSubscriptionGate>
    );
  }

  const progressPct = hasActiveTreatment
    ? Math.min(100, Math.round((progressData.currentDay / 90) * 100))
    : 0;

  return (
    <ProgramSubscriptionGate programSlug="mens_health_sexual">
      <div className="space-y-6">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#4a6243] via-[#3d4f38] to-[#34412f] p-6 text-white">
          <div className="absolute top-0 right-0 h-40 w-40 -translate-y-1/2 translate-x-1/3 rounded-full bg-white/5" />
          <div className="relative z-10">
            <p className="mb-1 text-sm text-[#cdd8c6]">Men&apos;s Health · Erectile Dysfunction</p>
            <h1 className="mb-1 font-serif text-2xl font-semibold md:text-3xl">
              {data?.user.firstName || "Your"} ED care
            </h1>
            <p className="text-sm text-[#a8bb9e]">
              {data?.focus.label || "Confidential clinician-guided treatment"}
            </p>
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

        <Card className="border-[#cdd8c6] bg-gradient-to-br from-[#f8f4ec] to-[#e6ebe3]">
          <CardContent className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-[#4a6243]" />
                <span className="font-serif font-semibold text-[#2c3628]">Your first 90 days</span>
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
                <p className="font-serif font-semibold text-[#2c3628]">
                  {data?.prescription
                    ? "Script ready — start logging use"
                    : "No active ED treatment yet"}
                </p>
                <p className="mt-1 text-sm text-[#5c7a52]">
                  {data?.prescription
                    ? `${data.prescription.medicationName} · ${data.prescription.description}`
                    : "Treatment details appear here after your doctor approves your plan."}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Link href="/dashboard/mens-health/sexual-health/check-in">
            <div className="group relative flex h-full min-h-[140px] flex-col overflow-hidden rounded-2xl bg-gradient-to-br from-[#f0e8d8] to-[#e5d7bf] p-4 transition-transform duration-300 md:hover:scale-[1.02]">
              <div className="relative z-10 mb-auto flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-[#5c7a52]">This week</span>
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white"
                  style={{ backgroundColor: RING.orange }}
                >
                  <Sparkles className="h-4 w-4" strokeWidth={2.25} />
                </span>
              </div>
              <div className="relative z-10 mt-3">
                <h3 className="font-serif text-lg text-[#2c3628]">Weekly check-in</h3>
                <p className="text-sm text-[#5c7a52]">Confidence and side effects</p>
              </div>
            </div>
          </Link>

          <Link
            href="/dashboard/mens-health/sexual-health/log"
            className="group relative flex h-full min-h-[140px] w-full flex-col overflow-hidden rounded-2xl bg-gradient-to-br from-[#4a6243] to-[#3d4f38] p-4 text-left transition-transform duration-300 md:hover:scale-[1.02]"
          >
            <div className="relative z-10 flex h-7 shrink-0 items-center justify-between gap-2">
              <p className="truncate text-xs leading-4 text-[#cdd8c6]">Meds</p>
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white"
                style={{ backgroundColor: RING.coral }}
              >
                <Pill className="h-3.5 w-3.5" strokeWidth={2.25} />
              </span>
            </div>
            <p className="relative z-10 mt-1 h-6 shrink-0 truncate text-sm font-medium leading-6 text-white">
              {data?.canLogUse ? "Log use" : "Awaiting script"}
            </p>
            <p className="relative z-10 mt-auto h-8 shrink-0 text-[11px] leading-4 text-[#a8bb9e]">
              <span className="line-clamp-2">
                {data?.treatment
                  ? `${data.treatment.medicationName} · track how it worked`
                  : "As-needed ED medication log"}
              </span>
            </p>
          </Link>

          <Link href="/dashboard/mens-health/support">
            <div className="group relative flex h-full min-h-[100px] flex-col overflow-hidden rounded-2xl bg-gradient-to-br from-[#e6ebe3] to-[#cdd8c6] p-4 transition-transform duration-300 md:hover:scale-[1.02]">
              <div className="relative z-10 mb-2 flex items-center justify-between gap-2">
                <p className="font-serif text-sm text-[#2c3628]">Care team</p>
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white"
                  style={{ backgroundColor: RING.emerald }}
                >
                  <MessageCircle className="h-4 w-4" strokeWidth={2.25} />
                </span>
              </div>
              <p className="relative z-10 text-xs text-[#5c7a52]">Private support</p>
            </div>
          </Link>

          <Link href="/dashboard/biomarkers?view=program&program=MENS_HEALTH">
            <div className="group relative flex h-full min-h-[100px] flex-col overflow-hidden rounded-2xl bg-gradient-to-br from-[#cdd8c6] to-[#a8bb9e] p-4 transition-transform duration-300 md:hover:scale-[1.02]">
              <div className="relative z-10 mb-2 flex items-center justify-between gap-2">
                <p className="font-serif text-sm text-[#2c3628]">Biomarkers</p>
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white"
                  style={{ backgroundColor: RING.teal }}
                >
                  <Target className="h-4 w-4" strokeWidth={2.25} />
                </span>
              </div>
              <p className="relative z-10 text-xs text-[#5c7a52]">Men&apos;s health panel</p>
            </div>
          </Link>
        </div>

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

        {data?.recentUses && data.recentUses.length > 0 && (
          <Card className="border-[#cdd8c6] bg-[#f8f4ec]">
            <CardHeader className="pb-2">
              <CardTitle className="font-serif text-base text-[#2c3628]">Recent logs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.recentUses.slice(0, 5).map((use) => (
                <div
                  key={use.id}
                  className="flex items-center justify-between rounded-lg border border-[#cdd8c6] bg-white/70 px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium text-[#2c3628]">
                      {use.effectiveness
                        ? EFFECTIVENESS_LABELS[use.effectiveness] || "Logged"
                        : "Logged"}
                    </p>
                    <p className="text-xs text-[#5c7a52]">{formatDate(use.takenAt)}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Card className="border-[#e5d7bf] bg-gradient-to-br from-[#f8f4ec] to-[#f0e8d8]">
          <Collapsible open={learnOpen} onOpenChange={setLearnOpen}>
            <CollapsibleTrigger className="flex w-full items-start justify-between gap-3 p-4 text-left">
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#c17a58]/20">
                  <BookOpen className="h-5 w-5 text-[#c17a58]" />
                </div>
                <div className="min-w-0">
                  <p className="mb-1 text-xs font-bold uppercase tracking-wider text-[#c17a58]">
                    Learn
                  </p>
                  <p className="font-serif text-sm text-[#2c3628]">What to expect with ED treatment</p>
                </div>
              </div>
              <ChevronDown
                className={cn(
                  "mt-1 h-5 w-5 shrink-0 text-[#c17a58] transition-transform",
                  learnOpen && "rotate-180"
                )}
              />
            </CollapsibleTrigger>
            <CollapsibleContent className="overflow-hidden data-[state=closed]:hidden">
              <div className="space-y-3 px-4 pb-4">
                {[
                  {
                    title: "As needed vs daily",
                    description:
                      "Sildenafil is usually taken before activity. Low-dose Tadalafil may be daily — follow your script.",
                    accent: RING.orange,
                  },
                  {
                    title: "Timing matters",
                    description:
                      "Allow enough time before intimacy, and avoid heavy meals with Sildenafil when possible.",
                    accent: RING.teal,
                  },
                  {
                    title: "Track what works",
                    description:
                      "Log each use so your doctor can adjust dose or switch medication if needed.",
                    accent: RING.emerald,
                  },
                  {
                    title: "Safety first",
                    description:
                      "Never combine with nitrates. Contact care team for chest pain, vision changes, or prolonged erection.",
                    accent: RING.coral,
                  },
                ].map((phase) => (
                  <div
                    key={phase.title}
                    className="flex gap-4 rounded-xl border border-[#cdd8c6] bg-[#e6ebe3]/40 p-3"
                  >
                    <div
                      className="mt-0.5 h-3 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: phase.accent }}
                    />
                    <div>
                      <p className="font-serif text-sm text-[#2c3628]">{phase.title}</p>
                      <p className="text-xs text-[#5c7a52]">{phase.description}</p>
                    </div>
                  </div>
                ))}
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
                <p className="mb-1 text-xs font-bold uppercase tracking-wider text-[#c17a58]">Tip</p>
                <p className="font-serif text-sm text-[#2c3628]">Complete your weekly check-in</p>
                <p className="mt-1 text-xs text-[#5c7a52]">
                  Short check-ins help your care team spot side effects early and refine your plan.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50/80">
          <CardContent className="flex gap-3 p-4">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
            <div>
              <p className="text-sm font-semibold text-amber-900">Safety reminder</p>
              <p className="mt-1 text-sm text-amber-800">
                Do not take ED medication if you use nitrates for chest pain. Follow your doctor&apos;s
                instructions and contact the care team if you feel unwell.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </ProgramSubscriptionGate>
  );
}
