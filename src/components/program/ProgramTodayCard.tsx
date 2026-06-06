"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  biomarkerFlags?: Array<{
    biomarkerId: string;
    name: string;
    status: string;
    programFocus?: string;
  }>;
  biomarkerSummary?: string | null;
  openSideEffects?: Array<{ escalated: boolean }>;
  symptomOptions?: Array<{ id: string; label: string }>;
};

export function ProgramTodayCard() {
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
  const progress =
    data.totalToday && data.totalToday > 0
      ? Math.round(((data.completedToday || 0) / data.totalToday) * 100)
      : 0;

  const hasEscalation = data.openSideEffects?.some((r) => r.escalated);
  const isPrecision = data.program?.planTier === "PRECISION";

  return (
    <>
      <ProgramBiomarkerStrip
        planTier={data.program?.planTier}
        flags={data.biomarkerFlags}
        summary={data.biomarkerSummary}
      />
      <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50/80 to-teal-50/80 dark:from-emerald-950/30">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <ListChecks className="w-5 h-5 text-emerald-600" />
              Today&apos;s program
            </CardTitle>
            <div className="flex gap-2">
              {isPrecision && (
                <Badge className="bg-violet-600">Precision</Badge>
              )}
              <Badge variant="secondary" className="capitalize">
                {data.program?.phase?.toLowerCase() || "induction"} · week{" "}
                {(data.program?.currentWeek ?? 0) + 1}
              </Badge>
            </div>
          </div>
          <CardDescription>
            {data.program?.medicationName
              ? `${data.program.medicationName} — your daily plan`
              : "Complete your daily tasks"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.weeklyInsight && (
            <div className="rounded-lg border border-emerald-200 bg-white/70 dark:bg-background/70 p-3 space-y-2">
              <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                This week
              </p>
              <p className="text-sm">{data.weeklyInsight.summary}</p>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
                {data.weeklyInsight.bullets?.slice(0, 3).map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
              <p className="text-xs font-medium text-emerald-800">
                Focus: {data.weeklyInsight.focusArea}
              </p>
            </div>
          )}

          {!data.weeklyInsight && (
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              onClick={generateInsight}
              disabled={generatingInsight}
            >
              {generatingInsight ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              Generate weekly insight
            </Button>
          )}

          <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Today&apos;s progress</span>
              <span>
                {data.completedToday}/{data.totalToday} done
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {hasEscalation && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 p-3 text-sm">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p>Your care team is reviewing a recent side effect report.</p>
            </div>
          )}

          <ul className="space-y-2">
            {pending.slice(0, 5).map((task) => (
              <li key={task.id}>
                <Link
                  href={task.href}
                  className="flex items-center justify-between rounded-lg border bg-white/60 dark:bg-background/60 px-3 py-2 hover:bg-white transition-colors"
                >
                  <span className="text-sm font-medium flex items-center gap-2">
                    {task.taskType === "DOSE" && (
                      <Pill className="w-4 h-4 text-violet-600" />
                    )}
                    {task.taskType === "BIOMARKER_REVIEW" && (
                      <Beaker className="w-4 h-4 text-violet-600" />
                    )}
                    {task.label}
                    {task.status === "OVERDUE" && (
                      <Badge variant="destructive" className="text-[10px] px-1 py-0">
                        Overdue
                      </Badge>
                    )}
                  </span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 min-w-[140px]"
              onClick={() => setSideEffectOpen(true)}
            >
              Report side effects
            </Button>
            <Link href="/dashboard/weight-management/treatment" className="flex-1 min-w-[140px]">
              <Button size="sm" className="w-full bg-emerald-600 hover:bg-emerald-700">
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
