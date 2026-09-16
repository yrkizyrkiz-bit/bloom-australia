"use client";

import { Info } from "lucide-react";

export function PriorOrganPanelNote({
  organLabel,
  dateLabel,
}: {
  organLabel: string;
  dateLabel: string;
}) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
      <Info className="mt-0.5 h-4 w-4 shrink-0" />
      <p>
        Your latest blood test did not include {organLabel} markers. Showing results from the previous
        blood test dated <span className="font-medium">{dateLabel}</span>.
      </p>
    </div>
  );
}
