"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarClock, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { DOSING_FREQUENCY_OPTIONS } from "@/lib/program/member-schedule";

type ScheduleForm = {
  activationDate: string;
  firstDoseDate: string;
  nextDoseDate: string;
  frequency: string;
};

const emptySchedule: ScheduleForm = {
  activationDate: "",
  firstDoseDate: "",
  nextDoseDate: "",
  frequency: "Once weekly",
};

export function MemberProgramSchedulePanel({
  userId,
  onSaved,
}: {
  userId: string;
  onSaved?: () => void;
}) {
  const [form, setForm] = useState<ScheduleForm>(emptySchedule);
  const [hasTreatment, setHasTreatment] = useState(false);
  const [hasProgram, setHasProgram] = useState(false);
  const [hasTakenDoses, setHasTakenDoses] = useState(false);
  const [history, setHistory] = useState<
    Array<{ id: string; content: string; authorName: string | null; createdAt: string }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/member-schedule?userId=${encodeURIComponent(userId)}`);
      if (!res.ok) throw new Error("Failed to load schedule");
      const data = await res.json();
      const schedule = data.schedule as {
        activationDate: string;
        firstDoseDate: string;
        nextDoseDate: string;
        frequency: string;
        hasTreatment: boolean;
        hasProgram: boolean;
        hasTakenDoses: boolean;
      };
      setForm({
        activationDate: schedule.activationDate || "",
        firstDoseDate: schedule.firstDoseDate || "",
        nextDoseDate: schedule.nextDoseDate || "",
        frequency: schedule.frequency || "Once weekly",
      });
      setHasTreatment(schedule.hasTreatment);
      setHasProgram(schedule.hasProgram);
      setHasTakenDoses(schedule.hasTakenDoses);
      setHistory(
        Array.isArray(data.history)
          ? data.history.map((note: { id: string; content: string; authorName: string | null; createdAt: string }) => ({
              id: note.id,
              content: note.content,
              authorName: note.authorName,
              createdAt: note.createdAt,
            }))
          : []
      );
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/member-schedule", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          activationDate: form.activationDate || null,
          firstDoseDate: form.firstDoseDate || null,
          nextDoseDate: form.nextDoseDate || null,
          frequency: form.frequency || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not save schedule");
      toast.success("Schedule updated. A note was added with who changed it.");
      await load();
      onSaved?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save schedule");
    } finally {
      setSaving(false);
    }
  };

  const frequencyOptions = DOSING_FREQUENCY_OPTIONS.some((option) => option.value === form.frequency)
    ? DOSING_FREQUENCY_OPTIONS
    : [{ value: form.frequency, label: form.frequency }, ...DOSING_FREQUENCY_OPTIONS];

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <CalendarClock className="h-5 w-5" />
          Program dates and dosing
        </CardTitle>
        <CardDescription>
          Edit activation date, first dose, next dose, and dosing frequency. Saving writes a medical
          note with the staff member who made the change. Untaken doses are rebuilt from the new
          next dose and frequency. Logged doses are left as they are.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasTreatment && !hasProgram ? (
          <p className="text-sm text-muted-foreground">
            Dates appear after the program is activated and a treatment is created.
          </p>
        ) : null}
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1">
            <Label htmlFor="activationDate">Activation date</Label>
            <Input
              id="activationDate"
              type="date"
              value={form.activationDate}
              disabled={!hasProgram}
              onChange={(event) =>
                setForm((current) => ({ ...current, activationDate: event.target.value }))
              }
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="firstDoseDate">First dose date</Label>
            <Input
              id="firstDoseDate"
              type="date"
              value={form.firstDoseDate}
              disabled={!hasTreatment && !hasProgram}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  firstDoseDate: event.target.value,
                  nextDoseDate: hasTakenDoses ? current.nextDoseDate : event.target.value,
                }))
              }
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="nextDoseDate">Next dose scheduled</Label>
            <Input
              id="nextDoseDate"
              type="date"
              value={form.nextDoseDate}
              disabled={!hasTreatment}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  nextDoseDate: event.target.value,
                  firstDoseDate: hasTakenDoses ? current.firstDoseDate : event.target.value,
                }))
              }
            />
          </div>
          <div className="space-y-1">
            <Label>Dosing</Label>
            <Select
              value={form.frequency}
              disabled={!hasTreatment}
              onValueChange={(value) => setForm((current) => ({ ...current, frequency: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                {frequencyOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        {hasTakenDoses ? (
          <p className="text-xs text-muted-foreground">
            At least one dose has been logged. Changing next dose or dosing rebuilds only remaining
            untaken doses.
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            No doses have been logged yet, so first dose and next dose stay in sync.
          </p>
        )}
        <Button type="button" onClick={() => void save()} disabled={saving || (!hasTreatment && !hasProgram)}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Update dates and dosing
        </Button>
        {history.length > 0 ? (
          <div className="space-y-2 border-t pt-3">
            <p className="text-sm font-medium">Change history</p>
            <div className="max-h-56 space-y-2 overflow-y-auto">
              {history.map((note) => (
                <div key={note.id} className="rounded-md border bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground">
                    {note.authorName || "Staff"} ·{" "}
                    {new Date(note.createdAt).toLocaleString("en-AU")}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{note.content}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
