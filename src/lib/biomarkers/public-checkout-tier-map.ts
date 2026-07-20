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
 * Advanced and Complete public panels normally bundle Organ Care entitlements.
 * Program funnels (hair / women's Advanced checkout) unlock biomarkers + that
 * program only — not Organ Care.
 */
export function panelIncludesOrganCare(
  tier: BiomarkerSubscriptionTier,
  options?: { sourceProgram?: string | null }
): boolean {
  const source = options?.sourceProgram ?? null;
  if (
    source === "hair_loss" ||
    source === "mens_health" ||
    source === "womens_health" ||
    source === "womens_health_sexual" ||
    source === "womens_health_vitality"
  ) {
    return false;
  }
  return tier === "advanced" || tier === "complete";
}

export function isValidPublicPanelTier(
  value: string | null | undefined
): value is BiomarkerSubscriptionTier {
  return value === "essential" || value === "advanced" || value === "complete";
}
