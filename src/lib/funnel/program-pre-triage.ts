import { prisma } from "@/lib/prisma";
import type { PublicConsultProgram } from "./public-consult-programs";
import { genderForPublicConsultSlug } from "./program-gender";

export type CreateProgramPreTriageInput = {
  userId: string;
  bookingId: string;
  patientName: string;
  scheduledAt: Date;
  intakeId?: string | null;
  program: PublicConsultProgram;
  /** Extra context stored in task notes JSON (concern, category, etc.). */
  context?: Record<string, unknown>;
};

/** Idempotent pre-triage task after a confirmed public consult booking. */
export async function createProgramPreTriageTask(
  input: CreateProgramPreTriageInput
): Promise<void> {
  const existing = await prisma.preTriageTask.findFirst({
    where: { bookingId: input.bookingId },
    select: { id: true },
  });
  if (existing) return;

  const dueDate = new Date(input.scheduledAt);
  dueDate.setHours(dueDate.getHours() - 24);

  let assignedOwnerId: string | null = null;
  try {
    const carePartners = await prisma.user.findMany({
      where: { role: "CARE_PARTNER" },
      select: { id: true },
    });
    if (carePartners.length > 0) {
      assignedOwnerId = carePartners[0].id;
    }
  } catch (e) {
    console.error("[pre-triage] care partner lookup failed:", e);
  }

  const isWeightManagement = input.program.isWeightManagement;
  const notes = JSON.stringify({
    programSlug: input.program.slug,
    programLabel: input.program.label,
    source: "public_consult_booking",
    ...input.context,
  });

  await prisma.preTriageTask.create({
    data: {
      patientId: input.userId,
      intakeId: input.intakeId || null,
      bookingId: input.bookingId,
      assignedOwnerId,
      dueDate,
      status: "PENDING",
      quizComplete: !isWeightManagement,
      phoneConfirmed: false,
      appointmentConfirmed: !isWeightManagement,
      medicationsChecked: false,
      allergiesChecked: false,
      riskFlagsChecked: false,
      bmiChecked: false,
      briefAttached: false,
      readyForDoctor: false,
      notes,
    },
  });

  const existingPatient = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { assignedCarePartnerId: true },
  });
  const carePartnerId =
    existingPatient?.assignedCarePartnerId ?? assignedOwnerId;

  const programGender = genderForPublicConsultSlug(input.program.slug);

  await prisma.user.update({
    where: { id: input.userId },
    data: {
      journeyStatus: "PRE_TRIAGE_PENDING",
      memberStatus: "MEMBER",
      ...(programGender ? { gender: programGender } : {}),
      ...(carePartnerId ? { assignedCarePartnerId: carePartnerId } : {}),
    },
  });

  if (assignedOwnerId) {
    await prisma.notification
      .create({
        data: {
          userId: assignedOwnerId,
          type: "INFO",
          title: `New ${input.program.label} pre-triage`,
          message: `${input.patientName} booked a consultation on ${input.scheduledAt.toLocaleDateString("en-AU", {
            weekday: "long",
            day: "numeric",
            month: "long",
            hour: "numeric",
            minute: "2-digit",
          })}. Review intake before the doctor call.`,
          isRead: false,
        },
      })
      .catch(() => undefined);
  }
}

/** Onboarding triage for subscription-only public flows (e.g. organ care). */
export async function createOnboardingPreTriageTask(input: {
  userId: string;
  programLabel: string;
  programSlug: string;
  paymentIntentId: string;
  context?: Record<string, unknown>;
}): Promise<void> {
  const existing = await prisma.preTriageTask.findFirst({
    where: {
      patientId: input.userId,
      notes: { contains: input.paymentIntentId },
    },
    select: { id: true },
  });
  if (existing) return;

  let assignedOwnerId: string | null = null;
  const partner = await prisma.user.findFirst({
    where: { role: "CARE_PARTNER" },
    select: { id: true },
  });
  assignedOwnerId = partner?.id ?? null;

  const dueDate = new Date(Date.now() + 48 * 60 * 60 * 1000);
  const notes = JSON.stringify({
    programSlug: input.programSlug,
    programLabel: input.programLabel,
    source: "public_subscription",
    paymentIntentId: input.paymentIntentId,
    appointmentConfirmed: false,
    ...input.context,
  });

  await prisma.preTriageTask.create({
    data: {
      patientId: input.userId,
      assignedOwnerId,
      dueDate,
      status: "PENDING",
      quizComplete: true,
      appointmentConfirmed: false,
      notes,
    },
  });

  if (assignedOwnerId) {
    await prisma.notification
      .create({
        data: {
          userId: assignedOwnerId,
          type: "INFO",
          title: `New ${input.programLabel} member`,
          message: `A member completed ${input.programLabel} checkout. Schedule onboarding consultation.`,
          isRead: false,
        },
      })
      .catch(() => undefined);
  }
}
