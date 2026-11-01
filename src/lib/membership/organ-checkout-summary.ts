import type { OrderSummaryMarqueeItem } from "@/lib/membership/order-summary-marquee";

export const ORGAN_CHECKOUT_SOURCES = [
  "fatty_liver",
  "heart_health",
  "kidney_health",
] as const;

export type OrganCheckoutSource = (typeof ORGAN_CHECKOUT_SOURCES)[number];

export type OrganCheckoutSummary = {
  source: OrganCheckoutSource;
  cardTitle: string;
  headline: string;
  steps: readonly [string, string, string, string];
  included: string;
  formBadge: string;
  formHeadline: string;
  marquee: readonly OrderSummaryMarqueeItem[];
};

const JOIN_STEP = "Join today – takes 2 minutes.";
const PATHOLOGY_STEP = "Get your pathology request form after first consult.";
const COLLECTION_STEP = "Visit a collection centre near you.";

const BIOMARKER_SCREEN: OrderSummaryMarqueeItem = {
  src: "/images/membership/mens-marquee/biomarker-vial.webp",
  alt: "Sanative biomarker blood test vial with metabolic markers",
  fit: "cover",
};

const APP_SCREEN: OrderSummaryMarqueeItem = {
  src: "/images/membership/mens-marquee/app-insights.webp",
  alt: "Sanative app showing health score and biomarker insights",
  fit: "cover",
};

const ORGAN_CHECKOUT_SUMMARIES: Record<OrganCheckoutSource, OrganCheckoutSummary> = {
  fatty_liver: {
    source: "fatty_liver",
    cardTitle: "Check your liver in 4 simple steps",
    headline: "Your liver blood test + doctor review",
    steps: [
      JOIN_STEP,
      PATHOLOGY_STEP,
      COLLECTION_STEP,
      "A doctor reviews your results and you see them in the app on your liver care dashboard",
    ],
    included:
      "Includes ALT, AST, GGT, HbA1c, insulin, triglycerides, HDL and 85+ more markers, plus 2 doctor consultations",
    formBadge: "Liver health check",
    formHeadline: "Step 1: Create your account",
    marquee: [
      {
        src: "/images/membership/organ-slider/liver.webp",
        alt: "Clinicians examining liver health markers",
        fit: "contain",
      },
      BIOMARKER_SCREEN,
      {
        src: "/images/conditions/fatty-liver-disease.webp",
        alt: "Liver model used on the liver health check",
        fit: "contain",
      },
      APP_SCREEN,
    ],
  },
  heart_health: {
    source: "heart_health",
    cardTitle: "Check your heart in 4 simple steps",
    headline: "Your heart blood test + doctor review",
    steps: [
      JOIN_STEP,
      PATHOLOGY_STEP,
      COLLECTION_STEP,
      "A doctor reviews your results and you see them in the app on your heart care dashboard",
    ],
    included:
      "Includes LDL, HDL, triglycerides, total cholesterol, hs-CRP, HbA1c, ApoB and 85+ more markers, plus 2 doctor consultations",
    formBadge: "Heart health check",
    formHeadline: "Step 1: Create your account",
    marquee: [
      {
        src: "/images/membership/organ-slider/heart.webp",
        alt: "Doctor reviewing heart health insights",
        fit: "contain",
      },
      BIOMARKER_SCREEN,
      {
        src: "/images/biomarker-results-card.webp",
        alt: "Sanative app biomarker results on a phone",
        fit: "cover",
      },
      APP_SCREEN,
    ],
  },
  kidney_health: {
    source: "kidney_health",
    cardTitle: "Check your kidneys in 4 simple steps",
    headline: "Your kidney blood test + doctor review",
    steps: [
      JOIN_STEP,
      PATHOLOGY_STEP,
      COLLECTION_STEP,
      "A doctor reviews your results and you see them in the app on your kidney care dashboard",
    ],
    included:
      "Includes eGFR, creatinine, uACR, BUN, HbA1c, insulin, electrolytes and 85+ more markers, plus 2 doctor consultations",
    formBadge: "Kidney health check",
    formHeadline: "Step 1: Create your account",
    marquee: [
      {
        src: "/images/membership/organ-slider/kidney.webp",
        alt: "Doctor reviewing kidney health insights",
        fit: "contain",
      },
      BIOMARKER_SCREEN,
      {
        src: "/images/conditions/chronic-kidney-disease.webp",
        alt: "Kidney model used on the kidney health check",
        fit: "contain",
      },
      APP_SCREEN,
    ],
  },
};

export function isOrganCheckoutSource(source: string | null | undefined): source is OrganCheckoutSource {
  return source === "fatty_liver" || source === "heart_health" || source === "kidney_health";
}

export function getOrganCheckoutSummary(
  source: string | null | undefined
): OrganCheckoutSummary | null {
  if (!isOrganCheckoutSource(source)) return null;
  return ORGAN_CHECKOUT_SUMMARIES[source];
}
