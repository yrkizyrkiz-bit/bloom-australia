"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Sparkles } from "lucide-react";
import { renderConditionBadges } from "@/components/admin/quiz-assessment/render-condition-badges";
import { formatQuizCompletedDate } from "@/lib/portal-quiz-display";

export function MemberHairLossQuestionnaire({
  rawSurveyData,
  submittedAt,
}: {
  rawSurveyData: Record<string, unknown>;
  submittedAt?: string | null;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-600" />
          Hair Loss Questionnaire
          <Badge className="bg-amber-100 text-amber-800 border-amber-200">Hair Loss</Badge>
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
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3 bg-muted/30 rounded-lg">
            <p className="text-xs text-muted-foreground">Hair stage</p>
            <p className="font-medium">{(rawSurveyData.hairStage as string) || "—"}</p>
          </div>
          <div className="p-3 bg-muted/30 rounded-lg">
            <p className="text-xs text-muted-foreground">Timeline</p>
            <p className="font-medium">{(rawSurveyData.hairLossTimeline as string) || "—"}</p>
          </div>
          <div className="p-3 bg-muted/30 rounded-lg">
            <p className="text-xs text-muted-foreground">Family history</p>
            <p className="font-medium">{(rawSurveyData.familyHistory as string) || "—"}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Medical considerations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="mb-2">Conditions</Label>
                {renderConditionBadges(
                  (rawSurveyData.medicalConditions as string[]) || [],
                  "bg-blue-50 text-blue-700"
                )}
              </div>
              {(rawSurveyData.gender as string) === "female" && (
                <div>
                  <Label className="mb-2">Pregnancy status</Label>
                  <Badge variant="outline">
                    {(rawSurveyData.pregnancyStatus as string) || "—"}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Care context</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="mb-2">Other concerns</Label>
                {renderConditionBadges(
                  (rawSurveyData.otherConcerns as string[]) || [],
                  "bg-amber-50 text-amber-700"
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                Plan:{" "}
                <span className="font-medium text-foreground">
                  $49 first month, then $79/month if approved
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}
