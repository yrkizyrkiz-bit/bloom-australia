"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ListChecks,
  Loader2,
  ChevronRight,
  Pill,
  AlertTriangle,
  Sparkles,
  Beaker,
} from "lucide-react";
import { SideEffectReportForm } from "./SideEffectReportForm";
import { ProgramBiomarkerStrip } from "./ProgramBiomarkerStrip";
import {
  todayRingProgress,
  type RingWeekScore,
} from "@/lib/weight-management/score-ring-week";

type ProgramTask = {
  id: string;
  taskType: string;
  label: string;
  status: string;
  href: string;
};

type ProgramTodayData = {
  hasProgram: boolean;
  program?: {
    phase: string;
    currentWeek: number;
    planTier?: string;
    medicationName?: string;
  };
  biomarkerFlags?: Array<{
    biomarkerId: string;
    name: string;
    status: string;
    value: number;
    unit: string;
    programFocus?: string;
  }>;
  biomarkerSummary?: string | null;
  tasks?: ProgramTask[];
  adherenceScore?: number | null;
  completedToday?: number;
  totalToday?: number;
  weeklyInsight?: {
    summary: string;
    bullets: string[];
    focusArea: string;
    encouragement: string;
  } | null;
  openSideEffects?: Array<{ escalated: boolean }>;
  symptomOptions?: Array<{ id: string; label: string }>;
};

export function ProgramTodayCard({ ringWeek }: { ringWeek?: RingWeekScore | null }) {
  const [data, setData] = useState<ProgramTodayData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sideEffectOpen, setSideEffectOpen] = useState(false);
  const [generatingInsight, setGeneratingInsight] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/program/today");
      if (res.ok) {
        setData(await res.json());
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const generateInsight = async () => {
    setGeneratingInsight(true);
    try {
      await fetch("/api/program/insight?force=true");
      await load();
    } finally {
      setGeneratingInsight(false);
    }
  };

  if (loading) return null;
  if (!data?.hasProgram) return null;

  const pending =
    data.tasks?.filter((t) => t.status === "PENDING" || t.status === "OVERDUE") || [];
  const today = ringWeek?.days.find((day) => day.isToday) ?? null;
  const ringProgress = todayRingProgress(today);
  const usingRings = ringProgress.total > 0;
  const progress = usingRings
    ? ringProgress.percent
    : data.totalToday && data.totalToday > 0
      ? Math.round(((data.completedToday || 0) / data.totalToday) * 100)
      : 0;
  const progressLabel = usingRings
    ? `${ringProgress.completed}/${ringProgress.total} done`
    : `${data.completedToday ?? 0}/${data.totalToday ?? 0} done`;

  const hasEscalation = data.openSideEffects?.some((r) => r.escalated);
  const isPrecision = data.program?.planTier === "PRECISION";

  return (
    <>
      <ProgramBiomarkerStrip
        planTier={data.program?.planTier}
        flags={data.biomarkerFlags}
        summary={data.biomarkerSummary}
      />
      <Card className="border-[#cdd8c6] bg-gradient-to-br from-[#f8f4ec] to-[#e6ebe3]">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-lg flex items-center gap-2 text-[#2c3628]">
              <ListChecks className="w-5 h-5 text-[#4a6243]" />
              AI has few words to say!
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              {isPrecision && (
                <Badge className="bg-[#4a6243] text-white">Precision</Badge>
              )}
              <Badge className="capitalize bg-[#cdd8c6] text-[#2c3628] hover:bg-[#cdd8c6]">
                {data.program?.phase?.toLowerCase() || "induction"} · week{" "}
                {(data.program?.currentWeek ?? 0) + 1}
              </Badge>
              <Button
                size="sm"
                variant="outline"
                className="border-[#cdd8c6] bg-[#f8f4ec] text-[#2c3628] hover:bg-[#e6ebe3]"
                onClick={generateInsight}
                disabled={generatingInsight}
              >
                {generatingInsight ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-1.5 h-4 w-4" />
                )}
                Refresh insight
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.weeklyInsight && (
            <div className="rounded-2xl border border-[#cdd8c6] bg-[#f8f4ec]/80 p-3 space-y-2">
              <p className="text-xs font-semibold text-[#4a6243] uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                This week
              </p>
              <p className="text-sm text-[#2c3628]">{data.weeklyInsight.summary}</p>
              <ul className="text-xs text-[#5c7a52] space-y-1 list-disc pl-4">
                {data.weeklyInsight.bullets?.slice(0, 3).map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
              <p className="text-xs font-medium text-[#4a6243]">
                Focus: {data.weeklyInsight.focusArea}
              </p>
            </div>
          )}

          <div>
            <div className="flex justify-between text-xs text-[#5c7a52] mb-1">
              <span>Today&apos;s progress</span>
              <span>
                {progressLabel}
              </span>
            </div>
            <Progress value={progress} className="h-2 bg-[#cdd8c6] [&>div]:bg-[#4a6243]" />
          </div>

          {hasEscalation && (
            <div className="flex items-start gap-2 rounded-2xl border border-[#e5d7bf] bg-[#f0e8d8] p-3 text-sm text-[#2c3628]">
              <AlertTriangle className="w-4 h-4 text-[#c17a58] shrink-0 mt-0.5" />
              <p>Your care team is reviewing a recent side effect report.</p>
            </div>
          )}

          <ul className="space-y-2">
            {pending.slice(0, 5).map((task) => (
              <li key={task.id}>
                <Link
                  href={task.href}
                  className="flex items-center justify-between rounded-2xl border border-[#cdd8c6] bg-[#f8f4ec] px-3 py-2 text-[#2c3628] transition-colors hover:bg-[#e6ebe3]"
                >
                  <span className="text-sm font-medium flex items-center gap-2">
                    {task.taskType === "DOSE" && (
                      <Pill className="w-4 h-4 text-[#4a6243]" />
                    )}
                    {task.taskType === "BIOMARKER_REVIEW" && (
                      <Beaker className="w-4 h-4 text-[#4a6243]" />
                    )}
                    {task.label}
                    {task.status === "OVERDUE" && (
                      <Badge variant="destructive" className="text-[10px] px-1 py-0">
                        Overdue
                      </Badge>
                    )}
                  </span>
                  <ChevronRight className="w-4 h-4 text-[#4a6243]" />
                </Link>
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 min-w-[140px] border-[#cdd8c6] bg-[#f8f4ec] text-[#2c3628] hover:bg-[#e6ebe3]"
              onClick={() => setSideEffectOpen(true)}
            >
              Report side effects
            </Button>
            <Link href="/dashboard/weight-management/treatment" className="flex-1 min-w-[140px]">
              <Button size="sm" className="w-full bg-[#4a6243] hover:bg-[#3d4f38]">
                Treatment hub
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <Dialog open={sideEffectOpen} onOpenChange={setSideEffectOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Report side effects</DialogTitle>
          </DialogHeader>
          {data.symptomOptions && (
            <SideEffectReportForm
              symptomOptions={data.symptomOptions}
              onComplete={() => {
                setSideEffectOpen(false);
                load();
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
