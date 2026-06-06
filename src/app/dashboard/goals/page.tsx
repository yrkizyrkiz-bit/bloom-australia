"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { getBiomarkerById, biomarkerDefinitions, categoryInfo } from "@/data/biomarkers";
import { toast } from "sonner";
import {
  Target,
  Plus,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  Clock,
  Calendar,
  Pause,
  Play,
  Trophy,
  Sparkles,
  Loader2,
  RefreshCw
} from "lucide-react";

interface Goal {
  id: string;
  biomarkerId: string;
  targetValue: number;
  currentValue: number;
  startValue: number;
  startDate: string;
  targetDate: string;
  status: string;
  notes?: string;
  createdAt: string;
  biomarker?: {
    name: string;
    shortName: string;
    category: string;
    unit: string;
  };
}

export default function GoalsPage() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showNewGoalDialog, setShowNewGoalDialog] = useState(false);
  const [selectedBiomarker, setSelectedBiomarker] = useState<string>("");
  const [targetValue, setTargetValue] = useState<string>("");
  const [targetDate, setTargetDate] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const gender = user?.gender === "female" ? "female" : "male";

  // Fetch goals from API
  const fetchGoals = async () => {
    try {
      const response = await fetch("/api/goals");
      if (!response.ok) throw new Error("Failed to fetch goals");
      const data = await response.json();
      setGoals(data.goals || []);
    } catch (error) {
      console.error("Error fetching goals:", error);
      toast.error("Failed to load goals");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const activeGoals = useMemo(() => goals.filter(g => g.status === "IN_PROGRESS"), [goals]);
  const achievedGoals = useMemo(() => goals.filter(g => g.status === "ACHIEVED"), [goals]);
  const pausedGoals = useMemo(() => goals.filter(g => g.status === "PAUSED" || g.status === "CANCELLED"), [goals]);

  // Get biomarkers that don't already have active goals
  const availableBiomarkers = useMemo(() => {
    const activeGoalBiomarkers = new Set(activeGoals.map(g => g.biomarkerId));
    return biomarkerDefinitions.filter(b => !activeGoalBiomarkers.has(b.id));
  }, [activeGoals]);

  const calculateProgress = (goal: Goal) => {
    const totalDistance = Math.abs(goal.targetValue - goal.startValue);
    if (totalDistance === 0) return 100;
    const currentDistance = Math.abs(goal.currentValue - goal.startValue);
    return Math.min(100, Math.round((currentDistance / totalDistance) * 100));
  };

  const getDaysRemaining = (targetDate: string) => {
    const target = new Date(targetDate);
    const now = new Date();
    const diff = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const handleCreateGoal = async () => {
    if (!selectedBiomarker || !targetValue || !targetDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    const biomarker = getBiomarkerById(selectedBiomarker);
    if (!biomarker) {
      toast.error("Could not find biomarker data");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          biomarkerId: selectedBiomarker,
          targetValue: parseFloat(targetValue),
          currentValue: 0, // Will be updated when results are uploaded
          startValue: 0,
          startDate: new Date().toISOString(),
          targetDate: new Date(targetDate).toISOString(),
          notes: notes || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create goal");
      }

      toast.success("Goal created successfully!");
      setShowNewGoalDialog(false);
      setSelectedBiomarker("");
      setTargetValue("");
      setTargetDate("");
      setNotes("");
      fetchGoals(); // Refresh goals list
    } catch (error) {
      console.error("Error creating goal:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create goal");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateGoalStatus = async (goalId: string, newStatus: string) => {
    try {
      const response = await fetch("/api/goals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: goalId,
          status: newStatus,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update goal");
      }

      toast.success(`Goal ${newStatus === "PAUSED" ? "paused" : newStatus === "IN_PROGRESS" ? "resumed" : "updated"}`);
      fetchGoals(); // Refresh goals list
    } catch (error) {
      console.error("Error updating goal:", error);
      toast.error("Failed to update goal");
    }
  };

  const GoalCard = ({ goal }: { goal: Goal }) => {
    const biomarker = goal.biomarker || getBiomarkerById(goal.biomarkerId);
    if (!biomarker) return null;

    const progress = calculateProgress(goal);
    const daysRemaining = getDaysRemaining(goal.targetDate);
    const biomarkerDef = getBiomarkerById(goal.biomarkerId);
    const range = biomarkerDef?.ranges[gender];
    const isImproving = goal.targetValue > goal.startValue
      ? goal.currentValue > goal.startValue
      : goal.currentValue < goal.startValue;

    const categoryColor = biomarkerDef ? categoryInfo[biomarkerDef.category]?.color : "#666";

    return (
      <Card className={`relative overflow-hidden ${goal.status === "ACHIEVED" ? "border-green-500/30" : goal.status === "PAUSED" ? "opacity-60" : ""}`}>
        {goal.status === "ACHIEVED" && (
          <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/10 rounded-bl-full flex items-start justify-end p-2">
            <Trophy className="w-5 h-5 text-green-600" />
          </div>
        )}
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{
                  backgroundColor: `${categoryColor}20`,
                  color: categoryColor
                }}
              >
                <Target className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-lg">{biomarker.shortName}</CardTitle>
                <CardDescription>{biomarker.name}</CardDescription>
              </div>
            </div>
            <Badge className={`
              ${goal.status === "ACHIEVED" ? "bg-green-500/10 text-green-600" :
                goal.status === "PAUSED" ? "bg-gray-500/10 text-gray-600" :
                "bg-primary/10 text-primary"}
            `}>
              {goal.status === "IN_PROGRESS" ? "Active" : goal.status.charAt(0) + goal.status.slice(1).toLowerCase()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress visualization */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Start: {goal.startValue} {range?.unit || (goal.biomarker as { unit?: string })?.unit || ''}</span>
              <span>Target: {goal.targetValue} {range?.unit || (goal.biomarker as { unit?: string })?.unit || ''}</span>
            </div>
          </div>

          {/* Current value */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div>
              <p className="text-xs text-muted-foreground">Current Value</p>
              <p className="text-2xl font-serif font-bold">{goal.currentValue}</p>
            </div>
            <div className="flex items-center gap-2">
              {goal.currentValue > 0 && (isImproving ? (
                <div className="flex items-center gap-1 text-green-600">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm font-medium">On Track</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-orange-600">
                  <TrendingDown className="w-4 h-4" />
                  <span className="text-sm font-medium">Needs Focus</span>
                </div>
              ))}
            </div>
          </div>

          {/* Timeline */}
          {goal.status !== "ACHIEVED" && (
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>Target: {new Date(goal.targetDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
              <Badge variant="outline" className={daysRemaining < 30 ? "border-orange-500 text-orange-600" : ""}>
                {daysRemaining > 0 ? `${daysRemaining} days left` : "Overdue"}
              </Badge>
            </div>
          )}

          {/* Notes */}
          {goal.notes && (
            <p className="text-sm text-muted-foreground italic border-l-2 border-primary/30 pl-3">
              {goal.notes}
            </p>
          )}

          {/* Actions */}
          {goal.status !== "ACHIEVED" && (
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => handleUpdateGoalStatus(goal.id, goal.status === "PAUSED" ? "IN_PROGRESS" : "PAUSED")}
              >
                {goal.status === "PAUSED" ? (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Resume
                  </>
                ) : (
                  <>
                    <Pause className="w-4 h-4 mr-2" />
                    Pause
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading your goals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif text-foreground">Health Goals</h1>
          <p className="text-muted-foreground mt-1">Set and track targets for your biomarkers</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchGoals}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={showNewGoalDialog} onOpenChange={setShowNewGoalDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                New Goal
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Create New Goal
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Select Biomarker</Label>
                  <Select value={selectedBiomarker} onValueChange={setSelectedBiomarker}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a biomarker" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableBiomarkers.map(b => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.shortName} - {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedBiomarker && (
                  <>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-sm text-muted-foreground">
                        Optimal range: <span className="font-medium text-green-600">
                          {getBiomarkerById(selectedBiomarker)?.ranges[gender].optimal_low} - {getBiomarkerById(selectedBiomarker)?.ranges[gender].optimal_high}
                          {" "}{getBiomarkerById(selectedBiomarker)?.ranges[gender].unit}
                        </span>
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>Target Value</Label>
                      <Input
                        type="number"
                        placeholder="Enter target value"
                        value={targetValue}
                        onChange={(e) => setTargetValue(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Target Date</Label>
                      <Input
                        type="date"
                        value={targetDate}
                        onChange={(e) => setTargetDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Notes (optional)</Label>
                      <Textarea
                        placeholder="Add any notes about your strategy..."
                        value={notes}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
                      />
                    </div>
                  </>
                )}

                <Button
                  onClick={handleCreateGoal}
                  className="w-full"
                  disabled={!selectedBiomarker || !targetValue || !targetDate || isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Goal"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Target className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-serif font-bold">{activeGoals.length}</p>
              <p className="text-xs text-muted-foreground">Active Goals</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-serif font-bold">{achievedGoals.length}</p>
              <p className="text-xs text-muted-foreground">Achieved</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-serif font-bold">{pausedGoals.length}</p>
              <p className="text-xs text-muted-foreground">Paused</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-serif font-bold">
                {activeGoals.length > 0 ? Math.round(activeGoals.reduce((acc, g) => acc + calculateProgress(g), 0) / activeGoals.length) : 0}%
              </p>
              <p className="text-xs text-muted-foreground">Avg Progress</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Goals Tabs */}
      <Tabs defaultValue="active" className="space-y-6">
        <TabsList>
          <TabsTrigger value="active">Active ({activeGoals.length})</TabsTrigger>
          <TabsTrigger value="achieved">Achieved ({achievedGoals.length})</TabsTrigger>
          <TabsTrigger value="paused">Paused ({pausedGoals.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          {activeGoals.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeGoals.map(goal => (
                <GoalCard key={goal.id} goal={goal} />
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium text-lg mb-2">No Active Goals</h3>
              <p className="text-muted-foreground mb-4">Set a goal to start tracking your progress</p>
              <Button onClick={() => setShowNewGoalDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Goal
              </Button>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="achieved">
          {achievedGoals.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {achievedGoals.map(goal => (
                <GoalCard key={goal.id} goal={goal} />
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium text-lg mb-2">No Achieved Goals Yet</h3>
              <p className="text-muted-foreground">Keep working on your active goals!</p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="paused">
          {pausedGoals.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pausedGoals.map(goal => (
                <GoalCard key={goal.id} goal={goal} />
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <Pause className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium text-lg mb-2">No Paused Goals</h3>
              <p className="text-muted-foreground">All your goals are active</p>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Tips Card */}
      <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium mb-2">Tips for Achieving Your Goals</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Set realistic targets based on your current values and optimal ranges</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Allow 3-6 months for most biomarkers to show significant improvement</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Regular testing helps track progress and adjust strategies</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Consult with your healthcare provider for personalized advice</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
