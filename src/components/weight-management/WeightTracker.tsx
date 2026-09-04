"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Scale, TrendingDown, TrendingUp, Calendar, Loader2, Sparkles, Heart } from "lucide-react";
import { toast } from "sonner";
import { ProgressChart } from "./ProgressChart";
import { SuccessAnimation } from "./SuccessAnimation";
import WeightScale from "./WeightScale";
import WaistTapeMeasure, { type WaistUnit } from "./WaistTapeMeasure";
import { getRandomMotivation } from "@/data/mealImages";

const CM_PER_IN = 2.54;

function toCm(value: number, unit: WaistUnit) {
  const cm = unit === "in" ? value * CM_PER_IN : value;
  return Math.round(cm * 10) / 10;
}

interface WeightLog {
  id: string;
  weight: number;
  waistCircumference: number | null;
  measuredAt: string;
  notes: string | null;
}

interface WeightData {
  weightLogs: WeightLog[];
  currentWeight: number | null;
  startingWeight: number | null;
  weightChange: number;
  percentChange: number;
  weeklyData: Array<{ week: string; avgWeight: number }>;
  activeGoal: {
    targetWeight: number;
    percentComplete: number;
    remainingWeight: number;
  } | null;
}

export function WeightTracker() {
  const [data, setData] = useState<WeightData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [weight, setWeight] = useState<number | null>(null);
  const [waist, setWaist] = useState<number | null>(90);
  const [waistUnit, setWaistUnit] = useState<WaistUnit>("cm");

  useEffect(() => {
    fetchWeightData();
  }, []);

  useEffect(() => {
    if (weight != null || data?.currentWeight == null) return;
    setWeight(data.currentWeight);
  }, [data?.currentWeight]);

  useEffect(() => {
    const latestWaist = data?.weightLogs
      ? [...data.weightLogs].reverse().find((log) => log.waistCircumference != null)?.waistCircumference
      : undefined;
    if (latestWaist != null) setWaist(latestWaist);
  }, [data?.weightLogs]);

  const fetchWeightData = async () => {
    try {
      const res = await fetch("/api/weight-management/weight?days=90");
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch (error) {
      console.error("Error fetching weight data:", error);
    } finally {
      setLoading(false);
    }
  };

  const persistMeasurement = async (payload: {
    weight?: number;
    waistCircumference?: number | null;
  }) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/weight-management/weight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const saved = await res.json();
        setSuccessMessage(getRandomMotivation("weightTracking"));
        setShowSuccess(true);
        if (typeof saved.weight === "number") setWeight(saved.weight);
        if (typeof saved.waistCircumference === "number") {
          setWaist(saved.waistCircumference);
          setWaistUnit("cm");
        }
        fetchWeightData();
      } else {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || "Failed to log weight");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to log measurement");
    } finally {
      setSubmitting(false);
    }
  };

  const persistWeight = async (value: number) => {
    const weightKg = Math.round(value * 10) / 10;
    if (!weightKg || weightKg <= 0) {
      toast.error("Please enter your weight");
      return;
    }
    await persistMeasurement({ weight: weightKg });
  };

  const persistWaist = async (value: number, unit: WaistUnit) => {
    await persistMeasurement({ waistCircumference: toCm(value, unit) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = weight ?? data?.currentWeight ?? null;
    if (value == null) {
      toast.error("Please enter your weight");
      return;
    }
    await persistWeight(value);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Success Animation */}
      <SuccessAnimation
        show={showSuccess}
        type="weight"
        subMessage={successMessage}
        onComplete={() => setShowSuccess(false)}
      />

      {/* Motivational Header */}
      <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-emerald-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
              <Heart className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="font-medium text-emerald-800 dark:text-emerald-200">
                Every measurement is a step forward
              </p>
              <p className="text-sm text-emerald-600 dark:text-emerald-400">
                {data?.weightLogs?.length || 0} entries logged • Keep going!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4 text-center">
            <Scale className="w-6 h-6 mx-auto mb-2 text-emerald-600" />
            <p className="text-2xl font-bold">{data?.currentWeight || "—"}</p>
            <p className="text-xs text-muted-foreground">Current (kg)</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4 text-center">
            <Calendar className="w-6 h-6 mx-auto mb-2 text-blue-600" />
            <p className="text-2xl font-bold">{data?.startingWeight || "—"}</p>
            <p className="text-xs text-muted-foreground">Start (kg)</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4 text-center">
            {(data?.weightChange || 0) <= 0 ? (
              <TrendingDown className="w-6 h-6 mx-auto mb-2 text-green-600" />
            ) : (
              <TrendingUp className="w-6 h-6 mx-auto mb-2 text-amber-600" />
            )}
            <p className={`text-2xl font-bold ${(data?.weightChange || 0) <= 0 ? 'text-green-600' : 'text-amber-600'}`}>
              {data?.weightChange ? `${data.weightChange > 0 ? '+' : ''}${data.weightChange}` : "—"}
            </p>
            <p className="text-xs text-muted-foreground">Change (kg)</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4 text-center">
            <div className="w-6 h-6 mx-auto mb-2 rounded-full bg-violet-100 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-violet-600" />
            </div>
            <p className={`text-2xl font-bold ${(data?.percentChange || 0) <= 0 ? 'text-green-600' : 'text-amber-600'}`}>
              {data?.percentChange ? `${data.percentChange > 0 ? '+' : ''}${data.percentChange}%` : "—"}
            </p>
            <p className="text-xs text-muted-foreground">% Change</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card className="border-0 bg-transparent shadow-none sm:border sm:border-[#cdd8c6] sm:bg-[#f8f4ec] sm:shadow">
        <CardHeader className="px-0 pb-2 sm:px-6">
          <CardTitle className="font-serif text-lg text-[#2c3628]">Your Journey</CardTitle>
        </CardHeader>
        <CardContent className="px-0 sm:px-6">
          <form
            id="journey-log-form"
            onSubmit={handleSubmit}
            className="mb-6 grid grid-cols-1 items-stretch gap-4 md:grid-cols-2"
          >
            <div className="flex h-full justify-center max-md:-mx-4 max-md:w-[calc(100%+2rem)] md:rounded-2xl md:bg-gradient-to-br md:from-[#e6ebe3] md:to-[#cdd8c6] md:p-4">
              <WeightScale
                className="journey-embedded-scale"
                value={weight}
                onChange={(next) => setWeight(next)}
                onSave={persistWeight}
                loading={submitting}
                disabled={submitting}
                title="Weight"
                helperText="Tap the display to enter your weight."
              />
            </div>
            <div className="flex h-full justify-center max-md:-mx-4 max-md:w-[calc(100%+2rem)] md:rounded-2xl md:bg-gradient-to-br md:from-[#e6ebe3] md:to-[#cdd8c6] md:p-4">
              <WaistTapeMeasure
                className="journey-embedded-tape"
                value={waist}
                onChange={(next, unit) => {
                  setWaist(next);
                  setWaistUnit(unit);
                }}
                onSave={persistWaist}
                unit={waistUnit}
                loading={submitting}
                disabled={submitting}
                title="Waist measurement"
                badge="Optional"
                helperText="Drag or slide the tape to log your waist measurement."
                buttonLabel="Save waist"
                soundEnabled
              />
            </div>
          </form>

          <ProgressChart data={data?.weeklyData || []} />
        </CardContent>
      </Card>

      {/* Recent Logs */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Recent Entries</CardTitle>
        </CardHeader>
        <CardContent>
          {!data?.weightLogs.length ? (
            <div className="text-center py-8">
              <Scale className="w-12 h-12 mx-auto mb-3 text-emerald-200" />
              <p className="font-medium mb-1">Start your journey</p>
              <p className="text-muted-foreground text-sm">
                Log your first weight to see your progress here
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {data.weightLogs.slice(-10).reverse().map((log, index) => (
                <div
                  key={log.id}
                  className={`flex items-center justify-between py-3 px-3 rounded-lg ${
                    index === 0 ? 'bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900' : 'border-b last:border-0'
                  }`}
                >
                  <div>
                    <p className="font-medium">{log.weight} kg</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(log.measuredAt).toLocaleDateString('en-AU', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short'
                      })}
                      {log.notes && <span className="ml-2 text-emerald-600">• {log.notes}</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {log.waistCircumference && (
                      <Badge variant="secondary">{log.waistCircumference} cm</Badge>
                    )}
                    {index === 0 && (
                      <Badge className="bg-emerald-600">Latest</Badge>
                    )}
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
