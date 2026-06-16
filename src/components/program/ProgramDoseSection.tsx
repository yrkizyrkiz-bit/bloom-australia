"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Pill, Calendar, CheckCircle2, Loader2, AlertCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { SideEffectReportForm } from "./SideEffectReportForm";
import {
  canLogDoseScheduledFor,
  formatNextDoseDateLong,
  formatNextDoseDateShort,
  getCalendarDateKey,
} from "@/lib/program/dose-schedule";

type Dose = {
  id: string;
  scheduledAt: string;
  takenAt: string | null;
  skipped: boolean;
  sideEffects: string[];
};

type SymptomOption = { id: string; label: string };

export function ProgramDoseSection() {
  const [loading, setLoading] = useState(true);
  const [treatment, setTreatment] = useState<{
    medicationName: string;
    dosage: string;
    frequency: string;
  } | null>(null);
  const [doses, setDoses] = useState<Dose[]>([]);
  const [symptomOptions, setSymptomOptions] = useState<SymptomOption[]>([]);
  const [doseDialogOpen, setDoseDialogOpen] = useState(false);
  const [activeDoseId, setActiveDoseId] = useState<string | null>(null);
  const [step, setStep] = useState<"confirm" | "side-effects">("confirm");
  const [logging, setLogging] = useState(false);

  const load = useCallback(async () => {
    try {
      const [dosesRes, todayRes] = await Promise.all([
        fetch("/api/program/doses"),
        fetch("/api/program/today"),
      ]);
      if (dosesRes.ok) {
        const d = await dosesRes.json();
        setTreatment(d.treatment);
        setDoses(d.doses || []);
      }
      if (todayRes.ok) {
        const t = await todayRes.json();
        if (t.symptomOptions) setSymptomOptions(t.symptomOptions);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const nextDose = doses.find((d) => !d.takenAt && !d.skipped);

  const openLogDose = (doseId: string) => {
    const dose = doses.find((d) => d.id === doseId);
    if (dose && !canLogDoseScheduledFor(dose.scheduledAt)) {
      toast.error("You can log this dose on its scheduled date");
      return;
    }
    setActiveDoseId(doseId);
    setStep("confirm");
    setDoseDialogOpen(true);
  };

  const markTaken = async () => {
    if (!activeDoseId) return;
    const dose = doses.find((d) => d.id === activeDoseId);
    if (dose && !canLogDoseScheduledFor(dose.scheduledAt)) {
      toast.error("You can log this dose on its scheduled date");
      return;
    }
    setStep("side-effects");
  };

  const confirmTakenNoEffects = async () => {
    if (!activeDoseId) return;
    setLogging(true);
    try {
      const res = await fetch(`/api/program/doses/${activeDoseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "taken", sideEffects: [] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to log dose");
      toast.success("Dose logged");
      setDoseDialogOpen(false);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not log dose");
    } finally {
      setLogging(false);
    }
  };

  const onSideEffectsComplete = async () => {
    setDoseDialogOpen(false);
    load();
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!treatment || !nextDose) {
    return null;
  }

  const scheduled = new Date(nextDose.scheduledAt);
  const canLog = canLogDoseScheduledFor(scheduled);
  const scheduledDateLong = formatNextDoseDateLong(scheduled);
  const scheduledDateShort = formatNextDoseDateShort(scheduled);
  const isToday =
    getCalendarDateKey(new Date()) === getCalendarDateKey(scheduled);
  const isOverdue = canLog && !isToday;

  return (
    <>
      <Card className="border-violet-200 bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Pill className="w-5 h-5 text-violet-600" />
            Medication program
          </CardTitle>
          <CardDescription>
            {treatment.medicationName} — {treatment.dosage} ({treatment.frequency})
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className={`rounded-2xl border-2 p-5 shadow-sm ${
              canLog
                ? "border-violet-400 bg-gradient-to-br from-violet-600 to-purple-600 text-white"
                : "border-violet-200 bg-white dark:bg-violet-950/30"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div
                  className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl ${
                    canLog ? "bg-white/20 ring-2 ring-white/30" : "bg-violet-100 dark:bg-violet-900/50"
                  }`}
                >
                  <Calendar
                    className={`h-7 w-7 ${canLog ? "text-white" : "text-violet-600"}`}
                  />
                </div>
                <div className="min-w-0">
                  <p
                    className={`text-xs font-semibold uppercase tracking-wide ${
                      canLog ? "text-violet-100" : "text-violet-600"
                    }`}
                  >
                    Next dose scheduled
                  </p>
                  <p
                    className={`mt-1 text-xl font-bold leading-tight sm:text-2xl ${
                      canLog ? "text-white" : "text-foreground"
                    }`}
                  >
                    {scheduledDateLong}
                  </p>
                  {canLog && isToday && (
                    <p className="mt-1 text-sm text-violet-100">Available to log today</p>
                  )}
                  {isOverdue && (
                    <p className="mt-1 text-sm text-violet-100">Ready to log — past scheduled date</p>
                  )}
                </div>
              </div>
              {canLog ? (
                isToday ? (
                  <Badge className="shrink-0 bg-white/20 text-white border-white/30 hover:bg-white/20">
                    Today
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="shrink-0">
                    Due
                  </Badge>
                )
              ) : (
                <Badge variant="secondary" className="shrink-0">
                  Upcoming
                </Badge>
              )}
            </div>
          </div>

          {!canLog && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 p-4 flex gap-3">
              <Clock className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                  Your next dose is scheduled for {scheduledDateShort}
                </p>
                <p className="text-xs text-amber-800 dark:text-amber-200">
                  Dose logging opens on that date. Please adhere to the dose and schedule
                  prescribed by your clinician — do not take or log doses early.
                </p>
              </div>
            </div>
          )}

          <Button
            className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-60"
            onClick={() => openLogDose(nextDose.id)}
            disabled={!canLog}
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            {canLog ? "Log dose taken" : "Not yet due"}
          </Button>

          {canLog ? (
            <p className="text-xs text-muted-foreground flex items-start gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              After logging, you can record side effects and get personalised tips. Severe
              symptoms alert your care team.
            </p>
          ) : (
            <p className="text-xs text-muted-foreground flex items-start gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              Times shown in Australian Eastern Time. Contact your care team if you have
              team if you have questions about your dosing schedule.
            </p>
          )}
        </CardContent>
      </Card>

      <Dialog open={doseDialogOpen} onOpenChange={setDoseDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          {step === "confirm" ? (
            <>
              <DialogHeader>
                <DialogTitle>Log this dose?</DialogTitle>
                <DialogDescription>
                  Confirm you have taken {treatment.dosage} as prescribed on{" "}
                  {scheduledDateLong}, then tell us how you feel.
                </DialogDescription>
              </DialogHeader>
              <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 px-3 py-2 text-xs text-amber-900 dark:text-amber-100">
                Only log doses taken as prescribed by your clinician on or after the
                scheduled date.
              </div>
              <div className="flex flex-col gap-2 pt-2">
                <Button
                  onClick={markTaken}
                  disabled={logging}
                  className="bg-violet-600 hover:bg-violet-700"
                >
                  Yes, I took it
                </Button>
                <Button variant="outline" onClick={() => setDoseDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Any side effects?</DialogTitle>
                <DialogDescription>
                  This helps us support you safely on your program.
                </DialogDescription>
              </DialogHeader>
              <SideEffectReportForm
                symptomOptions={symptomOptions}
                medicationDoseId={activeDoseId || undefined}
                showSkip
                skipLoading={logging}
                onSkip={confirmTakenNoEffects}
                onComplete={() => onSideEffectsComplete()}
              />
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
