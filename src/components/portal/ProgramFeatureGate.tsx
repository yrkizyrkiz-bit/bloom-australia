"use client";

import Link from "next/link";
import { Lock, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PortalContextPayload } from "@/lib/portal-context";

type ProgramFeatureGateProps = {
  portal: PortalContextPayload | null;
  feature: keyof PortalContextPayload["features"];
  title?: string;
  description?: string;
};

export function ProgramFeatureGate({
  portal,
  feature,
  title = "Progress tracking unlocks soon",
  description,
}: ProgramFeatureGateProps) {
  const stageText =
    description ||
    portal?.stageDescription ||
    "Your program is being prepared. You can follow your journey from Home until tracking is available.";

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mb-6">
        <Lock className="w-8 h-8 text-emerald-700" />
      </div>
      <h1 className="text-2xl font-serif text-gray-900 mb-3">{title}</h1>
      <p className="text-gray-600 max-w-md mb-2 leading-relaxed">{stageText}</p>
      {portal && !portal.isActive && (
        <p className="text-sm text-emerald-700 font-medium mb-8">
          Current stage: {portal.stageDescription}
        </p>
      )}
      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
        <Button asChild className="bg-emerald-700 hover:bg-emerald-800 flex-1">
          <Link href="/dashboard/weight-management">
            <TrendingUp className="w-4 h-4 mr-2" />
            View program journey
          </Link>
        </Button>
        <Button asChild variant="outline" className="flex-1">
          <Link href="/dashboard/weight-management/support">Contact care team</Link>
        </Button>
      </div>
      <p className="text-xs text-gray-400 mt-8 max-w-sm">
        Weight charts, goals, and check-ins open when your program is active.
      </p>
    </div>
  );
}

/** Returns true when the feature is unlocked for the current portal state. */
export function hasPortalFeature(
  portal: PortalContextPayload | null | undefined,
  feature: keyof PortalContextPayload["features"]
): boolean {
  if (!portal) return false;
  return Boolean(portal.features[feature]);
}
