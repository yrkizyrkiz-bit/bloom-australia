import type { ProgramKey } from "@/lib/membership/keys";
import type { BiomarkerSubscriptionTier } from "@/lib/biomarkers/public-subscription-panels";

/**
 * Program → required panel tier.
 *
 * The tier a program starts on is a CLINICAL decision: it is the minimum panel
 * that covers the biomarkers the program's care plan needs to be built safely.
 * It is NOT a price-selection the buyer makes. The buyer chooses a program; this
 * table chooses the panel; the panel sets the Start price.
 *
 * Public tiers: "essential" | "advanced" | "complete"
 *   advanced  -> billing "extended"     (adds hormones, thyroid, iron; bundles Organ Care)
 *   complete  -> billing "comprehensive"(adds longevity/optimiser depth)
 * See public-checkout-tier-map.ts for the billing mapping.
 *
 * Rationale per program:
 * - HAIR_LOSS: ferritin, iron studies, thyroid, hormones -> Advanced
 * - MENS_HEALTH_* : testosterone, thyroid, metabolic       -> Advanced
 * - WOMENS_HEALTH_*: estradiol, progesterone, FSH/LH/SHBG,
 *     TSH, ferritin                                         -> Advanced
 * - WEIGHT_MANAGEMENT: lipids, liver, kidney, HbA1c are the
 *     core WM markers and sit in Essential. Precision (deeper
 *     hormone/thyroid picture) is a doctor-recommended upgrade
 *     handled at the care plan, so the START tier is Essential.
 *
 * A doctor may always ADD markers in-consult beyond the started tier;
 * this table only sets the floor at checkout.
 */
export const PROGRAM_REQUIRED_PANEL_TIER: Record<
  ProgramKey,
  BiomarkerSubscriptionTier
> = {
  WEIGHT_MANAGEMENT: "essential",
  HAIR_LOSS: "advanced",
  MENS_HEALTH_VITALITY: "advanced",
  MENS_HEALTH_SEXUAL: "advanced",
  WOMENS_HEALTH_VITALITY: "advanced",
  WOMENS_HEALTH_SEXUAL: "advanced",
};

/**
 * The "unsure" / undiagnosed path has no program yet, the doctor classifies
 * it at the care plan. It still needs a panel to make that classification, and
 * the broad hormone/thyroid/metabolic picture requires Advanced. Callers pass
 * `null` for the undiagnosed women's-health "not sure where to start" entry.
 */
export const UNDIAGNOSED_DEFAULT_TIER: BiomarkerSubscriptionTier = "advanced";

export function resolveRequiredPanelTier(
  program: ProgramKey | null
): BiomarkerSubscriptionTier {
  if (program === null) return UNDIAGNOSED_DEFAULT_TIER;
  return PROGRAM_REQUIRED_PANEL_TIER[program];
}
