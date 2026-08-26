"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { UseEffectiveness } from "@/lib/mens-sexual-health/portal-data";

type PortalData = {
  treatment: {
    id: string;
    medicationName: string;
    dosage: string;
    frequency: string;
  } | null;
  prescription: {
    id: string;
    medicationName: string;
    dosage: string;
    frequency: string;
  } | null;
  canLogUse: boolean;
  isMember: boolean;
  status: { phase: string; description: string };
};

const EFFECTIVENESS_OPTIONS: Array<{
  id: UseEffectiveness;
  label: string;
  description: string;
}> = [
  { id: "excellent", label: "Excellent", description: "Worked very well" },
  { id: "good", label: "Good", description: "Helpful overall" },
  { id: "limited", label: "Limited", description: "Some benefit" },
  { id: "none", label: "No response", description: "Did not help this time" },
];

const SIDE_EFFECTS = [
  "Headache",
  "Flushing",
  "Nasal congestion",
  "Upset stomach",
  "Dizziness",
];

export default function MensSexualHealthLogPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [data, setData] = useState<PortalData | null>(null);
  const [effectiveness, setEffectiveness] = useState<UseEffectiveness | null>(null);
  const [detail, setDetail] = useState("");
  const [sideEffects, setSideEffects] = useState<string[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/mens-health/sexual-health/portal");
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

  const toggleSideEffect = (effect: string) => {
    setSideEffects((current) =>
      current.includes(effect)
        ? current.filter((item) => item !== effect)
        : [...current, effect]
    );
  };

  const submit = async () => {
    if (!effectiveness) {
      toast.error("Select how well the medication worked");
      return;
    }

    const medication = data?.treatment || data?.prescription;
    if (!medication) {
      toast.error("No active medication to log");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/mens-health/sexual-health/log-use", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          treatmentId: data?.treatment?.id,
          prescriptionId: data?.treatment ? undefined : data?.prescription?.id,
          effectiveness,
          detail,
          sideEffects,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not save log");

      toast.success("Use logged, thank you for keeping your care team informed.");
      router.push("/dashboard/mens-health/sexual-health");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save log");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  if (!data?.canLogUse) {
    return (
      <div className="mx-auto max-w-lg space-y-6 px-4 py-8">
        <Link
          href="/dashboard/mens-health/sexual-health"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <Card>
          <CardContent className="space-y-4 py-10 text-center">
            <p className="font-medium">No active treatment to log yet</p>
            <p className="text-sm text-muted-foreground">{data?.status.description}</p>
            {!data?.isMember && (
              <Button asChild className="bg-teal-700 hover:bg-teal-800">
                <Link href="/dashboard/programs/mens_health_sexual">Start program</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 px-4 py-6 pb-20">
      <Link
        href="/dashboard/mens-health/sexual-health"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Sexual Health
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Log medication use</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {(data.treatment || data.prescription)?.medicationName} ·{" "}
          {(data.treatment || data.prescription)?.dosage}
        </p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">How did it work?</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2">
          {EFFECTIVENESS_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setEffectiveness(option.id)}
              className={cn(
                "rounded-xl border p-3 text-left transition-colors",
                effectiveness === option.id
                  ? "border-teal-600 bg-teal-50"
                  : "border-slate-200 hover:border-slate-300"
              )}
            >
              <p className="font-medium text-sm">{option.label}</p>
              <p className="text-xs text-muted-foreground">{option.description}</p>
            </button>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Any side effects?</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {SIDE_EFFECTS.map((effect) => (
            <button
              key={effect}
              type="button"
              onClick={() => toggleSideEffect(effect)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm transition-colors",
                sideEffects.includes(effect)
                  ? "border-teal-600 bg-teal-50 text-teal-800"
                  : "border-slate-200 text-slate-700 hover:border-slate-300"
              )}
            >
              {effect}
            </button>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Notes (optional)</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={detail}
            onChange={(event) => setDetail(event.target.value)}
            placeholder="Anything else you'd like your care team to know..."
            rows={4}
          />
        </CardContent>
      </Card>

      <Button
        className="w-full bg-teal-700 hover:bg-teal-800"
        disabled={submitting || !effectiveness}
        onClick={submit}
      >
        {submitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Save log
          </>
        )}
      </Button>
    </div>
  );
}
