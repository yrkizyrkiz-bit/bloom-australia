import { prisma } from "@/lib/prisma";
import { appendPublicFunnelQuizFromIntake } from "@/lib/portal/public-funnel-quiz-submission";
import { upsertProgramMemberEnrollment } from "@/lib/portal/program-member-upsert";
import { resolveMensHealthCanonicalKey } from "@/lib/funnel/public-consult-programs";
import type { ProgramKey } from "@/lib/membership/keys";

function hasHairQuizFields(data: Record<string, unknown>): boolean {
  return (
    data.programType === "HAIR_LOSS" ||
    typeof data.hairStage === "string" ||
    typeof data.hairLossTimeline === "string" ||
    typeof data.familyHistory === "string"
  );
}

function resolveProgramFromSource(sourceProgram: string | null | undefined): string | null {
  if (!sourceProgram) return null;
  if (sourceProgram === "hair_loss") return "HAIR_LOSS";
  if (sourceProgram === "mens_health") return "MENS_HEALTH";
  if (
    sourceProgram === "womens_health" ||
    sourceProgram === "womens_health_sexual" ||
    sourceProgram === "womens_health_vitality"
  ) {
    return "WOMENS_HEALTH";
  }
  return null;
}

function buildEnrollmentIntakeData(input: {
  sourceProgram: string;
  priorQuizAnswers: Record<string, unknown>;
  paymentIntentId?: string;
  programKey?: ProgramKey | null;
}) {
  const completedAt =
    (typeof input.priorQuizAnswers.completedAt === "string" &&
      input.priorQuizAnswers.completedAt) ||
    new Date().toISOString();

  if (input.sourceProgram === "hair_loss") {
    return {
      ...input.priorQuizAnswers,
      programType: "HAIR_LOSS",
      canonicalProgramKey: "HAIR_LOSS",
      completedAt,
      source: "hair_loss_biomarkers_checkout",
      paymentIntentId: input.paymentIntentId,
    };
  }

  if (input.sourceProgram === "mens_health") {
    const programKey =
      input.programKey ||
      resolveMensHealthCanonicalKey(
        typeof input.priorQuizAnswers.concern === "string"
          ? input.priorQuizAnswers.concern
          : ""
      );
    return {
      ...input.priorQuizAnswers,
      programType: "MENS_HEALTH",
      resolvedProgram: programKey,
      canonicalProgramKey: programKey,
      completedAt,
      source: "mens_health_biomarkers_checkout",
      paymentIntentId: input.paymentIntentId,
    };
  }

  return {
    ...input.priorQuizAnswers,
    programType: "WOMENS_HEALTH",
    resolvedProgram: input.programKey,
    canonicalProgramKey: input.programKey,
    completedAt,
    source: "womens_health_biomarkers_checkout",
    paymentIntentId: input.paymentIntentId,
  };
}

/** Persist program-funnel quiz answers as soon as checkout payment succeeds. */
export async function persistPriorProgramQuizAtCheckout(input: {
  userId: string;
  sourceProgram: string;
  priorQuizAnswers: Record<string, unknown>;
  paymentIntentId?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  dateOfBirth?: Date | null;
}) {
  const program = resolveProgramFromSource(input.sourceProgram);
  if (!program || Object.keys(input.priorQuizAnswers).length === 0) return;

  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: {
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      dateOfBirth: true,
    },
  });
  if (!user?.email) return;

  const programKey =
    program === "MENS_HEALTH"
      ? resolveMensHealthCanonicalKey(
          typeof input.priorQuizAnswers.concern === "string"
            ? input.priorQuizAnswers.concern
            : ""
        )
      : program === "HAIR_LOSS"
        ? ("HAIR_LOSS" as ProgramKey)
        : (typeof input.priorQuizAnswers.canonicalProgramKey === "string"
            ? (input.priorQuizAnswers.canonicalProgramKey as ProgramKey)
            : null);

  const intakeData = buildEnrollmentIntakeData({
    sourceProgram: input.sourceProgram,
    priorQuizAnswers: input.priorQuizAnswers,
    paymentIntentId: input.paymentIntentId,
    programKey,
  });

  await upsertProgramMemberEnrollment({
    userId: input.userId,
    email: user.email,
    program,
    firstName: input.firstName || user.firstName || String(input.priorQuizAnswers.firstName || ""),
    lastName: input.lastName || user.lastName || String(input.priorQuizAnswers.lastName || ""),
    mobile: input.phone || user.phone || String(input.priorQuizAnswers.phone || ""),
    dob: input.dateOfBirth || user.dateOfBirth || new Date(),
    intakeData,
    membershipStatus: "PENDING",
  });

  const existingQuiz = await prisma.portalQuizSubmission.findFirst({
    where: {
      userId: input.userId,
      programKey: programKey ?? program,
      source: "public_funnel",
    },
    select: { id: true },
    orderBy: { submittedAt: "desc" },
  });

  if (!existingQuiz) {
    await appendPublicFunnelQuizFromIntake({
      userId: input.userId,
      program,
      intakeData,
      source: "public_funnel",
    });
  }
}

/** Repair member quiz artifacts when payment completed but enrollment partially failed. */
export async function syncMemberQuizArtifacts(userId: string) {
  const [user, programMember, hairQuiz, sourceQuiz] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { subscriptionTier: true },
    }),
    prisma.programMember.findFirst({
      where: { OR: [{ userId }] },
      orderBy: { createdAt: "desc" },
    }),
    prisma.portalQuizSubmission.findFirst({
      where: { userId, programKey: "HAIR_LOSS" },
      select: { id: true },
    }),
    prisma.portalQuizSubmission.findFirst({
      where: {
        userId,
        intent: "public_biomarkers_checkout_skip_quiz",
      },
      orderBy: { submittedAt: "desc" },
      select: { result: true },
    }),
  ]);

  if (!user || !programMember) return;

  const intake =
    programMember.intakeData && typeof programMember.intakeData === "object"
      ? (programMember.intakeData as Record<string, unknown>)
      : null;

  const skipResult =
    sourceQuiz?.result && typeof sourceQuiz.result === "object"
      ? (sourceQuiz.result as Record<string, unknown>)
      : null;
  const sourceProgram =
    typeof skipResult?.sourceProgram === "string" ? skipResult.sourceProgram : null;

  const shouldBeHair =
    user.subscriptionTier === "hair_loss" || sourceProgram === "hair_loss";

  if (shouldBeHair && programMember.program !== "HAIR_LOSS") {
    await prisma.programMember.update({
      where: { id: programMember.id },
      data: { program: "HAIR_LOSS" },
    });
  }

  if (shouldBeHair && !hairQuiz && intake && hasHairQuizFields(intake)) {
    await appendPublicFunnelQuizFromIntake({
      userId,
      program: "HAIR_LOSS",
      intakeData: intake,
      source: "public_funnel",
    });
  }
}

export async function loadPriorQuizAnswersForEnrollment(input: {
  userId: string;
  sourceProgram?: string;
  bodyPriorQuizAnswers?: Record<string, unknown>;
}): Promise<Record<string, unknown> | undefined> {
  if (
    input.bodyPriorQuizAnswers &&
    Object.keys(input.bodyPriorQuizAnswers).length > 0
  ) {
    return input.bodyPriorQuizAnswers;
  }

  const programMember = await prisma.programMember.findFirst({
    where: { userId: input.userId },
    orderBy: { updatedAt: "desc" },
    select: { intakeData: true, program: true },
  });

  const intake =
    programMember?.intakeData && typeof programMember.intakeData === "object"
      ? (programMember.intakeData as Record<string, unknown>)
      : null;
  if (!intake) return undefined;

  if (input.sourceProgram === "hair_loss" || programMember?.program === "HAIR_LOSS") {
    if (hasHairQuizFields(intake)) return intake;
  }

  if (
    input.sourceProgram === "mens_health" ||
    programMember?.program === "MENS_HEALTH"
  ) {
    if (intake.programType === "MENS_HEALTH" || intake.concern) return intake;
  }

  if (
    input.sourceProgram?.startsWith("womens_health") ||
    programMember?.program === "WOMENS_HEALTH"
  ) {
    if (intake.programType === "WOMENS_HEALTH" || intake.category) return intake;
  }

  return undefined;
}
