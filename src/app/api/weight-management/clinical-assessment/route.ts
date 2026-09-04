import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { savePortalQuizSubmission } from "@/lib/portal-quiz-submissions";
import {
  areClinicalAnswersComplete,
  emptyWeightManagementClinicalAnswers,
  readClinicalAnswersFromIntake,
  resolveWeightManagementClinicalStatus,
  WM_CLINICAL_ASSESSMENT_SOURCE,
  type WeightManagementClinicalAnswers,
} from "@/lib/programs/quizzes/weight-management-clinical-quiz";

export const dynamic = "force-dynamic";

function quizGenderFromUser(gender: string | null | undefined) {
  const value = (gender || "").toLowerCase();
  if (value === "male" || value === "female") return value;
  return null;
}

function asQuizData(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

async function loadIntakeQuizData(userId: string) {
  const [intake, user] = await Promise.all([
    prisma.weightManagementIntake.findFirst({
      where: { userId },
      select: { id: true, quizData: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { gender: true, email: true },
    }),
  ]);
  return { intake, user, quizData: asQuizData(intake?.quizData) };
}

async function persistClinicalNotes(
  userId: string,
  _answers: WeightManagementClinicalAnswers
) {
  await prisma.internalNote.deleteMany({
    where: {
      userId,
      createdBy: "system",
      category: "MEDICAL",
      OR: [
        { title: { startsWith: "Triage," } },
        {
          title: {
            in: [
              "Patient Motivations",
              "Previous Weight Loss Attempts",
              "Previous Treatment",
              "Exercise Frequency",
              "Waist Measurement",
              "Preferred Start Timing",
            ],
          },
        },
      ],
    },
  });
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { user, quizData } = await loadIntakeQuizData(session.user.id);
    const status = resolveWeightManagementClinicalStatus(quizData);

    return NextResponse.json({
      status,
      gender: quizGenderFromUser(user?.gender) ?? quizGenderFromUser(quizData.gender as string),
      answers:
        status === "complete"
          ? readClinicalAnswersFromIntake(quizData)
          : emptyWeightManagementClinicalAnswers(),
    });
  } catch (error) {
    console.error("[weight-management/clinical-assessment GET]", error);
    return NextResponse.json({ error: "Failed to load clinical assessment" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const action = body?.action as string | undefined;
    const { intake, user, quizData } = await loadIntakeQuizData(session.user.id);

    if (action === "defer") {
      const nextQuizData = {
        ...quizData,
        clinicalHistoryDeferredAt: new Date().toISOString(),
      };
      if (intake) {
        await prisma.weightManagementIntake.update({
          where: { id: intake.id },
          data: { quizData: nextQuizData },
        });
      }
      return NextResponse.json({ status: "deferred" });
    }

    if (action !== "complete") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const answers: WeightManagementClinicalAnswers = {
      metabolicConditions: Array.isArray(body.metabolicConditions) ? body.metabolicConditions : [],
      digestiveConditions: Array.isArray(body.digestiveConditions) ? body.digestiveConditions : [],
      cardiovascularConditions: Array.isArray(body.cardiovascularConditions)
        ? body.cardiovascularConditions
        : [],
      mentalHealthConditions: Array.isArray(body.mentalHealthConditions)
        ? body.mentalHealthConditions
        : [],
      seriousConditions: Array.isArray(body.seriousConditions) ? body.seriousConditions : [],
      currentMedications: Array.isArray(body.currentMedications) ? body.currentMedications : [],
    };

    if (!areClinicalAnswersComplete(answers)) {
      return NextResponse.json(
        { error: "Please answer every clinical question" },
        { status: 400 }
      );
    }

    const completedAt = new Date().toISOString();
    const nextQuizData: Record<string, unknown> = {
      ...quizData,
      ...answers,
      clinicalHistoryCompletedAt: completedAt,
    };
    delete nextQuizData.clinicalHistoryDeferredAt;

    if (intake) {
      await prisma.weightManagementIntake.update({
        where: { id: intake.id },
        data: { quizData: nextQuizData },
      });
    } else {
      await prisma.weightManagementIntake.create({
        data: {
          userId: session.user.id,
          quizData: nextQuizData,
          portalStatus: "INTAKE_STARTED",
          paymentStatus: "UNPAID",
          doctorReviewStatus: "PENDING_TRIAGE",
          bookingStatus: "NOT_BOOKED",
        },
      });
    }

    if (user?.email) {
      await prisma.programMember.updateMany({
        where: {
          program: "WEIGHT_MANAGEMENT",
          OR: [{ userId: session.user.id }, { email: user.email }],
        },
        data: {
          intakeData: nextQuizData,
        },
      });
    }

    await persistClinicalNotes(session.user.id, answers);
    await savePortalQuizSubmission({
      userId: session.user.id,
      programKey: "WEIGHT_MANAGEMENT",
      answers,
      intent: "clinical_assessment",
      source: WM_CLINICAL_ASSESSMENT_SOURCE,
      result: { completedAt },
    }).catch(() => undefined);

    return NextResponse.json({ status: "complete" });
  } catch (error) {
    console.error("[weight-management/clinical-assessment POST]", error);
    return NextResponse.json({ error: "Failed to save clinical assessment" }, { status: 500 });
  }
}
