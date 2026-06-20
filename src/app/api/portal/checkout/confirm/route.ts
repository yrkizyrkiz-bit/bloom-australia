import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { confirmPortalProgramPayment } from "@/lib/portal/program-purchase";
import { savePortalQuizSubmission } from "@/lib/portal-quiz-submissions";
import { normalizeProgramKey, PROGRAM_LABELS } from "@/lib/membership/keys";
import { resolveProgramCheckoutQuote } from "@/lib/billing/portal-pricing";
import { isProgramBillingTerm } from "@/lib/programs/offers";
import { getSexualHealthFocusLabel } from "@/lib/programs/quizzes/sexual-health-quiz";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const paymentIntentId = body?.paymentIntentId as string | undefined;
    if (!paymentIntentId) {
      return NextResponse.json({ error: "Missing paymentIntentId" }, { status: 400 });
    }

    const activation = await confirmPortalProgramPayment({
      userId: session.user.id,
      paymentIntentId,
    });

    const programKey = normalizeProgramKey(activation.programKey);
    if (programKey) {
      const billingTerm = isProgramBillingTerm(body?.billingTerm)
        ? body.billingTerm
        : "1m";
      const quote = await resolveProgramCheckoutQuote(programKey, billingTerm);
      const label = PROGRAM_LABELS[programKey];
      const treatmentFocus = body?.answers?.treatmentFocus as string | undefined;
      const focusText = treatmentFocus
        ? getSexualHealthFocusLabel(programKey, treatmentFocus)
        : label;

      await savePortalQuizSubmission({
        userId: session.user.id,
        programKey,
        answers: body?.answers ?? {},
        intent: "program_subscription",
        result: {
          focusLabel: focusText,
          priceLabel: quote.priceLabel,
          billingTerm,
          paymentIntentId,
          paid: true,
        },
      }).catch(() => undefined);
    }

    return NextResponse.json({
      success: true,
      programKey: activation.programKey,
      alreadyProcessed: activation.alreadyProcessed,
      message: programKey
        ? `Subscription started. Your first billing period includes your ${PROGRAM_LABELS[programKey]} doctor consultation — our care team will book that shortly.`
        : "Subscription payment received.",
    });
  } catch (error) {
    console.error("[portal/checkout/confirm]", error);
    const message = error instanceof Error ? error.message : "Failed to confirm payment";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
