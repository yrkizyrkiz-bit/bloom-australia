import { NextResponse } from "next/server";
import { completePublicBiomarkersEnrollment } from "@/lib/portal/public-biomarkers-purchase";
import {
  derivePublicBiomarkersPanelQuizResult,
  publicBiomarkersQuizMissingAnswers,
} from "@/lib/biomarkers/public-biomarkers-panel-quiz";
import { isValidPublicPanelTier } from "@/lib/biomarkers/public-checkout-tier-map";
import { savePortalQuizSubmission } from "@/lib/portal-quiz-submissions";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const userId = body?.userId as string | undefined;
    const paymentIntentId = body?.paymentIntentId as string | undefined;
    const publicPanelTier = body?.publicPanelTier as string | undefined;

    if (!userId || !paymentIntentId || !isValidPublicPanelTier(publicPanelTier)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const answers = (body?.answers ?? {}) as Record<string, string>;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, gender: true, email: true },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const missing = publicBiomarkersQuizMissingAnswers(publicPanelTier, user.gender, answers);
    if (missing.length > 0) {
      return NextResponse.json(
        { error: "Incomplete quiz answers", missing },
        { status: 400 }
      );
    }

    const quizResult = derivePublicBiomarkersPanelQuizResult(
      publicPanelTier,
      answers,
      user.gender
    );

    await savePortalQuizSubmission({
      userId,
      programKey: "BIOLOGICAL_CLOCK",
      answers: { ...answers, _publicPanelTier: publicPanelTier },
      intent: "public_biomarkers_checkout",
      result: {
        ...quizResult,
        paymentIntentId,
        publicPanelTier,
        paid: true,
      } as unknown as Record<string, unknown>,
    });

    const enrollment = await completePublicBiomarkersEnrollment({
      userId,
      paymentIntentId,
      publicPanelTier,
      quizAnswers: answers,
      quizResult: quizResult as unknown as Record<string, unknown>,
    });

    return NextResponse.json({
      success: true,
      alreadyProcessed: enrollment.alreadyProcessed,
      message: "Your biomarkers program is active. Sign in to your portal to get started.",
    });
  } catch (error) {
    console.error("[public/biomarkers-checkout/complete]", error);
    const message = error instanceof Error ? error.message : "Failed to complete enrollment";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
