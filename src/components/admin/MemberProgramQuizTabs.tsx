"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClipboardList } from "lucide-react";
import {
  PORTAL_QUIZ_TAB_ORDER,
  extractPortalQuizResultSummary,
  formatPortalQuizAnswers,
  portalQuizTabLabel,
} from "@/lib/portal-quiz-display";

export type PortalQuizSubmissionView = {
  id: string;
  programKey: string;
  answers: Record<string, unknown>;
  result?: unknown;
  intent?: string | null;
  source?: string;
  submittedAt: string;
};

export function MemberProgramQuizTabs({
  submissions,
  memberGender,
}: {
  submissions: PortalQuizSubmissionView[];
  memberGender?: string | null;
}) {
  if (!submissions.length) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <ClipboardList className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-muted-foreground">No in-portal program quizzes yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Quiz answers from the member portal appear here (not under Lab Results).
          </p>
        </CardContent>
      </Card>
    );
  }

  const ordered = [...submissions].sort((a, b) => {
    const ai = PORTAL_QUIZ_TAB_ORDER.indexOf(a.programKey as (typeof PORTAL_QUIZ_TAB_ORDER)[number]);
    const bi = PORTAL_QUIZ_TAB_ORDER.indexOf(b.programKey as (typeof PORTAL_QUIZ_TAB_ORDER)[number]);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  const defaultTab = ordered[0]?.programKey ?? "quiz-0";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <ClipboardList className="h-5 w-5" />
          In-portal program quizzes
        </CardTitle>
        <CardDescription>
          In-portal quiz answers for doctor consultation — separate from lab pathology results in the Lab Results tab.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={defaultTab}>
          <TabsList className="mb-4 flex h-auto w-full flex-wrap justify-start gap-1">
            {ordered.map((sub) => (
              <TabsTrigger key={sub.programKey} value={sub.programKey} className="text-xs sm:text-sm">
                {portalQuizTabLabel(sub.programKey)}
              </TabsTrigger>
            ))}
          </TabsList>

          {ordered.map((sub) => {
            const rows = formatPortalQuizAnswers(
              sub.programKey,
              sub.answers,
              memberGender
            );
            const parsed = extractPortalQuizResultSummary(sub.result);
            const submitted = new Date(sub.submittedAt).toLocaleString("en-AU", {
              dateStyle: "medium",
              timeStyle: "short",
            });

            return (
              <TabsContent key={sub.programKey} value={sub.programKey} className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{portalQuizTabLabel(sub.programKey)}</Badge>
                  {sub.intent && <Badge variant="secondary">{sub.intent.replace(/_/g, " ")}</Badge>}
                  <span className="text-xs text-muted-foreground">Submitted {submitted}</span>
                </div>

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
              </TabsContent>
            );
          })}
        </Tabs>
      </CardContent>
    </Card>
  );
}
