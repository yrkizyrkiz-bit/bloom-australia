"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Pill,
  Sparkles,
  Loader2,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { HairTreatmentsList } from "@/components/dashboard/HairTreatmentDoseCard";

/** WM sage + daily-ring accents (matches hair restoration hub). */
const RING = {
  orange: "#F97316",
  teal: "#0D9488",
  emerald: "#059669",
  coral: "#F87171",
} as const;

interface HairPortalTreatment {
  id: string;
  prescriptionId?: string | null;
  medicationName: string;
  dosage: string;
  strength?: string;
  frequency: string;
  startDate: string;
  nextDoseDate: string | null;
  adherence: number | null;
  upcomingDoses?: Array<{ id: string; scheduledAt: string }>;
}

interface HairPortalPrescription {
  id: string;
  medicationName: string;
  strength: string;
  dosage: string;
  frequency: string;
  status: string;
  nextRefillDate: string | null;
  needsFirstDose?: boolean;
}

interface HairPortalData {
  isHairMember: boolean;
  treatments: HairPortalTreatment[];
  prescriptions: HairPortalPrescription[];
}

export default function TreatmentPage() {
  const [loading, setLoading] = useState(true);
  const [hairPortalData, setHairPortalData] = useState<HairPortalData | null>(null);

  const loadPortalData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const hairRes = await fetch("/api/hair-loss/portal");
      if (hairRes.ok) {
        const json = (await hairRes.json()) as HairPortalData;
        setHairPortalData(json.isHairMember ? json : null);
      } else {
        setHairPortalData(null);
      }
    } catch (error) {
      console.error("Treatment portal load error:", error);
      setHairPortalData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPortalData();
  }, [loadPortalData]);

  const hairCount =
    hairPortalData?.treatments.length ||
    hairPortalData?.prescriptions.length ||
    0;
  const hasPrograms = Boolean(hairPortalData?.isHairMember);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center pb-20 md:pb-6">
        <Loader2 className="h-8 w-8 animate-spin text-[#4a6243]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 md:pb-6">
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
          <Link
            href="/dashboard/mens-health/hair-loss"
            className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
            aria-label="Back to Hair Restoration"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <p className="mb-1 text-sm text-[#cdd8c6]">Hair Restoration</p>
          <h1 className="mb-1 font-serif text-2xl font-semibold md:text-3xl">My Treatments</h1>
          <p className="text-sm text-[#a8bb9e]">
            Doctor-approved hair medications and dose schedules
          </p>
        </div>
      </div>

      {hasPrograms && (
        <div className="grid grid-cols-1 gap-3 sm:max-w-xs">
          <div className="relative flex min-h-[100px] flex-col overflow-hidden rounded-2xl bg-gradient-to-br from-[#4a6243] to-[#3d4f38] p-4 text-white">
            <div className="mb-auto flex items-center justify-between gap-2">
              <span className="text-xs text-[#cdd8c6]">Hair</span>
              <span
                className="flex h-8 w-8 items-center justify-center rounded-full text-white"
                style={{ backgroundColor: RING.coral }}
              >
                <Sparkles className="h-3.5 w-3.5" strokeWidth={2.25} />
              </span>
            </div>
            <p className="font-serif text-2xl font-semibold">{hairCount}</p>
            <p className="text-xs text-[#a8bb9e]">
              {hairCount === 1 ? "treatment" : "treatments"}
            </p>
          </div>
        </div>
      )}

      {hairPortalData?.isHairMember && (
        <Card className="overflow-hidden border-[#cdd8c6] bg-gradient-to-br from-[#f8f4ec] to-[#e6ebe3]">
          <CardContent className="space-y-4 p-5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white"
                  style={{ backgroundColor: RING.coral }}
                >
                  <Sparkles className="h-4 w-4" strokeWidth={2.25} />
                </span>
                <div className="min-w-0">
                  <p className="font-serif text-lg font-semibold text-[#2c3628]">
                    Hair Restoration
                  </p>
                  <p className="text-xs text-[#5c7a52]">Prescriptions and dose schedule</p>
                </div>
              </div>
              <Link
                href="/dashboard/mens-health/hair-loss"
                className="inline-flex shrink-0 items-center gap-0.5 text-sm font-medium text-[#4a6243] transition-colors hover:text-[#2c3628]"
              >
                Hub <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <HairTreatmentsList
              prescriptions={hairPortalData.prescriptions}
              treatments={hairPortalData.treatments}
              onSaved={() => loadPortalData(true)}
            />
          </CardContent>
        </Card>
      )}

      {!hasPrograms && (
        <Card className="border-[#e5d7bf] bg-gradient-to-br from-[#f8f4ec] to-[#f0e8d8]">
          <CardContent className="py-12 text-center">
            <span
              className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full text-white"
              style={{ backgroundColor: RING.emerald }}
            >
              <Pill className="h-6 w-6" strokeWidth={2.25} />
            </span>
            <p className="font-serif text-lg font-semibold text-[#2c3628]">
              No active treatments yet
            </p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-[#5c7a52]">
              Enroll in Hair Restoration to see prescriptions and medication tracking here.
            </p>
            <Link href="/dashboard/mens-health/hair-loss" className="mt-4 inline-block">
              <Button className="bg-[#4a6243] text-white hover:bg-[#3d4f38]">
                Back to programs
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
