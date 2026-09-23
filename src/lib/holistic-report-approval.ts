import { prisma } from "@/lib/prisma";
import { notifyMember } from "@/lib/notifications/member-notify";
import { HOLISTIC_HEALTH_ANALYSIS_TYPE } from "@/lib/holistic-health-report";
import {
  normalizeHolisticApprovalStatus,
  sanitizeHolisticHealthReport,
  type HolisticApprovalStatus,
  type HolisticHealthReport,
} from "@/lib/holistic-health-report-types";

const STAFF_ROLES = ["ADMIN", "CARE_PARTNER", "DOCTOR"] as const;
const ASSIGN_ROLES = ["ADMIN", "CARE_PARTNER"] as const;

export type HolisticPendingQueueItem = {
  userId: string;
  cacheId: string;
  memberName: string;
  email: string;
  panelDate: string | null;
  generatedAt: string;
  lastEditedByName: string | null;
  lastEditedAt: string | null;
  assignedDoctorId: string | null;
  assignedDoctorName: string | null;
  approvalStatus: HolisticApprovalStatus;
  overallHealthScore: number;
};

export type HolisticMemberReportRow = {
  id: string;
  source: "cache" | "history";
  panelDate: string | null;
  createdAt: string;
  approvalStatus: HolisticApprovalStatus;
  assignedDoctorName: string | null;
  lastEditedByName: string | null;
  reviewedByName: string | null;
  reviewedAt: string | null;
  overallHealthScore: number;
  isCurrent: boolean;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export function panelDateFromReport(report: HolisticHealthReport): string | null {
  const markers = [
    ...report.priorityBands.immediate,
    ...report.priorityBands.needsAttention,
    ...report.priorityBands.lookOut,
    ...report.priorityBands.good,
  ];
  const dates = markers
    .map((m) => m.testedAt)
    .filter((d): d is string => Boolean(d))
    .sort();
  return dates[dates.length - 1] || report.analysisTimestamp || null;
}

function staffDisplayName(user: {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  role?: string | null;
}): string {
  const name = `${user.firstName || ""} ${user.lastName || ""}`.trim();
  if (name && user.role === "DOCTOR" && !/^dr\b/i.test(name)) return `Dr ${name}`;
  if (name) return name;
  return user.email || "Staff";
}

export function isStaffRole(role: string | undefined | null): boolean {
  const normalized = String(role || "").toUpperCase();
  return STAFF_ROLES.includes(normalized as (typeof STAFF_ROLES)[number]);
}

export function canAssignHolisticDoctor(role: string | undefined | null): boolean {
  const normalized = String(role || "").toUpperCase();
  return ASSIGN_ROLES.includes(normalized as (typeof ASSIGN_ROLES)[number]);
}

async function writeCacheAndLatestHistory(
  userId: string,
  analysisData: Record<string, unknown>
) {
  const expiresAt = new Date();
  expiresAt.setFullYear(expiresAt.getFullYear() + 100);

  const cache = await prisma.aIAnalysisCache.findUnique({
    where: { userId_analysisType: { userId, analysisType: HOLISTIC_HEALTH_ANALYSIS_TYPE } },
  });
  if (!cache) throw new Error("No current holistic report");

  const existing = asRecord(cache.analysisData);
  const payload = {
    ...analysisData,
    biomarkerHash: cache.biomarkerHash || existing.biomarkerHash,
  };

  await prisma.aIAnalysisCache.update({
    where: { id: cache.id },
    data: { analysisData: payload, updatedAt: new Date(), expiresAt },
  });

  const latestHistory = await prisma.aIAnalysisHistory.findFirst({
    where: { userId, analysisType: HOLISTIC_HEALTH_ANALYSIS_TYPE },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
  if (latestHistory) {
    await prisma.aIAnalysisHistory.update({
      where: { id: latestHistory.id },
      data: { analysisData: payload },
    });
  }

  return cache.id;
}

export async function loadCurrentHolisticDraft(userId: string) {
  const cache = await prisma.aIAnalysisCache.findUnique({
    where: { userId_analysisType: { userId, analysisType: HOLISTIC_HEALTH_ANALYSIS_TYPE } },
  });
  if (!cache) return null;
  const report = sanitizeHolisticHealthReport(cache.analysisData as Partial<HolisticHealthReport>);
  if (!report || report.aiProvider !== "claude") return null;
  const member = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, firstName: true, lastName: true, email: true },
  });
  if (!member) return null;
  return {
    cacheId: cache.id,
    biomarkerHash: cache.biomarkerHash,
    updatedAt: cache.updatedAt.toISOString(),
    member,
    report,
  };
}

export async function listPendingHolisticReports(options?: {
  assignedDoctorId?: string;
}): Promise<HolisticPendingQueueItem[]> {
  const caches = await prisma.aIAnalysisCache.findMany({
    where: { analysisType: HOLISTIC_HEALTH_ANALYSIS_TYPE },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const items: HolisticPendingQueueItem[] = [];
  for (const cache of caches) {
    const report = sanitizeHolisticHealthReport(cache.analysisData as Partial<HolisticHealthReport>);
    if (!report || report.aiProvider !== "claude") continue;
    const status = normalizeHolisticApprovalStatus(report.approvalStatus);
    if (status !== "pending_approval" && status !== "held") continue;
    if (options?.assignedDoctorId && report.assignedDoctorId !== options.assignedDoctorId) continue;
    items.push({
      userId: cache.userId,
      cacheId: cache.id,
      memberName: `${cache.user.firstName} ${cache.user.lastName}`.trim() || cache.user.email,
      email: cache.user.email,
      panelDate: panelDateFromReport(report),
      generatedAt: cache.updatedAt.toISOString(),
      lastEditedByName: report.lastEditedByName || null,
      lastEditedAt: report.lastEditedAt || null,
      assignedDoctorId: report.assignedDoctorId || null,
      assignedDoctorName: report.assignedDoctorName || null,
      approvalStatus: status,
      overallHealthScore: report.overallHealthScore,
    });
  }
  return items;
}

export async function listMemberHolisticReports(userId: string): Promise<HolisticMemberReportRow[]> {
  const [cache, history] = await Promise.all([
    prisma.aIAnalysisCache.findUnique({
      where: { userId_analysisType: { userId, analysisType: HOLISTIC_HEALTH_ANALYSIS_TYPE } },
    }),
    prisma.aIAnalysisHistory.findMany({
      where: { userId, analysisType: HOLISTIC_HEALTH_ANALYSIS_TYPE },
      orderBy: { createdAt: "desc" },
      take: 24,
    }),
  ]);

  const currentHash = cache?.biomarkerHash;
  return history
    .map((row, index) => {
      const report = sanitizeHolisticHealthReport(row.analysisData as Partial<HolisticHealthReport>);
      if (!report || report.aiProvider !== "claude") return null;
      const data = asRecord(row.analysisData);
      const hash = typeof data.biomarkerHash === "string" ? data.biomarkerHash : null;
      return {
        id: row.id,
        source: "history" as const,
        panelDate: panelDateFromReport(report),
        createdAt: row.createdAt.toISOString(),
        approvalStatus: normalizeHolisticApprovalStatus(report.approvalStatus),
        assignedDoctorName: report.assignedDoctorName || null,
        lastEditedByName: report.lastEditedByName || null,
        reviewedByName: report.reviewedByName || null,
        reviewedAt: report.reviewedAt || null,
        overallHealthScore: report.overallHealthScore,
        isCurrent: hash && currentHash ? hash === currentHash : index === 0,
      } satisfies HolisticMemberReportRow;
    })
    .filter((row): row is HolisticMemberReportRow => Boolean(row));
}

export async function loadHolisticHistoryReport(historyId: string) {
  const row = await prisma.aIAnalysisHistory.findUnique({
    where: { id: historyId },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
  });
  if (!row || row.analysisType !== HOLISTIC_HEALTH_ANALYSIS_TYPE) return null;
  const report = sanitizeHolisticHealthReport(row.analysisData as Partial<HolisticHealthReport>);
  if (!report || report.aiProvider !== "claude") return null;
  return { historyId: row.id, userId: row.userId, member: row.user, createdAt: row.createdAt.toISOString(), report };
}

export async function saveHolisticDraftEdits(input: {
  userId: string;
  editor: { id: string; firstName?: string | null; lastName?: string | null; email?: string | null; role?: string | null };
  patch: Partial<Pick<
    HolisticHealthReport,
    | "reportTitle"
    | "executiveSummary"
    | "careTeamHandoffSummary"
    | "retestingGuidance"
    | "urgentActions"
    | "recommendations"
    | "questionsForCareTeam"
  >>;
}) {
  const current = await loadCurrentHolisticDraft(input.userId);
  if (!current) throw new Error("No current holistic report");
  const status = normalizeHolisticApprovalStatus(current.report.approvalStatus);
  if (status === "approved" || status === "superseded") {
    throw new Error("Approved reports cannot be edited");
  }

  const next: HolisticHealthReport = {
    ...current.report,
    ...input.patch,
    lastEditedById: input.editor.id,
    lastEditedByName: staffDisplayName(input.editor),
    lastEditedAt: new Date().toISOString(),
  };
  const sanitized = sanitizeHolisticHealthReport(next);
  if (!sanitized) throw new Error("Invalid report");
  await writeCacheAndLatestHistory(input.userId, JSON.parse(JSON.stringify(sanitized)));
  return sanitized;
}

export async function assignHolisticDoctor(input: {
  userId: string;
  doctorId: string;
}) {
  const current = await loadCurrentHolisticDraft(input.userId);
  if (!current) throw new Error("No current holistic report");
  const status = normalizeHolisticApprovalStatus(current.report.approvalStatus);
  if (status === "approved" || status === "superseded") {
    throw new Error("Cannot assign a doctor on an approved report");
  }

  const doctor = await prisma.user.findFirst({
    where: { id: input.doctorId, role: "DOCTOR" },
    select: { id: true, firstName: true, lastName: true, email: true, role: true },
  });
  if (!doctor) throw new Error("Doctor not found");

  const next: HolisticHealthReport = {
    ...current.report,
    assignedDoctorId: doctor.id,
    assignedDoctorName: staffDisplayName(doctor),
    approvalStatus: status === "held" ? "held" : "pending_approval",
  };
  const sanitized = sanitizeHolisticHealthReport(next);
  if (!sanitized) throw new Error("Invalid report");
  await writeCacheAndLatestHistory(input.userId, JSON.parse(JSON.stringify(sanitized)));
  return sanitized;
}

export async function holdHolisticReport(input: {
  userId: string;
  doctor: { id: string; firstName?: string | null; lastName?: string | null; email?: string | null; role?: string | null };
}) {
  const current = await loadCurrentHolisticDraft(input.userId);
  if (!current) throw new Error("No current holistic report");
  if (current.report.assignedDoctorId !== input.doctor.id) {
    throw new Error("Only the assigned doctor can hold this report");
  }
  const next: HolisticHealthReport = {
    ...current.report,
    approvalStatus: "held",
    lastEditedById: input.doctor.id,
    lastEditedByName: staffDisplayName(input.doctor),
    lastEditedAt: new Date().toISOString(),
  };
  const sanitized = sanitizeHolisticHealthReport(next);
  if (!sanitized) throw new Error("Invalid report");
  await writeCacheAndLatestHistory(input.userId, JSON.parse(JSON.stringify(sanitized)));
  return sanitized;
}

export async function approveHolisticReport(input: {
  userId: string;
  doctor: { id: string; firstName?: string | null; lastName?: string | null; email?: string | null; role?: string | null };
}) {
  const current = await loadCurrentHolisticDraft(input.userId);
  if (!current) throw new Error("No current holistic report");
  if (current.report.assignedDoctorId !== input.doctor.id) {
    throw new Error("Only the assigned doctor can approve this report");
  }

  const reviewedAt = new Date().toISOString();
  const next: HolisticHealthReport = {
    ...current.report,
    approvalStatus: "approved",
    reviewedById: input.doctor.id,
    reviewedByName: staffDisplayName(input.doctor),
    reviewedAt,
    lastEditedById: input.doctor.id,
    lastEditedByName: staffDisplayName(input.doctor),
    lastEditedAt: reviewedAt,
  };
  const sanitized = sanitizeHolisticHealthReport(next);
  if (!sanitized) throw new Error("Invalid report");
  await writeCacheAndLatestHistory(input.userId, JSON.parse(JSON.stringify(sanitized)));

  const member = current.member;
  try {
    await notifyMember({
      userId: member.id,
      intent: "RESULTS_READY",
      title: "Holistic report approved",
      message: `${staffDisplayName(input.doctor)} has reviewed and released your holistic health report.`,
      actionUrl: "/dashboard/reports",
      type: "SUCCESS",
      category: "SYSTEM",
    });
  } catch (error) {
    console.warn("[holistic-report-approval] notification failed", error);
  }

  return sanitized;
}

export async function listDoctorsForAssignment() {
  return prisma.user.findMany({
    where: { role: "DOCTOR" },
    select: { id: true, firstName: true, lastName: true, email: true },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });
}
