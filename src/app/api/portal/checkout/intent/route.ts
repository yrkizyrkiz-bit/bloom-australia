import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createPortalProgramPaymentIntent } from "@/lib/portal/program-purchase";
import { isProgramBillingTerm } from "@/lib/programs/offers";
import { savePortalQuizSubmission } from "@/lib/portal-quiz-submissions";
import { enqueuePortalPurchaseTriage } from "@/lib/portal/triage-enqueue";
import { PROGRAM_LABELS } from "@/lib/membership/keys";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const billingTerm = body?.billingTerm ?? "1m";
    if (!isProgramBillingTerm(billingTerm)) {
      return NextResponse.json({ error: "Invalid billing term" }, { status: 400 });
    }

    const result = await createPortalProgramPaymentIntent({
      userId: session.user.id,
      programKey: body?.programKey,
      billingTerm,
      answers: body?.answers,
      intent: body?.intent ?? "program_subscription",
    });

    if ("includedCare" in result && result.includedCare) {
      await savePortalQuizSubmission({
        userId: session.user.id,
        programKey: result.programKey,
        answers: body?.answers ?? {},
        intent: body?.intent ?? "program_subscription",
        result: {
          includedCare: true,
          billingTerm,
          priceLabel: result.priceLabel,
          paid: false,
        },
      }).catch(() => undefined);

      const label =
        PROGRAM_LABELS[result.programKey as keyof typeof PROGRAM_LABELS] ?? result.label;
      await enqueuePortalPurchaseTriage({
        source: "portal_upsell",
        userId: session.user.id,
        paymentIntentId: `included-care:${session.user.id}:${result.programKey}`,
        programKey: result.programKey,
        priceLabel: result.priceLabel,
        label: `${label} (included care)`,
      }).catch(() => undefined);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("[portal/checkout/intent]", error);
    const message = error instanceof Error ? error.message : "Failed to create payment";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
