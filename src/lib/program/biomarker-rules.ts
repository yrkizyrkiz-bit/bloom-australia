import { prisma } from "@/lib/prisma";
import { biomarkerDefinitions } from "@/data/biomarkers";

export type BiomarkerFlag = {
  biomarkerId: string;
  name: string;
  value: number;
  unit: string;
  status: "HIGH" | "LOW" | "BORDERLINE";
  message: string;
  programFocus?: string;
};

const WM_MONITOR_IDS = [
  "hba1c",
  "glucose",
  "alt",
  "ldl_cholesterol",
  "triglycerides",
  "hdl_cholesterol",
] as const;

function evaluateValue(
  biomarkerId: string,
  value: number,
  gender: "MALE" | "FEMALE" | "OTHER" | "PREFER_NOT_TO_SAY" = "FEMALE"
): "HIGH" | "LOW" | "OPTIMAL" | "BORDERLINE" {
  const def = biomarkerDefinitions.find((b) => b.id === biomarkerId);
  if (!def) return "OPTIMAL";

  const g = gender === "MALE" ? "male" : "female";
  const r = def.ranges[g];
  if (value > r.high) return "HIGH";
  if (value < r.optimal_low && r.low < r.optimal_low) return "LOW";
  if (value > r.optimal_high && value <= r.high) return "BORDERLINE";
  return "OPTIMAL";
}

const FOCUS_BY_MARKER: Record<string, { high?: string; low?: string; borderline?: string }> = {
  hba1c: {
    high: "Prioritise steady protein at meals and discuss glucose trends with your care partner.",
    borderline: "Keep logging meals — small, regular portions help glucose stability on GLP-1 therapy.",
  },
  glucose: {
    high: "Avoid skipping meals; pair carbs with protein to reduce glucose spikes.",
  },
  alt: {
    high: "Limit alcohol and notify your care team — liver markers need clinician review on weight-loss medication.",
    borderline: "Stay well hydrated and avoid heavy alcohol while on program.",
  },
  ldl_cholesterol: {
    high: "Focus on fibre-rich foods and discuss lipid results with your doctor at your next review.",
  },
  triglycerides: {
    high: "Reduce refined carbs and sugary drinks; your Precision plan tracks metabolic markers closely.",
  },
  hdl_cholesterol: {
    low: "Add resistance training and healthy fats (olive oil, nuts, fish) to support HDL.",
  },
};

export async function evaluateBiomarkerFlags(userId: string): Promise<{
  flags: BiomarkerFlag[];
  hasOutOfRange: boolean;
  summary: string | null;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { gender: true },
  });

  const gender = user?.gender || "FEMALE";
  const flags: BiomarkerFlag[] = [];

  for (const biomarkerId of WM_MONITOR_IDS) {
    const latest = await prisma.biomarkerResult.findFirst({
      where: { userId, biomarkerId },
      orderBy: { testedAt: "desc" },
      include: { biomarker: true },
    });

    if (!latest) continue;

    const evalStatus = evaluateValue(biomarkerId, latest.value, gender);
    if (evalStatus === "OPTIMAL") continue;

    const def = biomarkerDefinitions.find((b) => b.id === biomarkerId);
    const name = latest.biomarker?.name || def?.name || biomarkerId;
    const unit = def?.ranges.female.unit || "";

    const focusMap = FOCUS_BY_MARKER[biomarkerId];
    const programFocus =
      evalStatus === "HIGH"
        ? focusMap?.high
        : evalStatus === "LOW"
          ? focusMap?.low
          : focusMap?.borderline;

    flags.push({
      biomarkerId,
      name,
      value: latest.value,
      unit,
      status: evalStatus === "BORDERLINE" ? "BORDERLINE" : evalStatus,
      message: `${name} is ${evalStatus.toLowerCase()} at ${latest.value} ${unit}`.trim(),
      programFocus: programFocus || undefined,
    });
  }

  const hasOutOfRange = flags.some((f) => f.status === "HIGH" || f.status === "LOW");

  let summary: string | null = null;
  if (flags.length > 0) {
    summary = flags
      .slice(0, 2)
      .map((f) => f.programFocus || f.message)
      .join(" ");
  }

  return { flags, hasOutOfRange, summary };
}

export async function applyBiomarkerEscalations(
  userId: string,
  memberProgramId: string,
  flags: BiomarkerFlag[]
) {
  const critical = flags.filter(
    (f) =>
      (f.biomarkerId === "alt" && f.status === "HIGH") ||
      (f.biomarkerId === "hba1c" && f.status === "HIGH")
  );

  if (critical.length === 0) return;

  const recent = await prisma.careCommunication.findFirst({
    where: {
      userId,
      type: "BIOMARKER_REVIEW",
      createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    },
  });

  if (recent) return;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { firstName: true, lastName: true, assignedCarePartnerId: true },
  });

  await prisma.careCommunication.create({
    data: {
      userId,
      type: "BIOMARKER_REVIEW",
      priority: "HIGH",
      subject: `Precision biomarker review: ${user?.firstName || "Member"} ${user?.lastName || ""}`.trim(),
      notes: `Automated Precision program flag:

${critical.map((f) => `- ${f.message}${f.programFocus ? `\n  Focus: ${f.programFocus}` : ""}`).join("\n")}

Program ID: ${memberProgramId}`,
      status: "PENDING",
      dueDate: new Date(Date.now() + 48 * 60 * 60 * 1000),
      assignedTo: user?.assignedCarePartnerId || undefined,
    },
  });

  await prisma.automationLog.create({
    data: {
      userId,
      automationType: "biomarker_program_escalation",
      triggerEvent: "precision_rules",
      channel: "care_communication",
      status: "completed",
      metadata: { flags: critical.map((f) => f.biomarkerId) },
    },
  });
}
