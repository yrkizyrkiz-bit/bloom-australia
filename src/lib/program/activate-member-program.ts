import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import {
  generateDoseDates,
  parseDoseIntervalDays,
  startOfDayUTC,
} from "./dose-schedule";

/** Days after activation before the first scheduled dose (program week 1 is dose-free). */
export const FIRST_DOSE_OFFSET_DAYS = 7;

export type ActivateMemberProgramResult = {
  activated: boolean;
  alreadyActive: boolean;
  firstDoseDate: string;
  activationDate: string;
};

export async function activateMemberProgram(
  userId: string,
  activatedBy: string
): Promise<ActivateMemberProgramResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      journeyStatus: true,
    },
  });

  if (!user) {
    throw new Error("Member not found");
  }

  if (user.journeyStatus === "ACTIVE") {
    return {
      activated: false,
      alreadyActive: true,
      firstDoseDate: "",
      activationDate: "",
    };
  }

  const pendingPathology = await prisma.careCommunication.findFirst({
    where: {
      userId,
      type: "PATHOLOGY_REQUEST",
      status: "PENDING",
    },
  });

  if (pendingPathology) {
    throw new Error(
      "Cannot activate program while pathology review is pending"
    );
  }

  const activationDate = startOfDayUTC(new Date());
  const firstDoseDate = new Date(activationDate);
  firstDoseDate.setUTCDate(firstDoseDate.getUTCDate() + FIRST_DOSE_OFFSET_DAYS);

  const prescription = await prisma.prescription.findFirst({
    where: {
      patientId: userId,
      category: "WEIGHT_MANAGEMENT",
      status: "ACTIVE",
    },
    orderBy: { createdAt: "desc" },
  });

  if (prescription) {
    await prisma.prescription.update({
      where: { id: prescription.id },
      data: { startDate: firstDoseDate },
    });

    let treatment = await prisma.treatment.findFirst({
      where: { userId, prescriptionId: prescription.id },
    });

    if (!treatment) {
      const { ensureMemberProgram } = await import("./start-program");
      await ensureMemberProgram(userId, prescription.id);
      treatment = await prisma.treatment.findFirst({
        where: { userId, prescriptionId: prescription.id },
      });
    }

    if (treatment) {
      await prisma.medicationDose.deleteMany({
        where: { treatmentId: treatment.id, takenAt: null },
      });

      const intervalDays = parseDoseIntervalDays(prescription.frequency);
      const doseDates = generateDoseDates(
        firstDoseDate,
        intervalDays,
        12
      );

      if (doseDates.length > 0) {
        await prisma.medicationDose.createMany({
          data: doseDates.map((scheduledAt) => ({
            treatmentId: treatment!.id,
            scheduledAt,
          })),
        });
      }

      await prisma.treatment.update({
        where: { id: treatment.id },
        data: {
          startDate: firstDoseDate,
          nextDoseDate: firstDoseDate,
          isActive: true,
        },
      });
    }
  }

  const memberProgram = await prisma.memberProgram.findUnique({
    where: { userId },
  });

  if (memberProgram) {
    await prisma.memberProgram.update({
      where: { id: memberProgram.id },
      data: {
        startedAt: activationDate,
        currentWeek: 1,
        isActive: true,
        phase: "INDUCTION",
      },
    });
  } else if (prescription) {
    const { ensureMemberProgram } = await import("./start-program");
    const program = await ensureMemberProgram(userId, prescription.id);
    await prisma.memberProgram.update({
      where: { id: program.id },
      data: {
        startedAt: activationDate,
        currentWeek: 1,
      },
    });
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      journeyStatus: "ACTIVE",
      subscriptionStatus: "ACTIVE",
    },
  });

  const firstDoseLabel = firstDoseDate.toLocaleDateString("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const dashboardUrl = `${process.env.NEXTAUTH_URL || "https://sanative.com.au"}/dashboard/weight-management`;

  await sendEmail({
    to: user.email,
    subject: "Your Sanative program is now active!",
    body: `
      <h2>Hi ${user.firstName},</h2>
      <p>Your Sanative weight management program is now active. You can start using your dashboard straight away — logging weight, meals, and goals during your first program week.</p>
      <p><strong>First medication dose:</strong> scheduled for the start of week 2 (${firstDoseLabel}). Your care partner will confirm storage and usage instructions before then.</p>
      <div style="margin: 24px 0;">
        <a href="${dashboardUrl}" style="display:inline-block;background:#059669;color:white;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;">
          Go to My Dashboard
        </a>
      </div>
      <p style="color:#666;margin-top:24px;">The Sanative Health Team</p>
    `,
  });

  await prisma.activityLog.create({
    data: {
      userId,
      action: "PROGRAM_ACTIVATED",
      entity: "user",
      entityId: userId,
      details: {
        activatedBy,
        activationDate: activationDate.toISOString(),
        firstDoseDate: firstDoseDate.toISOString(),
        timestamp: new Date().toISOString(),
      },
    },
  });

  await prisma.automationLog.create({
    data: {
      userId,
      automationType: "member_program_activated",
      triggerEvent: "welcome_call_manual",
      channel: "care_partner",
      status: "completed",
      metadata: {
        activatedBy,
        firstDoseDate: firstDoseDate.toISOString(),
      },
    },
  });

  return {
    activated: true,
    alreadyActive: false,
    firstDoseDate: firstDoseDate.toISOString(),
    activationDate: activationDate.toISOString(),
  };
}
