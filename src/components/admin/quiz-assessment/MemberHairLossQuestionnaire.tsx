"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";
import {
  formatPortalQuizAnswers,
  formatQuizCompletedDate,
} from "@/lib/portal-quiz-display";

export function MemberHairLossQuestionnaire({
  rawSurveyData,
  submittedAt,
}: {
  rawSurveyData: Record<string, unknown>;
  submittedAt?: string | null;
}) {
  const rows = formatPortalQuizAnswers(
    "HAIR_LOSS",
    rawSurveyData,
    typeof rawSurveyData.gender === "string" ? rawSurveyData.gender : null
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-600" />
          Hair health
          <Badge className="bg-amber-100 text-amber-800 border-amber-200">Hair health</Badge>
        </CardTitle>
        <CardDescription>Captured from the hair assessment quiz.</CardDescription>
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
          {rows.map((row) => (
            <div key={row.questionId} className="rounded-lg border bg-muted/20 p-3">
              <p className="text-xs text-muted-foreground">{row.question}</p>
              <p className="mt-1 font-medium">{row.answerLabel}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
