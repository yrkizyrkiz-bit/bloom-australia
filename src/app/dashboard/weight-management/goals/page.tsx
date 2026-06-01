"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Target, Trophy, Calendar, TrendingDown, Loader2, CheckCircle2, Pause, X } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface WeightGoal {
  id: string;
  startWeight: number;
  targetWeight: number;
  currentWeight: number;
  startDate: string;
  targetDate: string;
  status: string;
  weeklyTargetLoss: number;
  actualLost: number;
  percentComplete: number;
  remainingToLose: number;
  daysRemaining: number;
  requiredWeeklyLoss: number;
  isOnTrack: boolean;
}

interface GoalsData {
  goals: WeightGoal[];
  activeGoal: WeightGoal | null;
}

export default function GoalsPage() {
  const [data, setData] = useState<GoalsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [startWeight, setStartWeight] = useState("");
  const [targetWeight, setTargetWeight] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [weeklyLoss, setWeeklyLoss] = useState("0.5");

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      const res = await fetch("/api/weight-management/goals?includeCompleted=true");
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch (error) {
      console.error("Error fetching goals:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startWeight || !targetWeight || !targetDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/weight-management/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startWeight: parseFloat(startWeight),
          targetWeight: parseFloat(targetWeight),
          targetDate,
          weeklyTargetLoss: parseFloat(weeklyLoss),
        }),
      });

      if (res.ok) {
        toast.success("Goal created!");
        setShowForm(false);
        setStartWeight("");
        setTargetWeight("");
        setTargetDate("");
        fetchGoals();
      }
    } catch (error) {
      toast.error("Failed to create goal");
    } finally {
      setSubmitting(false);
    }
  };

  const updateGoalStatus = async (id: string, status: string) => {
    try {
      const res = await fetch("/api/weight-management/goals", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        toast.success("Goal updated");
        fetchGoals();
      }
    } catch (error) {
      toast.error("Failed to update goal");
    }
  };

  const getMinDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date.toISOString().split("T")[0];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const activeGoal = data?.activeGoal;

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/weight-management">
          <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Weight Goals</h1>
          <p className="text-muted-foreground">Set and track your weight loss goals</p>
        </div>
        {!activeGoal && (
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="w-4 h-4 mr-2" /> New Goal
          </Button>
        )}
      </div>

      {/* Active Goal */}
      {activeGoal && (
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                <CardTitle>Active Goal</CardTitle>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => updateGoalStatus(activeGoal.id, "PAUSED")}>
                  <Pause className="w-4 h-4 mr-1" /> Pause
                </Button>
                <Button variant="outline" size="sm" onClick={() => updateGoalStatus(activeGoal.id, "ACHIEVED")}>
                  <CheckCircle2 className="w-4 h-4 mr-1" /> Complete
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">{activeGoal.startWeight} kg</p>
                <p className="text-xs text-muted-foreground">Start</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">{activeGoal.currentWeight} kg</p>
                <p className="text-xs text-muted-foreground">Current</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{activeGoal.targetWeight} kg</p>
                <p className="text-xs text-muted-foreground">Target</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span className="font-semibold">{activeGoal.percentComplete}%</span>
              </div>
              <Progress value={activeGoal.percentComplete} className="h-3" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{activeGoal.actualLost} kg lost</span>
                <span>{activeGoal.remainingToLose} kg to go</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{activeGoal.daysRemaining} days left</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Target: {new Date(activeGoal.targetDate).toLocaleDateString()}
                </p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingDown className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{activeGoal.requiredWeeklyLoss} kg/week</span>
                </div>
                <Badge variant={activeGoal.isOnTrack ? "default" : "destructive"} className="text-xs">
                  {activeGoal.isOnTrack ? "On Track" : "Behind Schedule"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Goal Form */}
      {showForm && !activeGoal && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Create New Goal</CardTitle>
            <CardDescription>Set a realistic weight loss target</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Starting Weight (kg) *</Label>
                  <Input type="number" step="0.1" placeholder="85" value={startWeight} onChange={(e) => setStartWeight(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Target Weight (kg) *</Label>
                  <Input type="number" step="0.1" placeholder="75" value={targetWeight} onChange={(e) => setTargetWeight(e.target.value)} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Target Date *</Label>
                  <Input type="date" min={getMinDate()} value={targetDate} onChange={(e) => setTargetDate(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Weekly Target Loss (kg)</Label>
                  <Input type="number" step="0.1" placeholder="0.5" value={weeklyLoss} onChange={(e) => setWeeklyLoss(e.target.value)} />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Recommended: 0.5-1 kg per week for sustainable weight loss
              </p>
              <div className="flex gap-2">
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Create Goal
                </Button>
                <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Past Goals */}
      {data?.goals && data.goals.filter(g => g.status !== "IN_PROGRESS").length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Past Goals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.goals.filter(g => g.status !== "IN_PROGRESS").map((goal) => (
                <div key={goal.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">{goal.startWeight} kg → {goal.targetWeight} kg</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(goal.startDate).toLocaleDateString()} - {new Date(goal.targetDate).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant={goal.status === "ACHIEVED" ? "default" : "secondary"}>
                    {goal.status === "ACHIEVED" && <Trophy className="w-3 h-3 mr-1" />}
                    {goal.status.replace("_", " ")}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!activeGoal && !showForm && (!data?.goals || data.goals.length === 0) && (
        <Card className="text-center py-12">
          <CardContent>
            <Target className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No goals yet</h3>
            <p className="text-muted-foreground mb-4">Set your first weight loss goal to start tracking</p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-2" /> Create Goal
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
