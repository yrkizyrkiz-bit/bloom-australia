"use client";

import { useMemo, useState } from "react";
import { Info } from "lucide-react";
import {
  getTierBiomarkersForDisplay,
  type PanelBiomarkerDisplay,
} from "@/lib/biomarkers/panel-biomarker-display";
import type { BiomarkerSubscriptionTier } from "@/lib/biomarkers/public-subscription-panels";

type Props = {
  tier: BiomarkerSubscriptionTier;
  planName: string;
  planTagline: string;
  markerCount: number;
};

function BiomarkerCard({
  marker,
  expanded,
  onToggle,
}: {
  marker: PanelBiomarkerDisplay;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`w-full rounded-2xl border bg-white p-4 text-left transition-all hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5c7a52] focus-visible:ring-offset-2 ${
        expanded
          ? "border-[#5c7a52] shadow-md ring-2 ring-[#5c7a52]/20"
          : "border-[#e6ebe3] hover:border-[#cdd8c6]"
      }`}
      aria-expanded={expanded}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-12 w-12 sm:h-14 sm:w-14 flex-shrink-0 items-center justify-center rounded-xl text-xs sm:text-sm font-bold text-white ${marker.categoryColor}`}
        >
          {marker.shortName}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-medium text-[#2c3628] text-sm sm:text-base leading-snug">
                {marker.name}
              </h3>
              <p className="mt-0.5 text-xs text-[#7e9a72] truncate">
                {marker.categoryName} · {marker.rangeLabel}
              </p>
            </div>
            {marker.isDerived && (
              <span className="flex-shrink-0 rounded-full bg-[#f4f7f2] px-2 py-0.5 text-[10px] font-medium text-[#5c7a52]">
                Calc
              </span>
            )}
          </div>
        </div>
      </div>

      <p
        className={`mt-3 text-sm leading-relaxed text-[#5c7a52] [@media(hover:none)]:block ${
          expanded ? "block" : "line-clamp-2 [@media(hover:hover)]:hidden"
        }`}
      >
        {marker.description}
      </p>

      <p className="mt-2 text-[10px] text-[#a8bb9e] [@media(hover:hover)]:hidden">
        {expanded ? "Tap to collapse" : "Tap for full description"}
      </p>
    </button>
  );
}

export function PanelBiomarkerPreview({ tier, planName, planTagline, markerCount }: Props) {
  const biomarkers = useMemo(() => getTierBiomarkersForDisplay(tier), [tier]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <section className="rounded-3xl border border-[#e6ebe3] bg-[#fdfbf7] p-5 sm:p-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-[#5c7a52]">
            {planName} panel
          </p>
          <h2 className="mt-1 font-serif text-2xl text-[#2c3628] sm:text-3xl">
            {markerCount} biomarkers included
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-[#5c7a52]">{planTagline}</p>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs text-[#7e9a72] border border-[#e6ebe3]">
          <Info className="h-4 w-4 flex-shrink-0 text-[#5c7a52]" />
          <span className="hidden sm:inline">Hover any marker for a quick summary</span>
          <span className="sm:hidden">Tap any marker to read more</span>
        </div>
      </div>

      <div className="relative pt-2">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {biomarkers.map((marker) => (
            <div key={marker.id} className="group relative">
              <BiomarkerCard
                marker={marker}
                expanded={expandedId === marker.id}
                onToggle={() =>
                  setExpandedId((current) => (current === marker.id ? null : marker.id))
                }
              />
              <div className="pointer-events-none absolute bottom-full left-0 right-0 z-20 mb-2 hidden rounded-xl border border-[#e6ebe3] bg-white p-3 shadow-lg [@media(hover:hover)]:group-hover:block">
                <p className="text-sm leading-relaxed text-[#5c7a52]">{marker.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
