import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  biomarkersQuizMissingAnswers,
  deriveBiomarkersQuizResult,
} from "@/lib/programs/quizzes/biomarkers-intake-quiz";
import { savePortalQuizSubmission } from "@/lib/portal-quiz-submissions";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const body = await request.json().catch(() => ({}));
    const answers = (body?.answers ?? {}) as Record<string, string>;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true, gender: true, assignedCarePartnerId: true },
    });

    const missing = biomarkersQuizMissingAnswers(user?.gender, answers);
    if (missing.length > 0) {
      return NextResponse.json(
        {
          error: "Incomplete quiz, please answer every section before submitting.",
          missing,
        },
        { status: 400 }
      );
    }

    const result = deriveBiomarkersQuizResult(answers, user?.gender);

    const submission = await savePortalQuizSubmission({
      userId,
      programKey: "BIOLOGICAL_CLOCK",
      answers,
      intent: "biomarker_testing",
      result: result as unknown as Record<string, unknown>,
    });

    const warnings: string[] = [];

    // Paid activation happens via biomarkers-checkout after Stripe payment, no free entitlement here.
    try {
      const existing = await prisma.careCommunication.findFirst({
        where: {
          userId,
          type: "BIOMARKER_TESTING_REQUEST",
          status: { in: ["PENDING", "IN_PROGRESS"] },
        },
        orderBy: { createdAt: "desc" },
      });

      const notes = `Member completed the Get My Biomarkers clinical intake quiz.

Primary goal: ${result.primaryGoal}
Suggested panel: ${result.suggestedPanel}
Medicare-eligible indications documented: ${result.hasMedicareEligibleIndications ? "Yes" : "Review required"}

${result.doctorSummary}

Raw quiz answers:
${JSON.stringify(answers, null, 2)}

Action: AHPRA doctor to review clinical indications, request Medicare-eligible pathology where criteria are met, and arrange Sanative extended panel / collection for biological age markers.`;

      if (existing) {
        await prisma.careCommunication.update({
          where: { id: existing.id },
          data: {
            notes,
            subject: `Biomarkers intake: ${user?.firstName || ""} ${user?.lastName || ""}`.trim(),
          },
        });
      } else {
        await prisma.careCommunication.create({
          data: {
            userId,
            type: "BIOMARKER_TESTING_REQUEST",
            priority: result.sections.some((s) => s.priority === "high") ? "HIGH" : "NORMAL",
            subject: `Biomarkers intake: ${user?.firstName || ""} ${user?.lastName || ""}`.trim(),
            notes,
            status: "PENDING",
            dueDate: new Date(Date.now() + 48 * 60 * 60 * 1000),
            assignedTo: user?.assignedCarePartnerId || undefined,
          },
        });
      }
    } catch (careError) {
      console.error("[portal/biomarkers-quiz] care task failed:", careError);
      warnings.push("Quiz saved but care team task could not be created.");
    }

    return NextResponse.json({
      success: true,
      submissionId: submission.id,
      result,
      warnings,
      message:
        "Thank you. A doctor will review your clinical indications and our care team will arrange the right pathology, including Medicare-eligible tests where appropriate.",
    });
  } catch (error) {
    console.error("[portal/biomarkers-quiz]", error);
    return NextResponse.json({ error: "Failed to submit quiz" }, { status: 500 });
  }
}
