import { prisma } from "@/lib/prisma";
import { ensureMemberProgram } from "./start-program";
import { getUserPlanTier, getPlaybookId } from "./plan-tier";
import { extendProgramTasks } from "./extend-tasks";

const ELIGIBLE_SCRIPT_STATUSES = [
  "SCRIPT_WRITTEN",
  "SCRIPT_SENT_TO_PHARMACY",
  "PHARMACY_PENDING",
  "DISPENSING",
  "SHIPPED",
  "DELIVERED",
] as const;

export type MigrationPreviewItem = {
  userId: string;
  email: string;
  name: string;
  action: "create" | "upgrade" | "sync" | "skip";
  detail: string;
  fromPlaybook?: string;
  toPlaybook?: string;
  fromTier?: string;
  toTier?: string;
};

export type MigrationResult = {
  dryRun: boolean;
  scanned: number;
  created: number;
  upgraded: number;
  synced: number;
  skipped: number;
  tasksExtended: number;
  errors: Array<{ userId: string; email: string; message: string }>;
  items: MigrationPreviewItem[];
};

async function findEligibleUsers(userId?: string) {
  const prescriptions = await prisma.prescription.findMany({
    where: {
      category: "WEIGHT_MANAGEMENT",
      status: "ACTIVE",
      scriptStatus: { in: [...ELIGIBLE_SCRIPT_STATUSES] },
      ...(userId ? { patientId: userId } : {}),
    },
    include: {
      patient: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          journeyStatus: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  const byUser = new Map<string, (typeof prescriptions)[0]>();
  for (const rx of prescriptions) {
    if (!byUser.has(rx.patientId)) {
      byUser.set(rx.patientId, rx);
    }
  }
  return Array.from(byUser.values());
}

export async function migrateMemberPrograms(options: {
  dryRun?: boolean;
  userId?: string;
  backfillTasks?: boolean;
}): Promise<MigrationResult> {
  const { dryRun = false, userId, backfillTasks = true } = options;

  const eligible = await findEligibleUsers(userId);
  const items: MigrationPreviewItem[] = [];
  const errors: MigrationResult["errors"] = [];
  let created = 0;
  let upgraded = 0;
  let synced = 0;
  let skipped = 0;
  let tasksExtended = 0;

  for (const rx of eligible) {
    const u = rx.patient;
    const name = `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email;

    try {
      const planTier = await getUserPlanTier(u.id);
      const playbookId = getPlaybookId(planTier);

      const existing = await prisma.memberProgram.findUnique({
        where: { userId: u.id },
      });

      if (!existing) {
        items.push({
          userId: u.id,
          email: u.email,
          name,
          action: "create",
          detail: `Start program (${planTier}, ${playbookId})`,
          toPlaybook: playbookId,
          toTier: planTier,
        });

        if (!dryRun) {
          await ensureMemberProgram(u.id, rx.id);
          created++;
          if (backfillTasks) {
            const program = await prisma.memberProgram.findUnique({
              where: { userId: u.id },
            });
            if (program) {
              await extendProgramTasks(program.id);
              tasksExtended++;
            }
          }
        } else {
          created++;
        }
        continue;
      }

      const needsTier =
        existing.planTier !== planTier || existing.playbookId !== playbookId;

      if (needsTier) {
        items.push({
          userId: u.id,
          email: u.email,
          name,
          action: "upgrade",
          detail: `Update plan ${existing.planTier} → ${planTier}`,
          fromPlaybook: existing.playbookId,
          toPlaybook: playbookId,
          fromTier: existing.planTier,
          toTier: planTier,
        });

        if (!dryRun) {
          await prisma.memberProgram.update({
            where: { id: existing.id },
            data: { planTier, playbookId },
          });

          await prisma.automationLog.create({
            data: {
              userId: u.id,
              automationType: "program_plan_migrated",
              triggerEvent: "admin_migration",
              channel: "admin_panel",
              status: "completed",
              metadata: {
                from: { planTier: existing.planTier, playbookId: existing.playbookId },
                to: { planTier, playbookId },
              },
            },
          });
        }
        upgraded++;
      } else if (!existing.prescriptionId && rx.id) {
        items.push({
          userId: u.id,
          email: u.email,
          name,
          action: "sync",
          detail: "Link prescription to program",
        });

        if (!dryRun) {
          await prisma.memberProgram.update({
            where: { id: existing.id },
            data: { prescriptionId: rx.id },
          });
        }
        synced++;
      } else {
        items.push({
          userId: u.id,
          email: u.email,
          name,
          action: "skip",
          detail: "Already on correct playbook",
          toTier: planTier,
          toPlaybook: playbookId,
        });
        skipped++;
      }

      if (backfillTasks && !dryRun) {
        const program = await prisma.memberProgram.findUnique({
          where: { userId: u.id },
        });
        if (program?.isActive) {
          const before = await prisma.programTask.count({
            where: { memberProgramId: program.id },
          });
          await extendProgramTasks(program.id);
          const after = await prisma.programTask.count({
            where: { memberProgramId: program.id },
          });
          if (after > before) tasksExtended++;
        }
      }
    } catch (e) {
      errors.push({
        userId: u.id,
        email: u.email,
        message: e instanceof Error ? e.message : "Unknown error",
      });
    }
  }

  return {
    dryRun,
    scanned: eligible.length,
    created,
    upgraded,
    synced,
    skipped,
    tasksExtended,
    errors,
    items,
  };
}

export async function getMigrationStatus() {
  const [eligibleCount, programCount, needsUpgrade] = await Promise.all([
    findEligibleUsers().then((u) => u.length),
    prisma.memberProgram.count({ where: { isActive: true } }),
    prisma.memberProgram.findMany({
      where: { isActive: true },
      select: { userId: true, planTier: true, playbookId: true },
    }),
  ]);

  let stalePlaybooks = 0;
  for (const p of needsUpgrade) {
    const tier = await getUserPlanTier(p.userId);
    const expected = getPlaybookId(tier);
    if (p.planTier !== tier || p.playbookId !== expected) {
      stalePlaybooks++;
    }
  }

  const missingPrograms = Math.max(0, eligibleCount - programCount);

  return {
    eligibleMembers: eligibleCount,
    activePrograms: programCount,
    likelyMissingPrograms: missingPrograms,
    needsPlanUpgrade: stalePlaybooks,
  };
}
