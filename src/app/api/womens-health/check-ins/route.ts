import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getClinicalFieldIds,
  type ClinicalFieldValue,
  type ClinicalMetadata,
  type WomensHealthCareArea,
} from "@/lib/womens-health-clinical-checkins";

type WomensHealthCheckInRow = {
  id: string;
  userId: string;
  careArea: string;
  periodStatus: string | null;
  cycleDay: number | null;
  lastPeriodDate: Date | null;
  energyLevel: number;
  moodLevel: number;
  sleepQuality: number;
  stressLevel: number;
  painLevel: number | null;
  libidoLevel: number | null;
  hotFlushesLevel: number | null;
  cravingsLevel: number | null;
  symptoms: string[];
  notes: string | null;
  treatmentSideEffectFlag: boolean;
  metadata: {
    clinical?: ClinicalMetadata;
  } | null;
  checkedInAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

const CARE_AREAS = new Set(["hormones", "menopause", "pcos", "fertility"]);

function parseRating(value: unknown, fallback?: number): number | null {
  if (value === undefined || value === null || value === "") return fallback ?? null;
  const rating = Number(value);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return null;
  return rating;
}

function average(rows: WomensHealthCheckInRow[], key: keyof WomensHealthCheckInRow): number {
  const values = rows
    .map((row) => row[key])
    .filter((value): value is number => typeof value === "number");
  if (!values.length) return 0;
  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10;
}

function buildSymptomCounts(rows: WomensHealthCheckInRow[]) {
  const counts: Record<string, number> = {};
  for (const row of rows) {
    for (const symptom of row.symptoms || []) {
      counts[symptom] = (counts[symptom] || 0) + 1;
    }
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([symptom, count]) => ({ symptom, count }));
}

function sanitizeClinicalMetadata(careArea: WomensHealthCareArea, value: unknown): ClinicalMetadata {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const allowedIds = getClinicalFieldIds(careArea);
  const raw = value as Record<string, unknown>;
  const clinical: ClinicalMetadata = {};

  for (const [key, fieldValue] of Object.entries(raw)) {
    if (!allowedIds.has(key)) continue;

    if (Array.isArray(fieldValue)) {
      clinical[key] = fieldValue
        .filter((item): item is string => typeof item === "string")
        .slice(0, 12);
      continue;
    }

    if (typeof fieldValue === "string") {
      const trimmed = fieldValue.trim();
      clinical[key] = trimmed ? trimmed.slice(0, 500) : null;
      continue;
    }

    if (typeof fieldValue === "number" && Number.isFinite(fieldValue)) {
      clinical[key] = fieldValue;
      continue;
    }

    if (fieldValue === null) {
      clinical[key] = null;
    }
  }

  return clinical;
}

function serialize(row: WomensHealthCheckInRow) {
  return {
    ...row,
    lastPeriodDate: row.lastPeriodDate?.toISOString() || null,
    checkedInAt: row.checkedInAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    metadata: row.metadata || {},
  };
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || session.user.id;
    const limit = Math.min(Number(searchParams.get("limit") || "12") || 12, 50);

    if (userId !== session.user.id && session.user.role?.toUpperCase() !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const rows = await prisma.$queryRaw<WomensHealthCheckInRow[]>`
      SELECT *
      FROM "WomensHealthCheckIn"
      WHERE "userId" = ${userId}
      ORDER BY "checkedInAt" DESC
      LIMIT ${limit}
    `;

    const chronological = [...rows].reverse();

    return NextResponse.json({
      checkIns: rows.map(serialize),
      latest: rows[0] ? serialize(rows[0]) : null,
      summary: {
        total: rows.length,
        sideEffectFlags: rows.filter((row) => row.treatmentSideEffectFlag).length,
        averages: {
          energy: average(rows, "energyLevel"),
          mood: average(rows, "moodLevel"),
          sleep: average(rows, "sleepQuality"),
          stress: average(rows, "stressLevel"),
          pain: average(rows, "painLevel"),
          libido: average(rows, "libidoLevel"),
          hotFlushes: average(rows, "hotFlushesLevel"),
          cravings: average(rows, "cravingsLevel"),
        },
        symptomCounts: buildSymptomCounts(rows),
        trend: chronological.map((row) => ({
          date: row.checkedInAt.toISOString(),
          careArea: row.careArea,
          energy: row.energyLevel,
          mood: row.moodLevel,
          sleep: row.sleepQuality,
          stress: row.stressLevel,
          pain: row.painLevel,
          hotFlushes: row.hotFlushesLevel,
        })),
      },
    });
  } catch (error) {
    console.error("[womens-health/check-ins] GET", error);
    return NextResponse.json({ error: "Failed to load Women's Health check-ins" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const careArea = typeof body.careArea === "string" ? body.careArea : "";
    if (!CARE_AREAS.has(careArea)) {
      return NextResponse.json({ error: "A valid care area is required" }, { status: 400 });
    }

    const energyLevel = parseRating(body.energyLevel);
    const moodLevel = parseRating(body.moodLevel);
    const sleepQuality = parseRating(body.sleepQuality);
    const stressLevel = parseRating(body.stressLevel);
    if (!energyLevel || !moodLevel || !sleepQuality || !stressLevel) {
      return NextResponse.json({ error: "Energy, mood, sleep and stress ratings are required" }, { status: 400 });
    }

    const symptoms = Array.isArray(body.symptoms)
      ? body.symptoms.filter((item: unknown): item is string => typeof item === "string").slice(0, 30)
      : [];
    const cycleDay =
      body.cycleDay === undefined || body.cycleDay === null || body.cycleDay === ""
        ? null
        : Number(body.cycleDay);
    const lastPeriodDate =
      typeof body.lastPeriodDate === "string" && body.lastPeriodDate
        ? new Date(body.lastPeriodDate)
        : null;
    const metadata = {
      submittedFrom: "womens-health-portal",
      createdBy: session.user.id,
      clinical: sanitizeClinicalMetadata(
        careArea as WomensHealthCareArea,
        body.metadata?.clinical
      ),
    };

    const rows = await prisma.$queryRaw<WomensHealthCheckInRow[]>`
      INSERT INTO "WomensHealthCheckIn" (
        "id",
        "userId",
        "careArea",
        "periodStatus",
        "cycleDay",
        "lastPeriodDate",
        "energyLevel",
        "moodLevel",
        "sleepQuality",
        "stressLevel",
        "painLevel",
        "libidoLevel",
        "hotFlushesLevel",
        "cravingsLevel",
        "symptoms",
        "notes",
        "treatmentSideEffectFlag",
        "metadata",
        "updatedAt"
      )
      VALUES (
        ${randomUUID()},
        ${session.user.id},
        ${careArea},
        ${typeof body.periodStatus === "string" ? body.periodStatus : null},
        ${Number.isFinite(cycleDay) ? cycleDay : null},
        ${lastPeriodDate && !Number.isNaN(lastPeriodDate.getTime()) ? lastPeriodDate : null},
        ${energyLevel},
        ${moodLevel},
        ${sleepQuality},
        ${stressLevel},
        ${parseRating(body.painLevel)},
        ${parseRating(body.libidoLevel)},
        ${parseRating(body.hotFlushesLevel)},
        ${parseRating(body.cravingsLevel)},
        ${symptoms},
        ${typeof body.notes === "string" && body.notes.trim() ? body.notes.trim() : null},
        ${Boolean(body.treatmentSideEffectFlag)},
        ${JSON.stringify(metadata)}::jsonb,
        NOW()
      )
      RETURNING *
    `;

    return NextResponse.json({ checkIn: serialize(rows[0]) }, { status: 201 });
  } catch (error) {
    console.error("[womens-health/check-ins] POST", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to save Women's Health check-in" }, { status: 500 });
  }
}
