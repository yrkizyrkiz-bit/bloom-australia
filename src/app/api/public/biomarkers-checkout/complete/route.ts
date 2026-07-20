import { NextRequest, NextResponse } from "next/server";
import { completePublicBiomarkersEnrollment } from "@/lib/portal/public-biomarkers-purchase";
import { loadPriorQuizAnswersForEnrollment } from "@/lib/portal/persist-prior-program-quiz";
import {
  derivePublicBiomarkersPanelQuizResult,
  publicBiomarkersQuizMissingAnswers,
} from "@/lib/biomarkers/public-biomarkers-panel-quiz";
import { isValidPublicPanelTier } from "@/lib/biomarkers/public-checkout-tier-map";
import { savePortalQuizSubmission } from "@/lib/portal-quiz-submissions";
import { prisma } from "@/lib/prisma";
import { signMagicLoginToken } from "@/lib/magic-link";
import { resolveAppBaseUrl } from "@/lib/app-base-url";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const userId = body?.userId as string | undefined;
    const paymentIntentId = body?.paymentIntentId as string | undefined;
    const publicPanelTier = body?.publicPanelTier as string | undefined;
    const skipQuiz = body?.skipQuiz === true;
    const sourceProgram =
      typeof body?.sourceProgram === "string" ? body.sourceProgram : undefined;
    const clientOrigin =
      typeof body?.clientOrigin === "string" ? body.clientOrigin : undefined;

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

    if (!skipQuiz) {
      const missing = publicBiomarkersQuizMissingAnswers(publicPanelTier, user.gender, answers);
      if (missing.length > 0) {
        return NextResponse.json(
          { error: "Incomplete quiz answers", missing },
          { status: 400 }
        );
      }
    }

    const quizResult = skipQuiz
      ? {
          publicPanelTier,
          suggestedPanel:
            publicPanelTier === "essential"
              ? "essential"
              : publicPanelTier === "advanced"
                ? "extended"
                : "comprehensive",
          skippedQuiz: true,
          sourceProgram: sourceProgram ?? "prior_program_assessment",
        }
      : derivePublicBiomarkersPanelQuizResult(publicPanelTier, answers, user.gender);

    const priorQuizAnswers = await loadPriorQuizAnswersForEnrollment({
      userId,
      sourceProgram,
      bodyPriorQuizAnswers:
        typeof body?.priorQuizAnswers === "object" && body.priorQuizAnswers
          ? (body.priorQuizAnswers as Record<string, unknown>)
          : undefined,
    });

    // Biomarkers panel quiz (or skip marker). Hair answers are saved separately as HAIR_LOSS.
    await savePortalQuizSubmission({
      userId,
      programKey: "BIOLOGICAL_CLOCK",
      answers: skipQuiz
        ? {
            _publicPanelTier: publicPanelTier,
            _skipQuiz: "true",
            _sourceProgram: sourceProgram ?? "prior_program_assessment",
          }
        : { ...answers, _publicPanelTier: publicPanelTier },
      intent: skipQuiz
        ? "public_biomarkers_checkout_skip_quiz"
        : "public_biomarkers_checkout",
      result: {
        ...quizResult,
        paymentIntentId,
        publicPanelTier,
        paid: true,
        skipQuiz,
        sourceProgram,
      } as unknown as Record<string, unknown>,
    });

    const enrollment = await completePublicBiomarkersEnrollment({
      userId,
      paymentIntentId,
      publicPanelTier,
      quizAnswers: answers,
      quizResult: quizResult as unknown as Record<string, unknown>,
      skipQuiz,
      sourceProgram,
      priorQuizAnswers,
    });

    const userForLink = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, passwordHash: true, subscriptionTier: true },
    });

    let magicLink: string | null = null;
    if (userForLink?.email) {
      const token = signMagicLoginToken(userForLink.id, userForLink.email);
      const baseUrl = resolveAppBaseUrl({ clientOrigin, request });
      const redirectPath =
        sourceProgram === "hair_loss"
          ? "/dashboard/programs?onboarding=hair-biomarkers"
          : sourceProgram === "womens_health" ||
              sourceProgram === "womens_health_sexual" ||
              sourceProgram === "womens_health_vitality"
            ? "/dashboard/womens-health?onboarding=womens-biomarkers"
          : "/dashboard/programs";
      magicLink = `${baseUrl}/auth/magic?token=${encodeURIComponent(token)}&redirect=${encodeURIComponent(redirectPath)}`;
    }

    return NextResponse.json({
      success: true,
      alreadyProcessed: enrollment.alreadyProcessed,
      magicLink,
      needsPassword: Boolean(userForLink && !userForLink.passwordHash),
      subscriptionTier: userForLink?.subscriptionTier ?? null,
      message: "Your biomarkers program is active. Set your password to open your portal.",
    });
  } catch (error) {
    console.error("[public/biomarkers-checkout/complete]", error);
    const message = error instanceof Error ? error.message : "Failed to complete enrollment";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
