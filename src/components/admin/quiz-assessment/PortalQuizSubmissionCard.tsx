"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  extractPortalQuizResultSummary,
  formatPortalQuizAnswers,
  formatQuizCompletedDate,
  portalQuizTabLabel,
} from "@/lib/portal-quiz-display";
import type { PortalQuizSubmissionView } from "@/components/admin/quiz-assessment/types";

export function PortalQuizSubmissionCard({
  submission,
  memberGender,
  attemptIndex,
}: {
  submission: PortalQuizSubmissionView;
  memberGender?: string | null;
  attemptIndex: number;
}) {
  const rows = formatPortalQuizAnswers(
    submission.programKey,
    submission.answers,
    memberGender
  );
  const parsed = extractPortalQuizResultSummary(submission.result);
  const completedLabel = formatQuizCompletedDate(submission.submittedAt);

  return (
    <Card className={attemptIndex === 0 ? "border-emerald-200" : undefined}>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="text-base">{portalQuizTabLabel(submission.programKey)}</CardTitle>
          {attemptIndex === 0 && (
            <Badge className="bg-emerald-100 text-emerald-800">Latest</Badge>
          )}
          {submission.intent && (
            <Badge variant="secondary">{submission.intent.replace(/_/g, " ")}</Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Quiz completed: <span className="font-medium text-foreground">{completedLabel}</span>
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {parsed.suggestedPanel && (
          <p className="text-sm">
            <span className="font-medium">Suggested panel:</span>{" "}
            <span className="capitalize">{parsed.suggestedPanel}</span>
          </p>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          {rows.map((row) => (
            <div key={row.questionId} className="rounded-lg border bg-muted/20 p-3">
              <p className="text-xs text-muted-foreground">{row.question}</p>
              <p className="mt-1 font-medium">{row.answerLabel}</p>
            </div>
          ))}
        </div>

        {parsed.sections.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-medium">Clinical indications</p>
            {parsed.sections.map((section, i) => (
              <div key={i} className="rounded-lg border p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">{section.categoryName}</p>
                  {section.priority && (
                    <Badge
                      className={
                        section.priority === "high"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-slate-100 text-slate-700"
                      }
                    >
                      {section.priority}
                    </Badge>
                  )}
                </div>
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                  {(section.clinicalIndications ?? []).map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
                {(section.medicareNotes ?? []).length > 0 && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Medicare: {(section.medicareNotes ?? []).join(" · ")}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {parsed.summary && (
          <div className="rounded-lg border bg-slate-50 p-3">
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Doctor summary
            </p>
            <pre className="whitespace-pre-wrap text-xs leading-relaxed text-slate-700">
              {parsed.summary}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
