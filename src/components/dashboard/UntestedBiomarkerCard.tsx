"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  getEffectiveRange,
  hasGenderSpecificRanges,
  type BloodPanelBiomarker,
  type Gender,
} from "@/data/bloodPanelConfig";
import { getMedicareEligibility } from "@/lib/biomarker-medicare-eligibility";
import { cn } from "@/lib/utils";
import { Calculator, User } from "lucide-react";
import { MedicareEligibilityBadge } from "@/components/dashboard/MedicareEligibilityBadge";

interface UntestedBiomarkerCardProps {
  biomarker: BloodPanelBiomarker;
  gender?: Gender;
  categoryColor?: string;
  onClick?: () => void;
}

export function UntestedBiomarkerCard({
  biomarker,
  gender,
  categoryColor = "#94a3b8",
  onClick,
}: UntestedBiomarkerCardProps) {
  const range = getEffectiveRange(biomarker, gender);
  const hasGenderRange = hasGenderSpecificRanges(biomarker);
  const isDerived = getMedicareEligibility(biomarker.id).type === "derived";
  const rangeSpan = range.normalHigh - range.normalLow;

  return (
    <Card
      className={cn(
        "p-4 transition-all duration-200 border-dashed",
        onClick && "cursor-pointer hover:shadow-md hover:border-primary/30 group"
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div
              className="w-2.5 h-2.5 rounded-full shrink-0 opacity-70"
              style={{ backgroundColor: categoryColor }}
            />
            <h4 className="font-medium text-foreground truncate group-hover:text-primary transition-colors">
              {biomarker.shortName}
            </h4>
            {hasGenderRange && (
              <span title={`${gender === "male" ? "Male" : "Female"} reference range`}>
                <User className="w-3 h-3 text-muted-foreground shrink-0" />
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{biomarker.name}</p>
        </div>
        <Badge
          variant="outline"
          className={cn(
            "text-[10px] shrink-0",
            isDerived
              ? "border-violet-200 bg-violet-50 text-violet-700"
              : "border-muted-foreground/30 text-muted-foreground"
          )}
        >
          {isDerived ? "Calculated" : "Not tested"}
        </Badge>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 mb-3">
        <MedicareEligibilityBadge biomarkerId={biomarker.id} />
        {isDerived && (
          <Badge variant="outline" className="text-[10px] border-violet-200/60 text-violet-600 gap-1">
            <Calculator className="w-3 h-3" />
            Auto-derived
          </Badge>
        )}
      </div>

      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-2xl font-serif font-bold text-muted-foreground/60">—</span>
        <span className="text-sm text-muted-foreground">{biomarker.unit || "ratio"}</span>
      </div>

      {rangeSpan > 0 && (
        <div className="space-y-1 mb-2">
          <div className="h-2 bg-muted rounded-full overflow-hidden relative">
            <div
              className="absolute h-full bg-green-500/25"
              style={{
                left: `${((range.optimalLow - range.normalLow) / rangeSpan) * 100}%`,
                width: `${((range.optimalHigh - range.optimalLow) / rangeSpan) * 100}%`,
              }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>{range.normalLow}</span>
            <span>
              Optimal: {range.optimalLow}–{range.optimalHigh}
            </span>
            <span>{range.normalHigh}</span>
          </div>
        </div>
      )}

      {biomarker.note && (
        <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2 mt-1">
          {biomarker.note}
        </p>
      )}
    </Card>
  );
}
