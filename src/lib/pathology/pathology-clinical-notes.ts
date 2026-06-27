import type { ProgramEssentialSlug } from "@/lib/program-essential-panels";
import {
  BLOOD_TEST_CATALOG,
  type BloodTestCatalogEntry,
} from "@/lib/pathology/blood-test-catalog";
import type { PathologyPanelSlug } from "@/lib/pathology/pathology-program-panels";
import {
  deriveBiomarkersQuizResult,
  type BiomarkersSectionId,
  type CategoryRecommendation,
} from "@/lib/programs/quizzes/biomarkers-intake-quiz";
import { deriveOrganCareQuizResult } from "@/lib/programs/quizzes/organ-care-intake-quiz";

type QuizSubmissionLike = {
  programKey: string;
  answers: unknown;
  result: unknown;
};

const TEST_TO_BIOMARKERS_SECTION: Partial<Record<string, BiomarkersSectionId>> = {
  full_blood_count: "nutrients",
  iron_studies: "nutrients",
  vitamin_d: "nutrients",
  vitamin_b12_folate: "nutrients",
  zinc: "nutrients",
  crp: "nutrients",
  lipid_panel: "heart",
  hba1c: "metabolic",
  fasting_glucose: "metabolic",
  fasting_insulin: "metabolic",
  thyroid: "thyroid",
  liver_function: "liver",
  kidney_function: "kidney",
  male_hormone_panel: "hormones",
  female_hormone_panel: "hormones",
  cortisol: "hormones",
  dhea_s: "hormones",
};

const PANEL_TO_QUIZ_PROGRAM_KEYS: Record<PathologyPanelSlug, string[]> = {
  WEIGHT_MANAGEMENT: ["WEIGHT_MANAGEMENT"],
  HAIR_LOSS: ["HAIR_LOSS"],
  MENS_HEALTH: ["MENS_HEALTH_VITALITY", "MENS_HEALTH_SEXUAL", "MENS_HEALTH"],
  WOMENS_HEALTH: ["WOMENS_HEALTH_VITALITY", "WOMENS_HEALTH_SEXUAL", "WOMENS_HEALTH"],
  ORGAN_CARE: ["ORGAN_CARE"],
  BIOMARKERS_ESSENTIAL: ["BIOLOGICAL_CLOCK", "ORGAN_CARE"],
  BIOMARKERS_COMPLETE: ["BIOLOGICAL_CLOCK", "ORGAN_CARE"],
};

const PROGRAM_ESSENTIAL_SLUGS = new Set<string>([
  "WEIGHT_MANAGEMENT",
  "HAIR_LOSS",
  "MENS_HEALTH",
  "WOMENS_HEALTH",
]);

function testRequiresMedicareIndication(testId: string): boolean {
  return Boolean(BLOOD_TEST_CATALOG[testId]?.mbsItems?.length);
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.map((v) => v.trim()).filter(Boolean))];
}

function deriveQuizSections(submission: QuizSubmissionLike): CategoryRecommendation[] {
  if (submission.result && typeof submission.result === "object") {
    const result = submission.result as Record<string, unknown>;
    if (Array.isArray(result.sections)) {
      return (result.sections as CategoryRecommendation[]).filter(
        (section) => typeof section.sectionId === "string"
      );
    }
  }

  if (typeof submission.answers !== "object" || !submission.answers) {
    return [];
  }

  const answers = submission.answers as Record<string, string>;
  if (submission.programKey === "ORGAN_CARE") {
    return deriveOrganCareQuizResult(answers).sections;
  }
  if (submission.programKey === "BIOLOGICAL_CLOCK") {
    return deriveBiomarkersQuizResult(answers).sections;
  }

  return [];
}

function indicationsForSection(
  submissions: QuizSubmissionLike[],
  sectionId: BiomarkersSectionId
): string[] {
  const found: string[] = [];
  for (const submission of submissions) {
    for (const section of deriveQuizSections(submission)) {
      if (section.sectionId === sectionId) {
        found.push(...(section.clinicalIndications ?? []));
      }
    }
  }
  return uniqueStrings(found);
}

function intakeIndicationsForTest(
  testId: string,
  intakeData: Record<string, unknown> | null | undefined
): string[] {
  if (!intakeData) return [];

  const metabolic = ((intakeData.metabolicConditions as string[]) || []).filter(Boolean);
  const cardiovascular = ((intakeData.cardiovascularConditions as string[]) || []).filter(
    Boolean
  );
  const digestive = ((intakeData.digestiveConditions as string[]) || []).filter(Boolean);
  const serious = ((intakeData.seriousConditions as string[]) || []).filter(
    (c) => c && c !== "None of these apply"
  );

  switch (testId) {
    case "hba1c":
    case "fasting_glucose":
      return metabolic.length
        ? [`Metabolic history: ${metabolic.join(", ")}`]
        : [];
    case "fasting_insulin":
      return metabolic.length
        ? [`Insulin resistance assessment — ${metabolic.join(", ")}`]
        : [];
    case "lipid_panel":
      return cardiovascular.length
        ? [`Cardiovascular risk — ${cardiovascular.join(", ")}`]
        : metabolic.length
          ? [`Metabolic risk — lipid assessment (${metabolic.join(", ")})`]
          : [];
    case "liver_function":
      return digestive.length
        ? [`Hepatic assessment — ${digestive.join(", ")}`]
        : [];
    case "kidney_function":
      return serious.length
        ? [`Renal monitoring — ${serious.join(", ")}`]
        : metabolic.some((c) => /diabetes|kidney|renal/i.test(c))
          ? [`Renal function — ${metabolic.join(", ")}`]
          : [];
    case "thyroid":
      return metabolic.some((c) => /thyroid/i.test(c))
        ? [`Thyroid assessment — ${metabolic.join(", ")}`]
        : [];
    case "full_blood_count":
    case "iron_studies":
      return serious.length
        ? [`General health screen — ${serious.join(", ")}`]
        : [];
    case "male_hormone_panel":
    case "female_hormone_panel":
    case "cortisol":
    case "dhea_s":
      return serious.length || metabolic.length
        ? [
            `Hormonal assessment — ${uniqueStrings([...serious, ...metabolic]).join(", ")}`,
          ]
        : [];
    default:
      return [];
  }
}

function resolveRelevantSubmissions(
  panelSlugs: PathologyPanelSlug[],
  submissions: QuizSubmissionLike[]
): QuizSubmissionLike[] {
  const keys = new Set<string>();
  for (const slug of panelSlugs) {
    for (const key of PANEL_TO_QUIZ_PROGRAM_KEYS[slug] ?? []) {
      keys.add(key);
    }
  }

  if (keys.size === 0) {
    return submissions;
  }

  return submissions.filter((s) => keys.has(s.programKey));
}

function stripTestNameFromIndication(indication: string): string {
  return indication
    .replace(/\s*[—–-]\s*(?:HbA1c|lipid panel|TSH|LFT|FBC|U&E|CRP|fasting glucose|fasting insulin|HOMA-IR|iron studies|thyroid panel|hormone panel|androgen deficiency symptoms)[^.]*\.?$/i, "")
    .replace(/\s*[—–-]\s*consider free T4\s*\/\s*free T3\.?$/i, "")
    .replace(/\s*[—–-]\s*fasting insulin\s*&\s*HOMA-IR\.?$/i, "")
    .trim();
}

export function buildMedicareClinicalNotesFromAssessment(options: {
  testIds: string[];
  panelSlugs?: PathologyPanelSlug[];
  quizSubmissions?: QuizSubmissionLike[];
  intakeDataList?: unknown[];
}): string {
  const medicareTestIds = options.testIds.filter(testRequiresMedicareIndication);
  if (medicareTestIds.length === 0) return "";

  const panelSlugs = options.panelSlugs ?? [];
  const submissions = resolveRelevantSubmissions(
    panelSlugs,
    options.quizSubmissions ?? []
  );

  const intakeRecords = (options.intakeDataList ?? []).filter(
    (data): data is Record<string, unknown> =>
      Boolean(data) && typeof data === "object"
  );

  const indicationLines = new Set<string>();

  for (const testId of medicareTestIds) {
    const test = BLOOD_TEST_CATALOG[testId];
    if (!test?.mbsItems?.length) continue;

    const sectionId = TEST_TO_BIOMARKERS_SECTION[testId];
    let indications: string[] = [];

    if (sectionId) {
      indications = indicationsForSection(submissions, sectionId);
    }

    if (indications.length === 0) {
      for (const intake of intakeRecords) {
        indications.push(...intakeIndicationsForTest(testId, intake));
      }
      indications = uniqueStrings(indications);
    }

    for (const raw of indications) {
      const cleaned = stripTestNameFromIndication(raw);
      if (cleaned) indicationLines.add(cleaned);
    }
  }

  return [...indicationLines].join("\n").trim();
}

export function buildPathologyIndicationNotes(options: {
  programSlugs: PathologyPanelSlug[];
  testIds: string[];
  customTests?: string;
  telehealthLine?: string;
  quizSubmissions?: QuizSubmissionLike[];
  intakeDataList?: unknown[];
}): string {
  const medicareNotes = buildMedicareClinicalNotesFromAssessment({
    testIds: options.testIds,
    panelSlugs: options.programSlugs,
    quizSubmissions: options.quizSubmissions,
    intakeDataList: options.intakeDataList,
  });

  if (medicareNotes) {
    return medicareNotes;
  }

  return "";
}

/** Map program essential slug to likely intake program keys in member records. */
export function programSlugUsesIntakeFallback(slug: PathologyPanelSlug): slug is ProgramEssentialSlug {
  return PROGRAM_ESSENTIAL_SLUGS.has(slug);
}
