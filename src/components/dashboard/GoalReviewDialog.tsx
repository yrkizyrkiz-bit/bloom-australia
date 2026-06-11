"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Calendar, Loader2, Trophy } from "lucide-react";
import { toast } from "sonner";
import { getBiomarkerById } from "@/data/biomarkers";
import {
  defaultNextReviewDate,
  formatReviewDate,
} from "@/lib/goal-review";
import { formatLatestResultDate } from "@/lib/goal-latest-values";
import { goalStatusLabel, reviewDueHint } from "@/lib/goal-display";

export interface GoalReviewTarget {
  id: string;
  biomarkerId: string;
  targetValue: number;
  currentValue: number;
  startValue: number;
  targetDate: string;
  status: string;
  notes?: string | null;
  effectiveCurrentValue?: number;
  latestResult?: {
    value: number;
    testedAt: string;
  } | null;
  biomarker?: {
    name?: string;
    shortName?: string;
    unit?: string;
  } | null;
}

interface GoalReviewDialogProps {
  goal: GoalReviewTarget | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
  gender?: "male" | "female";
}

export function GoalReviewDialog({
  goal,
  open,
  onOpenChange,
  onComplete,
  gender = "male",
}: GoalReviewDialogProps) {
  const [reviewNotes, setReviewNotes] = useState("");
  const [nextReviewDate, setNextReviewDate] = useState(defaultNextReviewDate(3));
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open && goal) {
      setReviewNotes("");
      setNextReviewDate(defaultNextReviewDate(3));
    }
  }, [open, goal]);

  if (!goal) return null;

  const biomarkerDef = getBiomarkerById(goal.biomarkerId);
  const name = goal.biomarker?.name || biomarkerDef?.name || goal.biomarkerId;
  const unit =
    goal.biomarker?.unit || biomarkerDef?.ranges[gender].unit || "";
  const currentValue = goal.effectiveCurrentValue ?? goal.currentValue;

  const submitReview = async (action: "achieve" | "continue") => {
    if (action === "continue" && !nextReviewDate) {
      toast.error("Please choose the next review date");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`/api/goals/${goal.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          nextReviewDate: action === "continue" ? nextReviewDate : undefined,
          reviewNotes: reviewNotes.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to save review");
      }

      toast.success(
        action === "achieve"
          ? "Goal marked as achieved — well done!"
          : "Next review scheduled"
      );
      onOpenChange(false);
      onComplete();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save review");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Review goal</DialogTitle>
          <DialogDescription>
            Check progress for {name} and decide whether you&apos;ve reached your target or
            need another review later.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 text-sm gap-3">
            <div>
              <p className="text-muted-foreground text-xs">Status</p>
              <p className="font-medium">{goalStatusLabel(goal.status)}</p>
            </div>
            <div className="text-right">
              <p className="text-muted-foreground text-xs">Scheduled review</p>
              <p className="font-medium">{formatReviewDate(goal.targetDate)}</p>
            </div>
            {reviewDueHint(goal.targetDate) && (
              <Badge variant="outline" className="border-amber-400 text-amber-700 bg-amber-50 shrink-0">
                {reviewDueHint(goal.targetDate)}
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Start</p>
              <p className="font-medium">
                {goal.startValue} {unit}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                {goal.latestResult
                  ? `Latest · ${formatLatestResultDate(goal.latestResult.testedAt)}`
                  : "Current value"}
              </p>
              <p className="font-medium">
                {currentValue} {unit}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Target</p>
              <p className="font-medium text-primary">
                {goal.targetValue} {unit}
              </p>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="review-notes">Review notes</Label>
            <Textarea
              id="review-notes"
              placeholder="e.g. Retest booked, still working on diet changes, discuss with doctor…"
              value={reviewNotes}
              onChange={e => setReviewNotes(e.target.value)}
              rows={3}
            />
          </div>

          <div className="rounded-lg border border-border p-4 space-y-3">
            <p className="text-sm font-medium">Schedule next review</p>
            <p className="text-xs text-muted-foreground">
              If you haven&apos;t hit your target yet, pick when to check in again. Your notes
              will be saved to this goal.
            </p>
            <div className="grid gap-2">
              <Label htmlFor="next-review-date">Next review date</Label>
              <Input
                id="next-review-date"
                type="date"
                value={nextReviewDate}
                onChange={e => setNextReviewDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
            <Button
              variant="outline"
              className="w-full"
              disabled={isSaving || !nextReviewDate}
              onClick={() => submitReview("continue")}
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Calendar className="w-4 h-4 mr-2" />
                  Save review &amp; schedule next date
                </>
              )}
            </Button>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-col gap-2">
          <Button
            className="w-full bg-green-600 hover:bg-green-700"
            disabled={isSaving}
            onClick={() => submitReview("achieve")}
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Trophy className="w-4 h-4 mr-2" />
                Mark goal achieved
              </>
            )}
          </Button>
          <Button variant="ghost" className="w-full" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
