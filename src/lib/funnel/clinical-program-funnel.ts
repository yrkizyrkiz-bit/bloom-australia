export type ClinicalFunnelProgramId =
  | "weight_management"
  | "hair_loss"
  | "mens_health"
  | "womens_health";

export type ClinicalFunnelBookingProgram =
  | "WEIGHT_MANAGEMENT"
  | "HAIR_LOSS"
  | "MENS_HEALTH"
  | "WOMENS_HEALTH";

export type ClinicalProgramFunnelConfig = {
  id: ClinicalFunnelProgramId;
  programType: ClinicalFunnelBookingProgram;
  intentProgram: string;
  source: string;
  label: string;
  postCheckoutPath: string;
  qualificationImage: string;
  qualificationImageAlt: string;
  membershipCopy: string;
  paymentNote: string;
  nextSteps: Array<{ title: string; detail: string }>;
};

const MEMBERSHIP_COPY =
  "Sanative starts with a comprehensive health check, including 85+ biomarkers, to help your doctor understand factors relevant to your health.";

const NEXT_STEPS = [
  {
    title: "Complete your profile",
    detail: "A few details so we can set up your account and portal access.",
  },
  {
    title: "Secure payment",
    detail:
      "Pay for your Sanative membership, which includes your 85+ biomarker health check and first 30 days of this program.",
  },
  {
    title: "Book your doctor consultation",
    detail: "Your Sanative doctor will organise your health check and discuss your care options.",
  },
] as const;

export function resolveClinicalIntentProgram(
  programId: ClinicalFunnelProgramId,
  resolvedProgram?: string | null
): string {
  if (resolvedProgram) {
    return resolvedProgram.toLowerCase().replace(/-/g, "_");
  }
  return programId;
}

export function getClinicalProgramFunnelConfig(
  programId: ClinicalFunnelProgramId,
  resolvedProgram?: string | null
): ClinicalProgramFunnelConfig {
  const intentProgram = resolveClinicalIntentProgram(programId, resolvedProgram);

  const shared = {
    intentProgram,
    membershipCopy: MEMBERSHIP_COPY,
    nextSteps: [...NEXT_STEPS],
  };

  if (programId === "hair_loss") {
    return {
      ...shared,
      id: "hair_loss",
      programType: "HAIR_LOSS",
      source: "hair_assessment",
      label: "Hair Loss",
      postCheckoutPath: "/dashboard/mens-health/hair-loss?onboarding=post-checkout",
      qualificationImage: "/images/membership/hair_ages_1.webp",
      qualificationImageAlt: "Doctor-led hair loss care with Sanative",
      paymentNote:
        "Your first 30 days of doctor-led hair loss care are included. After that, continue for $90 every three months. Cancel anytime.",
    };
  }

  if (programId === "mens_health") {
    return {
      ...shared,
      id: "mens_health",
      programType: "MENS_HEALTH",
      source: "mens_health_assessment",
      label: "Men's Health",
      postCheckoutPath: "/dashboard/mens-health?onboarding=post-checkout",
      qualificationImage: "/images/membership/Main_man.webp",
      qualificationImageAlt: "Doctor-led men's health care with Sanative",
      paymentNote:
        "Your first 30 days of doctor-led men's health care are included. After that, continue for $240 every three months. Cancel anytime.",
    };
  }

  if (programId === "womens_health") {
    return {
      ...shared,
      id: "womens_health",
      programType: "WOMENS_HEALTH",
      source: "womens_health_assessment",
      label: "Women's Health",
      postCheckoutPath: "/dashboard/womens-health?onboarding=post-checkout",
      qualificationImage: "/images/womens-health-doctor.webp",
      qualificationImageAlt: "Doctor-led women's health care with Sanative",
      paymentNote:
        "Your first 30 days of doctor-led women's health care are included. After that, continue for $240 every three months. Cancel anytime.",
    };
  }

  return {
    ...shared,
    id: "weight_management",
    programType: "WEIGHT_MANAGEMENT",
    source: "weight_management_assessment",
    label: "Weight Management",
    postCheckoutPath: "/dashboard/weight-management?onboarding=post-checkout",
    qualificationImage: "/images/membership/WM_quiz.webp",
    qualificationImageAlt: "Doctor-led weight management with Sanative",
    paymentNote:
      "Your first 30 days of doctor-led medical weight loss care are included. After that, continue for $360 every three months. Cancel anytime.",
    nextSteps: [
      NEXT_STEPS[0],
      {
        title: "Secure payment",
        detail:
          "Pay for your Sanative membership, which includes your 85+ biomarker health check and first 30 days of the weight loss program.",
      },
      {
        title: "Book your doctor consultation",
        detail:
          "Your Sanative doctor will organise your health check and discuss your weight loss options to reach your goals.",
      },
    ],
  };
}

const CLINICAL_FUNNEL_INTENTS = new Set([
  "weight_management",
  "hair_loss",
  "mens_health",
  "mens_health_vitality",
  "mens_health_sexual",
  "womens_health",
  "womens_health_vitality",
  "womens_health_sexual",
]);

export function isClinicalProgramMembershipFunnel(
  paymentMetadata?: Record<string, string> | null
): boolean {
  const intent = (paymentMetadata?.intentProgram || "").toLowerCase().replace(/-/g, "_");
  if (CLINICAL_FUNNEL_INTENTS.has(intent)) return true;
  const source = (paymentMetadata?.source || "").toLowerCase();
  return (
    paymentMetadata?.purchaseType === "sanative_membership" &&
    (source.includes("weight_management_assessment") ||
      source.includes("hair_assessment") ||
      source.includes("mens_health_assessment") ||
      source.includes("womens_health_assessment"))
  );
}
