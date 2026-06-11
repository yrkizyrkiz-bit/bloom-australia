"use client";

import { Info } from "lucide-react";
import { ORGAN_TREND_ILLUSTRATION_MESSAGE } from "@/lib/organ-trend-data";

interface OrganTrendIllustrationNoticeProps {
  className?: string;
}

export function OrganTrendIllustrationNotice({ className }: OrganTrendIllustrationNoticeProps) {
  return (
    <div
      className={`flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/30 ${className ?? ""}`}
    >
      <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
      <p className="text-sm text-blue-800 dark:text-blue-200">{ORGAN_TREND_ILLUSTRATION_MESSAGE}</p>
    </div>
  );
}
