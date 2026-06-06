"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Target,
  Plus,
  TrendingDown,
  Calendar,
  Award,
  ChevronLeft,
  Loader2,
  CheckCircle,
  Clock,
  Trash2,
  Sparkles,
  Brain,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface BiologicalAgeGoal {
  id: string;
  targetAge: number;
  currentAge: number;
  startAge: number;
  targetDate: string;
  status: "IN_PROGRESS" | "ACHIEVED" | "MISSED";
  createdAt: string;
  notes?: string;
}

interface BiologicalAgeData {
  biologicalAge: number;
  chronologicalAge: number;
  ageDifference: number;
}

export default function BiologicalAgeGoalsPage() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<BiologicalAgeGoal[]>([]);
  const [bioAgeData, setBioAgeData] = useState<BiologicalAgeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // New goal form
  const [targetReduction, setTargetReduction] = useState(2);
  const [targetMonths, setTargetMonths] = useState(6);
  const [goalNotes, setGoalNotes] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch biological age
      const bioAgeRes = await fetch("/api/biological-age");
      if (bioAgeRes.ok) {
        const data = await bioAgeRes.json();
        setBioAgeData(data.biologicalAge);
      }

      // Fetch existing goals
      const goalsRes = await fetch("/api/goals?type=biological_age");
      if (goalsRes.ok) {
        const data = await goalsRes.json();
        // Map to biological age goals format
        const bioAgeGoals = (data.goals || []).filter((g: any) => g.biomarkerId === "biological_age");
        setGoals(bioAgeGoals.map((g: any) => ({
          id: g.id,
          targetAge: g.targetValue,
          currentAge: g.currentValue,
          startAge: g.startValue,
          targetDate: g.targetDate,
          status: g.status,
          createdAt: g.createdAt,
          notes: g.notes,
        })));
      }
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const createGoal = async () => {
    if (!bioAgeData) return;

    setIsCreating(true);
    try {
      const targetDate = new Date();
      targetDate.setMonth(targetDate.getMonth() + targetMonths);

      const response = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          biomarkerId: "biological_age",
          targetValue: bioAgeData.biologicalAge - targetReduction,
          currentValue: bioAgeData.biologicalAge,
          startValue: bioAgeData.biologicalAge,
          targetDate: targetDate.toISOString(),
          notes: goalNotes || `Reduce biological age by ${targetReduction} years`,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create goal");
      }

      toast.success("Biological age goal created!");
      setShowCreateDialog(false);
      setTargetReduction(2);
      setTargetMonths(6);
      setGoalNotes("");
      fetchData();
    } catch (err) {
      console.error("Error creating goal:", err);
      toast.error("Failed to create goal");
    } finally {
      setIsCreating(false);
    }
  };

  const deleteGoal = async (goalId: string) => {
    try {
      const response = await fetch(`/api/goals/${goalId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete goal");
      }

      toast.success("Goal deleted");
      setGoals(goals.filter(g => g.id !== goalId));
    } catch (err) {
      console.error("Error deleting goal:", err);
      toast.error("Failed to delete goal");
    }
  };

  const calculateProgress = (goal: BiologicalAgeGoal) => {
    const totalReduction = goal.startAge - goal.targetAge;
    const currentReduction = goal.startAge - goal.currentAge;
    if (totalReduction <= 0) return 0;
    return Math.min(100, Math.max(0, (currentReduction / totalReduction) * 100));
  };

  const getDaysRemaining = (targetDate: string) => {
    const target = new Date(targetDate);
    const now = new Date();
    const diff = target.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading goals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/biological-age">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-serif">Biological Age Goals</h1>
            <p className="text-muted-foreground mt-1">Set targets to reduce your biological age</p>
          </div>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          New Goal
        </Button>
      </div>

      {/* Current Status */}
      {bioAgeData && (
        <Card className="bg-gradient-to-r from-purple-500/5 to-primary/5 border-purple-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <Brain className="w-8 h-8 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Current Biological Age</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-purple-600">
                    {Math.round(bioAgeData.biologicalAge)}
                  </span>
                  <span className="text-muted-foreground">years</span>
                  <Badge className={`ml-2 ${
                    bioAgeData.ageDifference < 0 ? "bg-green-500/10 text-green-600" :
                    bioAgeData.ageDifference > 0 ? "bg-orange-500/10 text-orange-600" :
                    "bg-gray-500/10"
                  }`}>
                    {bioAgeData.ageDifference > 0 ? "+" : ""}{Math.round(bioAgeData.ageDifference)} vs chronological
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Goals List */}
      {goals.length > 0 ? (
        <div className="space-y-4">
          {goals.map(goal => {
            const progress = calculateProgress(goal);
            const daysRemaining = getDaysRemaining(goal.targetDate);
            const isOverdue = daysRemaining < 0;
            const isAchieved = goal.status === "ACHIEVED";

            return (
              <Card key={goal.id} className={isAchieved ? "border-green-500/30 bg-green-50/30" : ""}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        isAchieved ? "bg-green-500/10" : "bg-primary/10"
                      }`}>
                        {isAchieved ? (
                          <Award className="w-6 h-6 text-green-600" />
                        ) : (
                          <Target className="w-6 h-6 text-primary" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">
                          Reduce to {goal.targetAge} years
                        </p>
                        <p className="text-sm text-muted-foreground">
                          From {goal.startAge} years ({goal.startAge - goal.targetAge} year reduction)
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={
                        isAchieved ? "bg-green-500/10 text-green-600" :
                        isOverdue ? "bg-red-500/10 text-red-600" :
                        "bg-blue-500/10 text-blue-600"
                      }>
                        {isAchieved ? "Achieved" : isOverdue ? "Overdue" : "In Progress"}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteGoal(goal.id)}
                        className="text-muted-foreground hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span>Progress</span>
                      <span className="font-medium">{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />

                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <TrendingDown className="w-4 h-4" />
                        <span>
                          Current: {goal.currentAge} years
                          ({goal.startAge - goal.currentAge > 0 ? "-" : "+"}{Math.abs(goal.startAge - goal.currentAge)} from start)
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {isOverdue
                            ? `${Math.abs(daysRemaining)} days overdue`
                            : `${daysRemaining} days remaining`
                          }
                        </span>
                      </div>
                    </div>

                    {goal.notes && (
                      <p className="text-sm text-muted-foreground pt-2 border-t">
                        {goal.notes}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Target className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
            <h3 className="text-xl font-medium mb-2">No Goals Set</h3>
            <p className="text-muted-foreground mb-4">
              Set a biological age reduction goal to track your progress
            </p>
            <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Create Your First Goal
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Tips Card */}
      <Card className="bg-gradient-to-r from-amber-500/5 to-orange-500/5 border-amber-500/20">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-600" />
            Tips for Reducing Biological Age
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <ArrowRight className="w-4 h-4 mt-1 text-amber-600" />
              <div>
                <p className="font-medium text-sm">Optimize Sleep</p>
                <p className="text-xs text-muted-foreground">7-9 hours of quality sleep can reduce biological age by 1-2 years</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <ArrowRight className="w-4 h-4 mt-1 text-amber-600" />
              <div>
                <p className="font-medium text-sm">Regular Exercise</p>
                <p className="text-xs text-muted-foreground">150 min/week of moderate exercise improves multiple biomarkers</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <ArrowRight className="w-4 h-4 mt-1 text-amber-600" />
              <div>
                <p className="font-medium text-sm">Anti-Inflammatory Diet</p>
                <p className="text-xs text-muted-foreground">Mediterranean diet rich in omega-3s and antioxidants</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <ArrowRight className="w-4 h-4 mt-1 text-amber-600" />
              <div>
                <p className="font-medium text-sm">Stress Management</p>
                <p className="text-xs text-muted-foreground">Meditation and relaxation can lower cortisol and inflammation</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create Goal Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Create Biological Age Goal
            </DialogTitle>
            <DialogDescription>
              Set a target to reduce your biological age
            </DialogDescription>
          </DialogHeader>

          {bioAgeData && (
            <div className="space-y-6 py-4">
              <div className="p-4 rounded-lg bg-muted/50 border">
                <p className="text-sm text-muted-foreground mb-1">Current Biological Age</p>
                <p className="text-2xl font-bold">{Math.round(bioAgeData.biologicalAge)} years</p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label>Target Reduction (years)</Label>
                  <div className="flex items-center gap-4 mt-2">
                    <Slider
                      value={[targetReduction]}
                      onValueChange={(v: number[]) => setTargetReduction(v[0])}
                      min={1}
                      max={10}
                      step={0.5}
                      className="flex-1"
                    />
                    <div className="w-20 text-center">
                      <span className="text-2xl font-bold text-primary">{targetReduction}</span>
                      <span className="text-sm text-muted-foreground ml-1">yrs</span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Target: {(bioAgeData.biologicalAge - targetReduction).toFixed(1)} years
                  </p>
                </div>

                <div>
                  <Label>Timeframe</Label>
                  <Select value={targetMonths.toString()} onValueChange={(v) => setTargetMonths(parseInt(v))}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 months</SelectItem>
                      <SelectItem value="6">6 months</SelectItem>
                      <SelectItem value="9">9 months</SelectItem>
                      <SelectItem value="12">12 months</SelectItem>
                      <SelectItem value="18">18 months</SelectItem>
                      <SelectItem value="24">24 months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Notes (optional)</Label>
                  <Input
                    value={goalNotes}
                    onChange={(e) => setGoalNotes(e.target.value)}
                    placeholder="e.g., Focus on improving metabolic markers"
                    className="mt-2"
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={createGoal} disabled={isCreating || !bioAgeData} className="gap-2">
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Create Goal
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
