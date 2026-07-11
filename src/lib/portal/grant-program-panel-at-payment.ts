/**
 * Grant the clinically required biomarker panel at payment (launch blocker B1).
 *
 * Consult-first Starts and test-first biomarker checkouts both call this so
 * BIOLOGICAL_CLOCK (and Organ Care when bundled) are active before results.
 */

import { grantEntitlement } from "@/lib/membership/entitlement-service";
import type { ProgramKey } from "@/lib/membership/keys";
import {
  isValidPublicPanelTier,
  panelIncludesOrganCare,
  publicTierToBillingTier,
} from "@/lib/biomarkers/public-checkout-tier-map";
import { resolveRequiredPanelTier } from "@/lib/biomarkers/program-panel-requirements";
import type { BiomarkerSubscriptionTier } from "@/lib/biomarkers/public-subscription-panels";
import type { BiomarkersPanelTier } from "@/lib/programs/offers";
import { isBiomarkersPanelTier } from "@/lib/programs/offers";

export type GrantProgramPanelAtPaymentInput = {
  userId: string;
  paymentIntentId: string;
  /** Canonical program, or null for undiagnosed / unsure. */
  programKey: ProgramKey | null;
  /** Optional public tier override from intake / payment metadata. */
  publicPanelTier?: string | null;
  /** Optional billing tier override from intake / payment metadata. */
  billingPanelTier?: string | null;
  /**
   * Funnel source for Organ Care bundling rules
   * (e.g. hair_loss Advanced does not bundle Organ Care).
   */
  sourceProgram?: string | null;
  /** Entitlement notes / audit source label. */
  source?: string;
};

export function resolvePanelTiersForProgramStart(input: {
  programKey: ProgramKey | null;
  publicPanelTier?: string | null;
  billingPanelTier?: string | null;
}): {
  publicPanelTier: BiomarkerSubscriptionTier;
  billingPanelTier: BiomarkersPanelTier;
} {
  const publicPanelTier = isValidPublicPanelTier(input.publicPanelTier)
    ? input.publicPanelTier
    : resolveRequiredPanelTier(input.programKey);

  const billingPanelTier =
    typeof input.billingPanelTier === "string" &&
    isBiomarkersPanelTier(input.billingPanelTier)
      ? input.billingPanelTier
      : publicTierToBillingTier(publicPanelTier);

  return { publicPanelTier, billingPanelTier };
}

export async function grantProgramPanelEntitlementsAtPayment(
  input: GrantProgramPanelAtPaymentInput
) {
  const source = input.source ?? "program_start_payment";
  const { publicPanelTier, billingPanelTier } = resolvePanelTiersForProgramStart({
    programKey: input.programKey,
    publicPanelTier: input.publicPanelTier,
    billingPanelTier: input.billingPanelTier,
  });

  const retestDueAt = new Date();
  retestDueAt.setFullYear(retestDueAt.getFullYear() + 1);
  const retestDueAtIso = retestDueAt.toISOString();

  const meta = {
    panelTier: billingPanelTier,
    publicPanelTier,
    source,
    retestDueAt: retestDueAtIso,
    programKey: input.programKey,
  };

  // Notes format must stay parseable by parseBiomarkerTierFromNotes
  // (`Biomarkers subscription (extended)`).
  await grantEntitlement({
    userId: input.userId,
    type: "SCOPE",
    key: "BIOLOGICAL_CLOCK",
    status: "ACTIVE",
    source: "PORTAL_PURCHASE",
    notes: `Biomarkers subscription (${billingPanelTier}). ${JSON.stringify(meta)}. PI ${input.paymentIntentId}`,
  });

  const addOrganCare = panelIncludesOrganCare(publicPanelTier, {
    sourceProgram: input.sourceProgram,
  });

  if (addOrganCare) {
    await grantEntitlement({
      userId: input.userId,
      type: "SCOPE",
      key: "ORGAN_CARE",
      status: "ACTIVE",
      source: "PORTAL_PURCHASE",
      notes: `Organ Care bundled with ${publicPanelTier} panel (${billingPanelTier}). ${JSON.stringify(meta)}. PI ${input.paymentIntentId}`,
    });
  }

  return {
    publicPanelTier,
    billingPanelTier,
    addOrganCare,
    retestDueAt: retestDueAtIso,
  };
}
