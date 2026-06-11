"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Clock,
  Award,
  Sparkles,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { biomarkerDefinitions } from "@/data/biomarkers";
import { useOrganAnalysis } from "@/hooks/useOrganAnalysis";
import { ReportDataDateNotice } from "@/components/dashboard/ReportDataDateNotice";
import { GoalReviewDialog } from "@/components/dashboard/GoalReviewDialog";
import { HealthGoalCard } from "@/components/dashboard/HealthGoalCard";
import { defaultNextReviewDate } from "@/lib/goal-review";
import {
  ORGAN_CONFIG,
  recommendationToGoalPayload,
  type NormalizedBiomarkerGoal,
  type NormalizedRecommendation,
  type OrganType,
} from "@/lib/organ-ai-recommendations";
import {
  duplicateGoalMessage,
  findBlockingGoalForBiomarker,
  getBlockingBiomarkerIds,
  hasBlockingGoalForBiomarker,
} from "@/lib/goal-deduplication";
import type { BiomarkerResult } from "@/types";

interface ApiGoal {
  id: string;
  biomarkerId: string;
  targetValue: number;
  currentValue: number;
  startValue: number;
  startDate: string;
  targetDate: string;
  status: string;
  notes?: string;
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

interface OrganGoalSettingProps {
  organ: OrganType;
  currentResults: BiomarkerResult[];
  gender?: "male" | "female";
}

const DATA_CATEGORY: Record<OrganType, string> = {
  liver: "liver",
  heart: "heart",
  kidney: "kidney",
  thyroid: "thyroid",
  hormone: "hormones",
};

function isGoalForOrgan(
  goal: ApiGoal,
  organ: OrganType,
  panelBiomarkerIds: Set<string>
): boolean {
  if (panelBiomarkerIds.has(goal.biomarkerId)) return true;

  const category = goal.biomarker?.category?.toLowerCase();
  if (category === DATA_CATEGORY[organ]) return true;
  if (goal.notes?.startsWith(`[AI:${organ}-`)) return true;
  return false;
}

export function OrganGoalSetting({
  organ,
  currentResults,
  gender = "male",
}: OrganGoalSettingProps) {
  const config = ORGAN_CONFIG[organ];
  const { analysis, isLoading: analysisLoading, dataDate, resultsStale } = useOrganAnalysis(organ);

  const [goals, setGoals] = useState<ApiGoal[]>([]);
  const [allGoals, setAllGoals] = useState<ApiGoal[]>([]);
  const [isLoadingGoals, setIsLoadingGoals] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [addingAiId, setAddingAiId] = useState<string | null>(null);
  const [reviewingGoal, setReviewingGoal] = useState<ApiGoal | null>(null);
  const [newGoal, setNewGoal] = useState({
    biomarkerId: "",
    targetValue: "",
    targetDate: defaultNextReviewDate(3),
    notes: "",
  });

  const biomarkerOptions = useMemo(
    () =>
      biomarkerDefinitions
        .filter(b => b.category === DATA_CATEGORY[organ])
        .map(b => ({
          id: b.id,
          name: b.name,
          unit: b.ranges[gender].unit,
        })),
    [organ, gender]
  );

  const panelBiomarkerIds = useMemo(
    () => new Set(currentResults.map(r => r.biomarkerId)),
    [currentResults]
  );

  const blockingBiomarkerIds = useMemo(
    () => getBlockingBiomarkerIds(allGoals),
    [allGoals]
  );

  const fetchGoals = useCallback(async () => {
    setIsLoadingGoals(true);
    try {
      const response = await fetch("/api/goals");
      if (!response.ok) throw new Error("Failed to fetch goals");
      const data = await response.json();
      const fetchedGoals = data.goals as ApiGoal[];
      setAllGoals(fetchedGoals);
      setGoals(
        fetchedGoals.filter(g => isGoalForOrgan(g, organ, panelBiomarkerIds))
      );
    } catch {
      toast.error("Failed to load goals");
    } finally {
      setIsLoadingGoals(false);
    }
  }, [organ, panelBiomarkerIds]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const getCurrentValue = (biomarkerId: string): number | null => {
    const result = currentResults.find(r => r.biomarkerId === biomarkerId);
    return result ? result.value : null;
  };

  const createGoal = async (payload: {
    biomarkerId: string;
    targetValue: number;
    currentValue: number;
    startValue: number;
    targetDate?: string;
    notes?: string;
  }) => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          targetDate:
            payload.targetDate ||
            new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        if (response.status === 409 && err.code === "DUPLICATE_GOAL") {
          toast.info(
            duplicateGoalMessage(payload.biomarkerId, err.existingGoal)
          );
        } else {
          throw new Error(err.error || "Failed to create goal");
        }
        return false;
      }

      toast.success("Goal added — we'll track your progress");
      await fetchGoals();
      return true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create goal");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateManualGoal = async () => {
    if (!newGoal.biomarkerId || !newGoal.targetValue || !newGoal.targetDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    const currentValue = getCurrentValue(newGoal.biomarkerId);
    if (currentValue === null) {
      toast.error("No current data available for this biomarker");
      return;
    }

    const existing = findBlockingGoalForBiomarker(allGoals, newGoal.biomarkerId);
    if (existing) {
      toast.info(duplicateGoalMessage(newGoal.biomarkerId, existing));
      return;
    }

    const success = await createGoal({
      biomarkerId: newGoal.biomarkerId,
      targetValue: parseFloat(newGoal.targetValue),
      startValue: currentValue,
      currentValue,
      targetDate: newGoal.targetDate,
      notes: newGoal.notes || undefined,
    });

    if (success) {
      setIsDialogOpen(false);
      setNewGoal({ biomarkerId: "", targetValue: "", targetDate: defaultNextReviewDate(3), notes: "" });
    }
  };

  const handleAddBiomarkerGoal = async (suggestion: NormalizedBiomarkerGoal) => {
    const existing = findBlockingGoalForBiomarker(allGoals, suggestion.biomarkerId);
    if (existing) {
      toast.info(duplicateGoalMessage(suggestion.biomarkerId, existing));
      return;
    }

    setAddingAiId(suggestion.id);
    const currentValue =
      suggestion.currentValue || getCurrentValue(suggestion.biomarkerId) || 0;

    await createGoal({
      biomarkerId: suggestion.biomarkerId,
      targetValue: suggestion.suggestedTarget,
      startValue: currentValue,
      currentValue,
      notes: `[AI:${suggestion.id}] ${suggestion.reason}`,
    });
    setAddingAiId(null);
  };

  const handleAddRecommendationGoal = async (rec: NormalizedRecommendation) => {
    const payload = recommendationToGoalPayload(
      rec,
      organ,
      currentResults.map(r => ({ biomarkerId: r.biomarkerId, value: r.value })),
      gender
    );

    if (!payload) {
      toast.error("Unable to create goal — no biomarker data available");
      return;
    }

    const existing = findBlockingGoalForBiomarker(allGoals, payload.biomarkerId);
    if (existing) {
      toast.info(duplicateGoalMessage(payload.biomarkerId, existing));
      return;
    }

    setAddingAiId(rec.id);
    await createGoal(payload);
    setAddingAiId(null);
  };

  const handleDeleteGoal = async (goalId: string) => {
    try {
      const response = await fetch(`/api/goals/${goalId}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete goal");
      toast.success("Goal removed");
      await fetchGoals();
    } catch {
      toast.error("Failed to remove goal");
    }
  };

  const biomarkerSuggestions = useMemo(() => {
    if (!analysis) return [];
    return analysis.biomarkerGoals.filter(
      s => !hasBlockingGoalForBiomarker(allGoals, s.biomarkerId)
    );
  }, [analysis, allGoals]);

  const recommendationSuggestions = useMemo(() => {
    if (!analysis) return [];
    return analysis.recommendations
      .filter(r => r.priority !== "low")
      .filter(r => {
        const payload = recommendationToGoalPayload(
          r,
          organ,
          currentResults.map(result => ({
            biomarkerId: result.biomarkerId,
            value: result.value,
          })),
          gender
        );
        if (!payload) return false;
        return !hasBlockingGoalForBiomarker(allGoals, payload.biomarkerId);
      })
      .slice(0, 6);
  }, [analysis, allGoals, organ, currentResults, gender]);

  const achievedCount = goals.filter(g => g.status === "ACHIEVED").length;
  const inProgressCount = goals.filter(g => g.status === "IN_PROGRESS").length;

  if (isLoadingGoals) {
    return (
      <Card>
        <CardContent className="py-16 flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading your goals…</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <ReportDataDateNotice dataDate={dataDate} resultsStale={resultsStale} />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                {config.label} Health Goals
              </CardTitle>
              <CardDescription>
                Set and track goals from your AI analysis or create your own
              </CardDescription>
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
                  <DialogTitle>Create {config.label} Health Goal</DialogTitle>
                  <DialogDescription>
                    Set a target for a specific biomarker and track your progress
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>Biomarker *</Label>
                    <Select
                      value={newGoal.biomarkerId}
                      onValueChange={value => setNewGoal({ ...newGoal, biomarkerId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select biomarker" />
                      </SelectTrigger>
                      <SelectContent>
                        {biomarkerOptions.map(b => {
                          const current = getCurrentValue(b.id);
                          const hasGoal = blockingBiomarkerIds.has(b.id);
                          return (
                            <SelectItem key={b.id} value={b.id} disabled={hasGoal}>
                              {b.name}
                              {current !== null && ` (Current: ${current} ${b.unit})`}
                              {hasGoal && " — Goal already exists"}
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
                          {biomarkerOptions.find(b => b.id === newGoal.biomarkerId)?.unit}
                        </span>
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Target Value *</Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="e.g., 100"
                        value={newGoal.targetValue}
                        onChange={e => setNewGoal({ ...newGoal, targetValue: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Review date *</Label>
                      <Input
                        type="date"
                        value={newGoal.targetDate}
                        onChange={e => setNewGoal({ ...newGoal, targetDate: e.target.value })}
                        min={new Date().toISOString().split("T")[0]}
                      />
                      <p className="text-xs text-muted-foreground">
                        When to check progress and decide if the goal is achieved
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label>Notes (optional)</Label>
                    <Input
                      placeholder="e.g., Strategy or motivation"
                      value={newGoal.notes}
                      onChange={e => setNewGoal({ ...newGoal, notes: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateManualGoal} disabled={isSaving}>
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Goal"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
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

          {!analysisLoading && (biomarkerSuggestions.length > 0 || recommendationSuggestions.length > 0) && (
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-4">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                AI-Suggested Goals
              </h4>

              {biomarkerSuggestions.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground font-medium">Biomarker targets</p>
                  {biomarkerSuggestions.map(suggestion => (
                    <div
                      key={suggestion.id}
                      className="flex items-center justify-between p-3 rounded bg-background border border-border gap-3"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-sm">{suggestion.biomarkerName}</p>
                        <p className="text-xs text-muted-foreground">{suggestion.reason}</p>
                        <p className="text-xs text-primary mt-1">
                          Target: {suggestion.suggestedTarget} {suggestion.unit}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={addingAiId === suggestion.id || isSaving}
                        onClick={() => handleAddBiomarkerGoal(suggestion)}
                      >
                        {addingAiId === suggestion.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          "Add Goal"
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {recommendationSuggestions.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground font-medium">Lifestyle actions</p>
                  {recommendationSuggestions.map(rec => (
                    <div
                      key={rec.id}
                      className="flex items-center justify-between p-3 rounded bg-background border border-border gap-3"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-sm">{rec.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2">{rec.description}</p>
                        <Badge variant="outline" className="text-xs mt-1 capitalize">
                          {rec.priority} priority
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={addingAiId === rec.id || isSaving}
                        onClick={() => handleAddRecommendationGoal(rec)}
                      >
                        {addingAiId === rec.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          "Add Goal"
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {analysisLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground p-4">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading AI suggestions…
            </div>
          )}

          {!analysisLoading && !analysis && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground p-4 rounded-lg bg-muted/40">
              <AlertCircle className="w-4 h-4" />
              AI suggestions unavailable — create a manual goal or check the Risk Assessment tab
            </div>
          )}

          {goals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Target className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="font-medium">No goals yet</p>
              <p className="text-sm mt-1">
                Add AI-suggested goals above or create your own biomarker target
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {goals.map(goal => (
                <HealthGoalCard
                  key={goal.id}
                  goal={goal}
                  gender={gender}
                  showPause={false}
                  onReview={() => setReviewingGoal(goal)}
                  onDelete={() => handleDeleteGoal(goal.id)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <GoalReviewDialog
        goal={reviewingGoal}
        open={!!reviewingGoal}
        onOpenChange={open => !open && setReviewingGoal(null)}
        onComplete={fetchGoals}
        gender={gender}
      />
    </div>
  );
}
