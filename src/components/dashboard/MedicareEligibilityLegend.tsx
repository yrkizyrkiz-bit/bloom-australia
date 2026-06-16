"use client";

import { Badge } from "@/components/ui/badge";
import { MEDICARE_ELIGIBILITY_LEGEND } from "@/lib/biomarker-medicare-eligibility";
import { cn } from "@/lib/utils";

const LEGEND_STYLES = {
  medicare_standard: "border-emerald-200 bg-emerald-50 text-emerald-800",
  medicare_with_indication: "border-sky-200 bg-sky-50 text-sky-800",
  derived: "border-border bg-muted/60 text-muted-foreground",
} as const;

interface MedicareEligibilityLegendProps {
  className?: string;
  compact?: boolean;
}

export function MedicareEligibilityLegend({
  className,
  compact = false,
}: MedicareEligibilityLegendProps) {
  return (
    <div className={cn("rounded-lg border bg-muted/30 p-3", className)}>
      <p className="text-xs font-medium text-foreground mb-2">
        Medicare eligibility (Australia)
      </p>
      <div className={cn("flex flex-wrap gap-2", !compact && "sm:grid sm:grid-cols-2 sm:gap-x-4 sm:gap-y-2")}>
        {MEDICARE_ELIGIBILITY_LEGEND.map((item) => (
          <div key={item.type} className="flex items-start gap-2 min-w-0">
            <Badge
              variant="outline"
              className={cn("text-[10px] shrink-0", LEGEND_STYLES[item.type])}
            >
              {item.label}
            </Badge>
            {!compact && (
              <span className="text-[11px] text-muted-foreground leading-snug">
                {item.description}
              </span>
            )}
          </div>
        ))}
      </div>
      <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed">
        Rebates require a valid clinical indication and MBS criteria. Bulk billing depends on
        your doctor and pathology provider.
      </p>
    </div>
  );
}
