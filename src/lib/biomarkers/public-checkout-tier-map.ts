import type { BiomarkerSubscriptionTier } from "@/lib/biomarkers/public-subscription-panels";
import type { BiomarkersPanelTier } from "@/lib/programs/offers";
export function publicTierToBillingTier(tier: BiomarkerSubscriptionTier): BiomarkersPanelTier {
  switch (tier) {
    case "essential":
      return "essential";
    case "advanced":
      return "extended";
    case "complete":
      return "comprehensive";
  }
}

export function billingTierToPublicTier(tier: BiomarkersPanelTier): BiomarkerSubscriptionTier {
  switch (tier) {
    case "essential":
      return "essential";
    case "extended":
      return "advanced";
    case "comprehensive":
      return "complete";
  }
}

/**
 * Organ Care is included with every biomarker panel (Essential and up),
 * including clinical-program panel grants. It is no longer sold separately.
 */
export function panelIncludesOrganCare(
  _tier: BiomarkerSubscriptionTier,
  _options?: { sourceProgram?: string | null }
): boolean {
  return true;
}

export function isValidPublicPanelTier(
  value: string | null | undefined
): value is BiomarkerSubscriptionTier {
  return value === "essential" || value === "advanced" || value === "complete";
}
