"use client";

import Link from "next/link";
import { Lock, Hourglass, FlaskConical, CheckCircle2, PauseCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { EntitlementState, MarkerCoverage } from "@/lib/membership/biomarker-readiness";

const STATE_META: Record<
  EntitlementState,
  { label: string; badgeClass: string; icon: typeof Lock }
> = {
  ready: {
    label: "Included",
    badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-200",
    icon: CheckCircle2,
  },
  partial: {
    label: "Partially ready",
    badgeClass: "bg-amber-100 text-amber-800 border-amber-200",
    icon: FlaskConical,
  },
  pending_results: {
    label: "Waiting for results",
    badgeClass: "bg-sky-100 text-sky-800 border-sky-200",
    icon: Hourglass,
  },
  locked_upgrade: {
    label: "Available upgrade",
    badgeClass: "bg-violet-100 text-violet-800 border-violet-200",
    icon: Lock,
  },
  inactive: {
    label: "Not active",
    badgeClass: "bg-gray-100 text-gray-600 border-gray-200",
    icon: PauseCircle,
  },
};

/** Compact pill that summarizes an entitlement/readiness state. */
export function PortalStateBadge({
  state,
  className,
}: {
  state: EntitlementState;
  className?: string;
}) {
  const meta = STATE_META[state];
  const Icon = meta.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
        meta.badgeClass,
        className
      )}
    >
      <Icon className="h-3 w-3" />
      {meta.label}
    </span>
  );
}

export type PortalInsightStateProps = {
  state: EntitlementState;
  title: string;
  description?: string;
  coverage?: MarkerCoverage;
  /** CTA destination (e.g. in-portal quiz/checkout or biomarkers page). */
  ctaHref?: string;
  ctaLabel?: string;
  /** Compact variant for inline use inside a card grid. */
  compact?: boolean;
  className?: string;
};

/**
 * Renders the locked / partial / pending / ready / inactive state for a portal
 * insight area, with marker coverage and an upgrade CTA.
 */
export function PortalInsightState({
  state,
  title,
  description,
  coverage,
  ctaHref,
  ctaLabel,
  compact = false,
  className,
}: PortalInsightStateProps) {
  const meta = STATE_META[state];
  const Icon = meta.icon;
  const showCta = Boolean(ctaHref) && state !== "ready";
  const defaultCta =
    state === "locked_upgrade"
      ? "Unlock this"
      : state === "inactive"
        ? "Reactivate"
        : "Learn more";

  const coverageLine =
    coverage && coverage.requiredCount > 0 ? (
      <p className="text-sm text-gray-500">
        {coverage.availableCount} of {coverage.requiredCount} markers ready
        {coverage.missing.length > 0 && state !== "ready"
          ? ` · ${coverage.missing.length} still needed`
          : ""}
      </p>
    ) : null;

  if (compact) {
    return (
      <div
        className={cn(
          "flex items-center justify-between gap-3 rounded-lg border bg-white/60 p-3",
          className
        )}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <PortalStateBadge state={state} />
            <span className="truncate text-sm font-medium text-gray-900">{title}</span>
          </div>
          {coverageLine}
        </div>
        {showCta && (
          <Button asChild size="sm" variant="outline" className="shrink-0">
            <Link href={ctaHref!}>{ctaLabel || defaultCta}</Link>
          </Button>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-2xl border bg-white px-6 py-10 text-center",
        className
      )}
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50">
        <Icon className="h-7 w-7 text-gray-600" />
      </div>
      <div className="mb-2">
        <PortalStateBadge state={state} />
      </div>
      <h3 className="mb-2 text-xl font-semibold text-gray-900">{title}</h3>
      {description && <p className="mb-2 max-w-md leading-relaxed text-gray-600">{description}</p>}
      {coverageLine}
      {showCta && (
        <Button asChild className="mt-6 bg-emerald-700 hover:bg-emerald-800">
          <Link href={ctaHref!}>{ctaLabel || defaultCta}</Link>
        </Button>
      )}
    </div>
  );
}
