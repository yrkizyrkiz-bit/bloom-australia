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
import { Pill, Calendar, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { SideEffectReportForm } from "./SideEffectReportForm";

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
    setActiveDoseId(doseId);
    setStep("confirm");
    setDoseDialogOpen(true);
  };

  const markTaken = async () => {
    if (!activeDoseId) return;
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
      if (!res.ok) throw new Error("Failed to log dose");
      toast.success("Dose logged");
      setDoseDialogOpen(false);
      load();
    } catch {
      toast.error("Could not log dose");
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
  const isOverdue = scheduled < new Date() && !nextDose.takenAt;

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
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-violet-500 flex items-center justify-center text-white">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <p className="font-semibold">Next dose</p>
                <p className="text-sm text-muted-foreground">
                  {scheduled.toLocaleDateString("en-AU", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  })}
                </p>
              </div>
            </div>
            {isOverdue && (
              <Badge variant="destructive">Due</Badge>
            )}
          </div>
          <Button
            className="w-full bg-violet-600 hover:bg-violet-700"
            onClick={() => openLogDose(nextDose.id)}
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Log dose taken
          </Button>
          <p className="text-xs text-muted-foreground flex items-start gap-1">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            After logging, you can record side effects and get personalised tips. Severe symptoms alert your care team.
          </p>
        </CardContent>
      </Card>

      <Dialog open={doseDialogOpen} onOpenChange={setDoseDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          {step === "confirm" ? (
            <>
              <DialogHeader>
                <DialogTitle>Log this dose?</DialogTitle>
                <DialogDescription>
                  Confirm you have taken {treatment.dosage} as prescribed, then tell us how you feel.
                </DialogDescription>
              </DialogHeader>
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
              <div className="flex gap-2 mb-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={confirmTakenNoEffects}
                  disabled={logging}
                >
                  {logging ? <Loader2 className="w-4 h-4 animate-spin" /> : "Skip — no effects"}
                </Button>
              </div>
              <SideEffectReportForm
                symptomOptions={symptomOptions}
                medicationDoseId={activeDoseId || undefined}
                showSkip={false}
                onComplete={() => onSideEffectsComplete()}
              />
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
