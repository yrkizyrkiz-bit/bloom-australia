import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { confirmOrganCarePayment } from "@/lib/portal/organ-care-purchase";
import {
  deriveOrganCareQuizResult,
  organCareQuizMissingAnswers,
} from "@/lib/programs/quizzes/organ-care-intake-quiz";
import { savePortalQuizSubmission } from "@/lib/portal-quiz-submissions";
import { prisma } from "@/lib/prisma";
import { BIOMARKERS_PANEL_META } from "@/lib/programs/offers";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const body = await request.json().catch(() => ({}));
    const paymentIntentId = body?.paymentIntentId as string | undefined;
    if (!paymentIntentId) {
      return NextResponse.json({ error: "Missing paymentIntentId" }, { status: 400 });
    }

    const answers = (body?.answers ?? {}) as Record<string, string>;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { gender: true },
    });

    const missing = organCareQuizMissingAnswers(user?.gender, answers);
    if (missing.length > 0) {
      return NextResponse.json(
        { error: "Incomplete quiz answers", missing },
        { status: 400 }
      );
    }

    const result = deriveOrganCareQuizResult(answers, user?.gender);
    const activation = await confirmOrganCarePayment({ userId, paymentIntentId });

    const panelTier = body?.panelTier as "essential" | "extended" | "comprehensive" | undefined;
    const panel = panelTier ? BIOMARKERS_PANEL_META[panelTier] : null;

    await savePortalQuizSubmission({
      userId,
      programKey: "ORGAN_CARE",
      answers,
      intent: "organ_care_membership",
      result: {
        ...result,
        addBiomarkers: Boolean(body?.addBiomarkers),
        panelTier,
        selectedPanel: panel?.name,
        organCareTerm: body?.organCareTerm,
        paymentIntentId,
        paid: true,
      } as unknown as Record<string, unknown>,
    }).catch(() => undefined);

    if (body?.addBiomarkers && panelTier) {
      await savePortalQuizSubmission({
        userId,
        programKey: "BIOLOGICAL_CLOCK",
        answers,
        intent: "biomarker_testing",
        source: "in_portal",
        result: {
          ...result,
          selectedPanel: panel?.name ?? panelTier,
          panelTier,
          addOrganCare: true,
          organCareTerm: body?.organCareTerm,
          paymentIntentId,
          paid: true,
          bundledWithOrganCare: true,
        } as unknown as Record<string, unknown>,
      }).catch(() => undefined);
    }

    return NextResponse.json({
      success: true,
      alreadyProcessed: activation.alreadyProcessed,
      message:
        "Payment received. Our care team will review your intake and arrange clinically indicated blood tests.",
    });
  } catch (error) {
    console.error("[portal/organ-care-checkout/confirm]", error);
    const message = error instanceof Error ? error.message : "Failed to confirm payment";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
