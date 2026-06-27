import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { confirmBiomarkersPanelPayment } from "@/lib/portal/biomarkers-purchase";
import {
  biomarkersQuizMissingAnswers,
  deriveBiomarkersQuizResult,
} from "@/lib/programs/quizzes/biomarkers-intake-quiz";
import { savePortalQuizSubmission } from "@/lib/portal-quiz-submissions";
import { prisma } from "@/lib/prisma";
import { BIOMARKERS_PANEL_META } from "@/lib/programs/offers";
import { requirePrePaymentConsent } from "@/lib/legal/require-pre-payment-consent";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const body = await request.json().catch(() => ({}));
    const paymentIntentId = body?.paymentIntentId as string | undefined;
    const consentRecordId = body?.consentRecordId as string | undefined;
    if (!paymentIntentId) {
      return NextResponse.json({ error: "Missing paymentIntentId" }, { status: 400 });
    }

    const consentVerification = await requirePrePaymentConsent({
      consentRecordId,
      userId,
      email: session.user.email ?? undefined,
    });

    if (!consentVerification.ok) {
      return NextResponse.json(
        { error: consentVerification.error },
        { status: consentVerification.status }
      );
    }

    const answers = (body?.answers ?? {}) as Record<string, string>;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { gender: true },
    });

    const missing = biomarkersQuizMissingAnswers(user?.gender, answers);
    if (missing.length > 0) {
      return NextResponse.json(
        { error: "Incomplete quiz answers", missing },
        { status: 400 }
      );
    }

    const result = deriveBiomarkersQuizResult(answers, user?.gender);
    const activation = await confirmBiomarkersPanelPayment({ userId, paymentIntentId });

    const panelTier = body?.panelTier as "essential" | "extended" | "comprehensive";
    const panel = panelTier ? BIOMARKERS_PANEL_META[panelTier] : null;

    await savePortalQuizSubmission({
      userId,
      programKey: "BIOLOGICAL_CLOCK",
      answers,
      intent: "biomarker_testing",
      result: {
        ...result,
        selectedPanel: panel?.name ?? result.suggestedPanel,
        panelTier,
        addOrganCare: Boolean(body?.addOrganCare),
        organCareTerm: body?.organCareTerm,
        paymentIntentId,
        paid: true,
      } as unknown as Record<string, unknown>,
    }).catch(() => undefined);

    return NextResponse.json({
      success: true,
      alreadyProcessed: activation.alreadyProcessed,
      message:
        "Payment received. Our care team will book your consultation and arrange your biomarker panel.",
    });
  } catch (error) {
    console.error("[portal/biomarkers-checkout/confirm]", error);
    const message = error instanceof Error ? error.message : "Failed to confirm payment";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
