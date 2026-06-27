"use client";

import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClipboardList } from "lucide-react";
import {
  groupPortalQuizSubmissionsByProgram,
  quizAssessmentProgramTabLabel,
  resolveQuizAssessmentProgramTabs,
} from "@/lib/portal-quiz-display";
import { PortalQuizSubmissionCard } from "@/components/admin/quiz-assessment/PortalQuizSubmissionCard";
import {
  MemberWeightManagementAssessment,
  type WeightManagementAssessmentData,
} from "@/components/admin/quiz-assessment/MemberWeightManagementAssessment";
import { MemberHairLossQuestionnaire } from "@/components/admin/quiz-assessment/MemberHairLossQuestionnaire";

import type { PortalQuizSubmissionView } from "@/components/admin/quiz-assessment/types";

export type { PortalQuizSubmissionView };

type MemberQuizAssessmentTabsProps = {
  submissions: PortalQuizSubmissionView[];
  memberGender?: string | null;
  assessment?: WeightManagementAssessmentData | null;
  bmi?: string | null;
  rawSurveyData?: Record<string, unknown> | null;
  isHairLossQuestionnaire?: boolean;
  assessmentSubmittedAt?: string | null;
};

export function MemberQuizAssessmentTabs({
  submissions,
  memberGender,
  assessment,
  bmi = null,
  rawSurveyData,
  isHairLossQuestionnaire = false,
  assessmentSubmittedAt,
}: MemberQuizAssessmentTabsProps) {
  const groupedSubmissions = useMemo(
    () => groupPortalQuizSubmissionsByProgram(submissions),
    [submissions]
  );

  const programTabs = useMemo(
    () =>
      resolveQuizAssessmentProgramTabs({
        portalSubmissions: submissions,
        hasWeightManagementAssessment: Boolean(assessment),
        hasHairLegacyQuestionnaire: Boolean(isHairLossQuestionnaire && rawSurveyData),
      }),
    [submissions, assessment, isHairLossQuestionnaire, rawSurveyData]
  );

  const defaultTab = programTabs[0] ?? "empty";

  if (programTabs.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <ClipboardList className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-muted-foreground">No quiz assessments yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Quiz answers from the member portal and public website assessments appear here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <ClipboardList className="h-5 w-5" />
          Quiz assessment
        </CardTitle>
        <CardDescription>
          Program quiz results for doctor consultation — separate from lab pathology results in the
          Lab Results tab. Latest attempt shown first when a quiz was completed more than once.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={defaultTab}>
          <TabsList className="mb-4 flex h-auto w-full flex-wrap justify-start gap-1">
            {programTabs.map((programKey) => {
              const attemptCount = groupedSubmissions.get(programKey)?.length ?? 0;
              const showLegacyOnly =
                programKey === "WEIGHT_MANAGEMENT"
                  ? Boolean(assessment) && attemptCount === 0
                  : programKey === "HAIR_LOSS"
                    ? Boolean(isHairLossQuestionnaire && rawSurveyData) && attemptCount === 0
                    : false;

              return (
                <TabsTrigger key={programKey} value={programKey} className="text-xs sm:text-sm">
                  {quizAssessmentProgramTabLabel(programKey)}
                  {attemptCount > 1 && (
                    <span className="ml-1.5 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700">
                      {attemptCount}
                    </span>
                  )}
                  {showLegacyOnly && (
                    <span className="ml-1.5 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-800">
                      1
                    </span>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {programTabs.map((programKey) => {
            const programSubmissions = groupedSubmissions.get(programKey) ?? [];

            return (
              <TabsContent key={programKey} value={programKey} className="space-y-4">
                {programKey === "WEIGHT_MANAGEMENT" && assessment && (
                  <MemberWeightManagementAssessment assessment={assessment} bmi={bmi} />
                )}

                {programSubmissions.map((submission, index) => (
                  <PortalQuizSubmissionCard
                    key={submission.id}
                    submission={submission}
                    memberGender={memberGender}
                    attemptIndex={index}
                  />
                ))}

                {programKey === "HAIR_LOSS" &&
                  isHairLossQuestionnaire &&
                  rawSurveyData &&
                  programSubmissions.length === 0 && (
                    <MemberHairLossQuestionnaire
                      rawSurveyData={rawSurveyData}
                      submittedAt={assessmentSubmittedAt}
                    />
                  )}
              </TabsContent>
            );
          })}
        </Tabs>
      </CardContent>
    </Card>
  );
}

/** @deprecated Use MemberQuizAssessmentTabs */
export const MemberProgramQuizTabs = MemberQuizAssessmentTabs;
