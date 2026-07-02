/**
 * Tier-filtered clinical quiz for public biomarkers checkout.
 * Medicare eligibility badges are stored in the quiz result for admin/doctor review only.
 */

import { getMedicareEligibility, type MedicareEligibility } from "@/lib/biomarker-medicare-eligibility";
import type { BiomarkerSubscriptionTier } from "@/lib/biomarkers/public-subscription-panels";
import { getBiomarkerTierMarkerIds } from "@/lib/biomarkers/public-subscription-panels";
import {
  deriveBiomarkersQuizResult,
  getBiomarkersQuizQuestions,
  isBiomarkersQuestionAnswered,
  type BiomarkersQuizQuestion,
  type BiomarkersQuizResult,
} from "@/lib/programs/quizzes/biomarkers-intake-quiz";
import { getBiomarkerFromPanel } from "@/data/bloodPanelConfig";

export type PanelMedicareTestRow = {
  biomarkerId: string;
  name: string;
  eligibility: MedicareEligibility;
  eligibilityLabel: string;
};

export type PublicBiomarkersPanelQuizResult = BiomarkersQuizResult & {
  publicPanelTier: BiomarkerSubscriptionTier;
  panelMedicareBreakdown: PanelMedicareTestRow[];
};

const ESSENTIAL_QUESTION_IDS = new Set([
  "clinicalSex",
  "primaryGoal",
  "heartRisk",
  "metabolicRisk",
  "thyroidSymptoms",
  "kidneyRisk",
  "liverRisk",
  "lastBloods",
]);

const ADVANCED_QUESTION_IDS = new Set([
  ...ESSENTIAL_QUESTION_IDS,
  "hormoneConcerns",
  "nutrientsInflammation",
]);

function markerDisplayName(id: string): string {
  return getBiomarkerFromPanel(id)?.biomarker.name ?? id.replace(/_/g, " ");
}

export function buildPanelMedicareBreakdown(
  tier: BiomarkerSubscriptionTier
): PanelMedicareTestRow[] {
  const ids = [...getBiomarkerTierMarkerIds(tier)].sort();
  return ids
    .map((biomarkerId) => {
      const info = getMedicareEligibility(biomarkerId);
      if (info.type === "derived") return null;
      return {
        biomarkerId,
        name: markerDisplayName(biomarkerId),
        eligibility: info.type,
        eligibilityLabel: info.label,
      };
    })
    .filter((row): row is PanelMedicareTestRow => row !== null);
}

export function getPublicBiomarkersPanelQuizQuestions(
  tier: BiomarkerSubscriptionTier,
  profileGender?: string | null,
  answers?: Record<string, string>
): BiomarkersQuizQuestion[] {
  const allowedIds =
    tier === "essential"
      ? ESSENTIAL_QUESTION_IDS
      : tier === "advanced"
        ? ADVANCED_QUESTION_IDS
        : null;

  const all = getBiomarkersQuizQuestions(profileGender, answers);
  if (!allowedIds) return all;
  return all.filter((q) => allowedIds.has(q.id));
}

export function publicBiomarkersQuizMissingAnswers(
  tier: BiomarkerSubscriptionTier,
  profileGender?: string | null,
  answers?: Record<string, string>
): string[] {
  const questions = getPublicBiomarkersPanelQuizQuestions(tier, profileGender, answers);
  return questions
    .filter((question) => !isBiomarkersQuestionAnswered(question, answers?.[question.id]))
    .map((question) => question.id);
}

export function derivePublicBiomarkersPanelQuizResult(
  tier: BiomarkerSubscriptionTier,
  answers: Record<string, string>,
  profileGender?: string | null
): PublicBiomarkersPanelQuizResult {
  const base = deriveBiomarkersQuizResult(answers, profileGender);
  const panelMedicareBreakdown = buildPanelMedicareBreakdown(tier);

  return {
    ...base,
    publicPanelTier: tier,
    suggestedPanel:
      tier === "essential" ? "essential" : tier === "advanced" ? "extended" : "comprehensive",
    panelMedicareBreakdown,
  };
}
