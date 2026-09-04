"use client";

import { Check, FileText, User, Wallet, type LucideIcon } from "lucide-react";
import type { ClinicalFunnelProgramId } from "@/lib/funnel/clinical-program-funnel";

export const FUNNEL_PROGRESS_PHASES: ReadonlyArray<{
  id: number;
  label: string;
  icon: LucideIcon;
}> = [
  { id: 1, label: "Your Details", icon: User },
  { id: 2, label: "Health Assessment", icon: FileText },
  { id: 3, label: "Review", icon: Check },
  { id: 4, label: "Submit & Pay", icon: Wallet },
];

export type FunnelProgressAccent = "sage" | "terracotta";

const ACCENT: Record<
  FunnelProgressAccent,
  { fill: string; ring: string; connector: string; track: string; inactiveText: string }
> = {
  sage: {
    fill: "bg-[#5c7a52] text-white",
    ring: "ring-[#5c7a52]/20",
    connector: "bg-[#5c7a52]",
    track: "bg-[#e6ebe3]",
    inactiveText: "text-[#7e9a72]",
  },
  terracotta: {
    fill: "bg-[#c17a58] text-white",
    ring: "ring-[#c17a58]/20",
    connector: "bg-[#c17a58]",
    track: "bg-[#f8e1e1]",
    inactiveText: "text-[#c17a58]",
  },
};

export function funnelProgressAccentForProgram(
  programId: ClinicalFunnelProgramId
): FunnelProgressAccent {
  return programId === "womens_health" ? "terracotta" : "sage";
}

export function backboneProgressPhase(
  _phase: "qualify" | "profile" | "pay" | "book" | "welcome"
): number {
  return 4;
}

export function FunnelStepProgress({
  currentPhase,
  compact = false,
  accent = "sage",
}: {
  currentPhase: number;
  compact?: boolean;
  accent?: FunnelProgressAccent;
}) {
  const colors = ACCENT[accent];

  return (
    <div className={`w-full px-2 ${compact ? "py-2" : "py-4"}`}>
      <div className="mx-auto flex max-w-lg items-center justify-between">
        {FUNNEL_PROGRESS_PHASES.map((phase, index) => {
          const isActive = currentPhase === phase.id;
          const isCompleted = currentPhase > phase.id;
          const Icon = phase.icon;

          return (
            <div key={phase.id} className="flex flex-1 items-center last:flex-initial">
              <div className="flex flex-col items-center">
                <div
                  className={`flex items-center justify-center rounded-full transition-all duration-300 ${
                    compact ? "h-8 w-8" : "h-10 w-10"
                  } ${
                    isCompleted || isActive
                      ? colors.fill
                      : `${colors.track} ${colors.inactiveText}`
                  } ${isActive ? `ring-4 ${colors.ring}` : ""}`}
                >
                  {isCompleted ? (
                    <Check className={compact ? "h-4 w-4" : "h-5 w-5"} />
                  ) : (
                    <Icon className={compact ? "h-4 w-4" : "h-5 w-5"} />
                  )}
                </div>
                <span
                  className={`mt-2 hidden text-center text-xs font-medium sm:block ${
                    isActive || isCompleted ? "text-[#2c3628]" : colors.inactiveText
                  }`}
                >
                  {phase.label}
                </span>
              </div>
              {index < FUNNEL_PROGRESS_PHASES.length - 1 && (
                <div
                  className={`mx-2 h-1 flex-1 rounded-full transition-all duration-300 ${
                    isCompleted ? colors.connector : colors.track
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
