import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createOrganCarePaymentIntent } from "@/lib/portal/organ-care-purchase";
import { isBiomarkersPanelTier, isOrganCareBillingTerm } from "@/lib/programs/offers";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const organCareTerm = body?.organCareTerm as string | undefined;
    const panelTier = body?.panelTier as string | undefined;

    const result = await createOrganCarePaymentIntent({
      userId: session.user.id,
      organCareTerm:
        organCareTerm && isOrganCareBillingTerm(organCareTerm) ? organCareTerm : "annual",
      addBiomarkers: Boolean(body?.addBiomarkers),
      panelTier: panelTier && isBiomarkersPanelTier(panelTier) ? panelTier : "essential",
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[portal/organ-care-checkout/intent]", error);
    const message = error instanceof Error ? error.message : "Failed to create payment";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
