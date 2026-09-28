"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Flower2 } from "lucide-react";
import {
  formatPortalQuizAnswers,
  formatQuizCompletedDate,
} from "@/lib/portal-quiz-display";

export function MemberWomensWellnessQuestionnaire({
  rawSurveyData,
  submittedAt,
}: {
  rawSurveyData: Record<string, unknown>;
  submittedAt?: string | null;
}) {
  const rows = formatPortalQuizAnswers(
    "WOMENS_HEALTH_SEXUAL",
    rawSurveyData,
    typeof rawSurveyData.gender === "string" ? rawSurveyData.gender : "female"
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Flower2 className="w-5 h-5 text-rose-600" />
          Women&apos;s Wellness
          <Badge className="bg-rose-100 text-rose-800 border-rose-200">Women&apos;s Health</Badge>
        </CardTitle>
        <CardDescription>
          Captured from the women&apos;s wellness / menopause assessment quiz.
        </CardDescription>
        {submittedAt && (
          <p className="text-sm text-muted-foreground">
            Quiz completed:{" "}
            <span className="font-medium text-foreground">
              {formatQuizCompletedDate(submittedAt)}
            </span>
          </p>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid gap-3">
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No assessment answers recorded.</p>
          ) : (
            rows.map((row) => (
              <div key={row.questionId} className="rounded-lg border bg-muted/20 p-3">
                <p className="text-xs text-muted-foreground">{row.question}</p>
                <p className="mt-1 font-medium">{row.answerLabel}</p>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
