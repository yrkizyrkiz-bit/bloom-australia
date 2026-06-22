"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  TestTubes,
  Bean,
  Droplets,
  Heart,
  Activity,
  Sparkles,
  Flame,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type OrganMetabolicPanel = {
  href: string;
  label: string;
  icon: LucideIcon;
  color: string;
};

export const ORGAN_METABOLIC_HEALTH_PANELS: OrganMetabolicPanel[] = [
  { href: "/dashboard/blood-panel", label: "Full Blood", icon: TestTubes, color: "#1D9E75" },
  { href: "/dashboard/liver-test", label: "Liver", icon: Bean, color: "#65a30d" },
  { href: "/dashboard/kidney-test", label: "Kidney", icon: Droplets, color: "#0891b2" },
  { href: "/dashboard/heart-test", label: "Heart", icon: Heart, color: "#ef4444" },
  { href: "/dashboard/thyroid-test", label: "Thyroid", icon: Activity, color: "#2563eb" },
  { href: "/dashboard/hormone-test", label: "Hormones", icon: Sparkles, color: "#a855f7" },
  { href: "/dashboard/metabolic-panel", label: "Metabolic", icon: Flame, color: "#f97316" },
];

type OrganMetabolicHealthPanelsProps = {
  organCareEntitled: boolean;
  title?: string;
  className?: string;
  /** When locked, link tiles to this upgrade path instead of panel routes. */
  upgradeHref?: string;
};

export function OrganMetabolicHealthPanels({
  organCareEntitled,
  title = "Organ & Metabolic Health",
  className,
  upgradeHref = "/dashboard/biomarkers/quiz",
}: OrganMetabolicHealthPanelsProps) {
  return (
    <div className={className}>
      <div className="mb-2 flex items-center gap-2">
        <h2 className="text-sm font-medium text-foreground">{title}</h2>
        {!organCareEntitled && (
          <span className="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[11px] font-medium text-violet-700">
            <Lock className="h-3 w-3" />
            Organ Care
          </span>
        )}
      </div>
      <div className="overflow-x-auto pb-1">
        <div className="flex w-max gap-2">
          {ORGAN_METABOLIC_HEALTH_PANELS.map((panel) => {
            const content = (
              <div
                className={cn(
                  "flex w-20 flex-col items-center justify-center gap-1.5 rounded-xl border border-border bg-card p-3 transition-shadow",
                  organCareEntitled
                    ? "hover:shadow-md"
                    : "cursor-not-allowed opacity-45 grayscale"
                )}
              >
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `${panel.color}15` }}
                >
                  <panel.icon className="h-5 w-5" style={{ color: panel.color }} />
                </div>
                <span className="text-center text-[11px] leading-tight text-muted-foreground">
                  {panel.label}
                </span>
              </div>
            );

            if (organCareEntitled) {
              return (
                <Link key={panel.href} href={panel.href} className="shrink-0">
                  {content}
                </Link>
              );
            }

            return (
              <Link
                key={panel.href}
                href={upgradeHref}
                className="shrink-0"
                title="Add Organ Care to unlock these dashboards"
              >
                {content}
              </Link>
            );
          })}
        </div>
      </div>
      {!organCareEntitled && (
        <p className="mt-1.5 text-xs text-muted-foreground">
          Add Organ Care to unlock liver, kidney, heart, and other organ dashboards.
        </p>
      )}
    </div>
  );
}
