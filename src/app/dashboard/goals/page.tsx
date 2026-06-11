"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { getBiomarkerById, biomarkerDefinitions } from "@/data/biomarkers";
import {
  duplicateGoalMessage,
  findBlockingGoalForBiomarker,
  getBlockingBiomarkerIds,
  PAUSED_GOAL_STATUS,
} from "@/lib/goal-deduplication";
import { defaultNextReviewDate } from "@/lib/goal-review";
import { calculateGoalProgress } from "@/lib/goal-display";
import { GoalReviewDialog } from "@/components/dashboard/GoalReviewDialog";
import { HealthGoalCard } from "@/components/dashboard/HealthGoalCard";
import { toast } from "sonner";
import {
  Target,
  Plus,
  CheckCircle,
  Clock,
  Pause,
  Trophy,
  Sparkles,
  Loader2,
  RefreshCw,
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
  effectiveCurrentValue?: number;
  latestResult?: {
    value: number;
    testedAt: string;
  } | null;
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
  const [targetDate, setTargetDate] = useState<string>(defaultNextReviewDate(3));
  const [notes, setNotes] = useState<string>("");
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [editTargetDate, setEditTargetDate] = useState<string>("");
  const [editTargetValue, setEditTargetValue] = useState<string>("");
  const [editNotes, setEditNotes] = useState<string>("");
  const [deletingGoal, setDeletingGoal] = useState<Goal | null>(null);
  const [reviewingGoal, setReviewingGoal] = useState<Goal | null>(null);

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
  const pausedGoals = useMemo(
    () => goals.filter(g => g.status === PAUSED_GOAL_STATUS),
    [goals]
  );

  const blockingBiomarkerIds = useMemo(
    () => getBlockingBiomarkerIds(goals),
    [goals]
  );

  // Biomarkers without an active or paused goal anywhere in the portal
  const availableBiomarkers = useMemo(() => {
    return biomarkerDefinitions.filter(b => !blockingBiomarkerIds.has(b.id));
  }, [blockingBiomarkerIds]);

  const calculateProgress = (goal: Goal) =>
    calculateGoalProgress(
      goal.startValue,
      goal.targetValue,
      goal.effectiveCurrentValue ?? goal.currentValue,
      goal.biomarkerId
    );

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

    const existing = findBlockingGoalForBiomarker(goals, selectedBiomarker);
    if (existing) {
      toast.info(duplicateGoalMessage(selectedBiomarker, existing));
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
        if (response.status === 409 && data.code === "DUPLICATE_GOAL") {
          toast.info(duplicateGoalMessage(selectedBiomarker, data.existingGoal));
          return;
        }
        throw new Error(data.error || "Failed to create goal");
      }

      toast.success("Goal created successfully!");
      setShowNewGoalDialog(false);
      setSelectedBiomarker("");
      setTargetValue("");
      setTargetDate(defaultNextReviewDate(3));
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
      const response = await fetch(`/api/goals/${goalId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update goal");
      }

      toast.success(`Goal ${newStatus === PAUSED_GOAL_STATUS ? "paused" : newStatus === "IN_PROGRESS" ? "resumed" : "updated"}`);
      fetchGoals();
    } catch (error) {
      console.error("Error updating goal:", error);
      toast.error("Failed to update goal");
    }
  };

  const handleOpenEditGoal = (goal: Goal) => {
    setEditingGoal(goal);
    setEditTargetDate(new Date(goal.targetDate).toISOString().split("T")[0]);
    setEditTargetValue(String(goal.targetValue));
    setEditNotes(goal.notes || "");
  };

  const handleSaveGoalEdits = async () => {
    if (!editingGoal || !editTargetDate || !editTargetValue) {
      toast.error("Please fill in target value and date");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`/api/goals/${editingGoal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetValue: parseFloat(editTargetValue),
          targetDate: editTargetDate,
          notes: editNotes || null,
        }),
      });

      if (!response.ok) throw new Error("Failed to update goal");

      toast.success("Goal updated");
      setEditingGoal(null);
      fetchGoals();
    } catch (error) {
      console.error("Error updating goal:", error);
      toast.error("Failed to update goal");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteGoal = async () => {
    if (!deletingGoal) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/goals/${deletingGoal.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete goal");

      toast.success("Goal deleted");
      setDeletingGoal(null);
      fetchGoals();
    } catch (error) {
      console.error("Error deleting goal:", error);
      toast.error("Failed to delete goal");
    } finally {
      setIsSaving(false);
    }
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
          <p className="text-muted-foreground mt-1">Set biomarker targets and review progress on scheduled dates</p>
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
                      <Label>Review date</Label>
                      <Input
                        type="date"
                        value={targetDate}
                        onChange={(e) => setTargetDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                      />
                      <p className="text-xs text-muted-foreground">
                        When to check progress and mark achieved or schedule the next review
                      </p>
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
                <HealthGoalCard
                  key={goal.id}
                  goal={goal}
                  gender={gender}
                  onReview={() => setReviewingGoal(goal)}
                  onEdit={() => handleOpenEditGoal(goal)}
                  onDelete={() => setDeletingGoal(goal)}
                  onPauseToggle={() =>
                    handleUpdateGoalStatus(
                      goal.id,
                      goal.status === PAUSED_GOAL_STATUS ? "IN_PROGRESS" : PAUSED_GOAL_STATUS
                    )
                  }
                />
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
                <HealthGoalCard key={goal.id} goal={goal} gender={gender} />
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
                <HealthGoalCard
                  key={goal.id}
                  goal={goal}
                  gender={gender}
                  onReview={() => setReviewingGoal(goal)}
                  onEdit={() => handleOpenEditGoal(goal)}
                  onDelete={() => setDeletingGoal(goal)}
                  onPauseToggle={() => handleUpdateGoalStatus(goal.id, "IN_PROGRESS")}
                />
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

      <Dialog open={!!editingGoal} onOpenChange={open => !open && setEditingGoal(null)}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>Edit goal</DialogTitle>
            <DialogDescription>
              Update your target for{" "}
              {editingGoal &&
                (editingGoal.biomarker?.name ||
                  getBiomarkerById(editingGoal.biomarkerId)?.name ||
                  editingGoal.biomarkerId)}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="edit-goal-value">Target value</Label>
              <Input
                id="edit-goal-value"
                type="number"
                step="0.1"
                value={editTargetValue}
                onChange={e => setEditTargetValue(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-goal-date">Review date</Label>
              <Input
                id="edit-goal-date"
                type="date"
                value={editTargetDate}
                onChange={e => setEditTargetDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-goal-notes">Notes</Label>
              <Textarea
                id="edit-goal-notes"
                placeholder="Strategy or motivation"
                value={editNotes}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingGoal(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveGoalEdits}
              disabled={isSaving || !editTargetDate || !editTargetValue}
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <GoalReviewDialog
        goal={reviewingGoal}
        open={!!reviewingGoal}
        onOpenChange={open => !open && setReviewingGoal(null)}
        onComplete={fetchGoals}
        gender={gender}
      />

      <Dialog open={!!deletingGoal} onOpenChange={open => !open && setDeletingGoal(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Delete goal?</DialogTitle>
            <DialogDescription>
              This will permanently remove your goal for{" "}
              {deletingGoal &&
                (deletingGoal.biomarker?.name ||
                  getBiomarkerById(deletingGoal.biomarkerId)?.name ||
                  deletingGoal.biomarkerId)}
              . This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingGoal(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteGoal} disabled={isSaving}>
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete goal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
