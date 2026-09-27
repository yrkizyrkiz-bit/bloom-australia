"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Heart, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  SEXUAL_CONFIDENCE_QUESTION,
  SEXUAL_SIDE_EFFECT_OPTIONS,
  type SexualSideEffectId,
} from "@/lib/mens-sexual-health/weekly-check-in";

type CheckInPayload = {
  weekKey: string;
  checkInNeeded: boolean;
  thisWeek: {
    confidence: number;
    sideEffects: string;
    notes: string | null;
    checkedInAt: string;
  } | null;
  history: Array<{
    id: string;
    weekKey: string;
    confidence: number;
    sideEffects: string;
    notes: string | null;
    checkedInAt: string;
  }>;
};

export default function SexualHealthWeeklyCheckInPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<CheckInPayload | null>(null);
  const [confidence, setConfidence] = useState(3);
  const [sideEffects, setSideEffects] = useState<SexualSideEffectId>("none");
  const [notes, setNotes] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/mens-health/sexual-health/check-in");
      if (!res.ok) throw new Error("Failed to load");
      const json = (await res.json()) as CheckInPayload;
      setData(json);
      if (json.thisWeek) {
        setConfidence(json.thisWeek.confidence);
        setSideEffects(
          (SEXUAL_SIDE_EFFECT_OPTIONS.find((o) => o.id === json.thisWeek?.sideEffects)?.id ||
            "none") as SexualSideEffectId
        );
        setNotes(json.thisWeek.notes || "");
      }
    } catch (error) {
      console.error(error);
      toast.error("Could not load this week's check-in");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/mens-health/sexual-health/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          confidence,
          sideEffects,
          notes,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Could not save check-in");
      toast.success("Weekly sexual health check-in saved");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save check-in");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#4a6243]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/mens-health/sexual-health">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Weekly Check-in</h1>
          <p className="text-muted-foreground">
            How confident you felt this week — no photos needed
          </p>
        </div>
        {data?.thisWeek && <Badge className="bg-[#4a6243]">This week done</Badge>}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Heart className="h-5 w-5 text-[#4a6243]" />
            This week
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label>{SEXUAL_CONFIDENCE_QUESTION.label}</Label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <Button
                  key={value}
                  type="button"
                  variant={confidence === value ? "default" : "outline"}
                  size="sm"
                  className="h-10 w-10"
                  onClick={() => setConfidence(value)}
                >
                  {value}
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              1 = {SEXUAL_CONFIDENCE_QUESTION.low} · 5 = {SEXUAL_CONFIDENCE_QUESTION.high}
            </p>
          </div>

          <div className="space-y-2">
            <Label>Any side effects?</Label>
            <div className="flex flex-wrap gap-2">
              {SEXUAL_SIDE_EFFECT_OPTIONS.map((option) => (
                <Button
                  key={option.id}
                  type="button"
                  variant={sideEffects === option.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSideEffects(option.id)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sexual-notes">Anything else this week? (optional)</Label>
            <Textarea
              id="sexual-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Dose timing, how it felt, questions for your doctor…"
            />
          </div>
        </CardContent>
      </Card>

      <Button
        className="w-full bg-[#4a6243] hover:bg-[#3d4f38]"
        onClick={submit}
        disabled={saving}
      >
        {saving ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <CheckCircle2 className="mr-2 h-4 w-4" />
        )}
        {data?.thisWeek ? "Update this week's check-in" : "Save weekly check-in"}
      </Button>

      {data?.history.length ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Previous weeks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.history.map((row) => (
              <div key={row.id} className="flex items-center justify-between text-sm">
                <span>{row.weekKey}</span>
                <span className="text-muted-foreground">
                  Confidence {row.confidence}/5
                  {row.sideEffects && row.sideEffects !== "none"
                    ? ` · ${row.sideEffects.replace(/_/g, " ")}`
                    : ""}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
