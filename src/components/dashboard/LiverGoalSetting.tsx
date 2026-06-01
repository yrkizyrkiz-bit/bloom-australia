"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  TrendingUp,
  TrendingDown,
  CheckCircle,
  Clock,
  Trash2,
  Award,
  Sparkles,
  ArrowRight
} from "lucide-react";
import { toast } from "sonner";
import { getBiomarkerById } from "@/data/biomarkers";
import type { BiomarkerResult } from "@/types";

interface LiverGoal {
  id: string;
  biomarkerId: string;
  targetValue: number;
  startValue: number;
  currentValue: number;
  startDate: string;
  targetDate: string;
  status: "in_progress" | "achieved" | "missed" | "at_risk";
  notes?: string;
}

// Mock liver-specific goals
const mockLiverGoals: LiverGoal[] = [
  {
    id: "lgoal_1",
    biomarkerId: "triglycerides",
    targetValue: 100,
    startValue: 180,
    currentValue: 145,
    startDate: "2023-06-01",
    targetDate: "2024-06-01",
    status: "in_progress",
    notes: "Reducing refined carbs and adding omega-3s"
  },
  {
    id: "lgoal_2",
    biomarkerId: "hdl_cholesterol",
    targetValue: 65,
    startValue: 48,
    currentValue: 58,
    startDate: "2023-06-01",
    targetDate: "2024-06-01",
    status: "in_progress",
    notes: "Exercise and healthy fats focus"
  },
  {
    id: "lgoal_3",
    biomarkerId: "ggt",
    targetValue: 25,
    startValue: 45,
    currentValue: 28,
    startDate: "2023-06-01",
    targetDate: "2024-03-01",
    status: "achieved",
    notes: "Reduced alcohol, improved sleep"
  }
];

// Liver test biomarkers available for goals
const liverBiomarkerOptions = [
  { id: "alt", name: "ALT", unit: "U/L", direction: "lower" },
  { id: "ast", name: "AST", unit: "U/L", direction: "lower" },
  { id: "ggt", name: "GGT", unit: "U/L", direction: "lower" },
  { id: "glucose", name: "Fasting Glucose", unit: "mg/dL", direction: "lower" },
  { id: "hba1c", name: "HbA1c", unit: "%", direction: "lower" },
  { id: "insulin", name: "Fasting Insulin", unit: "μIU/mL", direction: "lower" },
  { id: "total_cholesterol", name: "Total Cholesterol", unit: "mg/dL", direction: "lower" },
  { id: "triglycerides", name: "Triglycerides", unit: "mg/dL", direction: "lower" },
  { id: "ldl_cholesterol", name: "LDL Cholesterol", unit: "mg/dL", direction: "lower" },
  { id: "hdl_cholesterol", name: "HDL Cholesterol", unit: "mg/dL", direction: "higher" },
  { id: "crp", name: "CRP", unit: "mg/L", direction: "lower" },
  { id: "ferritin", name: "Ferritin", unit: "ng/mL", direction: "optimal" },
  { id: "uric_acid", name: "Uric Acid", unit: "mg/dL", direction: "lower" },
];

interface LiverGoalSettingProps {
  currentResults: BiomarkerResult[];
}

export function LiverGoalSetting({ currentResults }: LiverGoalSettingProps) {
  const [goals, setGoals] = useState<LiverGoal[]>(mockLiverGoals);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newGoal, setNewGoal] = useState({
    biomarkerId: "",
    targetValue: "",
    targetDate: "",
    notes: ""
  });

  const getCurrentValue = (biomarkerId: string): number | null => {
    const result = currentResults.find(r => r.biomarkerId === biomarkerId);
    return result ? result.value : null;
  };

  const calculateProgress = (goal: LiverGoal): number => {
    const biomarkerOption = liverBiomarkerOptions.find(b => b.id === goal.biomarkerId);
    const isHigherBetter = biomarkerOption?.direction === "higher";

    if (isHigherBetter) {
      // For HDL, higher is better
      const totalChange = goal.targetValue - goal.startValue;
      const currentChange = goal.currentValue - goal.startValue;
      return Math.min(100, Math.max(0, (currentChange / totalChange) * 100));
    } else {
      // For most markers, lower is better
      const totalChange = goal.startValue - goal.targetValue;
      const currentChange = goal.startValue - goal.currentValue;
      return Math.min(100, Math.max(0, (currentChange / totalChange) * 100));
    }
  };

  const getProgressColor = (progress: number, status: LiverGoal["status"]): string => {
    if (status === "achieved") return "bg-green-500";
    if (status === "missed") return "bg-red-500";
    if (progress >= 75) return "bg-green-500";
    if (progress >= 50) return "bg-yellow-500";
    if (progress >= 25) return "bg-orange-500";
    return "bg-red-500";
  };

  const getStatusBadge = (status: LiverGoal["status"]) => {
    switch (status) {
      case "achieved":
        return <Badge className="bg-green-600"><CheckCircle className="w-3 h-3 mr-1" />Achieved</Badge>;
      case "in_progress":
        return <Badge variant="outline" className="border-blue-500 text-blue-600"><Clock className="w-3 h-3 mr-1" />In Progress</Badge>;
      case "at_risk":
        return <Badge variant="outline" className="border-orange-500 text-orange-600"><TrendingDown className="w-3 h-3 mr-1" />At Risk</Badge>;
      case "missed":
        return <Badge variant="outline" className="border-red-500 text-red-600">Missed</Badge>;
    }
  };

  const handleCreateGoal = () => {
    if (!newGoal.biomarkerId || !newGoal.targetValue || !newGoal.targetDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    const currentValue = getCurrentValue(newGoal.biomarkerId);
    if (currentValue === null) {
      toast.error("No current data available for this biomarker");
      return;
    }

    const goal: LiverGoal = {
      id: `lgoal_${Date.now()}`,
      biomarkerId: newGoal.biomarkerId,
      targetValue: parseFloat(newGoal.targetValue),
      startValue: currentValue,
      currentValue: currentValue,
      startDate: new Date().toISOString().split('T')[0],
      targetDate: newGoal.targetDate,
      status: "in_progress",
      notes: newGoal.notes || undefined
    };

    setGoals([...goals, goal]);
    setIsDialogOpen(false);
    setNewGoal({ biomarkerId: "", targetValue: "", targetDate: "", notes: "" });
    toast.success("Goal created! We'll track your progress.");
  };

  const handleDeleteGoal = (goalId: string) => {
    setGoals(goals.filter(g => g.id !== goalId));
    toast.success("Goal removed");
  };

  const achievedCount = goals.filter(g => g.status === "achieved").length;
  const inProgressCount = goals.filter(g => g.status === "in_progress").length;

  // AI-suggested goals based on current results
  const suggestedGoals = useMemo(() => {
    const suggestions: Array<{ biomarkerId: string; reason: string; suggestedTarget: number }> = [];

    // Check triglycerides
    const trig = currentResults.find(r => r.biomarkerId === "triglycerides");
    if (trig && trig.value > 100 && !goals.find(g => g.biomarkerId === "triglycerides")) {
      suggestions.push({
        biomarkerId: "triglycerides",
        reason: "Currently elevated at " + trig.value + " mg/dL",
        suggestedTarget: 100
      });
    }

    // Check HDL
    const hdl = currentResults.find(r => r.biomarkerId === "hdl_cholesterol");
    if (hdl && hdl.value < 60 && !goals.find(g => g.biomarkerId === "hdl_cholesterol")) {
      suggestions.push({
        biomarkerId: "hdl_cholesterol",
        reason: "Below optimal at " + hdl.value + " mg/dL",
        suggestedTarget: 65
      });
    }

    // Check insulin
    const insulin = currentResults.find(r => r.biomarkerId === "insulin");
    if (insulin && insulin.value > 6 && !goals.find(g => g.biomarkerId === "insulin")) {
      suggestions.push({
        biomarkerId: "insulin",
        reason: "Above optimal at " + insulin.value + " μIU/mL",
        suggestedTarget: 5
      });
    }

    return suggestions;
  }, [currentResults, goals]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Liver Health Goals
            </CardTitle>
            <CardDescription>Set and track improvement goals for your liver biomarkers</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="w-4 h-4" />
                New Goal
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create Liver Health Goal</DialogTitle>
                <DialogDescription>
                  Set a target for a specific biomarker and track your progress
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="biomarker">Biomarker *</Label>
                  <Select
                    value={newGoal.biomarkerId}
                    onValueChange={(value) => setNewGoal({ ...newGoal, biomarkerId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select biomarker" />
                    </SelectTrigger>
                    <SelectContent>
                      {liverBiomarkerOptions.map(b => {
                        const current = getCurrentValue(b.id);
                        const hasGoal = goals.find(g => g.biomarkerId === b.id && g.status === "in_progress");
                        return (
                          <SelectItem
                            key={b.id}
                            value={b.id}
                            disabled={!!hasGoal}
                          >
                            {b.name} {current !== null && `(Current: ${current} ${b.unit})`}
                            {hasGoal && " - Goal exists"}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {newGoal.biomarkerId && (
                  <div className="p-3 bg-muted/50 rounded-lg text-sm">
                    <p className="font-medium mb-1">Current Value</p>
                    <p className="text-2xl font-bold text-primary">
                      {getCurrentValue(newGoal.biomarkerId) ?? "N/A"}
                      <span className="text-sm font-normal text-muted-foreground ml-1">
                        {liverBiomarkerOptions.find(b => b.id === newGoal.biomarkerId)?.unit}
                      </span>
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="target">Target Value *</Label>
                    <Input
                      id="target"
                      type="number"
                      step="0.1"
                      placeholder="e.g., 100"
                      value={newGoal.targetValue}
                      onChange={(e) => setNewGoal({ ...newGoal, targetValue: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="date">Target Date *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={newGoal.targetDate}
                      onChange={(e) => setNewGoal({ ...newGoal, targetDate: e.target.value })}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="notes">Notes (optional)</Label>
                  <Input
                    id="notes"
                    placeholder="e.g., Strategy or motivation"
                    value={newGoal.notes}
                    onChange={(e) => setNewGoal({ ...newGoal, notes: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleCreateGoal}>Create Goal</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 rounded-lg bg-green-500/10">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Award className="w-4 h-4 text-green-600" />
              <span className="text-2xl font-bold text-green-600">{achievedCount}</span>
            </div>
            <p className="text-xs text-muted-foreground">Achieved</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-blue-500/10">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Clock className="w-4 h-4 text-blue-600" />
              <span className="text-2xl font-bold text-blue-600">{inProgressCount}</span>
            </div>
            <p className="text-xs text-muted-foreground">In Progress</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-primary/10">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Target className="w-4 h-4 text-primary" />
              <span className="text-2xl font-bold text-primary">{goals.length}</span>
            </div>
            <p className="text-xs text-muted-foreground">Total Goals</p>
          </div>
        </div>

        {/* AI Suggested Goals */}
        {suggestedGoals.length > 0 && (
          <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              AI-Suggested Goals
            </h4>
            <div className="space-y-2">
              {suggestedGoals.map(suggestion => {
                const biomarker = liverBiomarkerOptions.find(b => b.id === suggestion.biomarkerId);
                return (
                  <div
                    key={suggestion.biomarkerId}
                    className="flex items-center justify-between p-2 rounded bg-white dark:bg-slate-900 border border-border"
                  >
                    <div>
                      <p className="font-medium text-sm">{biomarker?.name}</p>
                      <p className="text-xs text-muted-foreground">{suggestion.reason}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setNewGoal({
                          biomarkerId: suggestion.biomarkerId,
                          targetValue: suggestion.suggestedTarget.toString(),
                          targetDate: "",
                          notes: ""
                        });
                        setIsDialogOpen(true);
                      }}
                    >
                      Set Goal
                      <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Goals List */}
        {goals.length > 0 ? (
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Your Goals</h4>
            {goals.map(goal => {
              const biomarker = getBiomarkerById(goal.biomarkerId);
              const biomarkerOption = liverBiomarkerOptions.find(b => b.id === goal.biomarkerId);
              const progress = calculateProgress(goal);
              const isHigherBetter = biomarkerOption?.direction === "higher";
              const daysLeft = Math.ceil((new Date(goal.targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

              return (
                <div key={goal.id} className="p-4 rounded-lg border border-border">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h5 className="font-medium">{biomarker?.name || biomarkerOption?.name}</h5>
                        {getStatusBadge(goal.status)}
                      </div>
                      {goal.notes && (
                        <p className="text-xs text-muted-foreground">{goal.notes}</p>
                      )}
                    </div>
                    {goal.status === "in_progress" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-red-600"
                        onClick={() => handleDeleteGoal(goal.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-3 text-center">
                    <div>
                      <p className="text-xs text-muted-foreground">Start</p>
                      <p className="font-medium">{goal.startValue}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Current</p>
                      <p className="font-bold text-lg text-primary">{goal.currentValue}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Target</p>
                      <p className="font-medium">{goal.targetValue}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{Math.round(progress)}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${getProgressColor(progress, goal.status)}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {isHigherBetter ? (
                          <span className="flex items-center gap-1">
                            <TrendingUp className="w-3 h-3 text-green-600" />
                            +{(goal.currentValue - goal.startValue).toFixed(1)} {biomarkerOption?.unit}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <TrendingDown className="w-3 h-3 text-green-600" />
                            -{(goal.startValue - goal.currentValue).toFixed(1)} {biomarkerOption?.unit}
                          </span>
                        )}
                      </span>
                      <span>
                        {goal.status === "achieved" ? (
                          "Goal achieved!"
                        ) : daysLeft > 0 ? (
                          `${daysLeft} days left`
                        ) : (
                          "Past deadline"
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Target className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p>No goals set yet</p>
            <p className="text-sm">Create your first liver health goal to start tracking</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
