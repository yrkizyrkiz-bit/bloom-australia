"use client";

import { Badge } from "@/components/ui/badge";
import {
  getMedicareEligibility,
  type MedicareEligibility,
} from "@/lib/biomarker-medicare-eligibility";
import { cn } from "@/lib/utils";

const BADGE_STYLES: Record<MedicareEligibility, string> = {
  medicare_standard:
    "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-50",
  medicare_with_indication:
    "border-sky-200 bg-sky-50 text-sky-800 hover:bg-sky-50",
  derived:
    "border-border bg-muted/60 text-muted-foreground hover:bg-muted/60",
};

interface MedicareEligibilityBadgeProps {
  biomarkerId: string;
  className?: string;
  showTooltip?: boolean;
}

export function MedicareEligibilityBadge({
  biomarkerId,
  className,
  showTooltip = true,
}: MedicareEligibilityBadgeProps) {
  const eligibility = getMedicareEligibility(biomarkerId);

  return (
    <Badge
      variant="outline"
      className={cn("text-[10px] font-normal leading-tight", BADGE_STYLES[eligibility.type], className)}
      title={showTooltip ? eligibility.description : undefined}
    >
      {eligibility.label}
    </Badge>
  );
}
