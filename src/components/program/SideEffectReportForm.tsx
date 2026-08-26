"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, AlertTriangle, CheckCircle2, Shield } from "lucide-react";
import { toast } from "sonner";

type SymptomOption = { id: string; label: string; requiresEscalation?: boolean };

type MitigationTip = {
  id: string;
  title: string;
  description: string;
  priority: string;
};

type Props = {
  symptomOptions: SymptomOption[];
  medicationDoseId?: string;
  onComplete?: (reportId?: string) => void;
  onSkip?: () => void | Promise<void>;
  showSkip?: boolean;
  skipLoading?: boolean;
  compact?: boolean;
};

export function SideEffectReportForm({
  symptomOptions,
  medicationDoseId,
  onComplete,
  onSkip,
  showSkip = true,
  skipLoading = false,
  compact = false,
}: Props) {
  const [selected, setSelected] = useState<string[]>([]);
  const [severity, setSeverity] = useState<"MILD" | "MODERATE" | "SEVERE" | "">("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    report?: { id: string };
    plan?: {
      tips: MitigationTip[];
      requiresEscalation: boolean;
      escalationMessage: string | null;
    };
  } | null>(null);

  const toggleSymptom = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    if (!selected.length) {
      toast.error("Select at least one symptom, or tap “No side effects”");
      return;
    }
    if (!severity) {
      toast.error("Select how much this is affecting you");
      return;
    }

    setSubmitting(true);
    try {
      const res = medicationDoseId
        ? await fetch(`/api/program/doses/${medicationDoseId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "taken",
              sideEffects: selected,
              sideEffectSeverity: severity,
              sideEffectNotes: notes || undefined,
            }),
          })
        : await fetch("/api/program/side-effects", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              symptoms: selected,
              severity,
              notes: notes || undefined,
            }),
          });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit");

      setResult({
        report: data.sideEffectReport || data.report,
        plan: data.plan || (data.report?.mitigationTips
          ? {
              tips: data.report.mitigationTips,
              requiresEscalation: data.report.escalated,
              escalationMessage: data.report.escalated
                ? "Your care team has been notified. If you feel very unwell, call 000 or go to your nearest emergency department."
                : null,
            }
          : null),
      });
      toast.success(
        data.plan?.requiresEscalation
          ? "Report submitted, your care team has been notified"
          : "Thanks, here’s what may help"
      );
      onComplete?.(data.report?.id);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const handleNoSideEffects = async () => {
    if (onSkip) {
      await onSkip();
      return;
    }
    onComplete?.();
  };

  if (result?.plan) {
    return (
      <div className="space-y-4">
        {result.plan.requiresEscalation && (
          <div className="rounded-lg border border-red-300 bg-red-50 dark:bg-red-950/30 p-4 flex gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
            <div>
              <p className="font-semibold text-red-900 dark:text-red-100">Care team notified</p>
              <p className="text-sm text-red-800 dark:text-red-200 mt-1">
                {result.plan.escalationMessage}
              </p>
            </div>
          </div>
        )}
        <div className="space-y-3">
          <p className="font-semibold text-sm flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-600" />
            What may help
          </p>
          {result.plan.tips.map((tip) => (
            <div
              key={tip.id}
              className={`rounded-lg border p-3 ${
                tip.priority === "high"
                  ? "border-amber-200 bg-amber-50 dark:bg-amber-950/20"
                  : "border-muted"
              }`}
            >
              <p className="font-medium text-sm">{tip.title}</p>
              <p className="text-sm text-muted-foreground mt-1">{tip.description}</p>
            </div>
          ))}
        </div>
        <LinkRow />
        <Button className="w-full" onClick={() => onComplete?.(result.report?.id)}>
          Done
        </Button>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${compact ? "" : "pt-2"}`}>
      {showSkip && (
        <NoSideEffectsCard
          onClick={handleNoSideEffects}
          loading={skipLoading}
          disabled={submitting}
        />
      )}

      {showSkip && (
        <div className="relative py-1">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or report symptoms
            </span>
          </div>
        </div>
      )}

      <p className="text-sm text-muted-foreground">
        Logging side effects helps us tailor support and know when your care partner should check in.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {symptomOptions.map((s) => (
          <label
            key={s.id}
            className="flex items-center gap-2 rounded-lg border p-3 cursor-pointer hover:bg-muted/50"
          >
            <Checkbox
              checked={selected.includes(s.id)}
              onCheckedChange={() => toggleSymptom(s.id)}
            />
            <span className="text-sm">{s.label}</span>
          </label>
        ))}
      </div>

      <div className="space-y-2">
        <Label>How much is this affecting you?</Label>
        <div className="flex flex-wrap gap-2">
          {(["MILD", "MODERATE", "SEVERE"] as const).map((level) => (
            <Button
              key={level}
              type="button"
              size="sm"
              variant={severity === level ? "default" : "outline"}
              className={
                level === "SEVERE" && severity === level
                  ? "bg-red-600 hover:bg-red-700"
                  : ""
              }
              onClick={() => setSeverity(level)}
            >
              {level === "MILD"
                ? "Mild"
                : level === "MODERATE"
                  ? "Moderate"
                  : "Severe"}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="se-notes">Anything else? (optional)</Label>
        <Textarea
          id="se-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. started after yesterday’s dose"
          rows={2}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Button
          onClick={handleSubmit}
          disabled={submitting}
          variant="outline"
          className="w-full"
        >
          {submitting ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <CheckCircle2 className="w-4 h-4 mr-2" />
          )}
          Submit & see guidance
        </Button>
      </div>
    </div>
  );
}

function NoSideEffectsCard({
  onClick,
  loading = false,
  disabled = false,
}: {
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className="group w-full rounded-2xl border-2 border-emerald-500 bg-gradient-to-br from-emerald-600 to-teal-600 p-5 text-left text-white shadow-lg transition-all hover:from-emerald-700 hover:to-teal-700 hover:shadow-xl active:scale-[0.99] disabled:pointer-events-none disabled:opacity-70"
    >
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/20 ring-2 ring-white/30 transition-transform group-hover:scale-105">
          {loading ? (
            <Loader2 className="h-7 w-7 animate-spin" />
          ) : (
            <CheckCircle2 className="h-7 w-7" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-lg font-bold leading-tight">No side effects</p>
          <p className="mt-1 text-sm text-emerald-50/95">
            I&apos;m feeling fine, skip this check-in
          </p>
        </div>
      </div>
    </button>
  );
}

function LinkRow() {
  return (
    <p className="text-xs text-muted-foreground text-center">
      Still concerned?{" "}
      <a href="/dashboard/messages" className="text-emerald-600 underline">
        Message your care partner
      </a>{" "}
      or call 000 in an emergency.
    </p>
  );
}
