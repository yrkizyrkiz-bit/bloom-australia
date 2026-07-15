import type { BiomarkerSubscriptionTier } from "@/lib/biomarkers/public-subscription-panels";

/** Canonical sessionStorage key for program → biomarkers checkout handoff. */
export const PROGRAM_BIOMARKERS_CHECKOUT_KEY = "program_biomarkers_checkout";

export type ProgramBiomarkersCheckoutSource =
  | "hair_loss"
  | "womens_health"
  | "womens_health_sexual"
  | "womens_health_vitality"
  | "mens_health";

export type ProgramBiomarkersCheckoutHandoff = {
  source: ProgramBiomarkersCheckoutSource;
  skipQuiz: boolean;
  panelTier: BiomarkerSubscriptionTier;
  programLabel?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  postcode?: string;
  address?: string;
  gender?: string;
  resolvedProgram?: string | null;
  quizAnswers?: Record<string, unknown>;
};

export type ProgramCheckoutBanner = {
  headline: string;
  body: string;
  borderClass: string;
  bgClass: string;
  textClass: string;
};

const LEGACY_STORAGE_KEYS = [
  "hair_biomarkers_checkout",
  "womens_biomarkers_checkout",
  "mens_biomarkers_checkout",
] as const;

export function isWomensHealthCheckoutSource(
  source: string | null | undefined
): boolean {
  return (
    source === "womens_health" ||
    source === "womens_health_sexual" ||
    source === "womens_health_vitality"
  );
}

export function isProgramBiomarkersCheckoutSource(
  source: string | null | undefined
): source is ProgramBiomarkersCheckoutSource {
  if (!source) return false;
  return (
    source === "hair_loss" ||
    isWomensHealthCheckoutSource(source) ||
    source === "mens_health"
  );
}

export function shouldSkipBiomarkersQuiz(
  source: string | null | undefined
): boolean {
  return isProgramBiomarkersCheckoutSource(source);
}

export function buildProgramBiomarkersCheckoutUrl(
  panelTier: BiomarkerSubscriptionTier,
  source: ProgramBiomarkersCheckoutSource
): string {
  const params = new URLSearchParams({
    package: panelTier,
    source,
    skipQuiz: "1",
  });
  return `/biomarkers/checkout?${params.toString()}`;
}

export function persistProgramBiomarkersHandoff(
  handoff: ProgramBiomarkersCheckoutHandoff
): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(
      PROGRAM_BIOMARKERS_CHECKOUT_KEY,
      JSON.stringify(handoff)
    );
    for (const key of LEGACY_STORAGE_KEYS) {
      sessionStorage.removeItem(key);
    }
  } catch {
    // sessionStorage may be unavailable in private browsing
  }
}

export function navigateToProgramBiomarkersCheckout(
  handoff: ProgramBiomarkersCheckoutHandoff
): void {
  persistProgramBiomarkersHandoff(handoff);
  window.location.href = buildProgramBiomarkersCheckoutUrl(
    handoff.panelTier,
    handoff.source
  );
}

function normalizeLegacyHandoff(
  legacy: Record<string, unknown>,
  sourceParam?: string | null
): ProgramBiomarkersCheckoutHandoff | null {
  const panelTier = legacy.panelTier;
  if (
    panelTier !== "essential" &&
    panelTier !== "advanced" &&
    panelTier !== "complete"
  ) {
    return null;
  }

  const source =
    (typeof legacy.source === "string"
      ? legacy.source
      : sourceParam) as ProgramBiomarkersCheckoutSource;

  if (!isProgramBiomarkersCheckoutSource(source)) return null;

  const quizAnswers =
    (legacy.quizAnswers as Record<string, unknown> | undefined) ||
    (legacy.hairQuizAnswers as Record<string, unknown> | undefined) ||
    (legacy.womensQuizAnswers as Record<string, unknown> | undefined) ||
    (legacy.mensQuizAnswers as Record<string, unknown> | undefined);

  return {
    source,
    skipQuiz: true,
    panelTier,
    programLabel:
      typeof legacy.programLabel === "string" ? legacy.programLabel : undefined,
    firstName:
      typeof legacy.firstName === "string" ? legacy.firstName : undefined,
    lastName: typeof legacy.lastName === "string" ? legacy.lastName : undefined,
    email: typeof legacy.email === "string" ? legacy.email : undefined,
    phone: typeof legacy.phone === "string" ? legacy.phone : undefined,
    dateOfBirth:
      typeof legacy.dateOfBirth === "string" ? legacy.dateOfBirth : undefined,
    postcode:
      typeof legacy.postcode === "string" ? legacy.postcode : undefined,
    address: typeof legacy.address === "string" ? legacy.address : undefined,
    gender: typeof legacy.gender === "string" ? legacy.gender : undefined,
    resolvedProgram:
      typeof legacy.resolvedProgram === "string"
        ? legacy.resolvedProgram
        : legacy.resolvedProgram === null
          ? null
          : undefined,
    quizAnswers,
  };
}

export function readProgramBiomarkersHandoff(
  sourceParam?: string | null
): ProgramBiomarkersCheckoutHandoff | null {
  if (typeof window === "undefined") return null;

  const parseStored = (raw: string | null): ProgramBiomarkersCheckoutHandoff | null => {
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      return normalizeLegacyHandoff(parsed, sourceParam);
    } catch {
      return null;
    }
  };

  const canonical = parseStored(
    sessionStorage.getItem(PROGRAM_BIOMARKERS_CHECKOUT_KEY)
  );
  if (canonical) return canonical;

  const legacyKeys =
    sourceParam === "hair_loss"
      ? (["hair_biomarkers_checkout"] as const)
      : isWomensHealthCheckoutSource(sourceParam)
        ? (["womens_biomarkers_checkout"] as const)
        : sourceParam === "mens_health"
          ? (["mens_biomarkers_checkout"] as const)
          : LEGACY_STORAGE_KEYS;

  for (const key of legacyKeys) {
    const legacy = parseStored(sessionStorage.getItem(key));
    if (legacy) return legacy;
  }

  return null;
}

export function clearProgramBiomarkersHandoff(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(PROGRAM_BIOMARKERS_CHECKOUT_KEY);
    for (const key of LEGACY_STORAGE_KEYS) {
      sessionStorage.removeItem(key);
    }
  } catch {
    // ignore
  }
}

export function getProgramCheckoutBanner(
  source: string | null | undefined,
  panelName: string
): ProgramCheckoutBanner | null {
  if (!isProgramBiomarkersCheckoutSource(source)) return null;

  if (source === "hair_loss") {
    return {
      headline: "Continuing from your hair assessment",
      body: `Your questionnaire is complete. After payment and your doctor consultation, we'll activate your ${panelName} panel and hair care program.`,
      borderClass: "border-[#cdd8c6]",
      bgClass: "bg-[#f4f7f2]",
      textClass: "text-[#34412f]",
    };
  }

  if (isWomensHealthCheckoutSource(source)) {
    return {
      headline: "Continuing from your women's health assessment",
      body: `Your questionnaire is complete. After payment and your doctor consultation, we'll activate your ${panelName} panel and care program.`,
      borderClass: "border-[#f8e1e1]",
      bgClass: "bg-[#fef4f0]",
      textClass: "text-[#34412f]",
    };
  }

  if (source === "mens_health") {
    return {
      headline: "Continuing from your men's health assessment",
      body: `Your questionnaire is complete. After payment and your doctor consultation, we'll activate your ${panelName} panel and care program.`,
      borderClass: "border-[#cdd8c6]",
      bgClass: "bg-[#f4f7f2]",
      textClass: "text-[#34412f]",
    };
  }

  return null;
}
