"use client";

import Link from "next/link";
import { Stethoscope } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type ClinicalAssessmentPromptProps = {
  variant: "needed" | "deferred";
  firstVisit?: boolean;
  onCompleteLater?: () => void;
  deferring?: boolean;
  /** Render inner content only, for nesting inside another panel. */
  embedded?: boolean;
};

export function ClinicalAssessmentPrompt({
  variant,
  firstVisit = false,
  onCompleteLater,
  deferring = false,
  embedded = false,
}: ClinicalAssessmentPromptProps) {
  const needed = variant === "needed";

  const body = (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
      <div
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${
          needed ? "bg-[#5c7a52]/10" : "bg-amber-100"
        }`}
      >
        <Stethoscope className={`h-6 w-6 ${needed ? "text-[#5c7a52]" : "text-amber-700"}`} />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="font-semibold text-[#2c3628]">
          {firstVisit ? "Complete your clinical assessment" : "Clinical assessment for your doctor"}
        </h3>
        <p className="mt-1 text-sm text-[#5c7a52]">
          {needed
            ? "A few health history questions so your doctor can prepare for your consultation. Takes about 2 minutes."
            : "You chose to finish this later. Complete it before your doctor consultation so your care plan is based on a full history."}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button asChild className="bg-[#5c7a52] hover:bg-[#4a6343]">
            <Link href="/dashboard/weight-management/clinical-assessment">
              {needed ? "Start now" : "Continue assessment"}
            </Link>
          </Button>
          {needed && onCompleteLater ? (
            <Button
              type="button"
              variant="outline"
              onClick={onCompleteLater}
              disabled={deferring}
            >
              Complete later
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );

  if (embedded) {
    return body;
  }

  return (
    <Card
      className={
        needed
          ? "border-[#5c7a52]/30 bg-[#f4f7f2]"
          : "border-amber-200 bg-amber-50"
      }
    >
      <CardContent className="p-5">{body}</CardContent>
    </Card>
  );
}
