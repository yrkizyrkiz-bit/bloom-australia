"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ArrowRight,
  Calendar,
  ClipboardCheck,
  Pause,
  Pencil,
  Play,
  Sparkles,
  Target,
  Trash2,
  TrendingDown,
  TrendingUp,
  Trophy,
} from "lucide-react";
import { getBiomarkerById, categoryInfo } from "@/data/biomarkers";
import { formatLatestResultDate } from "@/lib/goal-latest-values";
import {
  calculateGoalProgress,
  goalStatusLabel,
  isActiveGoalStatus,
  isGoalImproving,
  isPausedGoalStatus,
  nextReviewHint,
  reviewDueHint,
} from "@/lib/goal-display";
import type { GoalReviewTarget } from "@/components/dashboard/GoalReviewDialog";

export interface HealthGoalCardGoal extends GoalReviewTarget {
  startValue: number;
  biomarkerId: string;
}

interface HealthGoalCardProps {
  goal: HealthGoalCardGoal;
  gender?: "male" | "female";
  onReview?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onPauseToggle?: () => void;
  showPause?: boolean;
}

function statusBadgeClass(status: string): string {
  if (status === "ACHIEVED") return "bg-green-500/10 text-green-700 border-green-200";
  if (isPausedGoalStatus(status)) return "bg-muted text-muted-foreground border-border";
  return "bg-blue-500/10 text-blue-700 border-blue-200";
}

export function HealthGoalCard({
  goal,
  gender = "male",
  onReview,
  onEdit,
  onDelete,
  onPauseToggle,
  showPause = true,
}: HealthGoalCardProps) {
  const biomarkerDef = getBiomarkerById(goal.biomarkerId);
  const displayShortName =
    goal.biomarker?.shortName || biomarkerDef?.shortName || goal.biomarkerId;
  const displayName = goal.biomarker?.name || biomarkerDef?.name || goal.biomarkerId;
  const unit = goal.biomarker?.unit || biomarkerDef?.ranges[gender].unit || "";
  const currentValue = goal.effectiveCurrentValue ?? goal.currentValue;
  const progress = calculateGoalProgress(
    goal.startValue,
    goal.targetValue,
    currentValue,
    goal.biomarkerId
  );
  const improving =
    currentValue > 0 &&
    isGoalImproving(goal.startValue, goal.targetValue, currentValue);
  const categoryColor = biomarkerDef
    ? categoryInfo[biomarkerDef.category]?.color
    : "#666";
  const isAiGoal = goal.notes?.includes("[AI:");
  const dueHint = reviewDueHint(goal.targetDate);
  const isAchieved = goal.status === "ACHIEVED";
  const isPaused = isPausedGoalStatus(goal.status);

  const displayNotes = goal.notes?.replace(/^\[AI:[^\]]+\]\s*/, "").trim();

  return (
    <Card
      className={`relative overflow-hidden transition-shadow hover:shadow-md ${
        isAchieved
          ? "border-green-500/30 bg-green-500/[0.02]"
          : isPaused
            ? "opacity-75"
            : ""
      }`}
    >
      {isAchieved && (
        <div className="absolute top-0 right-0 w-16 h-16 bg-green-500/10 rounded-bl-full flex items-start justify-end p-2">
          <Trophy className="w-4 h-4 text-green-600" />
        </div>
      )}

      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
              style={{
                backgroundColor: `${categoryColor}18`,
                color: categoryColor,
              }}
            >
              <Target className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-base leading-tight truncate">
                {displayShortName}
              </CardTitle>
              <CardDescription className="truncate text-xs">{displayName}</CardDescription>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <Badge variant="outline" className={`text-xs font-medium ${statusBadgeClass(goal.status)}`}>
              {goalStatusLabel(goal.status)}
            </Badge>
            {isAiGoal && (
              <Badge variant="secondary" className="text-[10px] gap-1 px-1.5 py-0">
                <Sparkles className="w-3 h-3" />
                AI
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Value journey */}
        <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-1 text-center">
          <div className="rounded-lg bg-muted/40 px-2 py-2">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Start</p>
            <p className="text-sm font-semibold tabular-nums">
              {goal.startValue}
              <span className="text-[10px] font-normal text-muted-foreground ml-0.5">{unit}</span>
            </p>
          </div>
          <ArrowRight className="w-3 h-3 text-muted-foreground/50" />
          <div className="rounded-lg bg-primary/5 border border-primary/10 px-2 py-2">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground truncate">
              {goal.latestResult ? "Latest" : "Current"}
            </p>
            <p className="text-sm font-semibold tabular-nums text-primary">
              {currentValue}
              <span className="text-[10px] font-normal text-muted-foreground ml-0.5">{unit}</span>
            </p>
            {goal.latestResult && (
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {formatLatestResultDate(goal.latestResult.testedAt)}
              </p>
            )}
          </div>
          <ArrowRight className="w-3 h-3 text-muted-foreground/50" />
          <div className="rounded-lg bg-muted/40 px-2 py-2">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Target</p>
            <p className="text-sm font-semibold tabular-nums">
              {goal.targetValue}
              <span className="text-[10px] font-normal text-muted-foreground ml-0.5">{unit}</span>
            </p>
          </div>
        </div>

        {/* Progress */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Progress to target</span>
            <div className="flex items-center gap-2">
              {currentValue > 0 && !isAchieved && (
                improving ? (
                  <span className="flex items-center gap-1 text-green-600 font-medium">
                    <TrendingUp className="w-3 h-3" />
                    On track
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-amber-600 font-medium">
                    <TrendingDown className="w-3 h-3" />
                    Needs focus
                  </span>
                )
              )}
              <span className="font-semibold tabular-nums">{progress}%</span>
            </div>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Review date — subtle, no countdown */}
        {!isAchieved && (
          <button
            type="button"
            onClick={onReview}
            className="w-full flex items-center justify-between gap-2 rounded-lg border border-dashed border-border/80 px-3 py-2 text-left hover:bg-muted/40 transition-colors"
          >
            <span className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="w-3.5 h-3.5 shrink-0" />
              {nextReviewHint(goal.targetDate)}
            </span>
            {dueHint && (
              <Badge variant="outline" className="text-[10px] border-amber-400 text-amber-700 bg-amber-50 shrink-0">
                {dueHint}
              </Badge>
            )}
          </button>
        )}

        {displayNotes && (
          <p className="text-xs text-muted-foreground leading-relaxed border-l-2 border-primary/20 pl-3 line-clamp-3">
            {displayNotes}
          </p>
        )}

        {!isAchieved && (
          <div className="flex flex-wrap gap-2 pt-1">
            {onReview && (
              <Button
                size="sm"
                variant={dueHint ? "default" : "outline"}
                className="flex-1 min-w-[100px]"
                onClick={onReview}
              >
                <ClipboardCheck className="w-4 h-4 mr-1.5" />
                Review
              </Button>
            )}
            {onEdit && (
              <Button size="sm" variant="outline" onClick={onEdit}>
                <Pencil className="w-4 h-4 mr-1.5" />
                Edit
              </Button>
            )}
            {showPause && onPauseToggle && isActiveGoalStatus(goal.status) && (
              <Button size="sm" variant="outline" onClick={onPauseToggle}>
                <Pause className="w-4 h-4 mr-1.5" />
                Pause
              </Button>
            )}
            {showPause && onPauseToggle && isPaused && (
              <Button size="sm" variant="outline" onClick={onPauseToggle}>
                <Play className="w-4 h-4 mr-1.5" />
                Resume
              </Button>
            )}
            {onDelete && (
              <Button
                size="sm"
                variant="ghost"
                className="text-muted-foreground hover:text-destructive px-2"
                onClick={onDelete}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
