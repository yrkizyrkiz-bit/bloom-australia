import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export type SecurityActionType =
  | "read"
  | "update"
  | "delete"
  | "export"
  | "refund"
  | "approve"
  | "decline";

export async function recordSecurityAudit(params: {
  req?: NextRequest;
  actorUserId: string;
  actorRole: string;
  route: string;
  patientId?: string | null;
  actionType: SecurityActionType;
  entity?: string;
  entityId?: string | null;
  details?: Record<string, unknown>;
}) {
  const ipAddress =
    params.req?.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    params.req?.headers.get("x-real-ip") ??
    null;
  const userAgent = params.req?.headers.get("user-agent") ?? null;

  try {
    await prisma.activityLog.create({
      data: {
        userId: params.actorUserId,
        action: params.actionType,
        entity: params.entity ?? "patient",
        entityId: params.patientId ?? params.entityId ?? null,
        ipAddress,
        userAgent,
        details: {
          actorRole: params.actorRole,
          route: params.route,
          patientId: params.patientId ?? null,
          ...params.details,
        },
      },
    });
  } catch (error) {
    console.error("[security-audit] Failed to record audit log:", error);
  }
}
