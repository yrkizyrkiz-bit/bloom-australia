"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { BiomarkerDefinition, BiomarkerResult, BiomarkerStatus } from "@/types";
import {
  TrendingUp,
  Lightbulb,
  Link2,
  Calendar,
  AlertTriangle,
  CheckCircle,
  MinusCircle,
  Calculator,
  Clock,
  Stethoscope,
  Info,
} from "lucide-react";
import {
  getBiomarkerStatus as getPanelStatus,
  getEffectiveRange,
  type BloodPanelBiomarker,
  type Gender,
} from "@/data/bloodPanelConfig";
import { isDerivedBiomarker } from "@/lib/biomarker-medicare-eligibility";
import { interpretDerivedScore } from "@/lib/derived-biomarker-interpretations";
import { MedicareEligibilityBadge } from "@/components/dashboard/MedicareEligibilityBadge";
import {
  biomarkerCommonName,
  biomarkerResultExplanation,
  biomarkerResultHeadline,
  biomarkerStatusBadgeLabel,
  getResultDirection,
  relatedBiomarkerLabel,
} from "@/lib/biomarker-patient-copy";

interface BiomarkerDetailDialogProps {
  biomarker: BiomarkerDefinition | null;
  result: BiomarkerResult | null;
  history: BiomarkerResult[];
  gender: "male" | "female";
  panelBiomarker?: BloodPanelBiomarker;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BiomarkerDetailDialog({
  biomarker,
  result,
  history,
  gender,
  panelBiomarker,
  open,
  onOpenChange,
}: BiomarkerDetailDialogProps) {
  if (!biomarker) return null;

  const isDerived = isDerivedBiomarker(biomarker.id);
  const isUntested = !result;
  const usePanelRanges = !!panelBiomarker;

  const displayRange =
    usePanelRanges && panelBiomarker
      ? {
          low: getEffectiveRange(panelBiomarker, gender as Gender).normalLow,
          optimal_low: getEffectiveRange(panelBiomarker, gender as Gender).optimalLow,
          optimal_high: getEffectiveRange(panelBiomarker, gender as Gender).optimalHigh,
          high: getEffectiveRange(panelBiomarker, gender as Gender).normalHigh,
          unit: panelBiomarker.unit,
        }
      : biomarker.ranges[gender];

  const rangeSpan = displayRange.high - displayRange.low;

  const getStatusColor = (status: BiomarkerStatus) => {
    switch (status) {
      case "optimal":
        return "text-emerald-700 bg-emerald-500/10 border-emerald-500/30";
      case "normal":
        return "text-amber-700 bg-amber-500/10 border-amber-500/30";
      case "out_of_range":
        return "text-orange-700 bg-orange-500/10 border-orange-500/30";
      case "critical":
        return "text-red-700 bg-red-500/10 border-red-500/30";
      default:
        return "text-muted-foreground bg-muted border-border";
    }
  };

  const getValueColor = (status: BiomarkerStatus) => {
    switch (status) {
      case "optimal":
        return "text-emerald-600";
      case "normal":
        return "text-amber-600";
      case "out_of_range":
        return "text-orange-600";
      case "critical":
        return "text-red-600";
      default:
        return "text-foreground";
    }
  };

  const getStatusIcon = (status: BiomarkerStatus) => {
    switch (status) {
      case "optimal":
        return CheckCircle;
      case "normal":
        return MinusCircle;
      case "out_of_range":
      case "critical":
        return AlertTriangle;
      default:
        return Info;
    }
  };

  const panelStatusResult =
    result && panelBiomarker
      ? getPanelStatus(result.value, panelBiomarker, gender as Gender)
      : null;

  const getStatusFromPanel = (): { status: BiomarkerStatus; label: string } => {
    if (!result) return { status: "normal", label: "Not tested" };

    if (!panelStatusResult) {
      const range = biomarker.ranges[gender];
      if (result.value >= range.optimal_low && result.value <= range.optimal_high) {
        return { status: "optimal", label: "Optimal" };
      }
      if (result.value >= range.low && result.value <= range.high) {
        return { status: "normal", label: "In range" };
      }
      if (result.value < range.low * 0.5 || result.value > range.high * 1.5) {
        return { status: "critical", label: "Needs urgent review" };
      }
      return { status: "out_of_range", label: "Out of range" };
    }

    const statusStr = panelStatusResult.status;
    if (statusStr === "Optimal") return { status: "optimal", label: "Optimal" };
    if (statusStr === "Normal") return { status: "normal", label: "In range" };
    if (statusStr === "Critical Low" || statusStr === "Critical High") {
      return { status: "critical", label: "Needs urgent review" };
    }
    return { status: "out_of_range", label: "Out of range" };
  };

  const { status: calculatedStatus } = getStatusFromPanel();
  const direction = getResultDirection(
    result?.value,
    isUntested ? "untested" : calculatedStatus,
    displayRange.optimal_low,
    displayRange.optimal_high
  );
  const badgeLabel = biomarkerStatusBadgeLabel(
    isUntested ? "untested" : calculatedStatus,
    direction
  );
  const headline = biomarkerResultHeadline(biomarker, direction);
  const explanation = biomarkerResultExplanation(biomarker, direction);
  const commonName = biomarkerCommonName(biomarker);
  const StatusIcon = isUntested ? (isDerived ? Calculator : Clock) : getStatusIcon(calculatedStatus);
  const scoreBand =
    result && Number.isFinite(result.value)
      ? interpretDerivedScore(biomarker.id, result.value)
      : null;

  const calculatePosition = (value: number) => {
    if (rangeSpan === 0) return 50;
    const position = ((value - displayRange.low) / rangeSpan) * 100;
    return Math.max(0, Math.min(100, position));
  };

  const optimalStartPct =
    rangeSpan > 0 ? ((displayRange.optimal_low - displayRange.low) / rangeSpan) * 100 : 0;
  const optimalWidthPct =
    rangeSpan > 0
      ? ((displayRange.optimal_high - displayRange.optimal_low) / rangeSpan) * 100
      : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader className="space-y-3">
          <DialogTitle className="sr-only">{biomarker.name}</DialogTitle>
          <div className="flex items-start justify-between gap-3 pr-6">
            <div className="min-w-0">
              <h2 className="text-2xl font-serif font-semibold text-foreground leading-tight">
                {biomarker.name}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">{commonName}</p>
            </div>
            <Badge
              variant="outline"
              className={`shrink-0 text-xs px-2.5 py-1 ${
                isUntested ? "text-muted-foreground bg-muted" : getStatusColor(calculatedStatus)
              }`}
            >
              <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-current" />
              {badgeLabel}
            </Badge>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)]">
          <div className="space-y-6 pr-4">
            <div className="flex flex-wrap items-center gap-2">
              <MedicareEligibilityBadge biomarkerId={biomarker.id} />
              {isUntested && (
                <Badge variant="outline" className="text-xs">
                  {isDerived ? "Awaiting calculation" : "Awaiting results"}
                </Badge>
              )}
            </div>

            {/* Hers-style clinician explainer */}
            <div className="flex gap-3 rounded-2xl border border-[#e6ebe3] bg-[#f7faf6] p-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#1D9E75]/15 text-[#1D9E75]">
                <Stethoscope className="h-5 w-5" />
              </div>
              <div className="min-w-0 space-y-1.5">
                <p
                  className={`font-semibold leading-snug ${
                    isUntested
                      ? "text-foreground"
                      : direction === "high" || direction === "low" || calculatedStatus === "critical"
                        ? "text-red-600"
                        : direction === "optimal"
                          ? "text-emerald-700"
                          : "text-amber-700"
                  }`}
                >
                  {isUntested
                    ? isDerived
                      ? `About your ${biomarker.name}`
                      : `Waiting for your ${biomarker.name} result`
                    : headline}
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">{explanation}</p>
              </div>
            </div>

            {isUntested ? (
              <div className="bg-muted/50 rounded-xl p-6">
                <p className="text-sm text-muted-foreground mb-4">
                  {isDerived
                    ? "This marker is calculated automatically from your other lab results once the required inputs are available."
                    : "This marker is in your Sanative panel but does not have a result yet. Upload a lab report or order testing to populate it."}
                </p>
                {panelBiomarker?.note && (
                  <p className="text-sm text-foreground/80 mb-4 p-3 rounded-lg bg-background border">
                    {panelBiomarker.note}
                  </p>
                )}
                <p className="text-sm font-medium text-foreground mb-3">Reference ranges</p>
                {rangeSpan > 0 && (
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded-full overflow-hidden relative">
                      <div
                        className="absolute h-full bg-orange-500/20"
                        style={{ left: 0, width: `${optimalStartPct}%` }}
                      />
                      <div
                        className="absolute h-full bg-emerald-500/35"
                        style={{ left: `${optimalStartPct}%`, width: `${optimalWidthPct}%` }}
                      />
                      <div
                        className="absolute h-full bg-orange-500/20"
                        style={{ left: `${optimalStartPct + optimalWidthPct}%`, right: 0 }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Low: {displayRange.low}</span>
                      <span className="text-emerald-600 font-medium">
                        Optimal: {displayRange.optimal_low} – {displayRange.optimal_high}
                      </span>
                      <span>High: {displayRange.high}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Unit: {displayRange.unit || "—"}</p>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="rounded-xl border bg-background p-6">
                  <div className="flex items-end justify-between gap-4 mb-5">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Current result</p>
                      <div className="flex items-baseline gap-2">
                        <span
                          className={`text-4xl font-serif font-bold tracking-tight ${getValueColor(calculatedStatus)}`}
                        >
                          {result.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </span>
                        <span className="text-base text-muted-foreground">{displayRange.unit}</span>
                      </div>
                    </div>
                    <div
                      className={`flex items-center gap-1.5 text-sm font-medium ${getValueColor(calculatedStatus)}`}
                    >
                      <StatusIcon className="h-4 w-4" />
                      {badgeLabel}
                    </div>
                  </div>

                  {rangeSpan > 0 && (
                    <div className="space-y-3">
                      <div className="relative h-5 rounded-full overflow-hidden bg-muted">
                        <div
                          className="absolute inset-y-0 left-0 bg-red-500/25"
                          style={{ width: `${optimalStartPct}%` }}
                        />
                        <div
                          className="absolute inset-y-0 bg-emerald-500/40"
                          style={{ left: `${optimalStartPct}%`, width: `${optimalWidthPct}%` }}
                        />
                        <div
                          className="absolute inset-y-0 right-0 bg-red-500/25"
                          style={{ left: `${optimalStartPct + optimalWidthPct}%` }}
                        />
                        <div
                          className={`absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-md ${
                            calculatedStatus === "optimal"
                              ? "bg-emerald-600"
                              : calculatedStatus === "normal"
                                ? "bg-amber-500"
                                : "bg-red-600"
                          }`}
                          style={{ left: `${calculatePosition(result.value)}%` }}
                          title="Current result"
                        />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>
                          <span className="text-red-600/80">Out of range</span>
                          <span className="mx-1">·</span>
                          {displayRange.low}
                        </span>
                        <span className="text-emerald-700 font-medium">
                          Optimal {displayRange.optimal_low} – {displayRange.optimal_high}
                        </span>
                        <span>
                          {displayRange.high}
                          <span className="mx-1">·</span>
                          <span className="text-red-600/80">Out of range</span>
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Marker shows where your current result sits on the scale.
                      </p>
                    </div>
                  )}

                  {scoreBand && (
                    <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-3">
                      <p className="text-sm font-medium text-foreground">Score: {scoreBand.label}</p>
                      <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                        {scoreBand.meaning}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>
                      Tested on{" "}
                      {new Date(result.testedAt).toLocaleDateString("en-AU", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>

                {history.length > 1 && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium flex items-center gap-2 mb-4">
                        <TrendingUp className="w-4 h-4 text-primary" />
                        How this has changed
                      </h4>
                      <div className="bg-muted/30 rounded-lg p-4">
                        <div className="flex items-end justify-between h-24 gap-2">
                          {history.map((h) => {
                            const height = (h.value / displayRange.high) * 100;
                            const isOptimal =
                              h.value >= displayRange.optimal_low &&
                              h.value <= displayRange.optimal_high;
                            return (
                              <div key={h.id} className="flex-1 flex flex-col items-center gap-1">
                                <div
                                  className={`w-full max-w-8 rounded-t ${
                                    isOptimal ? "bg-emerald-500" : "bg-orange-500"
                                  }`}
                                  style={{ height: `${Math.max(height, 10)}%` }}
                                />
                                <span className="text-xs text-muted-foreground">
                                  {new Date(h.testedAt).toLocaleDateString("en-AU", {
                                    month: "short",
                                  })}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}

            {(isUntested || calculatedStatus !== "optimal") && biomarker.improvementTips.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="font-medium flex items-center gap-2 mb-4">
                    <Lightbulb className="w-4 h-4 text-yellow-500" />
                    {isUntested ? "What usually helps" : "What you can do"}
                  </h4>
                  <div className="space-y-3">
                    {biomarker.improvementTips.map((tip, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20"
                      >
                        <div className="w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0 text-yellow-700 text-sm font-medium">
                          {index + 1}
                        </div>
                        <p className="text-sm text-foreground">{tip}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {biomarker.relatedBiomarkers.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="font-medium flex items-center gap-2 mb-3">
                    <Link2 className="w-4 h-4 text-primary" />
                    Related markers
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {biomarker.relatedBiomarkers.map((related) => (
                      <Badge key={related} variant="secondary" className="text-xs">
                        {relatedBiomarkerLabel(related)}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}

            <p className="text-xs text-muted-foreground leading-relaxed">
              Educational only — not a diagnosis. Discuss results with your GP or Sanative care team.
            </p>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
