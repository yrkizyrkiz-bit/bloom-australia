/**
 * Program marketing copy and billing term types.
 *
 * All amounts live in the billing catalog (Product / BillingPrice tables)
 * and are edited via Admin → Membership Pricing.
 */

import type { ProgramKey } from "@/lib/membership/keys";

export type ProgramBillingTerm = "1m" | "3m" | "6m" | "12m";

export const PROGRAM_BILLING_TERMS: ProgramBillingTerm[] = ["1m", "3m", "6m", "12m"];

export type ProgramBillingTermOption = {
  term: ProgramBillingTerm;
  label: string;
  periodLabel: string;
  months: number;
};

export const PROGRAM_BILLING_TERM_OPTIONS: ProgramBillingTermOption[] = [
  { term: "1m", label: "Monthly", periodLabel: "per month", months: 1 },
  { term: "3m", label: "3 months", periodLabel: "every 3 months", months: 3 },
  { term: "6m", label: "6 months", periodLabel: "every 6 months", months: 6 },
  { term: "12m", label: "Annual", periodLabel: "per year", months: 12 },
];

export type ProgramOffer = {
  programKey: ProgramKey;
  headline: string;
  priceHint: string;
  planTier?: "CORE" | "PRECISION" | null;
};

/** Static marketing copy only — prices come from the billing catalog. */
export const PROGRAM_OFFERS: Record<ProgramKey, ProgramOffer> = {
  WEIGHT_MANAGEMENT: {
    programKey: "WEIGHT_MANAGEMENT",
    headline: "Doctor-guided weight management",
    priceHint: "From $249 first month",
    planTier: "CORE",
  },
  HAIR_LOSS: {
    programKey: "HAIR_LOSS",
    headline: "Clinically-backed hair regrowth",
    priceHint: "From $59/mo",
    planTier: null,
  },
  MENS_HEALTH_VITALITY: {
    programKey: "MENS_HEALTH_VITALITY",
    headline: "Energy, focus and vitality",
    priceHint: "From $59/mo",
    planTier: null,
  },
  MENS_HEALTH_SEXUAL: {
    programKey: "MENS_HEALTH_SEXUAL",
    headline: "Confidential sexual health care",
    priceHint: "From $59/mo",
    planTier: null,
  },
  WOMENS_HEALTH_VITALITY: {
    programKey: "WOMENS_HEALTH_VITALITY",
    headline: "Hormone and vitality support",
    priceHint: "From $59/mo",
    planTier: null,
  },
  WOMENS_HEALTH_SEXUAL: {
    programKey: "WOMENS_HEALTH_SEXUAL",
    headline: "Confidential sexual health care",
    priceHint: "From $59/mo",
    planTier: null,
  },
};

export function getProgramOffer(key: ProgramKey): ProgramOffer {
  return PROGRAM_OFFERS[key];
}

export type BiomarkersPanelTier = "essential" | "extended" | "comprehensive";

export type BiomarkersPanelMeta = {
  tier: BiomarkersPanelTier;
  name: string;
  description: string;
  markerCount: number;
};

export const BIOMARKERS_PANEL_META: Record<BiomarkersPanelTier, BiomarkersPanelMeta> = {
  essential: {
    tier: "essential",
    name: "Essential Panel",
    description: "Core biomarkers mapped from your clinical intake",
    markerCount: 40,
  },
  extended: {
    tier: "extended",
    name: "Advanced Panel",
    description: "Broader category coverage including hormones and inflammation",
    markerCount: 65,
  },
  comprehensive: {
    tier: "comprehensive",
    name: "Complete Panel",
    description: "Full health audit across all intake categories",
    markerCount: 85,
  },
};

export const ORGAN_CARE_UPSELL_META = {
  name: "Organ & Metabolic Care",
  description:
    "All organ dashboards — heart, liver, kidney, thyroid, hormones and metabolic health — in one annual membership",
} as const;

/** Upsell copy when biomarkers panel is offered alongside organ care checkout. */
export const BIOMARKERS_UPSELL_META = {
  name: "Get My Biomarkers",
  headline: "Complete insight with a full biomarker panel",
  description:
    "Add an annual biomarker panel for biological age, deeper organ markers and a doctor-led testing plan — Medicare-eligible tests ordered where clinically indicated.",
  badge: "Recommended for complete picture",
} as const;

export function isProgramBillingTerm(value: string): value is ProgramBillingTerm {
  return value === "1m" || value === "3m" || value === "6m" || value === "12m";
}

export function isBiomarkersPanelTier(value: string): value is BiomarkersPanelTier {
  return value === "essential" || value === "extended" || value === "comprehensive";
}

/** Organ Care cadence when added as biomarkers upsell or standalone. */
export type OrganCareBillingTerm = "monthly" | "annual";

export function isOrganCareBillingTerm(value: string): value is OrganCareBillingTerm {
  return value === "monthly" || value === "annual";
}
