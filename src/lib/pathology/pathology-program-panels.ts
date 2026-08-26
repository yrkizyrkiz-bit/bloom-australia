import type { ProgramEssentialSlug } from "@/lib/program-essential-panels";
import {
  PROGRAM_ESSENTIAL_PANELS,
  getProgramEssentialPanel,
  resolveDefaultProgramFromTier,
} from "@/lib/program-essential-panels";
import {
  BLOOD_TEST_CATALOG,
  catalogTestsRequireFasting,
  stripCalculatedMarkerPhrases,
} from "@/lib/pathology/blood-test-catalog";
import { buildPathologyIndicationNotes as buildMedicareClinicalNotes } from "@/lib/pathology/pathology-clinical-notes";

export type PathologyPatientGender = "male" | "female";

/** Extended panel slugs for pathology referrals (programs + organ/biomarker products). */
export type PathologyPanelSlug =
  | ProgramEssentialSlug
  | "ORGAN_CARE"
  | "BIOMARKERS_ESSENTIAL"
  | "BIOMARKERS_COMPLETE";

export const ALL_PATHOLOGY_PROGRAM_SLUGS: ProgramEssentialSlug[] = [
  "WEIGHT_MANAGEMENT",
  "HAIR_LOSS",
  "MENS_HEALTH",
  "WOMENS_HEALTH",
];

export type OrganBiomarkerPanelSlug =
  | "ORGAN_CARE"
  | "BIOMARKERS_ESSENTIAL"
  | "BIOMARKERS_COMPLETE";

export const ORGAN_BIOMARKER_PANEL_SLUGS: OrganBiomarkerPanelSlug[] = [
  "ORGAN_CARE",
  "BIOMARKERS_ESSENTIAL",
  "BIOMARKERS_COMPLETE",
];

export const ALL_PATHOLOGY_PANEL_SLUGS: PathologyPanelSlug[] = [
  ...ALL_PATHOLOGY_PROGRAM_SLUGS,
  ...ORGAN_BIOMARKER_PANEL_SLUGS,
];

const BASELINE_PATHOLOGY_TESTS = [
  "full_blood_count",
  "liver_function",
  "kidney_function",
  "vitamin_d",
] as const;

const BIOMARKERS_ESSENTIAL_TESTS = [
  ...BASELINE_PATHOLOGY_TESTS,
  "lipid_panel",
  "fasting_glucose",
  "hba1c",
  "thyroid",
  "iron_studies",
  "crp",
] as const;

const ORGAN_CARE_TESTS = [
  ...BASELINE_PATHOLOGY_TESTS,
  "lipid_panel",
  "fasting_glucose",
  "hba1c",
  "thyroid",
  "iron_studies",
  "male_hormone_panel",
  "female_hormone_panel",
  "crp",
  "cortisol",
] as const;

const BIOMARKERS_COMPLETE_TESTS = [
  ...BIOMARKERS_ESSENTIAL_TESTS,
  "fasting_insulin",
  "male_hormone_panel",
  "female_hormone_panel",
  "cortisol",
  "dhea_s",
  "vitamin_b12_folate",
  "zinc",
] as const;

/** Pathology test IDs ordered per Sanative program Essential panel. */
export const PATHOLOGY_TESTS_BY_PROGRAM: Record<ProgramEssentialSlug, readonly string[]> = {
  WEIGHT_MANAGEMENT: [
    ...BASELINE_PATHOLOGY_TESTS,
    "fasting_glucose",
    "hba1c",
    "fasting_insulin",
    "lipid_panel",
    "thyroid",
    "crp",
  ],
  HAIR_LOSS: [
    ...BASELINE_PATHOLOGY_TESTS,
    "thyroid",
    "iron_studies",
    "vitamin_b12_folate",
    "zinc",
    "male_hormone_panel",
    "female_hormone_panel",
  ],
  MENS_HEALTH: [
    ...BASELINE_PATHOLOGY_TESTS,
    "lipid_panel",
    "fasting_glucose",
    "hba1c",
    "male_hormone_panel",
    "cortisol",
    "dhea_s",
    "crp",
  ],
  WOMENS_HEALTH: [
    ...BASELINE_PATHOLOGY_TESTS,
    "thyroid",
    "iron_studies",
    "female_hormone_panel",
    "fasting_glucose",
    "hba1c",
    "fasting_insulin",
    "lipid_panel",
    "crp",
  ],
};

export const PATHOLOGY_TESTS_BY_PANEL: Record<PathologyPanelSlug, readonly string[]> = {
  ...PATHOLOGY_TESTS_BY_PROGRAM,
  ORGAN_CARE: ORGAN_CARE_TESTS,
  BIOMARKERS_ESSENTIAL: BIOMARKERS_ESSENTIAL_TESTS,
  BIOMARKERS_COMPLETE: BIOMARKERS_COMPLETE_TESTS,
};

const ORGAN_BIOMARKER_PANEL_META: Record<
  OrganBiomarkerPanelSlug,
  { label: string; shortLabel: string; description: string }
> = {
  ORGAN_CARE: {
    label: "Organ & Metabolic Care",
    shortLabel: "Organ Care",
    description:
      "Heart, liver, kidney, thyroid, hormones and metabolic markers, full organ health review.",
  },
  BIOMARKERS_ESSENTIAL: {
    label: "Biomarkers Essential",
    shortLabel: "Essential",
    description:
      "Core biomarker panel, metabolic, cardiovascular, thyroid, liver, kidney and nutrient markers.",
  },
  BIOMARKERS_COMPLETE: {
    label: "Biomarkers Complete",
    shortLabel: "Complete",
    description:
      "Full biomarker audit, essential panel plus hormones, insulin resistance and extended nutrients.",
  },
};

export function getPathologyPanelMeta(slug: PathologyPanelSlug) {
  if (ORGAN_BIOMARKER_PANEL_SLUGS.includes(slug as OrganBiomarkerPanelSlug)) {
    return ORGAN_BIOMARKER_PANEL_META[slug as OrganBiomarkerPanelSlug];
  }
  return getProgramEssentialPanel(slug as ProgramEssentialSlug);
}

export function normalizePatientGender(gender?: string | null): PathologyPatientGender {
  return gender?.toLowerCase() === "female" ? "female" : "male";
}

export function resolvePathologyTestsForPanels(
  panelSlugs: PathologyPanelSlug[],
  gender: PathologyPatientGender
): string[] {
  const tests = new Set<string>();

  for (const slug of panelSlugs) {
    for (const testId of PATHOLOGY_TESTS_BY_PANEL[slug]) {
      if (testId === "male_hormone_panel" && gender === "female") continue;
      if (testId === "female_hormone_panel" && gender === "male") continue;
      tests.add(testId);
    }
  }

  return [...tests];
}

/** @deprecated Use resolvePathologyTestsForPanels */
export function resolvePathologyTestsForPrograms(
  programSlugs: ProgramEssentialSlug[],
  gender: PathologyPatientGender
): string[] {
  return resolvePathologyTestsForPanels(programSlugs, gender);
}

export function mergePathologyTestIds(
  panelSlugs: PathologyPanelSlug[],
  gender: PathologyPatientGender,
  additionalTestIds: string[] = []
): string[] {
  const merged = new Set([
    ...resolvePathologyTestsForPanels(panelSlugs, gender),
    ...additionalTestIds,
  ]);
  return [...merged].filter((id) => Boolean(BLOOD_TEST_CATALOG[id]));
}

export function buildPathologyIndicationNotes(options: {
  programSlugs: PathologyPanelSlug[];
  testIds: string[];
  customTests?: string;
  telehealthLine?: string;
  quizSubmissions?: Array<{ programKey: string; answers: unknown; result: unknown }>;
  intakeDataList?: unknown[];
}): string {
  return buildMedicareClinicalNotes(options);
}

/** Strip internal program/panel names from notes before they appear on the patient-facing PDF. */
export function formatClinicalIndicationForPdf(clinicalIndication: string): string {
  let text = clinicalIndication.trim();

  text = text.replace(
    /\n?(?:Pathology panels|Program pathology panels):[\s\S]*?(?=\nTests requested:|$)/i,
    ""
  );
  text = text.replace(/\n?Tests requested:[\s\S]*$/i, "");

  text = stripCalculatedMarkerPhrases(text);

  // Legacy lines prefixed with MBS code + test name (tests belong in Tests requested only).
  text = text
    .split("\n")
    .map((line) => line.replace(/^\d{5}(?:\/\d{5})*\s+[^:]+:\s*/i, "").trim())
    .filter(Boolean)
    .join("\n");

  return text.replace(/\n{3,}/g, "\n\n").trim();
}

export function listPathologyProgramOptions() {
  return PROGRAM_ESSENTIAL_PANELS.map((panel) => ({
    slug: panel.slug as PathologyPanelSlug,
    label: panel.label,
    shortLabel: panel.shortLabel,
    description: panel.description,
    testCount: PATHOLOGY_TESTS_BY_PANEL[panel.slug].length,
    group: "clinical" as const,
  }));
}

export function listOrganBiomarkerPanelOptions() {
  return ORGAN_BIOMARKER_PANEL_SLUGS.map((slug) => {
    const panel = ORGAN_BIOMARKER_PANEL_META[slug];
    return {
      slug,
      label: panel.label,
      shortLabel: panel.shortLabel,
      description: panel.description,
      testCount: PATHOLOGY_TESTS_BY_PANEL[slug].length,
      group: "organ_biomarkers" as const,
    };
  });
}

export function listPathologyPanelOptionGroups() {
  return [
    {
      id: "clinical" as const,
      label: "Clinical program panels",
      options: listPathologyProgramOptions(),
    },
    {
      id: "organ_biomarkers" as const,
      label: "Organ & biomarker panels",
      options: listOrganBiomarkerPanelOptions(),
    },
  ];
}

export function resolveDefaultPathologyPanels(
  subscriptionTier?: string | null
): PathologyPanelSlug[] {
  const tier = (subscriptionTier || "").toLowerCase();
  const panels: PathologyPanelSlug[] = [resolveDefaultProgramFromTier(subscriptionTier)];

  if (tier.includes("organ")) {
    panels.unshift("ORGAN_CARE");
  }
  if (tier.includes("complete") || tier.includes("comprehensive") || tier.includes("whole_body")) {
    panels.push("BIOMARKERS_COMPLETE");
  } else if (
    tier.includes("essential") ||
    tier.includes("biomarker") ||
    tier.includes("biological") ||
    tier.includes("extended")
  ) {
    panels.push("BIOMARKERS_ESSENTIAL");
  }

  return [...new Set(panels)];
}

export function programSlugsRequireFasting(
  panelSlugs: PathologyPanelSlug[],
  gender: PathologyPatientGender,
  additionalTestIds: string[] = []
): boolean {
  return catalogTestsRequireFasting(
    mergePathologyTestIds(panelSlugs, gender, additionalTestIds)
  );
}

export function isPathologyPanelSlug(value: string): value is PathologyPanelSlug {
  return ALL_PATHOLOGY_PANEL_SLUGS.includes(value as PathologyPanelSlug);
}

/** @deprecated Use isPathologyPanelSlug */
export function isProgramEssentialSlug(value: string): value is ProgramEssentialSlug {
  return ALL_PATHOLOGY_PROGRAM_SLUGS.includes(value as ProgramEssentialSlug);
}

export function extractMedicareFromIntake(intakeData: unknown): {
  medicareNumber?: string;
  medicareIrn?: string;
} {
  if (!intakeData || typeof intakeData !== "object") return {};
  const data = intakeData as Record<string, unknown>;

  const rawNumber =
    data.medicareNumber ??
    data.medicareCardNumber ??
    data.medicare ??
    data.medicareCard;

  const rawIrn = data.medicareIrn ?? data.medicareReference ?? data.medicareRef;

  const medicareNumber =
    typeof rawNumber === "string" || typeof rawNumber === "number"
      ? String(rawNumber).replace(/\s/g, "").trim()
      : undefined;

  const medicareIrn =
    typeof rawIrn === "string" || typeof rawIrn === "number"
      ? String(rawIrn).replace(/\s/g, "").trim()
      : undefined;

  return {
    medicareNumber: medicareNumber || undefined,
    medicareIrn: medicareIrn || undefined,
  };
}
