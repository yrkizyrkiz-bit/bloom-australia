"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { BiomarkerDefinition, BiomarkerResult, BiomarkerStatus } from "@/types";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import {
  getBiomarkerStatus as getPanelStatus,
  getEffectiveRange,
  type BloodPanelBiomarker,
  type Gender
} from "@/data/bloodPanelConfig";

interface BiomarkerCardProps {
  biomarker: BiomarkerDefinition;
  result: BiomarkerResult;
  previousResult?: BiomarkerResult;
  gender: "male" | "female";
  panelBiomarker?: BloodPanelBiomarker; // Optional panel biomarker for consistent ranges
  onClick?: () => void;
}

export function BiomarkerCard({ biomarker, result, previousResult, gender, panelBiomarker, onClick }: BiomarkerCardProps) {
  // Use panel biomarker ranges if provided, otherwise fall back to definition ranges
  const usePanelRanges = !!panelBiomarker;

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

  const getStatusColor = (status: BiomarkerStatus) => {
    switch (status) {
      case "optimal": return "bg-green-500";
      case "normal": return "bg-yellow-500";
      case "out_of_range": return "bg-orange-500";
      case "critical": return "bg-red-500";
      default: return "bg-gray-400";
    }
  };

  const getStatusBadgeClass = (status: BiomarkerStatus) => {
    switch (status) {
      case "optimal": return "status-optimal";
      case "normal": return "status-normal";
      case "out_of_range": return "status-out-of-range";
      case "critical": return "status-critical";
      default: return "";
    }
  };

  // Calculate position on range bar
  const calculatePosition = () => {
    const totalRange = displayRange.high - displayRange.low;
    if (totalRange === 0) return 50;
    const position = ((result.value - displayRange.low) / totalRange) * 100;
    return Math.max(0, Math.min(100, position));
  };

  // Calculate trend
  const getTrend = () => {
    if (!previousResult) return null;
    const diff = result.value - previousResult.value;
    if (Math.abs(diff) < 0.01) return "stable";
    return diff > 0 ? "up" : "down";
  };

  const trend = getTrend();
  const position = calculatePosition();

  return (
    <Card
      className="p-4 cursor-pointer hover:shadow-lg hover:border-primary/30 transition-all duration-200 group"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor(calculatedStatus)}`} />
          <h4 className="font-medium text-foreground group-hover:text-primary transition-colors">
            {biomarker.shortName}
          </h4>
        </div>
        <Badge variant="outline" className={`text-xs ${getStatusBadgeClass(calculatedStatus)}`}>
          {statusLabel}
        </Badge>
      </div>

      {/* Value */}
      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-2xl font-serif font-bold text-foreground">
          {result.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
        </span>
        <span className="text-sm text-muted-foreground">{displayRange.unit}</span>

        {/* Trend indicator */}
        {trend && (
          <div className={`ml-auto flex items-center gap-1 text-xs ${
            trend === "up" ? "text-green-600" : trend === "down" ? "text-red-600" : "text-muted-foreground"
          }`}>
            {trend === "up" && <TrendingUp className="w-3 h-3" />}
            {trend === "down" && <TrendingDown className="w-3 h-3" />}
            {trend === "stable" && <Minus className="w-3 h-3" />}
          </div>
        )}
      </div>

      {/* Range bar */}
      <div className="space-y-1">
        <div className="h-2 bg-muted rounded-full overflow-hidden relative">
          {/* Optimal zone */}
          <div
            className="absolute h-full bg-green-500/30"
            style={{
              left: `${((displayRange.optimal_low - displayRange.low) / (displayRange.high - displayRange.low)) * 100}%`,
              width: `${((displayRange.optimal_high - displayRange.optimal_low) / (displayRange.high - displayRange.low)) * 100}%`
            }}
          />
          {/* Current position marker */}
          <div
            className={`absolute w-3 h-3 rounded-full -top-0.5 -translate-x-1/2 border-2 border-white shadow ${getStatusColor(calculatedStatus)}`}
            style={{ left: `${position}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{displayRange.low}</span>
          <span className="text-green-600">Optimal: {displayRange.optimal_low}-{displayRange.optimal_high}</span>
          <span>{displayRange.high}</span>
        </div>
      </div>
    </Card>
  );
}
