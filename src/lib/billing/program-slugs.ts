import type { ProgramKey } from "@/lib/membership/keys";

export const PROGRAM_SLUG: Record<ProgramKey, string> = {
  WEIGHT_MANAGEMENT: "weight_management",
  HAIR_LOSS: "hair_loss",
  MENS_HEALTH_VITALITY: "mens_health_vitality",
  MENS_HEALTH_SEXUAL: "mens_health_sexual",
  WOMENS_HEALTH_VITALITY: "womens_health_vitality",
  WOMENS_HEALTH_SEXUAL: "womens_health_sexual",
};

export const SANATIVE_MEMBERSHIP_SLUG = "sanative_membership";

/** Included with Sanative Membership, not billed as standalone subscriptions. */
export const MEMBERSHIP_INCLUDED_SCOPE_SLUGS = ["organ_care", "biological_clock"] as const;

export function programSlugFromProgramKey(key: ProgramKey): string {
  return PROGRAM_SLUG[key];
}
