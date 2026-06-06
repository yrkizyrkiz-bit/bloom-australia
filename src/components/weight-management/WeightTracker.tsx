"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Scale, Plus, TrendingDown, TrendingUp, Calendar, Loader2, Sparkles, Heart } from "lucide-react";
import { toast } from "sonner";
import { ProgressChart } from "./ProgressChart";
import { SuccessAnimation } from "./SuccessAnimation";
import { getRandomMotivation } from "@/data/mealImages";

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
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [weight, setWeight] = useState("");
  const [waist, setWaist] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    fetchWeightData();
  }, []);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!weight) {
      toast.error("Please enter your weight");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/weight-management/weight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weight: parseFloat(weight),
          waistCircumference: waist ? parseFloat(waist) : null,
          notes: notes || null,
        }),
      });

      if (res.ok) {
        // Show celebratory animation
        setSuccessMessage(getRandomMotivation("weightTracking"));
        setShowSuccess(true);

        setWeight("");
        setWaist("");
        setNotes("");
        setShowForm(false);
        fetchWeightData();
      } else {
        throw new Error("Failed to log weight");
      }
    } catch (error) {
      toast.error("Failed to log weight");
    } finally {
      setSubmitting(false);
    }
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
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Your Journey</CardTitle>
            <Button
              onClick={() => setShowForm(!showForm)}
              size="sm"
              className={showForm ? "bg-gray-200 text-gray-700 hover:bg-gray-300" : "bg-emerald-600 hover:bg-emerald-700"}
            >
              <Plus className="w-4 h-4 mr-1" /> Log Weight
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showForm && (
            <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gradient-to-br from-emerald-50/50 to-teal-50/50 dark:from-emerald-950/20 dark:to-teal-950/20 rounded-xl border border-emerald-100 dark:border-emerald-900 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Scale className="w-5 h-5 text-emerald-600" />
                <span className="font-medium text-emerald-800 dark:text-emerald-200">How are you doing today?</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="weight">Weight (kg) *</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    placeholder="75.5"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    required
                    className="text-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="waist">Waist (cm)</Label>
                  <Input
                    id="waist"
                    type="number"
                    step="0.1"
                    placeholder="85"
                    value={waist}
                    onChange={(e) => setWaist(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">How are you feeling?</Label>
                <Input
                  id="notes"
                  placeholder="e.g., Feeling energized today!"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700">
                  {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Save Entry
                </Button>
                <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          )}

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
