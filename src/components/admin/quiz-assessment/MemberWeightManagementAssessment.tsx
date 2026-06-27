"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  AlertTriangle,
  Brain,
  ClipboardList,
  Flame,
  Heart,
  Pill,
  Scale,
  Target,
  Utensils,
} from "lucide-react";
import { renderConditionBadges } from "@/components/admin/quiz-assessment/render-condition-badges";

export type WeightManagementAssessmentData = {
  weightLossGoal: string;
  currentWeight: string;
  targetWeight: string;
  height: string;
  motivations: string[];
  otherGoals: string[];
  howHeard: string;
  submittedAt: string;
  metabolicConditions: string[];
  digestiveConditions: string[];
  cardiovascularConditions: string[];
  mentalHealthConditions: string[];
  seriousConditions: string[];
  currentMedications: string[];
};

export function MemberWeightManagementAssessment({
  assessment,
  bmi,
}: {
  assessment: WeightManagementAssessmentData;
  bmi: string | null;
}) {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Scale className="w-5 h-5" />
            Weight Management Goals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 bg-muted/30 rounded-lg">
              <p className="text-xs text-muted-foreground">Current Weight</p>
              <p className="text-xl font-bold">{assessment.currentWeight || "—"} kg</p>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg">
              <p className="text-xs text-muted-foreground">Target Weight</p>
              <p className="text-xl font-bold">{assessment.targetWeight || "—"} kg</p>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg">
              <p className="text-xs text-muted-foreground">Height</p>
              <p className="text-xl font-bold">{assessment.height || "—"} cm</p>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg">
              <p className="text-xs text-muted-foreground">BMI</p>
              <p className="text-xl font-bold">{bmi || "—"}</p>
              {bmi && (
                <Badge
                  className={`text-xs mt-1 ${
                    parseFloat(bmi) >= 30
                      ? "bg-red-100 text-red-700"
                      : parseFloat(bmi) >= 27
                        ? "bg-orange-100 text-orange-700"
                        : parseFloat(bmi) >= 25
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-green-100 text-green-700"
                  }`}
                >
                  {parseFloat(bmi) >= 30
                    ? "Obese"
                    : parseFloat(bmi) >= 27
                      ? "Overweight"
                      : parseFloat(bmi) >= 25
                        ? "Slightly Overweight"
                        : "Healthy"}
                </Badge>
              )}
            </div>
          </div>
          {assessment.weightLossGoal && (
            <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
              <p className="text-sm font-medium flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                Weight Loss Goal:{" "}
                <span className="text-primary">{assessment.weightLossGoal}</span>
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ClipboardList className="w-5 h-5" />
            Medical History
          </CardTitle>
          <CardDescription>Conditions reported during health assessment</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="flex items-center gap-2 mb-2">
              <Flame className="w-4 h-4 text-orange-500" />
              Metabolic Conditions
            </Label>
            {renderConditionBadges(assessment.metabolicConditions, "bg-orange-50 text-orange-700")}
          </div>
          <Separator />
          <div>
            <Label className="flex items-center gap-2 mb-2">
              <Utensils className="w-4 h-4 text-green-500" />
              Digestive Conditions
            </Label>
            {renderConditionBadges(assessment.digestiveConditions, "bg-green-50 text-green-700")}
          </div>
          <Separator />
          <div>
            <Label className="flex items-center gap-2 mb-2">
              <Heart className="w-4 h-4 text-red-500" />
              Cardiovascular Conditions
            </Label>
            {renderConditionBadges(
              assessment.cardiovascularConditions,
              "bg-red-50 text-red-700"
            )}
          </div>
          <Separator />
          <div>
            <Label className="flex items-center gap-2 mb-2">
              <Brain className="w-4 h-4 text-purple-500" />
              Mental Health Conditions
            </Label>
            {renderConditionBadges(
              assessment.mentalHealthConditions,
              "bg-purple-50 text-purple-700"
            )}
          </div>
          {assessment.seriousConditions &&
            assessment.seriousConditions.filter(
              (c) => c && !c.toLowerCase().includes("none")
            ).length > 0 && (
              <>
                <Separator />
                <div>
                  <Label className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    Serious Conditions / Contraindications
                  </Label>
                  {renderConditionBadges(assessment.seriousConditions, "bg-red-100 text-red-800")}
                </div>
              </>
            )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Pill className="w-5 h-5" />
            Current Medications
          </CardTitle>
        </CardHeader>
        <CardContent>
          {renderConditionBadges(assessment.currentMedications, "bg-blue-50 text-blue-700")}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="w-5 h-5" />
            Motivations & Goals
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="mb-2">Primary Motivations</Label>
            {renderConditionBadges(assessment.motivations, "bg-primary/10 text-primary")}
          </div>
          {assessment.otherGoals &&
            assessment.otherGoals.filter((g) => g && g !== "none").length > 0 && (
              <div>
                <Label className="mb-2">Other Health Goals</Label>
                {renderConditionBadges(assessment.otherGoals, "bg-amber-50 text-amber-700")}
              </div>
            )}
          {assessment.howHeard && (
            <div className="pt-2">
              <p className="text-sm text-muted-foreground">
                How they heard about us:{" "}
                <span className="font-medium text-foreground">{assessment.howHeard}</span>
              </p>
            </div>
          )}
          {assessment.submittedAt && (
            <p className="text-sm text-muted-foreground">
              Quiz completed:{" "}
              <span className="font-medium text-foreground">
                {new Date(assessment.submittedAt).toLocaleString("en-AU", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </span>
            </p>
          )}
        </CardContent>
      </Card>
    </>
  );
}
