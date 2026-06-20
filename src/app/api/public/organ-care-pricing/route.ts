import { NextResponse } from "next/server";
import { getPublicOrganCareAnnualPricing } from "@/lib/billing/portal-pricing";
import { ORGAN_CARE_PUBLIC_OFFER } from "@/lib/programs/organ-care-public-offer";

/** Public organ care pricing for marketing pages and checkout (no auth required). */
export async function GET() {
  try {
    const pricing = await getPublicOrganCareAnnualPricing();
    return NextResponse.json({
      ...ORGAN_CARE_PUBLIC_OFFER,
      amountCents: pricing.amountCents,
      amountAud: pricing.amountAud,
      priceLabel: pricing.priceLabel,
    });
  } catch (error) {
    console.error("[public/organ-care-pricing]", error);
    return NextResponse.json({
      ...ORGAN_CARE_PUBLIC_OFFER,
      amountCents: ORGAN_CARE_PUBLIC_OFFER.priceAud * 100,
      amountAud: ORGAN_CARE_PUBLIC_OFFER.priceAud,
      priceLabel: ORGAN_CARE_PUBLIC_OFFER.priceLabel,
    });
  }
}
