"use client";

import Link from "next/link";
import { ArrowLeft, ChevronRight, TestTubes } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePortalContext } from "@/hooks/usePortalContext";
import { PortalStateBadge } from "@/components/portal/PortalInsightState";
import type { ProgramKey } from "@/lib/membership/keys";
import type { EntitlementState } from "@/lib/membership/biomarker-readiness";
import { programSlugFromProgramKey } from "@/lib/billing/program-slugs";
import { ProgramSubscriptionGate } from "@/components/portal/ProgramSubscriptionGate";

export type ProgramFocusLandingProps = {
  programKey: ProgramKey;
  title: string;
  intro: string;
  focusItems: string[];
  biomarkerItems: string[];
  quizRoute: string;
};

export function ProgramFocusLanding({
  programKey,
  title,
  intro,
  focusItems,
  biomarkerItems,
  quizRoute,
}: ProgramFocusLandingProps) {
  const { data: portal } = usePortalContext();
  const state: EntitlementState =
    portal?.membership?.programs?.[programKey]?.state ?? "locked_upgrade";
  const entitled = state === "ready" || state === "partial" || state === "pending_results";

  return (
    <ProgramSubscriptionGate programSlug={programSlugFromProgramKey(programKey)}>
    <div className="mx-auto max-w-3xl px-0 py-4 sm:px-4 sm:py-8">
      <Link
        href="/dashboard"
        className="mb-6 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" /> Back to dashboard
      </Link>

      <div className="mb-6 flex items-center gap-3">
        <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
        <PortalStateBadge state={state} />
      </div>
      <p className="mb-8 max-w-2xl leading-relaxed text-gray-600">{intro}</p>

      {!entitled && (
        <Card className="mb-6 border-emerald-100 bg-emerald-50 sm:mb-8">
          <CardContent className="flex flex-col items-start gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div className="min-w-0">
              <p className="font-medium text-gray-900">Unlock {title}</p>
              <p className="text-sm text-gray-600">
                Take a short quiz and start your program from inside the portal.
              </p>
            </div>
            <Button asChild className="w-full bg-emerald-700 hover:bg-emerald-800 sm:w-auto">
              <Link href={quizRoute}>Start quiz</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">What we focus on</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {focusItems.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-gray-700">
                  <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TestTubes className="h-4 w-4 text-emerald-600" /> Biomarkers we track
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {biomarkerItems.map((item) => (
                <li key={item} className="text-sm text-gray-700">
                  {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
    </ProgramSubscriptionGate>
  );
}
