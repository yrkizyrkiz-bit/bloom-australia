"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calculator,
  Loader2,
  Stethoscope,
  User,
  Droplets,
  Info,
} from "lucide-react";
import type { AscvdLabInputs, AscvdProfileInputs } from "@/lib/ascvd-inputs";

interface AscvdSetupFormProps {
  mode: "initial" | "bp_update";
  labInputs: AscvdLabInputs;
  profile: AscvdProfileInputs;
  onProfileChange: (profile: AscvdProfileInputs) => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
  submitLabel?: string;
  missingForFirstRun?: string[];
}

function ReadOnlyField({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-800">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

export function AscvdSetupForm({
  mode,
  labInputs,
  profile,
  onProfileChange,
  onSubmit,
  isSubmitting = false,
  submitLabel,
  missingForFirstRun = [],
}: AscvdSetupFormProps) {
  const isInitial = mode === "initial";
  const canSubmit =
    mode === "bp_update"
      ? Boolean(profile.systolicBP && profile.diastolicBP)
      : missingForFirstRun.length === 0 &&
        Boolean(profile.systolicBP && profile.diastolicBP);

  return (
    <Card className="border-0 shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          {isInitial ? (
            <>
              <Calculator className="w-5 h-5 text-red-600" />
              ASCVD Calculator Inputs
            </>
          ) : (
            <>
              <Stethoscope className="w-5 h-5 text-red-600" />
              Update Latest Blood Pressure
            </>
          )}
        </CardTitle>
        <CardDescription>
          {isInitial
            ? "Review the values from your blood tests, confirm your risk factors, then generate your first cardiovascular report."
            : "Enter your most recent blood pressure reading to refresh your ASCVD risk. Your other inputs stay the same until new blood tests are uploaded."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <Droplets className="w-4 h-4 text-red-500" />
            From your blood tests
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <ReadOnlyField
              label="Age"
              value={labInputs.age !== null ? `${labInputs.age} years` : "Not set"}
            />
            <ReadOnlyField label="Sex" value={labInputs.sexLabel} />
            <ReadOnlyField
              label="Total cholesterol"
              value={
                labInputs.totalCholesterol !== null
                  ? `${labInputs.totalCholesterol} mmol/L (${labInputs.totalCholesterolMgDl} mg/dL)`
                  : "Not available"
              }
            />
            <ReadOnlyField
              label="HDL cholesterol"
              value={
                labInputs.hdlCholesterol !== null
                  ? `${labInputs.hdlCholesterol} mmol/L (${labInputs.hdlCholesterolMgDl} mg/dL)`
                  : "Not available"
              }
            />
            <ReadOnlyField
              label="Diabetes"
              value={labInputs.diabetes ? `Yes${labInputs.diabetesDetail ? ` — ${labInputs.diabetesDetail}` : ""}` : "No"}
            />
            {labInputs.dataDate && (
              <ReadOnlyField
                label="Blood test date"
                value={new Date(labInputs.dataDate).toLocaleDateString("en-AU", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              />
            )}
          </div>
          {labInputs.ascvdNote && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              <Info className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{labInputs.ascvdNote}</span>
            </div>
          )}
        </div>

        {isInitial ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <User className="w-4 h-4 text-red-500" />
              Confirm your risk factors
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ascvd-systolic">Systolic blood pressure (mmHg) *</Label>
                <Input
                  id="ascvd-systolic"
                  type="number"
                  placeholder="e.g., 120"
                  value={profile.systolicBP ?? ""}
                  onChange={(e) =>
                    onProfileChange({
                      ...profile,
                      systolicBP: e.target.value ? parseInt(e.target.value, 10) : null,
                    })
                  }
                  min={70}
                  max={250}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ascvd-diastolic">Diastolic blood pressure (mmHg) *</Label>
                <Input
                  id="ascvd-diastolic"
                  type="number"
                  placeholder="e.g., 80"
                  value={profile.diastolicBP ?? ""}
                  onChange={(e) =>
                    onProfileChange({
                      ...profile,
                      diastolicBP: e.target.value ? parseInt(e.target.value, 10) : null,
                    })
                  }
                  min={40}
                  max={150}
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 p-4">
              <div>
                <Label htmlFor="ascvd-bp-meds" className="font-medium">
                  On blood pressure medication?
                </Label>
                <p className="text-sm text-slate-500">Required for ASCVD calculation</p>
              </div>
              <Switch
                id="ascvd-bp-meds"
                checked={profile.onBPMedication}
                onCheckedChange={(checked) =>
                  onProfileChange({ ...profile, onBPMedication: checked })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Smoking status</Label>
              <Select
                value={profile.smokingStatus}
                onValueChange={(value) =>
                  onProfileChange({
                    ...profile,
                    smokingStatus: value as AscvdProfileInputs["smokingStatus"],
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select smoking status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NEVER">Never smoked</SelectItem>
                  <SelectItem value="FORMER">Former smoker</SelectItem>
                  <SelectItem value="CURRENT">Current smoker</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Race / ethnicity (for ASCVD)</Label>
              <Select
                value={profile.race}
                onValueChange={(value) =>
                  onProfileChange({
                    ...profile,
                    race: value as AscvdProfileInputs["race"],
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select race/ethnicity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WHITE">White</SelectItem>
                  <SelectItem value="AFRICAN_AMERICAN">African American</SelectItem>
                  <SelectItem value="ASIAN">Asian</SelectItem>
                  <SelectItem value="HISPANIC">Hispanic</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500">
                Validated ASCVD coefficients are available for White and African American populations.
              </p>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 p-4">
              <div>
                <Label htmlFor="ascvd-family-history" className="font-medium">
                  Family history of heart disease?
                </Label>
                <p className="text-sm text-slate-500">First-degree relative with premature cardiovascular disease</p>
              </div>
              <Switch
                id="ascvd-family-history"
                checked={profile.familyHistoryCVD}
                onCheckedChange={(checked) =>
                  onProfileChange({ ...profile, familyHistoryCVD: checked })
                }
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <ReadOnlyField
                label="Smoking"
                value={
                  profile.smokingStatus === "NEVER"
                    ? "Never"
                    : profile.smokingStatus === "FORMER"
                      ? "Former"
                      : "Current"
                }
              />
              <ReadOnlyField
                label="BP medication"
                value={profile.onBPMedication ? "Yes" : "No"}
              />
              <ReadOnlyField label="Race / ethnicity" value={profile.race.replace(/_/g, " ")} />
              <ReadOnlyField
                label="Previous BP"
                value={
                  profile.systolicBP && profile.diastolicBP
                    ? `${profile.systolicBP}/${profile.diastolicBP} mmHg`
                    : "Not recorded"
                }
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ascvd-bp-systolic">Latest systolic (mmHg) *</Label>
                <Input
                  id="ascvd-bp-systolic"
                  type="number"
                  placeholder="e.g., 120"
                  value={profile.systolicBP ?? ""}
                  onChange={(e) =>
                    onProfileChange({
                      ...profile,
                      systolicBP: e.target.value ? parseInt(e.target.value, 10) : null,
                    })
                  }
                  min={70}
                  max={250}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ascvd-bp-diastolic">Latest diastolic (mmHg) *</Label>
                <Input
                  id="ascvd-bp-diastolic"
                  type="number"
                  placeholder="e.g., 80"
                  value={profile.diastolicBP ?? ""}
                  onChange={(e) =>
                    onProfileChange({
                      ...profile,
                      diastolicBP: e.target.value ? parseInt(e.target.value, 10) : null,
                    })
                  }
                  min={40}
                  max={150}
                />
              </div>
            </div>
          </div>
        )}

        {isInitial && missingForFirstRun.length > 0 && (
          <div className="rounded-lg border border-orange-200 bg-orange-50 p-3 text-sm text-orange-800">
            Still needed before generating your report: {missingForFirstRun.join(", ")}.
          </div>
        )}

        <div className="flex items-center justify-between gap-3">
          {!isInitial && (
            <Badge variant="outline" className="text-slate-600">
              Lab values update automatically when new blood tests are uploaded
            </Badge>
          )}
          <Button
            onClick={onSubmit}
            disabled={!canSubmit || isSubmitting}
            className={`gap-2 bg-red-600 hover:bg-red-700 ${isInitial ? "ml-auto" : ""}`}
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Calculator className="w-4 h-4" />
            )}
            {submitLabel ??
              (isInitial ? "Generate cardiovascular report" : "Update report with latest BP")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
