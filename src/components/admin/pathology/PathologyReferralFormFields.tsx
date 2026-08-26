"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { listBloodTestsForApi } from "@/lib/pathology/blood-test-catalog";
import { listPathologyPanelOptionGroups } from "@/lib/pathology/pathology-program-panels";
import type { usePathologyReferralForm } from "@/components/admin/pathology/usePathologyReferralForm";

const PANEL_GROUPS = listPathologyPanelOptionGroups();
const ADDITIONAL_TESTS = listBloodTestsForApi();

type PathologyReferralFormFieldsProps = {
  form: ReturnType<typeof usePathologyReferralForm>;
  idPrefix?: string;
};

export function PathologyReferralFormFields({
  form,
  idPrefix = "",
}: PathologyReferralFormFieldsProps) {
  const pid = (id: string) => `${idPrefix}${id}`;

  return (
    <div className="space-y-6">
      {form.loadingPrefill && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="w-3 h-3 animate-spin" />
          Loading saved doctor and patient details…
        </div>
      )}

      <section
        ref={form.referralDetailsRef}
        className="rounded-lg border bg-slate-50 p-4 space-y-3"
      >
        <div>
          <h3 className="text-sm font-semibold">1. Referral details</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Your prescriber Medicare provider number is required on every referral (not the
            patient&apos;s Medicare card number).
          </p>
        </div>
        {form.providerError && (
          <p className="text-sm text-red-600 rounded-md border border-red-200 bg-red-50 px-3 py-2">
            Enter <strong>your</strong> Medicare provider number, e.g.{" "}
            <span className="font-mono">1234567A</span>.
          </p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor={pid("providerNumber")}>Your Medicare provider number *</Label>
            <Input
              ref={form.providerInputRef}
              id={pid("providerNumber")}
              value={form.providerNumber}
              onChange={(e) => {
                form.updateProviderNumber(e.target.value);
              }}
              onBlur={(e) => {
                void form.persistProviderNumber(e.target.value);
              }}
              placeholder="e.g. 1234567A"
              autoComplete="off"
              className={
                form.providerError || !form.getProviderNumberValue()
                  ? "border-amber-500 bg-white ring-1 ring-amber-200"
                  : "bg-white"
              }
            />
            <p className="text-xs text-muted-foreground">
              {form.providerSource
                ? `Loaded from ${form.providerSource.toLowerCase()}`
                : "Save once under Doctor → Account Details, or enter here"}
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={pid("doctorName")}>Prescriber name</Label>
            <Input
              id={pid("doctorName")}
              className="bg-white"
              value={form.doctorName}
              onChange={(e) => form.setDoctorName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={pid("medicareNumber")}>Patient Medicare number</Label>
            <Input
              id={pid("medicareNumber")}
              className="bg-white"
              value={form.medicareNumber}
              onChange={(e) => form.setMedicareNumber(e.target.value)}
              placeholder="10 digits (optional)"
              inputMode="numeric"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={pid("medicareIrn")}>Patient Medicare IRN</Label>
            <Input
              id={pid("medicareIrn")}
              className="bg-white"
              value={form.medicareIrn}
              onChange={(e) => form.setMedicareIrn(e.target.value)}
              placeholder="1 digit (optional)"
              maxLength={1}
              inputMode="numeric"
            />
          </div>
        </div>
      </section>

      <section className="rounded-lg border p-4 space-y-2">
        <div>
          <h3 className="text-sm font-semibold">2. Clinical indication &amp; notes</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Medicare clinical indications are pulled from the member&apos;s program quiz where
            available, edit or add notes before generating the PDF.
          </p>
        </div>
        <Textarea
          id={pid("clinicalIndication")}
          value={form.clinicalIndication}
          onChange={(e) => {
            form.indicationEditedRef.current = true;
            form.setClinicalIndication(e.target.value);
          }}
          rows={7}
          className="min-h-[140px] bg-white"
          placeholder="Medicare indications from quiz assessments appear here when available. Add or edit clinical notes for each MBS item before generating…"
        />
      </section>

      {PANEL_GROUPS.map((group) => (
        <section key={group.id} className="rounded-lg border p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold">
              3. {group.label}
              {group.id === "organ_biomarkers" ? " (Organ Care & Biomarkers)" : ""}
            </h3>
            {group.id === "clinical" && (
              <Button type="button" variant="outline" size="sm" onClick={form.selectAllPanels}>
                Select all panels
              </Button>
            )}
          </div>
          <div className="grid grid-cols-1 gap-2">
            {group.options.map((panel) => (
              <label
                key={panel.slug}
                className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                  form.selectedPanels.includes(panel.slug)
                    ? "border-emerald-500 bg-emerald-50/50"
                    : "hover:bg-slate-50"
                }`}
              >
                <Checkbox
                  checked={form.selectedPanels.includes(panel.slug)}
                  onCheckedChange={(c) => form.togglePanel(panel.slug, c === true)}
                  className="mt-0.5"
                />
                <div>
                  <p className="font-medium text-sm">{panel.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{panel.description}</p>
                </div>
              </label>
            ))}
          </div>
        </section>
      ))}

      {form.resolvedTestIds.length > 0 && (
        <section className="space-y-2">
          <Label>Tests included ({form.resolvedTestIds.length})</Label>
          <div className="flex flex-wrap gap-1.5">
            {form.resolvedTestIds.map((testId) => {
              const test = ADDITIONAL_TESTS.find((t) => t.id === testId);
              return (
                <Badge key={testId} variant="secondary" className="text-xs">
                  {test?.name || testId}
                </Badge>
              );
            })}
          </div>
        </section>
      )}

      <section className="rounded-lg border p-4 space-y-3">
        <Label>Additional individual tests (optional)</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 border rounded-lg p-3 max-h-40 overflow-y-auto bg-white">
          {ADDITIONAL_TESTS.map((test) => (
            <div key={test.id} className="flex items-start space-x-2">
              <Checkbox
                id={pid(`add-test-${test.id}`)}
                checked={form.additionalTests.includes(test.id)}
                onCheckedChange={(c) => form.toggleAdditionalTest(test.id, c === true)}
              />
              <Label
                htmlFor={pid(`add-test-${test.id}`)}
                className="text-sm font-normal cursor-pointer leading-snug"
              >
                {test.name}
              </Label>
            </div>
          ))}
        </div>
        <Input
          value={form.customTests}
          onChange={(e) => form.setCustomTests(e.target.value)}
          placeholder="Other tests (free text)"
          className="bg-white"
        />
      </section>

      <section className="flex flex-wrap gap-6 pb-2">
        <div className="flex items-center space-x-2">
          <Checkbox
            id={pid("fastingRequired")}
            checked={form.fastingRequired}
            onCheckedChange={(c) => form.setFastingRequired(c === true)}
          />
          <Label htmlFor={pid("fastingRequired")} className="cursor-pointer">
            Fasting required (8–12 hours)
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id={pid("urgentReferral")}
            checked={form.urgent}
            onCheckedChange={(c) => form.setUrgent(c === true)}
          />
          <Label htmlFor={pid("urgentReferral")} className="cursor-pointer">
            Urgent
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id={pid("emailToPatient")}
            checked={form.emailToPatient}
            onCheckedChange={(c) => form.setEmailToPatient(c === true)}
          />
          <Label htmlFor={pid("emailToPatient")} className="cursor-pointer">
            Email PDF to patient ({form.patientEmail})
          </Label>
        </div>
      </section>
    </div>
  );
}
