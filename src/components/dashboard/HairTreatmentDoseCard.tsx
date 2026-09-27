"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Calendar, Pill } from "lucide-react";
import { toast } from "sonner";
import { DOSE_SCHEDULE_TIMEZONE } from "@/lib/program/dose-schedule";
import {
  formatHairDoseLine,
  hairDosesPerDay,
} from "@/lib/program/hair-treatment-schedule";

export type HairTreatmentDose = {
  id: string;
  scheduledAt: string;
};

export type HairTreatmentRecord = {
  id: string;
  prescriptionId?: string | null;
  medicationName: string;
  dosage: string;
  strength?: string;
  frequency: string;
  startDate: string;
  nextDoseDate: string | null;
  adherence: number | null;
  upcomingDoses?: HairTreatmentDose[];
};

export type HairPrescriptionRecord = {
  id: string;
  medicationName: string;
  strength: string;
  dosage: string;
  frequency: string;
  needsFirstDose?: boolean;
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-AU", {
    timeZone: DOSE_SCHEDULE_TIMEZONE,
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function formatUpcomingDose(dateStr: string, frequency: string): string {
  const date = formatDate(dateStr);
  if (hairDosesPerDay(frequency) <= 1) return date;
  const hour = new Date(dateStr).getUTCHours();
  const slot = hour < 8 ? "morning" : hour < 16 ? "evening" : "night";
  return `${date} · ${slot}`;
}

export function HairFirstDoseForm({
  prescriptionId,
  onSaved,
}: {
  prescriptionId: string;
  onSaved: () => void;
}) {
  const [firstDoseDate, setFirstDoseDate] = useState(
    new Date().toLocaleDateString("en-CA", { timeZone: DOSE_SCHEDULE_TIMEZONE })
  );
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!firstDoseDate) {
      toast.error("Enter the date of your first dose");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/hair-loss/treatments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prescriptionId, firstDoseDate }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not save first dose date");
      toast.success("Dose schedule created from your first dose date");
      onSaved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save first dose date");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3 rounded-2xl border border-[#cdd8c6] bg-white/70 p-3">
      <Label
        htmlFor={`first-dose-${prescriptionId}`}
        className="text-sm font-medium text-[#2c3628]"
      >
        Date of first dose
      </Label>
      <p className="text-xs text-[#5c7a52]">
        Enter when you took or will take the first dose. Later dose dates are calculated from this.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          id={`first-dose-${prescriptionId}`}
          type="date"
          value={firstDoseDate}
          onChange={(event) => setFirstDoseDate(event.target.value)}
          className="border-[#cdd8c6] bg-white"
        />
        <Button
          className="bg-[#4a6243] text-white hover:bg-[#3d4f38]"
          onClick={submit}
          disabled={saving}
        >
          {saving ? "Saving…" : "Save first dose"}
        </Button>
      </div>
    </div>
  );
}

export function HairTreatmentDoseCard({
  prescription,
  treatment,
  onSaved,
}: {
  prescription?: HairPrescriptionRecord;
  treatment?: HairTreatmentRecord;
  onSaved: () => void;
}) {
  const name = treatment?.medicationName || prescription?.medicationName || "Hair treatment";
  const frequency = treatment?.frequency || prescription?.frequency || "";
  const doseLine = formatHairDoseLine({
    strength: prescription?.strength || treatment?.strength,
    dosage: treatment?.dosage || prescription?.dosage,
    frequency,
  });
  const needsFirstDose = Boolean(prescription?.needsFirstDose) && !treatment?.upcomingDoses?.length;
  const upcoming = [...(treatment?.upcomingDoses ?? [])].sort(
    (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
  );

  return (
    <div className="rounded-2xl border border-[#cdd8c6] bg-white/70 p-4">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="font-serif font-semibold text-[#2c3628]">{name}</p>
          {doseLine ? <p className="text-sm text-[#5c7a52]">{doseLine}</p> : null}
        </div>
        <Badge
          className={
            needsFirstDose
              ? "w-fit border-0 bg-[#f0e8d8] text-[#c17a58]"
              : "w-fit border-0 bg-[#cdd8c6]/70 text-[#2c3628]"
          }
        >
          {needsFirstDose ? "Awaiting first dose" : "Prescribed"}
        </Badge>
      </div>

      {needsFirstDose && prescription ? (
        <HairFirstDoseForm prescriptionId={prescription.id} onSaved={onSaved} />
      ) : (
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-[#5c7a52]">Adherence</span>
            <span className="font-medium text-[#2c3628]">
              {treatment?.adherence != null ? `${treatment.adherence}%` : "Starts after first dose"}
            </span>
          </div>
          <Progress value={treatment?.adherence ?? 0} className="h-2 bg-[#e6ebe3]" />
          {treatment?.startDate && (
            <p className="flex items-center gap-1 text-xs text-[#5c7a52]">
              <Calendar className="h-3 w-3" />
              First dose {formatDate(treatment.startDate)}
            </p>
          )}
          {upcoming.length > 0 ? (
            <div className="pt-1">
              <p className="mb-1 text-xs font-medium text-[#4a6243]">Upcoming doses</p>
              <ul className="space-y-1 text-xs text-[#5c7a52]">
                {upcoming.slice(0, 6).map((dose) => (
                  <li key={dose.id}>{formatUpcomingDose(dose.scheduledAt, frequency)}</li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-xs text-[#5c7a52]">
              {treatment?.nextDoseDate
                ? `Next dose: ${formatDate(treatment.nextDoseDate)}`
                : "Dose schedule will appear after you log the first dose date"}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export function HairTreatmentsList({
  prescriptions,
  treatments,
  onSaved,
}: {
  prescriptions: HairPrescriptionRecord[];
  treatments: HairTreatmentRecord[];
  onSaved: () => void;
}) {
  const items = prescriptions.length
    ? prescriptions.map((prescription) => ({
        prescription,
        treatment: treatments.find((treatment) => treatment.prescriptionId === prescription.id),
      }))
    : treatments.map((treatment) => ({ prescription: undefined, treatment }));

  if (!items.length) {
    return (
      <div className="rounded-2xl border border-dashed border-[#cdd8c6] bg-white/40 p-6 text-center">
        <Pill className="mx-auto mb-2 h-8 w-8 text-[#a8bb9e]" />
        <p className="font-serif font-medium text-[#2c3628]">No hair treatment prescribed yet</p>
        <p className="mt-1 text-sm text-[#5c7a52]">
          Your doctor-approved hair prescription will appear here when the script is complete.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map(({ prescription, treatment }) => (
        <HairTreatmentDoseCard
          key={prescription?.id || treatment?.id}
          prescription={prescription}
          treatment={treatment}
          onSaved={onSaved}
        />
      ))}
    </div>
  );
}
