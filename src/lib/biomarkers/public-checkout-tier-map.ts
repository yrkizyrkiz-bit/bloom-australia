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

/** Advanced and Complete panels bundle Organ Care entitlements. */
export function panelIncludesOrganCare(tier: BiomarkerSubscriptionTier): boolean {
  return tier === "advanced" || tier === "complete";
}

export function isValidPublicPanelTier(
  value: string | null | undefined
): value is BiomarkerSubscriptionTier {
  return value === "essential" || value === "advanced" || value === "complete";
}
