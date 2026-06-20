import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { normalizeProgramKey, type ProgramKey } from "@/lib/membership/keys";
import {
  getProgramProductPricing,
  resolveProgramCheckoutQuote,
  resolveBiomarkersCheckoutQuote,
  getOrganCarePricingOptions,
  getBiomarkersPanelPrice,
  formatRecurringPriceLabel,
} from "@/lib/billing/portal-pricing";
import {
  isBiomarkersPanelTier,
  isOrganCareBillingTerm,
  PROGRAM_BILLING_TERM_OPTIONS,
  BIOMARKERS_PANEL_META,
  ORGAN_CARE_UPSELL_META,
} from "@/lib/programs/offers";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const programKey = normalizeProgramKey(searchParams.get("programKey") ?? "");
    const panelTier = searchParams.get("panelTier");
    const biomarkers = searchParams.get("biomarkers") === "true";

    if (biomarkers) {
      const tiers = await Promise.all(
        (["essential", "extended", "comprehensive"] as const).map(async (tier) => {
          const price = await getBiomarkersPanelPrice(tier);
          return {
            ...BIOMARKERS_PANEL_META[tier],
            priceLabel: price ? `$${price.amountAud}/yr` : null,
            amountAud: price?.amountAud ?? null,
            billingPriceId: price?.id ?? null,
          };
        })
      );
      const organOptions = await getOrganCarePricingOptions();
      return NextResponse.json({
        panels: tiers,
        organCare: {
          ...ORGAN_CARE_UPSELL_META,
          options: [
            organOptions.monthly
              ? {
                  term: "monthly" as const,
                  label: "Monthly",
                  priceLabel: formatRecurringPriceLabel(
                    organOptions.monthly.amountCents,
                    organOptions.monthly.billingInterval
                  ),
                  amountAud: organOptions.monthly.amountAud,
                  billingPriceId: organOptions.monthly.id,
                  promo: null,
                }
              : null,
            organOptions.annual
              ? {
                  term: "annual" as const,
                  label: "Annual",
                  priceLabel: formatRecurringPriceLabel(
                    organOptions.annual.amountCents,
                    organOptions.annual.billingInterval
                  ),
                  amountAud: organOptions.annual.amountAud,
                  billingPriceId: organOptions.annual.id,
                  promo: "Best value",
                }
              : null,
          ].filter(Boolean),
        },
      });
    }

    if (panelTier && isBiomarkersPanelTier(panelTier)) {
      const addOrganCare = searchParams.get("addOrganCare") === "true";
      const organTermRaw = searchParams.get("organCareTerm") ?? "annual";
      const organCareTerm = isOrganCareBillingTerm(organTermRaw) ? organTermRaw : "annual";
      const quote = await resolveBiomarkersCheckoutQuote(panelTier, addOrganCare, organCareTerm);
      return NextResponse.json({ quote });
    }

    if (!programKey) {
      return NextResponse.json({ error: "programKey required" }, { status: 400 });
    }

    const catalog = await getProgramProductPricing(programKey as ProgramKey);
    const terms = await Promise.all(
      PROGRAM_BILLING_TERM_OPTIONS.map(async (opt) => {
        try {
          const quote = await resolveProgramCheckoutQuote(programKey as ProgramKey, opt.term);
          return {
            term: opt.term,
            label: opt.label,
            dueTodayAud: quote.dueTodayAud,
            dueTodayLabel: quote.dueTodayLabel,
            recurringLabel: quote.recurringLabel,
            priceLabel: quote.priceLabel,
            recurringBillingPriceId: quote.recurring.id,
            firstMonthBillingPriceId: quote.firstMonth.id,
          };
        } catch {
          return { term: opt.term, label: opt.label, error: true };
        }
      })
    );

    return NextResponse.json({ programKey, catalog, terms });
  } catch (error) {
    console.error("[portal/program-pricing]", error);
    const message = error instanceof Error ? error.message : "Failed to load pricing";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
