import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  createBiomarkersPanelPaymentIntent,
  isValidPanelTier,
} from "@/lib/portal/biomarkers-purchase";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const panelTier = body?.panelTier as string;
    if (!isValidPanelTier(panelTier)) {
      return NextResponse.json({ error: "Invalid panel tier" }, { status: 400 });
    }

    const organCareTerm = body?.organCareTerm as string | undefined;

    const result = await createBiomarkersPanelPaymentIntent({
      userId: session.user.id,
      panelTier,
      addOrganCare: Boolean(body?.addOrganCare),
      organCareTerm:
        organCareTerm === "monthly" || organCareTerm === "annual"
          ? organCareTerm
          : undefined,
      quizAnswers: body?.answers,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[portal/biomarkers-checkout/intent]", error);
    const message = error instanceof Error ? error.message : "Failed to create payment";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
