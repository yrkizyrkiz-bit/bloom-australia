"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  Pill,
  CheckCircle2,
  Package,
  Truck,
  Sparkles,
  Heart,
  Loader2,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

interface HairPortalTreatment {
  id: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  nextDoseDate: string | null;
  adherence: number | null;
}

interface HairPortalPrescription {
  id: string;
  medicationName: string;
  strength: string;
  dosage: string;
  frequency: string;
  status: string;
  nextRefillDate: string | null;
}

interface HairPortalData {
  isHairMember: boolean;
  treatments: HairPortalTreatment[];
  prescriptions: HairPortalPrescription[];
}

interface SexualHealthPortalData {
  isMember: boolean;
  status: {
    phase: string;
    label: string;
    description: string;
  };
  prescription: {
    id: string;
    medicationName: string;
    strength: string;
    dosage: string;
    frequency: string;
    refillsRemaining: number;
    label: string;
    description: string;
    nextRefillDate: string | null;
    trackingNumber: string | null;
  } | null;
  treatment: {
    id: string;
    medicationName: string;
    dosage: string;
    frequency: string;
  } | null;
  canLogUse: boolean;
  useStats: {
    totalLogged: number;
    effectiveRate: number | null;
  };
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
  });
}

function HairTreatmentSection({ data }: { data: HairPortalData }) {
  const hairItems = data.treatments.length
    ? data.treatments
    : data.prescriptions.map((rx) => ({
        id: rx.id,
        medicationName: rx.medicationName,
        dosage: rx.strength || rx.dosage,
        frequency: rx.frequency,
        nextDoseDate: null,
        adherence: null,
      }));

  return (
    <Card className="border-slate-200 dark:border-slate-800">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-violet-600" />
            Hair Loss
          </CardTitle>
          <Link href="/dashboard/mens-health/hair-loss">
            <Button variant="ghost" size="sm" className="text-violet-700">
              Hub <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {hairItems.length ? (
          hairItems.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-violet-200 bg-violet-50 p-4 dark:border-violet-900 dark:bg-violet-950/20"
            >
              <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="font-semibold">{item.medicationName}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.dosage} · {item.frequency}
                  </p>
                </div>
                <Badge className="w-fit bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  Active
                </Badge>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Adherence</span>
                  <span className="font-medium">
                    {item.adherence != null ? `${item.adherence}%` : "Starts after dosing"}
                  </span>
                </div>
                <Progress value={item.adherence ?? 0} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {item.nextDoseDate
                    ? `Next dose: ${formatDate(item.nextDoseDate)}`
                    : "Dose schedule will appear after setup"}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-xl border border-dashed p-6 text-center text-muted-foreground">
            <Pill className="mx-auto mb-2 h-8 w-8" />
            <p className="font-medium">No hair treatment prescribed yet</p>
            <p className="mt-1 text-sm">
              Your doctor-approved treatment will appear here after triage and approval.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SexualHealthTreatmentSection({ data }: { data: SexualHealthPortalData }) {
  return (
    <Card className="border-slate-200 dark:border-slate-800">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Heart className="h-5 w-5 text-teal-600" />
            Sexual Health
          </CardTitle>
          <Link href="/dashboard/mens-health/sexual-health">
            <Button variant="ghost" size="sm" className="text-teal-700">
              Hub <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.treatment ? (
          <div className="rounded-xl border border-teal-200 bg-teal-50 p-4 dark:border-teal-900 dark:bg-teal-950/20">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="font-semibold">{data.treatment.medicationName}</p>
                <p className="text-sm text-muted-foreground">
                  {data.treatment.dosage} · {data.treatment.frequency}
                </p>
                {data.useStats.effectiveRate != null && (
                  <p className="mt-2 text-xs text-teal-700">
                    {data.useStats.effectiveRate}% effective in the last 30 days
                  </p>
                )}
              </div>
              {data.canLogUse && (
                <Link href="/dashboard/mens-health/sexual-health/log" className="w-full sm:w-auto">
                  <Button size="sm" className="w-full bg-teal-600 hover:bg-teal-700 sm:w-auto">
                    <CheckCircle2 className="mr-1 h-4 w-4" /> Log use
                  </Button>
                </Link>
              )}
            </div>
            {data.prescription?.nextRefillDate && (
              <p className="mt-3 flex items-center gap-1 border-t border-teal-200 pt-3 text-xs text-muted-foreground">
                <Package className="h-3 w-3" />
                Next refill: {formatDate(data.prescription.nextRefillDate)}
                {data.prescription.refillsRemaining > 0 &&
                  ` · ${data.prescription.refillsRemaining} refills left`}
              </p>
            )}
          </div>
        ) : data.prescription ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="font-semibold">{data.prescription.medicationName}</p>
                <p className="text-sm text-muted-foreground">
                  {data.prescription.dosage} · {data.prescription.frequency}
                </p>
                <p className="mt-2 text-sm text-slate-600">{data.prescription.description}</p>
              </div>
              <Badge variant="secondary" className="w-fit shrink-0">
                {data.prescription.label}
              </Badge>
            </div>
            {data.prescription.trackingNumber && (
              <p className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
                <Truck className="h-3 w-3" />
                Tracking: {data.prescription.trackingNumber}
              </p>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed p-6 text-center text-muted-foreground">
            <Pill className="mx-auto mb-2 h-8 w-8" />
            <p className="font-medium">{data.status.label}</p>
            <p className="mt-1 text-sm">{data.status.description}</p>
            <Link href="/dashboard/mens-health/sexual-health" className="mt-4 inline-block">
              <Button variant="outline" size="sm">
                View program status
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function TreatmentPage() {
  const [loading, setLoading] = useState(true);
  const [hairPortalData, setHairPortalData] = useState<HairPortalData | null>(null);
  const [sexualPortalData, setSexualPortalData] = useState<SexualHealthPortalData | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadPortalData() {
      try {
        const [hairRes, sexualRes] = await Promise.all([
          fetch("/api/hair-loss/portal"),
          fetch("/api/mens-health/sexual-health/portal"),
        ]);

        if (!cancelled && hairRes.ok) {
          const json = (await hairRes.json()) as HairPortalData;
          if (json.isHairMember) setHairPortalData(json);
        }

        if (!cancelled && sexualRes.ok) {
          const json = (await sexualRes.json()) as SexualHealthPortalData;
          if (json.isMember) setSexualPortalData(json);
        }
      } catch (error) {
        console.error("Treatment portal load error:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadPortalData();
    return () => {
      cancelled = true;
    };
  }, []);

  const hairCount =
    hairPortalData?.treatments.length ||
    hairPortalData?.prescriptions.length ||
    0;
  const sexualCount = sexualPortalData?.treatment || sexualPortalData?.prescription ? 1 : 0;
  const hasPrograms = Boolean(hairPortalData?.isHairMember || sexualPortalData?.isMember);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center pb-20 md:pb-6">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <Link href="/dashboard/mens-health" className="self-start">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="flex items-center gap-2 text-xl font-bold sm:text-2xl">
            <Pill className="h-5 w-5 shrink-0 text-teal-600 sm:h-6 sm:w-6" />
            My Treatments
          </h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Doctor-approved medications across your programs
          </p>
        </div>
      </div>

      {hasPrograms && (
        <div
          className={`grid gap-3 ${hairPortalData?.isHairMember && sexualPortalData?.isMember ? "grid-cols-2" : "grid-cols-1 sm:max-w-xs"}`}
        >
          {hairPortalData?.isHairMember && (
            <Card className="border-0 bg-gradient-to-br from-violet-500 to-purple-600 text-white">
              <CardContent className="p-3 text-center sm:p-4">
                <Sparkles className="mx-auto mb-1 h-5 w-5" />
                <p className="text-xl font-bold">{hairCount}</p>
                <p className="text-xs text-white/80">Hair</p>
              </CardContent>
            </Card>
          )}
          {sexualPortalData?.isMember && (
            <Card className="border-0 bg-gradient-to-br from-slate-700 to-teal-800 text-white">
              <CardContent className="p-3 text-center sm:p-4">
                <Heart className="mx-auto mb-1 h-5 w-5" />
                <p className="text-xl font-bold">{sexualCount}</p>
                <p className="text-xs text-white/80">Sexual Health</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {hairPortalData?.isHairMember && <HairTreatmentSection data={hairPortalData} />}
      {sexualPortalData?.isMember && <SexualHealthTreatmentSection data={sexualPortalData} />}

      {!hasPrograms && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Pill className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <p className="font-medium">No active treatments yet</p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
              Enroll in a men&apos;s health program to see prescriptions and medication tracking here.
            </p>
            <Link href="/dashboard/mens-health" className="mt-4 inline-block">
              <Button className="bg-teal-600 hover:bg-teal-700">Browse programs</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {hasPrograms && (
        <Card className="border-0 bg-gradient-to-r from-teal-500 to-cyan-600 text-white">
          <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/20">
                <Truck className="h-6 w-6" />
              </div>
              <div>
                <p className="font-semibold">Discreet delivery</p>
                <p className="text-sm text-teal-100">Plain packaging on prescription refills</p>
              </div>
            </div>
            <Link href="/dashboard/mens-health/support" className="w-full sm:w-auto">
              <Button variant="secondary" size="sm" className="w-full sm:w-auto">
                Contact care team
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
