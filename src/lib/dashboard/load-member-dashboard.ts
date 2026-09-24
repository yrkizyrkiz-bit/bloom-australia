import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { isCatalogBiomarker } from "@/lib/catalog-biomarkers";

/**
 * One round trip for the member dashboard.
 * Netlify uses a single database connection, so the old fan-out of separate
 * Prisma reads waited on each other across the network.
 */
export async function loadMemberDashboard(userId: string, now: Date) {
  const rows = await prisma.$queryRaw<Array<{ payload: DashboardPayload }>>(Prisma.sql`
    WITH panel AS (
      SELECT DISTINCT ON (br."biomarkerId")
        br.id,
        br."userId",
        br."biomarkerId",
        br.value,
        br.status::text AS status,
        br."testedAt",
        br."uploadedAt",
        br."uploadedBy",
        br."labReportId",
        br.notes,
        bd.name,
        bd."shortName",
        bd.category::text AS category,
        bd.unit
      FROM "BiomarkerResult" br
      INNER JOIN "BiomarkerDefinition" bd ON bd."biomarkerId" = br."biomarkerId"
      WHERE br."userId" = ${userId}
        AND (br."testedAt" AT TIME ZONE 'UTC')::date = (
          SELECT (MAX(latest."testedAt") AT TIME ZONE 'UTC')::date
          FROM "BiomarkerResult" latest
          WHERE latest."userId" = ${userId}
        )
      ORDER BY br."biomarkerId", br."testedAt" DESC
    )
    SELECT json_build_object(
      'user', (
        SELECT json_build_object(
          'id', u.id,
          'firstName', u."firstName",
          'lastName', u."lastName",
          'email', u.email,
          'dateOfBirth', u."dateOfBirth",
          'gender', u.gender::text,
          'subscriptionStatus', u."subscriptionStatus"::text,
          'createdAt', u."createdAt"
        )
        FROM "User" u
        WHERE u.id = ${userId}
      ),
      'healthScore', (
        SELECT json_build_object(
          'id', hs.id,
          'userId', hs."userId",
          'overall', hs.overall,
          'biologicalAge', hs."biologicalAge",
          'chronologicalAge', hs."chronologicalAge",
          'calculatedAt', hs."calculatedAt",
          'categoryScores', hs."categoryScores"
        )
        FROM "HealthScore" hs
        WHERE hs."userId" = ${userId}
        ORDER BY hs."calculatedAt" DESC
        LIMIT 1
      ),
      'goals', COALESCE((
        SELECT json_agg(item ORDER BY ord)
        FROM (
          SELECT json_build_object(
            'id', g.id,
            'userId', g."userId",
            'biomarkerId', g."biomarkerId",
            'targetValue', g."targetValue",
            'currentValue', g."currentValue",
            'startValue', g."startValue",
            'startDate', g."startDate",
            'targetDate', g."targetDate",
            'status', g.status::text,
            'notes', g.notes,
            'createdAt', g."createdAt",
            'updatedAt', g."updatedAt",
            'completedAt', g."completedAt",
            'biomarker', json_build_object(
              'name', bd.name,
              'shortName', bd."shortName",
              'unit', bd.unit
            )
          ) AS item,
          g."createdAt" AS ord
          FROM "HealthGoal" g
          INNER JOIN "BiomarkerDefinition" bd ON bd."biomarkerId" = g."biomarkerId"
          WHERE g."userId" = ${userId}
        ) goals
      ), '[]'::json),
      'upcomingReminders', COALESCE((
        SELECT json_agg(item ORDER BY ord)
        FROM (
          SELECT json_build_object(
            'id', r.id,
            'userId', r."userId",
            'type', r.type::text,
            'title', r.title,
            'description', r.description,
            'dueDate', r."dueDate",
            'frequency', r.frequency::text,
            'isCompleted', r."isCompleted",
            'completedAt', r."completedAt",
            'isActive', r."isActive",
            'createdAt', r."createdAt",
            'updatedAt', r."updatedAt"
          ) AS item,
          r."dueDate" AS ord
          FROM "Reminder" r
          WHERE r."userId" = ${userId}
            AND r."isActive" = true
            AND r."isCompleted" = false
            AND r."dueDate" >= ${now}
          ORDER BY r."dueDate" ASC
          LIMIT 5
        ) reminders
      ), '[]'::json),
      'upcomingAppointments', COALESCE((
        SELECT json_agg(item ORDER BY ord)
        FROM (
          SELECT json_build_object(
            'id', a.id,
            'userId', a."userId",
            'type', a.type::text,
            'title', a.title,
            'description', a.description,
            'scheduledAt', a."scheduledAt",
            'duration', a.duration,
            'location', a.location,
            'status', a.status::text,
            'notes', a.notes,
            'createdAt', a."createdAt",
            'updatedAt', a."updatedAt",
            'videoLink', a."videoLink",
            'carePartnerId', a."carePartnerId",
            'doctorId', a."doctorId",
            'isPaid', a."isPaid",
            'paymentId', a."paymentId",
            'stripePaymentId', a."stripePaymentId",
            'patientBriefSent', a."patientBriefSent",
            'cancellationReason', a."cancellationReason",
            'followUpRequired', a."followUpRequired",
            'followUpDate', a."followUpDate",
            'referralId', a."referralId"
          ) AS item,
          a."scheduledAt" AS ord
          FROM "Appointment" a
          WHERE a."userId" = ${userId}
            AND a."scheduledAt" >= ${now}
            AND a.status::text IN ('SCHEDULED', 'CONFIRMED')
          ORDER BY a."scheduledAt" ASC
          LIMIT 5
        ) appointments
      ), '[]'::json),
      'unreadNotifications', (
        SELECT COUNT(*)::int
        FROM "Notification" n
        WHERE n."userId" = ${userId}
          AND n."isRead" = false
      ),
      'recentActivity', COALESCE((
        SELECT json_agg(item ORDER BY ord DESC)
        FROM (
          SELECT json_build_object(
            'id', al.id,
            'userId', al."userId",
            'action', al.action,
            'entity', al.entity,
            'entityId', al."entityId",
            'details', al.details,
            'ipAddress', al."ipAddress",
            'userAgent', al."userAgent",
            'createdAt', al."createdAt"
          ) AS item,
          al."createdAt" AS ord
          FROM "ActivityLog" al
          WHERE al."userId" = ${userId}
          ORDER BY al."createdAt" DESC
          LIMIT 10
        ) activity
      ), '[]'::json),
      'labReports', COALESCE((
        SELECT json_agg(item ORDER BY ord DESC)
        FROM (
          SELECT json_build_object(
            'id', lr.id,
            'fileName', lr."fileName",
            'status', lr.status::text,
            'uploadedAt', lr."uploadedAt",
            'biomarkerCount', lr."biomarkerCount"
          ) AS item,
          lr."uploadedAt" AS ord
          FROM "LabReport" lr
          WHERE lr."userId" = ${userId}
          ORDER BY lr."uploadedAt" DESC
          LIMIT 5
        ) reports
      ), '[]'::json),
      'biomarkerResults', COALESCE((
        SELECT json_agg(json_build_object(
          'id', p.id,
          'userId', p."userId",
          'biomarkerId', p."biomarkerId",
          'value', p.value,
          'status', p.status,
          'testedAt', p."testedAt",
          'uploadedAt', p."uploadedAt",
          'uploadedBy', p."uploadedBy",
          'labReportId', p."labReportId",
          'notes', p.notes,
          'biomarker', json_build_object(
            'name', p.name,
            'shortName', p."shortName",
            'category', p.category,
            'unit', p.unit
          )
        ))
        FROM panel p
      ), '[]'::json)
    ) AS payload
  `);

  const payload = rows[0]?.payload;
  if (!payload?.user) return null;

  const biomarkerResults = (payload.biomarkerResults ?? []).filter((row) =>
    isCatalogBiomarker(row.biomarkerId)
  );

  return {
    user: payload.user,
    healthScore: payload.healthScore,
    goals: payload.goals ?? [],
    upcomingReminders: payload.upcomingReminders ?? [],
    upcomingAppointments: payload.upcomingAppointments ?? [],
    unreadNotifications: payload.unreadNotifications ?? 0,
    recentActivity: payload.recentActivity ?? [],
    labReports: payload.labReports ?? [],
    biomarkerResults,
  };
}

type DashboardPayload = {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    dateOfBirth: string | null;
    gender: string;
    subscriptionStatus: string;
    createdAt: string;
  } | null;
  healthScore: Record<string, unknown> | null;
  goals: Array<{ status: string } & Record<string, unknown>>;
  upcomingReminders: Array<Record<string, unknown>>;
  upcomingAppointments: Array<Record<string, unknown>>;
  unreadNotifications: number;
  recentActivity: Array<Record<string, unknown>>;
  labReports: Array<Record<string, unknown>>;
  biomarkerResults: Array<{
    id: string;
    userId: string;
    biomarkerId: string;
    value: number;
    status: string;
    testedAt: string;
    uploadedAt: string;
    uploadedBy: string | null;
    labReportId: string | null;
    notes: string | null;
    biomarker: { name: string; shortName: string; category: string; unit: string };
  }>;
};
