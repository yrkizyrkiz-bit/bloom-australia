import { NextRequest, NextResponse } from "next/server";
import { resolveMembershipCheckoutOffer } from "@/lib/membership/checkout-product";

/** Public pricing for membership checkout, or the $79 liver product when selected. */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const offer = await resolveMembershipCheckoutOffer({
      product: searchParams.get("product"),
      button: searchParams.get("button"),
    });
    return NextResponse.json({
      productSlug: offer.slug,
      productName: offer.productName,
      amountCents: offer.amountCents,
      amountAud: offer.amountAud,
      priceLabel: offer.priceLabel,
      intervalLabel: offer.intervalLabel,
      autoRenew: offer.autoRenew,
    });
  } catch (error) {
    console.error("[public/membership-checkout/pricing]", error);
    return NextResponse.json({ error: "Failed to load pricing" }, { status: 500 });
  }
}
