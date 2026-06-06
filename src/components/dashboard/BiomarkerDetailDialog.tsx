"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { BiomarkerDefinition, BiomarkerResult, BiomarkerStatus } from "@/types";
import {
  TrendingUp,
  TrendingDown,
  Info,
  Lightbulb,
  Link2,
  Calendar,
  AlertTriangle,
  CheckCircle,
  MinusCircle
} from "lucide-react";
import {
  getBiomarkerStatus as getPanelStatus,
  getEffectiveRange,
  type BloodPanelBiomarker,
  type Gender
} from "@/data/bloodPanelConfig";

interface BiomarkerDetailDialogProps {
  biomarker: BiomarkerDefinition | null;
  result: BiomarkerResult | null;
  history: BiomarkerResult[];
  gender: "male" | "female";
  panelBiomarker?: BloodPanelBiomarker; // Optional panel biomarker for consistent ranges
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
  onOpenChange
}: BiomarkerDetailDialogProps) {
  if (!biomarker || !result) return null;

  const usePanelRanges = !!panelBiomarker;

  // Get range for display - prefer panel ranges if available
  const displayRange = usePanelRanges && panelBiomarker
    ? {
        low: getEffectiveRange(panelBiomarker, gender as Gender).normalLow,
        optimal_low: getEffectiveRange(panelBiomarker, gender as Gender).optimalLow,
        optimal_high: getEffectiveRange(panelBiomarker, gender as Gender).optimalHigh,
        high: getEffectiveRange(panelBiomarker, gender as Gender).normalHigh,
        unit: panelBiomarker.unit
      }
    : biomarker.ranges[gender];

  // Get status from panel config for consistency
  const panelStatusResult = panelBiomarker
    ? getPanelStatus(result.value, panelBiomarker, gender as Gender)
    : null;

  // Map panel status to our status types
  const getStatusFromPanel = (): { status: BiomarkerStatus; label: string } => {
    if (!panelStatusResult) {
      // Fall back to calculating from biomarker definition
      const range = biomarker.ranges[gender];
      if (result.value >= range.optimal_low && result.value <= range.optimal_high) {
        return { status: "optimal", label: "Optimal" };
      }
      if (result.value >= range.low && result.value <= range.high) {
        return { status: "normal", label: "Normal" };
      }
      if (result.value < range.low * 0.5 || result.value > range.high * 1.5) {
        return { status: "critical", label: "Critical" };
      }
      return { status: "out_of_range", label: "Attention" };
    }

    // Map panel status strings to our types
    const statusStr = panelStatusResult.status;
    if (statusStr === "Optimal") return { status: "optimal", label: "Optimal" };
    if (statusStr === "Normal") return { status: "normal", label: "Normal" };
    if (statusStr === "Critical Low" || statusStr === "Critical High") return { status: "critical", label: "Critical" };
    // "Low", "High", or any other out of range status -> "Attention"
    return { status: "out_of_range", label: "Attention" };
  };

  const { status: calculatedStatus, label: statusLabel } = getStatusFromPanel();

  const getStatusColor = (status: BiomarkerStatus) => {
    switch (status) {
      case "optimal": return "text-green-600 bg-green-500/10";
      case "normal": return "text-yellow-600 bg-yellow-500/10";
      case "out_of_range": return "text-orange-600 bg-orange-500/10";
      case "critical": return "text-red-600 bg-red-500/10";
      default: return "text-gray-600 bg-gray-500/10";
    }
  };

  const getStatusIcon = (status: BiomarkerStatus) => {
    switch (status) {
      case "optimal": return CheckCircle;
      case "normal": return MinusCircle;
      case "out_of_range": return AlertTriangle;
      case "critical": return AlertTriangle;
      default: return Info;
    }
  };

  const StatusIcon = getStatusIcon(calculatedStatus);

  // Calculate position on range bar
  const calculatePosition = (value: number) => {
    const totalRange = displayRange.high - displayRange.low;
    if (totalRange === 0) return 50;
    const position = ((value - displayRange.low) / totalRange) * 100;
    return Math.max(0, Math.min(100, position));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${getStatusColor(calculatedStatus)}`}>
              <StatusIcon className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-serif">{biomarker.name}</span>
              <span className="text-sm text-muted-foreground ml-2">({biomarker.shortName})</span>
            </div>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)]">
          <div className="space-y-6 pr-4">
            {/* Current Value Section */}
            <div className="bg-muted/50 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">Current Value</p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-4xl font-serif font-bold text-foreground">
                      {result.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-lg text-muted-foreground">{displayRange.unit}</span>
                  </div>
                </div>
                <Badge variant="outline" className={`text-sm px-3 py-1 ${getStatusColor(calculatedStatus)}`}>
                  {statusLabel}
                </Badge>
              </div>

              {/* Range visualization */}
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded-full overflow-hidden relative">
                  {/* Low zone */}
                  <div
                    className="absolute h-full bg-orange-500/30"
                    style={{
                      left: 0,
                      width: `${((displayRange.optimal_low - displayRange.low) / (displayRange.high - displayRange.low)) * 100}%`
                    }}
                  />
                  {/* Optimal zone */}
                  <div
                    className="absolute h-full bg-green-500/40"
                    style={{
                      left: `${((displayRange.optimal_low - displayRange.low) / (displayRange.high - displayRange.low)) * 100}%`,
                      width: `${((displayRange.optimal_high - displayRange.optimal_low) / (displayRange.high - displayRange.low)) * 100}%`
                    }}
                  />
                  {/* High zone */}
                  <div
                    className="absolute h-full bg-orange-500/30"
                    style={{
                      left: `${((displayRange.optimal_high - displayRange.low) / (displayRange.high - displayRange.low)) * 100}%`,
                      right: 0
                    }}
                  />
                  {/* Current position marker */}
                  <div
                    className="absolute w-4 h-4 rounded-full bg-foreground border-2 border-white shadow-lg -top-0 -translate-x-1/2"
                    style={{ left: `${calculatePosition(result.value)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Low: {displayRange.low}</span>
                  <span className="text-green-600 font-medium">Optimal: {displayRange.optimal_low} - {displayRange.optimal_high}</span>
                  <span>High: {displayRange.high}</span>
                </div>
              </div>

              {/* Test date */}
              <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>
                  Tested on {new Date(result.testedAt).toLocaleDateString('en-AU', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </span>
              </div>
            </div>

            {/* History Chart */}
            {history.length > 1 && (
              <>
                <Separator />
                <div>
                  <h4 className="font-medium flex items-center gap-2 mb-4">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    Trend History
                  </h4>
                  <div className="bg-muted/30 rounded-lg p-4">
                    <div className="flex items-end justify-between h-24 gap-2">
                      {history.map((h, i) => {
                        const height = (h.value / displayRange.high) * 100;
                        const isOptimal = h.value >= displayRange.optimal_low && h.value <= displayRange.optimal_high;
                        return (
                          <div key={h.id} className="flex-1 flex flex-col items-center gap-1">
                            <div
                              className={`w-full max-w-8 rounded-t ${isOptimal ? 'bg-green-500' : 'bg-orange-500'}`}
                              style={{ height: `${Math.max(height, 10)}%` }}
                            />
                            <span className="text-xs text-muted-foreground">
                              {new Date(h.testedAt).toLocaleDateString('en-AU', { month: 'short' })}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </>
            )}

            <Separator />

            {/* About Section */}
            <div>
              <h4 className="font-medium flex items-center gap-2 mb-3">
                <Info className="w-4 h-4 text-primary" />
                About {biomarker.shortName}
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {biomarker.description}
              </p>
            </div>

            <Separator />

            {/* Why It Matters */}
            <div>
              <h4 className="font-medium flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-accent" />
                Why It Matters
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {biomarker.whyItMatters}
              </p>
            </div>

            {/* Improvement Tips - Only show if not optimal */}
            {calculatedStatus !== "optimal" && (
              <>
                <Separator />
                <div>
                  <h4 className="font-medium flex items-center gap-2 mb-4">
                    <Lightbulb className="w-4 h-4 text-yellow-500" />
                    How to Improve
                  </h4>
                  <div className="space-y-3">
                    {biomarker.improvementTips.map((tip, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
                        <div className="w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0 text-yellow-600 text-sm font-medium">
                          {index + 1}
                        </div>
                        <p className="text-sm text-foreground">{tip}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Related Biomarkers */}
            {biomarker.relatedBiomarkers.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="font-medium flex items-center gap-2 mb-3">
                    <Link2 className="w-4 h-4 text-primary" />
                    Related Biomarkers
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {biomarker.relatedBiomarkers.map((related) => (
                      <Badge key={related} variant="secondary" className="text-xs">
                        {related.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
