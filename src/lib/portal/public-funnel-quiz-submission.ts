import { prisma } from "@/lib/prisma";
import { resolveProgramMemberProgramKey } from "@/lib/membership/entitlement-service";
import type { ProgramKey } from "@/lib/membership/keys";
import { savePortalQuizSubmission } from "@/lib/portal-quiz-submissions";

const STRIP_FROM_ANSWERS = new Set([
  "email",
  "confirmEmail",
  "phone",
  "firstName",
  "lastName",
  "cardNumber",
  "cardExpiry",
  "cardCvc",
  "cardName",
  "cardNameOnCard",
  "selectedSlotId",
  "discountCode",
  "agreedToTerms",
  "confirmedAccurate",
  "howHeard",
]);

export function sanitizePublicFunnelIntakeAnswers(
  intake: Record<string, unknown>
): Record<string, unknown> {
  const answers: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(intake)) {
    if (STRIP_FROM_ANSWERS.has(key)) continue;
    if (value == null || value === "") continue;
    answers[key] = value;
  }
  return answers;
}

export function resolvePublicFunnelProgramKey(
  program: string | null | undefined,
  intake: Record<string, unknown>
): ProgramKey | null {
  return resolveProgramMemberProgramKey({
    program,
    intakeData: intake,
  });
}

/** Persist public website assessment answers on the member record (Program Quizzes tab). */
export async function savePublicFunnelQuizFromIntake(input: {
  userId: string;
  program?: string | null;
  intakeData: Record<string, unknown>;
  source?: string;
}) {
  const programKey = resolvePublicFunnelProgramKey(input.program, input.intakeData);
  if (!programKey) return null;

  const existing = await prisma.portalQuizSubmission.findFirst({
    where: {
      userId: input.userId,
      programKey,
      source: input.source ?? "public_funnel",
    },
    select: { id: true },
  });
  if (existing) return existing;

  const answers = sanitizePublicFunnelIntakeAnswers(input.intakeData);

  return savePortalQuizSubmission({
    userId: input.userId,
    programKey,
    answers,
    result: {
      source: "public_funnel",
      programType: input.program,
      canonicalProgramKey: input.intakeData.canonicalProgramKey,
      completedAt: input.intakeData.completedAt ?? new Date().toISOString(),
    },
    intent: "public_assessment",
    source: input.source ?? "public_funnel",
  });
}

/** Backfill helper when loading CRM if payment saved intake but not PortalQuizSubmission. */
export async function ensurePublicFunnelQuizOnMember(input: {
  userId: string;
  program?: string | null;
  intakeData: Record<string, unknown> | null | undefined;
}) {
  if (!input.intakeData || typeof input.intakeData !== "object") return null;
  return savePublicFunnelQuizFromIntake({
    userId: input.userId,
    program: input.program,
    intakeData: input.intakeData as Record<string, unknown>,
  });
}
