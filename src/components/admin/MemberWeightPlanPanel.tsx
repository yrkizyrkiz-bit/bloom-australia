"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Loader2, Calculator, Save } from "lucide-react";
import { toast } from "sonner";
import { MemberProgramSchedulePanel } from "@/components/admin/MemberProgramSchedulePanel";
import {
  ACTIVITY_BANDS,
  activityBandFromSessionsPerWeek,
  calculateCaloriePlan,
  sexFromGender,
  type ActivityBandId,
} from "@/lib/weight-management/calorie-calculator";
import {
  defaultPlanTargetDate,
  resolveQuizTargetWeightKg,
} from "@/lib/weight-management/quiz-goal-defaults";

type PlanRecord = {
  id: string;
  version: number;
  status: string;
  age: number | null;
  sex: string | null;
  heightCm: number | null;
  weightKg: number | null;
  waistCm: number | null;
  bodyFatPercent: number | null;
  activityBand: string | null;
  activityFactor: number | null;
  bmr: number | null;
  tdee: number | null;
  formula: string | null;
  weeklyTargetLoss: number;
  dailyCalorieGoal: number | null;
  dailyExerciseMin: number | null;
  startWeight: number | null;
  targetWeight: number | null;
  targetDate: string | null;
  createdAt: string;
  supersededAt: string | null;
};

type Prefill = {
  age?: number | null;
  gender?: string | null;
  heightCm?: number | null;
  weightKg?: number | null;
  waistCm?: number | null;
  targetWeight?: number | null;
  weeklyTargetLoss?: number | null;
  weightLossGoal?: string | null;
};

type FormState = {
  age: string;
  sex: "male" | "female";
  heightCm: string;
  weightKg: string;
  waistCm: string;
  bodyFatPercent: string;
  activityBand: ActivityBandId;
  weeklyTargetLoss: string;
  dailyCalorieGoal: string;
  dailyExerciseMin: string;
  startWeight: string;
  targetWeight: string;
  targetDate: string;
};

function emptyForm(prefill?: Prefill): FormState {
  return {
    age: prefill?.age != null ? String(prefill.age) : "",
    sex: sexFromGender(prefill?.gender),
    heightCm: prefill?.heightCm != null ? String(prefill.heightCm) : "",
    weightKg: prefill?.weightKg != null ? String(prefill.weightKg) : "",
    waistCm: prefill?.waistCm != null ? String(prefill.waistCm) : "",
    bodyFatPercent: "",
    activityBand: "light",
    weeklyTargetLoss: prefill?.weeklyTargetLoss != null ? String(prefill.weeklyTargetLoss) : "0.5",
    dailyCalorieGoal: "",
    dailyExerciseMin: "",
    startWeight: prefill?.weightKg != null ? String(prefill.weightKg) : "",
    targetWeight: (() => {
      const target = resolveQuizTargetWeightKg({
        storedTargetWeight: prefill?.targetWeight,
        currentWeight: prefill?.weightKg,
        weightLossGoal: prefill?.weightLossGoal,
      });
      return target != null ? String(target) : "";
    })(),
    targetDate: defaultPlanTargetDate(),
  };
}

function formFromPlan(plan: PlanRecord): FormState {
  return {
    age: plan.age != null ? String(plan.age) : "",
    sex: plan.sex === "female" ? "female" : "male",
    heightCm: plan.heightCm != null ? String(plan.heightCm) : "",
    weightKg: plan.weightKg != null ? String(plan.weightKg) : "",
    waistCm: plan.waistCm != null ? String(plan.waistCm) : "",
    bodyFatPercent: plan.bodyFatPercent != null ? String(plan.bodyFatPercent) : "",
    activityBand: (ACTIVITY_BANDS.some((b) => b.id === plan.activityBand)
      ? plan.activityBand
      : "light") as ActivityBandId,
    weeklyTargetLoss: String(plan.weeklyTargetLoss ?? 0.5),
    dailyCalorieGoal: plan.dailyCalorieGoal != null ? String(plan.dailyCalorieGoal) : "",
    dailyExerciseMin: plan.dailyExerciseMin != null ? String(plan.dailyExerciseMin) : "",
    startWeight: plan.startWeight != null ? String(plan.startWeight) : "",
    targetWeight: plan.targetWeight != null ? String(plan.targetWeight) : "",
    targetDate: plan.targetDate ? plan.targetDate.slice(0, 10) : defaultPlanTargetDate(),
  };
}

export function MemberWeightPlanPanel({
  userId,
  prefill,
  compact = false,
  onScheduleSaved,
}: {
  userId: string;
  prefill?: Prefill;
  compact?: boolean;
  onScheduleSaved?: () => void;
}) {
  const [plans, setPlans] = useState<PlanRecord[]>([]);
  const [index, setIndex] = useState(0);
  const [form, setForm] = useState<FormState>(() => emptyForm(prefill));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState<ReturnType<typeof calculateCaloriePlan> | null>(null);
  const prefillRef = useRef(prefill);
  prefillRef.current = prefill;

  const latestIndex = Math.max(0, plans.length - 1);
  const viewing = plans[index] ?? null;
  const isLatest = plans.length === 0 || index === latestIndex;
  const isHistorical = plans.length > 0 && !isLatest;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/doctor/ring-plan?userId=${encodeURIComponent(userId)}`);
      if (!res.ok) throw new Error("Failed to load plans");
      const data = await res.json();
      const nextPlans = (data.plans || []) as PlanRecord[];
      setPlans(nextPlans);
      if (nextPlans.length > 0) {
        const last = nextPlans[nextPlans.length - 1];
        setIndex(nextPlans.length - 1);
        setForm(formFromPlan(last));
      } else {
        const sessions = Number(data.exerciseSessionsLast14Days || 0);
        const seed = prefillRef.current;
        setForm({
          ...emptyForm({
            ...seed,
            weightKg: seed?.weightKg ?? data.latestWeightKg,
            waistCm: seed?.waistCm ?? data.latestWaistCm,
            targetWeight: seed?.targetWeight ?? data.activeGoal?.targetWeight,
            weeklyTargetLoss: seed?.weeklyTargetLoss ?? data.activeGoal?.weeklyTargetLoss,
          }),
          activityBand: activityBandFromSessionsPerWeek(sessions),
        });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  const runCalculator = () => {
    const age = Number(form.age);
    const heightCm = Number(form.heightCm);
    const weightKg = Number(form.weightKg);
    if (!age || !heightCm || !weightKg) {
      toast.error("Age, height, and weight are required to calculate");
      return;
    }
    const result = calculateCaloriePlan({
      age,
      sex: form.sex,
      heightCm,
      weightKg,
      waistCm: form.waistCm ? Number(form.waistCm) : null,
      bodyFatPercent: form.bodyFatPercent ? Number(form.bodyFatPercent) : null,
      activityBand: form.activityBand,
      weeklyTargetLossKg: form.weeklyTargetLoss ? Number(form.weeklyTargetLoss) : 0.5,
    });
    setPreview(result);
    setForm((current) => ({
      ...current,
      dailyCalorieGoal: String(result.dailyCalorieGoal),
      dailyExerciseMin: String(result.dailyExerciseMin),
      weeklyTargetLoss: String(result.weeklyTargetLossKg),
      bodyFatPercent:
        result.estimatedBodyFatPercent != null
          ? String(result.estimatedBodyFatPercent)
          : current.bodyFatPercent,
    }));
  };

  const savePlan = async () => {
    setSaving(true);
    try {
      const result = preview;
      const res = await fetch("/api/admin/doctor/ring-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          age: form.age ? Number(form.age) : null,
          sex: form.sex,
          heightCm: form.heightCm ? Number(form.heightCm) : null,
          weightKg: form.weightKg ? Number(form.weightKg) : null,
          waistCm: form.waistCm ? Number(form.waistCm) : null,
          bodyFatPercent: form.bodyFatPercent ? Number(form.bodyFatPercent) : null,
          activityBand: form.activityBand,
          activityFactor: result?.activityFactor ?? null,
          bmr: result?.bmr ?? null,
          tdee: result?.tdee ?? null,
          formula: result?.formula ?? null,
          weeklyTargetLoss: form.weeklyTargetLoss ? Number(form.weeklyTargetLoss) : 0.5,
          dailyCalorieGoal: form.dailyCalorieGoal ? Number(form.dailyCalorieGoal) : null,
          dailyExerciseMin: form.dailyExerciseMin ? Number(form.dailyExerciseMin) : null,
          startWeight: form.startWeight ? Number(form.startWeight) : form.weightKg ? Number(form.weightKg) : null,
          targetWeight: form.targetWeight ? Number(form.targetWeight) : null,
          targetDate: form.targetDate || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Could not save plan");
      }
      toast.success(plans.length ? "Plan updated and previous version archived" : "Plan set");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save plan");
    } finally {
      setSaving(false);
    }
  };

  const showVersion = (next: number) => {
    const plan = plans[next];
    if (!plan) return;
    setIndex(next);
    setForm(formFromPlan(plan));
    setPreview(null);
  };

  const field = (
    id: keyof FormState,
    label: string,
    type: string = "number",
    step?: string
  ) => (
    <div className="space-y-1">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        step={step}
        value={form[id]}
        disabled={isHistorical}
        onChange={(e) => setForm((current) => ({ ...current, [id]: e.target.value }))}
      />
    </div>
  );

  const title = useMemo(() => {
    if (!viewing) return "Set weight management plan";
    return viewing.status === "ACTIVE" ? `Active plan v${viewing.version}` : `Archived plan v${viewing.version}`;
  }, [viewing]);

  return (
    <div className="space-y-4">
      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription>
              Set the calorie and exercise plan at this consult, before approval or program activation.
              Saving the plan turns on the member rings. Updating archives the previous version.
            </CardDescription>
          </div>
          {plans.length > 0 && (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                disabled={index <= 0}
                onClick={() => showVersion(index - 1)}
                aria-label="Previous plan"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                {index + 1} / {plans.length}
              </span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                disabled={index >= latestIndex}
                onClick={() => showVersion(index + 1)}
                aria-label="Next plan"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
        {viewing && (
          <div className="flex flex-wrap gap-2 pt-1">
            <Badge variant={viewing.status === "ACTIVE" ? "default" : "secondary"}>{viewing.status}</Badge>
            <Badge variant="outline">v{viewing.version}</Badge>
            {isHistorical && <Badge variant="outline">View only</Badge>}
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className={`grid gap-3 ${compact ? "md:grid-cols-3" : "md:grid-cols-4"}`}>
          {field("age", "Age")}
          <div className="space-y-1">
            <Label>Sex</Label>
            <Select
              value={form.sex}
              disabled={isHistorical}
              onValueChange={(value) =>
                setForm((current) => ({ ...current, sex: value as "male" | "female" }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {field("heightCm", "Height (cm)", "number", "0.1")}
          {field("weightKg", "Weight (kg)", "number", "0.1")}
          {field("waistCm", "Waist (cm)", "number", "0.1")}
          {field("bodyFatPercent", "Body fat %", "number", "0.1")}
          {field("weeklyTargetLoss", "Weekly loss (kg)", "number", "0.1")}
          {field("startWeight", "Start weight (kg)", "number", "0.1")}
          {field("targetWeight", "Target weight (kg)", "number", "0.1")}
          {field("targetDate", "Target date", "date")}
          <div className={`space-y-1 ${compact ? "md:col-span-3" : "md:col-span-2"}`}>
            <Label>Activity</Label>
            <Select
              value={form.activityBand}
              disabled={isHistorical}
              onValueChange={(value) =>
                setForm((current) => ({ ...current, activityBand: value as ActivityBandId }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ACTIVITY_BANDS.map((band) => (
                  <SelectItem key={band.id} value={band.id}>
                    {band.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {field("dailyCalorieGoal", "Daily calories")}
          {field("dailyExerciseMin", "Daily exercise (min)")}
        </div>

        {preview && isLatest && (
          <p className="text-sm text-muted-foreground">
            {preview.formula === "katch_mcardle" ? "Katch-McArdle" : "Mifflin-St Jeor"} BMR {preview.bmr} ·
            TDEE {preview.tdee} · deficit {preview.dailyDeficit} kcal/day. Numbers stay editable.
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={runCalculator} disabled={isHistorical}>
            <Calculator className="mr-2 h-4 w-4" />
            Calculate
          </Button>
          <Button type="button" onClick={() => void savePlan()} disabled={saving || isHistorical}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {plans.length ? "Update plan" : "Set plan"}
          </Button>
        </div>
      </CardContent>
    </Card>
      )}
    <MemberProgramSchedulePanel userId={userId} onSaved={onScheduleSaved} />
    </div>
  );
}

