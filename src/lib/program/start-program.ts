import { prisma } from "@/lib/prisma";
import { generateDoseDates, parseDoseIntervalDays, startOfDayUTC } from "./dose-schedule";
import { getUserPlanTier, getPlaybookId } from "./plan-tier";
import { getPlaybook } from "./playbooks";
import type { ProgramTaskType } from "@prisma/client";

const DEFAULT_DOSE_COUNT = 12;
const INITIAL_TASK_DAYS = 14;

export async function ensureMemberProgram(userId: string, prescriptionId: string) {
  const existing = await prisma.memberProgram.findUnique({
    where: { userId },
  });
  if (existing) return existing;

  const prescription = await prisma.prescription.findFirst({
    where: { id: prescriptionId, patientId: userId, category: "WEIGHT_MANAGEMENT" },
  });
  if (!prescription) {
    throw new Error("Prescription not found for user");
  }

  const [user, planTier] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { timezone: true },
    }),
    getUserPlanTier(userId),
  ]);

  const playbookId = getPlaybookId(planTier);
  const startDate = prescription.startDate || new Date();
  const intervalDays = parseDoseIntervalDays(prescription.frequency);

  const memberProgram = await prisma.memberProgram.create({
    data: {
      userId,
      prescriptionId: prescription.id,
      playbookId,
      planTier,
      phase: "INDUCTION",
      currentWeek: 0,
      timezone: user?.timezone || "Australia/Sydney",
      startedAt: startDate,
    },
  });

  let treatment = await prisma.treatment.findFirst({
    where: { userId, prescriptionId: prescription.id },
  });

  if (!treatment) {
    treatment = await prisma.treatment.create({
      data: {
        userId,
        prescriptionId: prescription.id,
        medicationName: prescription.medicationName,
        dosage: prescription.dosage,
        frequency: prescription.frequency,
        instructions: prescription.instructions,
        doctorName: prescription.prescriberName,
        pharmacyName: prescription.pharmacyName,
        pharmacyPhone: prescription.pharmacyPhone,
        startDate,
        nextDoseDate: startDate,
        isActive: true,
      },
    });
  }

  const existingDoses = await prisma.medicationDose.count({
    where: { treatmentId: treatment.id },
  });

  if (existingDoses === 0) {
    const doseDates = generateDoseDates(startDate, intervalDays, DEFAULT_DOSE_COUNT);
    await prisma.medicationDose.createMany({
      data: doseDates.map((scheduledAt) => ({
        treatmentId: treatment!.id,
        scheduledAt,
      })),
    });
    if (doseDates[1]) {
      await prisma.treatment.update({
        where: { id: treatment.id },
        data: { nextDoseDate: doseDates[1] },
      });
    }
  }

  await generateProgramTasks(memberProgram.id, startDate, userId);

  if (planTier === "PRECISION") {
    const { flags } = await import("./biomarker-rules").then((m) =>
      m.evaluateBiomarkerFlags(userId)
    );
    if (flags.length > 0) {
      const { applyBiomarkerEscalations } = await import("./biomarker-rules");
      await applyBiomarkerEscalations(userId, memberProgram.id, flags);
    }
    const { ensureLabCadenceTasks } = await import("./lab-cadence");
    await ensureLabCadenceTasks(memberProgram.id, userId);
  }

  try {
    const { ensureWMProgramMember } = await import("@/lib/wm/ensure-program-member");
    await ensureWMProgramMember(userId);
  } catch {
    /* non-blocking */
  }

  await prisma.automationLog.create({
    data: {
      userId,
      automationType: "member_program_started",
      triggerEvent: "prescription_script_written",
      channel: "program_orchestrator",
      status: "completed",
      metadata: { prescriptionId, playbookId, planTier },
    },
  });

  return memberProgram;
}

export async function generateProgramTasks(
  memberProgramId: string,
  fromDate: Date,
  userId: string
) {
  const program = await prisma.memberProgram.findUnique({
    where: { id: memberProgramId },
  });
  if (!program) return;

  const playbook = getPlaybook(program.playbookId);
  const start = startOfDayUTC(fromDate);
  const tasks: Array<{
    memberProgramId: string;
    taskType: ProgramTaskType;
    scheduledFor: Date;
    metadata?: object;
  }> = [];

  for (let day = 0; day < INITIAL_TASK_DAYS; day++) {
    const scheduledFor = new Date(start);
    scheduledFor.setUTCDate(scheduledFor.getUTCDate() + day);
    const dayOfWeek = scheduledFor.getUTCDay();

    for (const taskType of playbook.dailyTasks) {
      tasks.push({ memberProgramId, taskType, scheduledFor });
    }

    if (day < playbook.sideEffectCheckDays) {
      tasks.push({
        memberProgramId,
        taskType: "SIDE_EFFECT_CHECK",
        scheduledFor,
      });
    }

    if (dayOfWeek === 0) {
      for (const taskType of playbook.sundayTasks) {
        tasks.push({ memberProgramId, taskType, scheduledFor });
      }
    }
  }

  if (program.prescriptionId) {
    const treatment = await prisma.treatment.findFirst({
      where: { userId, prescriptionId: program.prescriptionId },
      include: {
        doses: {
          where: { scheduledAt: { gte: start } },
          orderBy: { scheduledAt: "asc" },
          take: 8,
        },
      },
    });

    for (const dose of treatment?.doses || []) {
      tasks.push({
        memberProgramId,
        taskType: "DOSE",
        scheduledFor: startOfDayUTC(dose.scheduledAt),
        metadata: { doseId: dose.id },
      });
    }
  }

  const existingCount = await prisma.programTask.count({
    where: {
      memberProgramId,
      scheduledFor: { gte: start },
    },
  });

  if (existingCount === 0) {
    await prisma.programTask.createMany({ data: tasks });
  }
}
