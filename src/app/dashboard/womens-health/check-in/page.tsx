"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, CalendarDays, CheckCircle2, HeartPulse, Loader2, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  formatClinicalLabel,
  formatClinicalValue,
  WOMENS_HEALTH_CLINICAL_SECTIONS,
  type ClinicalField,
  type ClinicalFieldValue,
  type ClinicalMetadata,
  type WomensHealthCareArea,
} from "@/lib/womens-health-clinical-checkins";

type CheckIn = {
  id: string;
  careArea: string;
  energyLevel: number;
  moodLevel: number;
  sleepQuality: number;
  stressLevel: number;
  symptoms: string[];
  metadata?: {
    clinical?: ClinicalMetadata;
  } | null;
  checkedInAt: string;
};

const careAreas = [
  { id: "hormones", label: "Hormone Health" },
  { id: "menopause", label: "Menopause & Perimenopause" },
  { id: "pcos", label: "PCOS & Metabolic Health" },
  { id: "fertility", label: "Fertility & Reproductive Health" },
];

const symptomOptions = [
  "fatigue",
  "brain_fog",
  "low_mood",
  "anxiety",
  "poor_sleep",
  "night_sweats",
  "hot_flushes",
  "vaginal_dryness",
  "joint_aches",
  "cramps",
  "bloating",
  "headache",
  "low_libido",
  "cravings",
  "acne",
  "oily_skin",
  "excess_hair_growth",
  "hair_changes",
  "irregular_cycle",
  "weight_change",
  "energy_crash",
  "spotting",
  "breast_tenderness",
  "ovulation_pain",
  "fertile_mucus",
  "positive_lh_test",
  "negative_lh_test",
];

function formatSymptom(symptom: string) {
  return formatClinicalLabel(symptom);
}

function RatingSelector({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((rating) => (
          <Button
            key={rating}
            type="button"
            size="sm"
            variant={value === rating ? "default" : "outline"}
            className={value === rating ? "bg-rose-600 hover:bg-rose-700" : ""}
            onClick={() => onChange(rating)}
          >
            {rating}
          </Button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">1 = low, 5 = high</p>
    </div>
  );
}

function ClinicalFieldControl({
  field,
  value,
  onChange,
}: {
  field: ClinicalField;
  value: ClinicalFieldValue | undefined;
  onChange: (value: ClinicalFieldValue) => void;
}) {
  if (field.type === "multi") {
    const selected = Array.isArray(value) ? value : [];
    return (
      <div className="space-y-2">
        <Label>{field.label}</Label>
        {field.helper && <p className="text-xs text-muted-foreground">{field.helper}</p>}
        <div className="grid gap-2 sm:grid-cols-2">
          {(field.options || []).map((option) => (
            <label key={option} className="flex items-center gap-2 rounded-xl border p-3 text-sm">
              <Checkbox
                checked={selected.includes(option)}
                onCheckedChange={(checked) =>
                  onChange(
                    checked
                      ? [...selected, option]
                      : selected.filter((item) => item !== option)
                  )
                }
              />
              <span className="capitalize">{formatSymptom(option)}</span>
            </label>
          ))}
        </div>
      </div>
    );
  }

  if (field.type === "rating") {
    return (
      <RatingSelector
        label={field.label}
        value={typeof value === "number" ? value : 3}
        onChange={onChange}
      />
    );
  }

  if (field.type === "select") {
    return (
      <div className="space-y-2">
        <Label>{field.label}</Label>
        <select
          value={typeof value === "string" ? value : ""}
          onChange={(event) => onChange(event.target.value || null)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">Choose what fits best</option>
          {(field.options || []).map((option) => (
            <option key={option} value={option}>
              {formatClinicalLabel(option)}
            </option>
          ))}
        </select>
        {field.helper && <p className="text-xs text-muted-foreground">{field.helper}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label>{field.label}</Label>
      <Input
        type={field.type === "number" ? "number" : "text"}
        min={field.min}
        max={field.max}
        value={typeof value === "number" || typeof value === "string" ? value : ""}
        onChange={(event) =>
          onChange(field.type === "number" ? Number(event.target.value) || null : event.target.value)
        }
        placeholder={field.placeholder}
      />
      {field.helper && <p className="text-xs text-muted-foreground">{field.helper}</p>}
    </div>
  );
}

export default function WomensHealthCheckInPage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [recentCheckIns, setRecentCheckIns] = useState<CheckIn[]>([]);
  const [careArea, setCareArea] = useState("hormones");
  const [periodStatus, setPeriodStatus] = useState("");
  const [cycleDay, setCycleDay] = useState("");
  const [lastPeriodDate, setLastPeriodDate] = useState("");
  const [energyLevel, setEnergyLevel] = useState(3);
  const [moodLevel, setMoodLevel] = useState(3);
  const [sleepQuality, setSleepQuality] = useState(3);
  const [stressLevel, setStressLevel] = useState(3);
  const [painLevel, setPainLevel] = useState(1);
  const [libidoLevel, setLibidoLevel] = useState(3);
  const [hotFlushesLevel, setHotFlushesLevel] = useState(1);
  const [cravingsLevel, setCravingsLevel] = useState(1);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [clinicalAnswers, setClinicalAnswers] = useState<ClinicalMetadata>({});
  const [notes, setNotes] = useState("");
  const [treatmentSideEffectFlag, setTreatmentSideEffectFlag] = useState(false);
  const selectedClinicalSections =
    WOMENS_HEALTH_CLINICAL_SECTIONS[careArea as WomensHealthCareArea];

  const loadCheckIns = async () => {
    try {
      const res = await fetch("/api/womens-health/check-ins?limit=5");
      if (res.ok) {
        const data = await res.json();
        setRecentCheckIns(data.checkIns || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const areaParam = new URLSearchParams(window.location.search).get("area");
    if (areaParam && careAreas.some((area) => area.id === areaParam)) {
      setCareArea(areaParam);
    }
    loadCheckIns();
  }, []);

  const toggleSymptom = (symptom: string) => {
    setSymptoms((current) =>
      current.includes(symptom)
        ? current.filter((item) => item !== symptom)
        : [...current, symptom]
    );
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/womens-health/check-ins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          careArea,
          periodStatus: periodStatus || null,
          cycleDay: cycleDay || null,
          lastPeriodDate: lastPeriodDate || null,
          energyLevel,
          moodLevel,
          sleepQuality,
          stressLevel,
          painLevel,
          libidoLevel,
          hotFlushesLevel,
          cravingsLevel,
          symptoms,
          metadata: {
            clinical: clinicalAnswers,
          },
          notes,
          treatmentSideEffectFlag,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save check-in");
      toast.success("Women's Health check-in saved");
      setNotes("");
      setSymptoms([]);
      setClinicalAnswers({});
      setTreatmentSideEffectFlag(false);
      loadCheckIns();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save check-in");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 px-3 pb-20 sm:px-0 md:pb-8">
      <div className="flex items-start gap-3 sm:items-center sm:gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link href="/dashboard/womens-health">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div className="min-w-0">
          <h1 className="flex items-center gap-2 text-xl font-bold sm:text-2xl">
            <CalendarDays className="w-6 h-6 shrink-0 text-rose-600" />
            Women&apos;s Health Check-in
          </h1>
          <p className="text-muted-foreground">Log symptoms, cycle context and treatment notes.</p>
        </div>
      </div>

      <Card className="border-rose-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HeartPulse className="w-5 h-5 text-rose-600" />
            Today&apos;s data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <Label>Care area</Label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
                {careAreas.map((area) => (
                  <Button
                    key={area.id}
                    type="button"
                    variant={careArea === area.id ? "default" : "outline"}
                    className={`h-auto justify-start whitespace-normal text-left ${
                      careArea === area.id ? "bg-rose-600 hover:bg-rose-700" : ""
                    }`}
                    onClick={() => {
                      setCareArea(area.id);
                      setClinicalAnswers({});
                    }}
                  >
                    {area.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="period-status">Period status</Label>
                <Input
                  id="period-status"
                  value={periodStatus}
                  onChange={(event) => setPeriodStatus(event.target.value)}
                  placeholder="e.g. regular, irregular, none"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cycle-day">Cycle day</Label>
                <Input
                  id="cycle-day"
                  type="number"
                  min="1"
                  max="90"
                  value={cycleDay}
                  onChange={(event) => setCycleDay(event.target.value)}
                  placeholder="Optional"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last-period">Last period date</Label>
                <Input
                  id="last-period"
                  type="date"
                  value={lastPeriodDate}
                  onChange={(event) => setLastPeriodDate(event.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              <RatingSelector label="Energy" value={energyLevel} onChange={setEnergyLevel} />
              <RatingSelector label="Mood" value={moodLevel} onChange={setMoodLevel} />
              <RatingSelector label="Sleep quality" value={sleepQuality} onChange={setSleepQuality} />
              <RatingSelector label="Stress" value={stressLevel} onChange={setStressLevel} />
              <RatingSelector label="Pain" value={painLevel} onChange={setPainLevel} />
              <RatingSelector label="Libido" value={libidoLevel} onChange={setLibidoLevel} />
              <RatingSelector label="Hot flushes" value={hotFlushesLevel} onChange={setHotFlushesLevel} />
              <RatingSelector label="Cravings" value={cravingsLevel} onChange={setCravingsLevel} />
            </div>

            <div className="space-y-3">
              <Label>Symptoms today</Label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {symptomOptions.map((symptom) => (
                  <label key={symptom} className="flex min-w-0 items-center gap-2 rounded-xl border p-3 text-sm cursor-pointer">
                    <Checkbox
                      checked={symptoms.includes(symptom)}
                      onCheckedChange={() => toggleSymptom(symptom)}
                    />
                    <span className="capitalize leading-snug">{formatSymptom(symptom)}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-4 rounded-2xl border border-rose-100 bg-rose-50/50 p-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-rose-600">
                  More about your {formatSymptom(careArea)}
                </p>
                <p className="text-sm text-muted-foreground">
                  A few focused questions help your care team understand what is happening day to day.
                </p>
              </div>
              {selectedClinicalSections.map((section) => (
                <div key={section.title} className="space-y-4 rounded-xl bg-white p-4">
                  <div>
                    <h3 className="font-semibold">{section.title}</h3>
                    <p className="text-sm text-muted-foreground">{section.description}</p>
                  </div>
                  <div className="grid gap-4 lg:grid-cols-2">
                    {section.fields.map((field) => (
                      <ClinicalFieldControl
                        key={field.id}
                        field={field}
                        value={clinicalAnswers[field.id]}
                        onChange={(value) =>
                          setClinicalAnswers((current) => ({
                            ...current,
                            [field.id]: value,
                          }))
                        }
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes for your care team</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Add anything useful about symptoms, triggers, cycle changes, medication effects or questions."
                rows={4}
              />
            </div>

            <label className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm">
              <Checkbox
                checked={treatmentSideEffectFlag}
                onCheckedChange={(checked) => setTreatmentSideEffectFlag(Boolean(checked))}
              />
              <span>
                I think one of these symptoms may be related to a treatment or prescription.
              </span>
            </label>

            <Button type="submit" disabled={submitting} className="w-full bg-rose-600 hover:bg-rose-700">
              {submitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4 mr-2" />
              )}
              Save check-in
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-rose-600" />
            Recent entries
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          ) : recentCheckIns.length ? (
            recentCheckIns.map((checkIn) => (
              <div key={checkIn.id} className="rounded-xl border p-3 sm:p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium capitalize">{formatSymptom(checkIn.careArea)}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(checkIn.checkedInAt).toLocaleDateString("en-AU", {
                        day: "numeric",
                        month: "short",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <Badge variant="secondary" className="w-fit">
                    Energy {checkIn.energyLevel}/5 · Sleep {checkIn.sleepQuality}/5
                  </Badge>
                </div>
                {checkIn.symptoms.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {checkIn.symptoms.slice(0, 6).map((symptom) => (
                      <Badge key={symptom} variant="outline" className="capitalize">
                        {formatSymptom(symptom)}
                      </Badge>
                    ))}
                  </div>
                )}
                {checkIn.metadata?.clinical && (
                  <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                    {Object.entries(checkIn.metadata.clinical)
                      .filter(([, value]) => formatClinicalValue(value).length > 0)
                      .slice(0, 4)
                      .map(([key, value]) => (
                        <div key={key} className="rounded-lg bg-muted/50 px-3 py-2">
                          <span className="font-medium capitalize text-foreground">
                            {formatClinicalLabel(key)}:
                          </span>{" "}
                          {formatClinicalValue(value)}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No check-ins yet. Your first entry will appear here.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
