"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Heart,
  Loader2,
  Lock,
  MessageCircle,
  Pill,
  Shield,
  Sparkles,
  Stethoscope,
  TrendingUp,
  AlertCircle,
  Package,
  Truck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PortalStateBadge } from "@/components/portal/PortalInsightState";
import { usePortalContext } from "@/hooks/usePortalContext";
import type { EntitlementState } from "@/lib/membership/biomarker-readiness";

type PortalData = {
  user: { firstName: string | null };
  isMember: boolean;
  entitlementStatus: string | null;
  focus: { id: string | null; label: string; summary: string };
  status: {
    phase: string;
    label: string;
    description: string;
  };
  booking: {
    id: string;
    status: string;
    scheduledAt: string;
    doctorName: string | null;
  } | null;
  prescription: {
    id: string;
    medicationName: string;
    strength: string;
    dosage: string;
    frequency: string;
    instructions: string | null;
    refillsRemaining: number;
    scriptStatus: string;
    label: string;
    description: string;
    nextRefillDate: string | null;
    trackingNumber: string | null;
    deliveredAt: string | null;
  } | null;
  treatment: {
    id: string;
    medicationName: string;
    dosage: string;
    frequency: string;
    instructions: string | null;
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

const EFFECTIVENESS_LABELS: Record<string, string> = {
  excellent: "Excellent response",
  good: "Good response",
  limited: "Limited response",
  none: "No response",
};

const TIMELINE_STEPS = [
  { key: "SCRIPT_DRAFT", label: "Prepared", icon: Pill },
  { key: "SCRIPT_WRITTEN", label: "Written", icon: CheckCircle2 },
  { key: "SCRIPT_SENT_TO_PHARMACY", label: "Pharmacy", icon: Package },
  { key: "SHIPPED", label: "Shipped", icon: Truck },
  { key: "DELIVERED", label: "Delivered", icon: CheckCircle2 },
];

function formatDate(date: string | null) {
  if (!date) return "Not scheduled";
  return new Date(date).toLocaleDateString("en-AU", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getTimelineIndex(status: string) {
  const index = TIMELINE_STEPS.findIndex((step) => step.key === status);
  if (status === "PHARMACY_PENDING" || status === "DISPENSING") return 2;
  return index;
}

export function MensSexualHealthDashboard() {
  const { data: portal } = usePortalContext();
  const [data, setData] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(true);

  const programState: EntitlementState =
    portal?.membership?.programs?.MENS_HEALTH_SEXUAL?.state ?? "locked_upgrade";
  const entitled =
    programState === "ready" ||
    programState === "partial" ||
    programState === "pending_results";

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/mens-health/sexual-health/portal");
      if (res.ok) {
        setData(await res.json());
      }
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
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  const firstName = data?.user.firstName;
  const timelineIndex = data?.prescription
    ? getTimelineIndex(data.prescription.scriptStatus)
    : -1;

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <Link href="/dashboard/mens-health" className="self-start">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="flex items-center gap-2 text-xl font-bold sm:text-2xl">
              <Heart className="h-5 w-5 shrink-0 text-teal-600 sm:h-6 sm:w-6" />
              Sexual Health
            </h1>
            <PortalStateBadge state={programState} />
          </div>
          <p className="text-muted-foreground">
            {firstName ? `Private care for ${firstName}` : "Confidential, clinician-guided care"}
          </p>
        </div>
      </div>

      <Card className="border-0 bg-gradient-to-r from-slate-900 to-slate-800 text-white">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-teal-500/20">
            <Lock className="h-6 w-6 text-teal-300" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold">100% private & discreet</p>
            <p className="text-sm text-slate-300">
              Encrypted records, plain packaging, and no pharmacy visits required.
            </p>
          </div>
          <Shield className="hidden h-8 w-8 shrink-0 text-slate-500 sm:block" />
        </CardContent>
      </Card>

      {!entitled && !data?.isMember && (
        <Card className="border-teal-200 bg-teal-50/60">
          <CardContent className="flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium text-slate-900">Join Sexual Health</p>
              <p className="text-sm text-slate-600">
                Answer a few confidential questions and start your subscription from the portal.
              </p>
            </div>
            <Button asChild className="bg-teal-700 hover:bg-teal-800">
              <Link href="/dashboard/programs/mens_health_sexual">Start quiz</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {(entitled || data?.isMember) && data && (
        <>
          <Card className="border-slate-200">
            <CardContent className="p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
                    Your program
                  </p>
                  <p className="mt-1 text-base font-semibold text-slate-900 sm:text-lg">{data.focus.label}</p>
                  <p className="mt-2 text-sm text-slate-600">{data.status.description}</p>
                </div>
                <Badge variant="secondary" className="w-fit shrink-0 bg-slate-100">
                  {data.status.label}
                </Badge>
              </div>
              {data.booking && (
                <div className="mt-4 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <Calendar className="h-5 w-5 text-teal-600" />
                  <div>
                    <p className="text-sm font-medium">Consultation</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(data.booking.scheduledAt)}
                      {data.booking.doctorName ? ` · ${data.booking.doctorName}` : ""}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {data.treatment && (
            <Card className="overflow-hidden border-0 bg-gradient-to-br from-slate-800 via-slate-900 to-teal-950 text-white">
              <CardContent className="p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-wider text-teal-200/80">
                      Active treatment
                    </p>
                    <p className="mt-1 text-xl font-bold sm:text-2xl">{data.treatment.medicationName}</p>
                    <p className="mt-1 text-sm text-slate-300">
                      {data.treatment.dosage} · {data.treatment.frequency}
                    </p>
                  </div>
                  {data.useStats.effectiveRate != null && (
                    <div className="text-left sm:text-right">
                      <p className="text-xs text-teal-200/80">30-day effectiveness</p>
                      <p className="text-2xl font-bold sm:text-3xl">{data.useStats.effectiveRate}%</p>
                    </div>
                  )}
                </div>
                <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-3">
                  <Link href="/dashboard/mens-health/sexual-health/log" className="w-full sm:w-auto">
                    <Button className="w-full bg-teal-600 hover:bg-teal-500 sm:w-auto">
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Log medication use
                    </Button>
                  </Link>
                  <Link href="/dashboard/mens-health/support" className="w-full sm:w-auto">
                    <Button variant="outline" className="w-full border-white/30 text-white hover:bg-white/10 sm:w-auto">
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Message care team
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {data.prescription && !data.treatment && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Prescription status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="font-medium">{data.prescription.medicationName}</p>
                  <p className="text-sm text-muted-foreground">
                    {data.prescription.dosage} · {data.prescription.frequency}
                  </p>
                  <p className="mt-2 text-sm text-slate-600">{data.prescription.description}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {TIMELINE_STEPS.map((step, index) => {
                    const Icon = step.icon;
                    const active = index <= timelineIndex;
                    return (
                      <div
                        key={step.key}
                        className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs ${
                          active
                            ? "bg-teal-100 text-teal-800"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {step.label}
                      </div>
                    );
                  })}
                </div>
                {data.prescription.nextRefillDate && (
                  <p className="text-sm text-muted-foreground">
                    Next refill: {formatDate(data.prescription.nextRefillDate)}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {(data.treatment || data.canLogUse) && (
            <div className="grid grid-cols-2 gap-3">
              <Link href="/dashboard/mens-health/sexual-health/log">
                <Card className="cursor-pointer border-teal-200 transition-all hover:border-teal-400 hover:shadow-md">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-600">
                        <CheckCircle2 className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold">Log use</p>
                        <p className="text-xs text-muted-foreground">Track how it worked</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
              <Link href="/dashboard/biomarkers?view=program&program=MENS_HEALTH">
                <Card className="cursor-pointer border-slate-200 transition-all hover:border-slate-300 hover:shadow-md">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
                        <TrendingUp className="h-6 w-6 text-slate-700" />
                      </div>
                      <div>
                        <p className="font-semibold">Biomarkers</p>
                        <p className="text-xs text-muted-foreground">Men&apos;s health panel</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          )}

          {!data.treatment && !data.canLogUse && data.status.phase === "awaiting_consultation" && (
            <div className="grid grid-cols-2 gap-3">
              <Link href="/dashboard/mens-health/support">
                <Card className="cursor-pointer border-slate-200 transition-all hover:border-slate-300 hover:shadow-md">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-600">
                        <MessageCircle className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold">Care team</p>
                        <p className="text-xs text-muted-foreground">Questions before consult</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
              <Link href="/dashboard/biomarkers?view=program&program=MENS_HEALTH">
                <Card className="cursor-pointer border-slate-200 transition-all hover:border-slate-300 hover:shadow-md">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
                        <TrendingUp className="h-6 w-6 text-slate-700" />
                      </div>
                      <div>
                        <p className="font-semibold">Biomarkers</p>
                        <p className="text-xs text-muted-foreground">Men&apos;s health panel</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          )}

          {data.recentUses.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Recent logs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.recentUses.slice(0, 5).map((use) => (
                  <div
                    key={use.id}
                    className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {use.effectiveness
                          ? EFFECTIVENESS_LABELS[use.effectiveness] || "Logged"
                          : "Logged"}
                      </p>
                      <p className="text-xs text-muted-foreground">{formatDate(use.takenAt)}</p>
                    </div>
                    {use.detail && (
                      <p className="max-w-[45%] truncate text-xs text-muted-foreground">
                        {use.detail}
                      </p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-teal-600" />
            How your care works
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            {
              title: "Confidential assessment",
              description: "Share your symptoms privately online",
              icon: Stethoscope,
            },
            {
              title: "Doctor review",
              description: "A licensed clinician reviews your history",
              icon: Shield,
            },
            {
              title: "Personalised plan",
              description: "Treatment only if safe and appropriate for you",
              icon: CheckCircle2,
            },
            {
              title: "Discreet delivery",
              description: "Medication shipped in plain packaging if prescribed",
              icon: Lock,
            },
          ].map((item) => (
            <div key={item.title} className="flex gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-100">
                <item.icon className="h-5 w-5 text-teal-700" />
              </div>
              <div>
                <p className="text-sm font-medium">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-amber-200 bg-amber-50/80">
        <CardContent className="flex gap-3 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
          <div>
            <p className="text-sm font-semibold text-amber-900">Safety reminder</p>
            <p className="mt-1 text-sm text-amber-800">
              Do not take ED medication if you use nitrates for chest pain. Always follow your
              doctor&apos;s instructions and contact the care team if you feel unwell.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Learn more</CardTitle>
            <Link href="/dashboard/mens-health/learn">
              <Button variant="ghost" size="sm" className="text-teal-700">
                See all <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <Link href="/dashboard/mens-health/learn">
            <div className="flex items-center gap-4 rounded-xl bg-slate-50 p-3 transition-colors hover:bg-slate-100">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-teal-100">
                <Heart className="h-5 w-5 text-teal-700" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Understanding ED & PE</p>
                <p className="text-xs text-muted-foreground">Causes, treatments and lifestyle tips</p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </Link>
        </CardContent>
      </Card>

      <Card className="border-0 bg-gradient-to-r from-slate-900 to-slate-800 text-white">
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="font-semibold">Need to talk to someone?</p>
            <p className="text-sm text-slate-300">Your care team is here for clinical questions.</p>
          </div>
          <Link href="/dashboard/mens-health/support" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full border-white/30 text-white hover:bg-white/10 sm:w-auto">
              Contact
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
