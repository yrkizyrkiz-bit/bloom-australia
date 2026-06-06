import { prisma } from "@/lib/prisma";
import { getMitigationPlan, symptomLabels } from "./side-effects";
import type { SideEffectSeverity } from "@prisma/client";

export async function processSideEffectReport(params: {
  userId: string;
  memberProgramId?: string | null;
  medicationDoseId?: string | null;
  symptoms: string[];
  severity: SideEffectSeverity;
  notes?: string | null;
}) {
  const { userId, memberProgramId, medicationDoseId, symptoms, severity, notes } = params;

  const plan = getMitigationPlan(symptoms, severity);
  const labels = symptomLabels(symptoms);

  let status: "REPORTED" | "MITIGATING" | "ESCALATED" = plan.requiresEscalation
    ? "ESCALATED"
    : severity === "MILD"
      ? "MITIGATING"
      : "REPORTED";

  const report = await prisma.sideEffectReport.create({
    data: {
      userId,
      memberProgramId: memberProgramId || undefined,
      medicationDoseId: medicationDoseId || undefined,
      symptoms,
      severity,
      notes: notes || undefined,
      mitigationTips: plan.tips,
      escalated: plan.requiresEscalation,
      status,
    },
  });

  if (plan.requiresEscalation) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        firstName: true,
        lastName: true,
        assignedCarePartnerId: true,
      },
    });

    await prisma.careCommunication.create({
      data: {
        userId,
        type: "SIDE_EFFECT_REVIEW",
        priority: severity === "SEVERE" ? "URGENT" : "HIGH",
        subject: `Side effect review: ${user?.firstName || "Member"} ${user?.lastName || ""}`.trim(),
        notes: `Patient reported side effects via weight management program.

**Severity:** ${severity}
**Symptoms:** ${labels.join(", ")}
${notes ? `**Notes:** ${notes}` : ""}

**Mitigation shown to patient:** ${plan.tips.map((t) => t.title).join("; ")}

Report ID: ${report.id}
${medicationDoseId ? `Dose ID: ${medicationDoseId}` : ""}

Please contact the patient within 4 business hours (urgent: same day).`,
        status: "PENDING",
        dueDate: new Date(Date.now() + (severity === "SEVERE" ? 2 : 24) * 60 * 60 * 1000),
        assignedTo: user?.assignedCarePartnerId || undefined,
      },
    });

    await prisma.automationLog.create({
      data: {
        userId,
        automationType: "side_effect_escalated",
        triggerEvent: "patient_report",
        channel: "care_communication",
        status: "completed",
        metadata: {
          reportId: report.id,
          severity,
          symptoms,
        },
      },
    });
  } else if (severity === "MODERATE") {
    const recentModerate = await prisma.sideEffectReport.count({
      where: {
        userId,
        severity: { in: ["MODERATE", "SEVERE"] },
        createdAt: { gte: new Date(Date.now() - 48 * 60 * 60 * 1000) },
        id: { not: report.id },
      },
    });

    if (recentModerate >= 1) {
      await prisma.sideEffectReport.update({
        where: { id: report.id },
        data: { escalated: true, status: "ESCALATED" },
      });

      await prisma.careCommunication.create({
        data: {
          userId,
          type: "SIDE_EFFECT_REVIEW",
          priority: "NORMAL",
          subject: "Recurring side effects — care partner check-in",
          notes: `Multiple moderate+ side effect reports in 48h.

Latest symptoms: ${labels.join(", ")}
Report ID: ${report.id}`,
          status: "PENDING",
          dueDate: new Date(Date.now() + 48 * 60 * 60 * 1000),
        },
      });
    }
  }

  const sideEffectTask = memberProgramId
    ? await prisma.programTask.findFirst({
        where: {
          memberProgramId,
          taskType: "SIDE_EFFECT_CHECK",
          scheduledFor: {
            gte: new Date(new Date().setUTCHours(0, 0, 0, 0)),
            lt: new Date(new Date().setUTCHours(23, 59, 59, 999)),
          },
          status: "PENDING",
        },
      })
    : null;

  if (sideEffectTask) {
    await prisma.programTask.update({
      where: { id: sideEffectTask.id },
      data: { status: "DONE", completedAt: new Date() },
    });
  }

  return { report, plan };
}
