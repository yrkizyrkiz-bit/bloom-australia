import { NextResponse } from "next/server";
import { getSanativeMembershipPricing } from "@/lib/portal/sanative-membership";

/** Public pricing for the consolidated Sanative Membership checkout. */
export async function GET() {
  try {
    const pricing = await getSanativeMembershipPricing();
    return NextResponse.json({
      productName: pricing.productName,
      amountCents: pricing.amountCents,
      amountAud: pricing.amountAud,
      priceLabel: pricing.priceLabel,
    });
  } catch (error) {
    console.error("[public/membership-checkout/pricing]", error);
    return NextResponse.json({ error: "Failed to load pricing" }, { status: 500 });
  }
}
