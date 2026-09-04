"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Dumbbell, Flame, Clock, Trash2, Loader2, Footprints } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { equivalentExerciseMinutes } from "@/lib/weight-management/score-ring-week";

interface ExerciseLog {
  id: string;
  activityType: string;
  name: string;
  durationMinutes: number;
  intensity: string;
  caloriesBurned: number | null;
  loggedAt: string;
}

interface ExerciseData {
  exerciseLogs: ExerciseLog[];
  weeklySummary: {
    totalMinutes: number;
    totalCalories: number;
    totalWorkouts: number;
    activeDays: number;
  };
  activityBreakdown: Record<string, { count: number; totalMinutes: number; totalCalories: number }>;
}

const ACTIVITY_LABELS: Record<string, string> = {
  WALKING: "Walking",
  RUNNING: "Running",
  CYCLING: "Cycling",
  SWIMMING: "Swimming",
  STRENGTH_TRAINING: "Strength Training",
  YOGA: "Yoga",
  PILATES: "Pilates",
  HIIT: "HIIT",
  DANCE: "Dance",
  SPORTS: "Sports",
  STRETCHING: "Stretching",
  OTHER: "Other",
};

const INTENSITY_LABELS: Record<string, string> = {
  LIGHT: "Light",
  MODERATE: "Moderate",
  VIGOROUS: "Vigorous",
  MAXIMUM: "Maximum",
};

const INTENSITY_HINTS: Record<string, string> = {
  LIGHT: "counts as half",
  MODERATE: "counts as logged",
  VIGOROUS: "counts double",
  MAXIMUM: "counts as 2½×",
};

function ringMinutesFor(durationMinutes: number, intensity: string) {
  return Math.round(equivalentExerciseMinutes(durationMinutes, intensity) * 10) / 10;
}

function todayInputValue() {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function loggedAtFromDateInput(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  const now = new Date();
  const sameDay =
    year === now.getFullYear() && month === now.getMonth() + 1 && day === now.getDate();
  if (sameDay) return now.toISOString();
  return new Date(year, month - 1, day, now.getHours(), now.getMinutes(), now.getSeconds()).toISOString();
}

function formatActivityDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  const time = date.toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit" });
  if (sameDay(date, today)) return `Today · ${time}`;
  if (sameDay(date, yesterday)) return `Yesterday · ${time}`;
  return date.toLocaleDateString("en-AU", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export default function ExercisePage() {
  const [data, setData] = useState<ExerciseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [activityType, setActivityType] = useState("WALKING");
  const [name, setName] = useState("");
  const [duration, setDuration] = useState("");
  const [intensity, setIntensity] = useState("MODERATE");
  const [loggedDate, setLoggedDate] = useState(todayInputValue);

  useEffect(() => {
    fetchExercise();
  }, []);

  const fetchExercise = async () => {
    try {
      const res = await fetch("/api/weight-management/exercise?days=30");
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch (error) {
      console.error("Error fetching exercise:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !duration) {
      toast.error("Please fill in required fields");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/weight-management/exercise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activityType,
          name,
          durationMinutes: parseInt(duration),
          intensity,
          loggedAt: loggedAtFromDateInput(loggedDate),
        }),
      });

      if (!res.ok) {
        const result = await res.json().catch(() => null);
        toast.error(result?.error || "Failed to log exercise");
        return;
      }

      const clock = parseInt(duration, 10);
      const towardRing = ringMinutesFor(clock, intensity);
      toast.success(
        towardRing === clock
          ? `Logged ${clock} min toward your exercise ring`
          : `Logged ${clock} min ${INTENSITY_LABELS[intensity]?.toLowerCase()} · ${towardRing} min toward your exercise ring`
      );
      resetForm();
      fetchExercise();
    } catch {
      toast.error("Failed to log exercise");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/weight-management/exercise?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Exercise deleted");
        fetchExercise();
      }
    } catch (error) {
      toast.error("Failed to delete");
    }
  };

  const resetForm = () => {
    setName("");
    setDuration("");
    setLoggedDate(todayInputValue());
    setShowForm(false);
  };

  const clockMinutes = duration ? parseInt(duration, 10) : 0;
  const towardRing =
    Number.isFinite(clockMinutes) && clockMinutes > 0
      ? ringMinutesFor(clockMinutes, intensity)
      : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/weight-management">
          <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Exercise Log</h1>
          <p className="text-muted-foreground">
            Track workouts. The exercise ring uses intensity, not clock time alone.
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-2" /> Add Exercise
        </Button>
      </div>

      {/* Weekly Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-0">
          <CardContent className="p-4 text-center">
            <Dumbbell className="w-6 h-6 mx-auto mb-1" />
            <p className="text-2xl font-bold">{data?.weeklySummary.totalWorkouts || 0}</p>
            <p className="text-xs text-white/80">Workouts</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="w-6 h-6 mx-auto mb-2 text-teal-600" />
            <p className="text-2xl font-bold">{data?.weeklySummary.totalMinutes || 0}</p>
            <p className="text-xs text-muted-foreground">Minutes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Flame className="w-6 h-6 mx-auto mb-2 text-orange-600" />
            <p className="text-2xl font-bold">{data?.weeklySummary.totalCalories?.toLocaleString() || 0}</p>
            <p className="text-xs text-muted-foreground">Calories</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Footprints className="w-6 h-6 mx-auto mb-2 text-green-600" />
            <p className="text-2xl font-bold">{data?.weeklySummary.activeDays || 0}</p>
            <p className="text-xs text-muted-foreground">Active Days</p>
          </CardContent>
        </Card>
      </div>

      {/* Add Exercise Form */}
      {showForm && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Log Exercise</CardTitle>
            <p className="text-sm font-normal text-muted-foreground pt-1">
              Your daily ring target is moderate minutes. Light counts as half, vigorous double,
              maximum 2½×.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Activity Type</Label>
                  <Select value={activityType} onValueChange={setActivityType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(ACTIVITY_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input placeholder="Morning run" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Duration (min) *</Label>
                  <Input type="number" placeholder="30" value={duration} onChange={(e) => setDuration(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Date *</Label>
                  <Input type="date" value={loggedDate} onChange={(e) => setLoggedDate(e.target.value)} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Intensity</Label>
                <Select value={intensity} onValueChange={setIntensity}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(INTENSITY_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label} — {INTENSITY_HINTS[key]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {towardRing > 0 && (
                <div className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-sm text-teal-900">
                  <p className="font-medium">
                    {clockMinutes} min {INTENSITY_LABELS[intensity]?.toLowerCase()} → {towardRing} min
                    toward your exercise ring
                  </p>
                  <p className="text-xs text-teal-800/80 mt-0.5">
                    {towardRing === clockMinutes
                      ? "Moderate effort counts minute for minute."
                      : towardRing > clockMinutes
                        ? "Higher intensity counts more than the clock."
                        : "Lighter effort counts less than the clock."}
                  </p>
                </div>
              )}
              <div className="flex gap-2">
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Save
                </Button>
                <Button type="button" variant="ghost" onClick={resetForm}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Recent Exercises */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {!data?.exerciseLogs.length ? (
            <p className="text-muted-foreground text-center py-8">No exercises logged. Start tracking!</p>
          ) : (
            <div className="space-y-3">
              {data.exerciseLogs.slice(0, 10).map((log) => (
                <div key={log.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                      <Dumbbell className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">{log.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatActivityDate(log.loggedAt)}
                        {" · "}
                        {ACTIVITY_LABELS[log.activityType]} • {log.durationMinutes} min{" "}
                        {INTENSITY_LABELS[log.intensity]?.toLowerCase()}
                        {ringMinutesFor(log.durationMinutes, log.intensity) !== log.durationMinutes
                          ? ` → ${ringMinutesFor(log.durationMinutes, log.intensity)} toward ring`
                          : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary">{INTENSITY_LABELS[log.intensity]}</Badge>
                    {log.caloriesBurned && <Badge className="bg-orange-100 text-orange-700">{log.caloriesBurned} cal</Badge>}
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(log.id)}>
                      <Trash2 className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
