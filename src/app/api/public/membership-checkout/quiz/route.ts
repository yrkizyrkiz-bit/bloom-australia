import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { savePortalQuizSubmission } from "@/lib/portal-quiz-submissions";
import { hasProcessedPortalPayment } from "@/lib/portal/purchase-invoice";
import {
  biomarkersQuizMissingAnswers,
  deriveBiomarkersQuizResult,
  resolveBiomarkersQuizGender,
} from "@/lib/programs/quizzes/biomarkers-intake-quiz";

/**
 * Persist the clinical intake quiz completed inside the membership funnel.
 * Answers are stored as a PortalQuizSubmission so the care team and doctor
 * see them during triage and the consultation.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const userId = body?.userId as string | undefined;
    const paymentIntentId = body?.paymentIntentId as string | undefined;
    const answers = (body?.answers ?? {}) as Record<string, string>;
    const intentProgram =
      typeof body?.intentProgram === "string" ? body.intentProgram : null;
    const skipped = body?.skipped === true;

    if (!userId || !paymentIntentId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // The quiz may only be attached to a real, paid activation.
    const [user, paid] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { id: true, gender: true } }),
      hasProcessedPortalPayment(paymentIntentId),
    ]);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    if (!paid) {
      return NextResponse.json({ error: "Payment not found" }, { status: 400 });
    }

    if (!skipped) {
      const missing = biomarkersQuizMissingAnswers(user.gender, answers);
      if (missing.length > 0) {
        return NextResponse.json(
          { error: "Incomplete quiz answers", missing },
          { status: 400 }
        );
      }

      // Persist clinical sex onto the member profile when they answered it in-funnel.
      // User.gender defaults to OTHER, so treat OTHER/unset as needing an update —
      // `!user.gender` is never true for a normal member row.
      const resolved = resolveBiomarkersQuizGender(user.gender, answers.clinicalSex);
      const profileUnset =
        !user.gender ||
        user.gender === "OTHER" ||
        resolveBiomarkersQuizGender(user.gender) === "neutral";
      if ((resolved === "male" || resolved === "female") && profileUnset) {
        await prisma.user
          .update({
            where: { id: userId },
            data: { gender: resolved === "male" ? "MALE" : "FEMALE" },
          })
          .catch((err) =>
            console.error("[membership-checkout/quiz] gender persist failed:", err)
          );
      }
    }

    const result = skipped
      ? { skippedQuiz: true }
      : (deriveBiomarkersQuizResult(answers, user.gender) as unknown as Record<
          string,
          unknown
        >);

    await savePortalQuizSubmission({
      userId,
      programKey: "BIOLOGICAL_CLOCK",
      answers: skipped ? { _skipQuiz: "true" } : answers,
      intent: skipped
        ? "membership_checkout_skip_quiz"
        : "membership_checkout_intake",
      source: "membership_funnel",
      result: {
        ...result,
        paymentIntentId,
        intentProgram,
        membershipFunnel: true,
      } as unknown as Record<string, unknown>,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[public/membership-checkout/quiz]", error);
    return NextResponse.json({ error: "Failed to save quiz" }, { status: 500 });
  }
}
