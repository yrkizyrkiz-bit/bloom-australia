import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  alreadyCheckedInHairWeek,
  clampHairRating,
  hairWeekKey,
} from "@/lib/hair-health/weekly-check-in";
import { parseHairCheckInPhotos } from "@/lib/hair-health/compare-photos";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const weekKey = hairWeekKey();
    const [thisWeek, history] = await Promise.all([
      prisma.hairWeeklyCheckIn.findUnique({
        where: { userId_weekKey: { userId: session.user.id, weekKey } },
      }),
      prisma.$queryRaw<
        Array<{
          id: string;
          weekKey: string;
          overallFeeling: number;
          sheddingLevel: number;
          scalpComfort: number;
          confidence: number;
          notes: string | null;
          photoCount: number;
          checkedInAt: Date;
        }>
      >`
        SELECT
          id,
          "weekKey",
          "overallFeeling",
          "sheddingLevel",
          "scalpComfort",
          confidence,
          notes,
          CASE
            WHEN jsonb_typeof("photos"::jsonb) = 'array' THEN jsonb_array_length("photos"::jsonb)
            ELSE 0
          END AS "photoCount",
          "checkedInAt"
        FROM "HairWeeklyCheckIn"
        WHERE "userId" = ${session.user.id}
        ORDER BY "checkedInAt" DESC
        LIMIT 12
      `,
    ]);

    return NextResponse.json({
      weekKey,
      checkInNeeded: !alreadyCheckedInHairWeek(thisWeek?.weekKey),
      thisWeek: thisWeek
        ? {
            id: thisWeek.id,
            weekKey: thisWeek.weekKey,
            overallFeeling: thisWeek.overallFeeling,
            sheddingLevel: thisWeek.sheddingLevel,
            scalpComfort: thisWeek.scalpComfort,
            confidence: thisWeek.confidence,
            notes: thisWeek.notes,
            photos: thisWeek.photos,
            checkedInAt: thisWeek.checkedInAt.toISOString(),
          }
        : null,
      history: history.map((row) => ({
        ...row,
        photoCount: Number(row.photoCount),
        checkedInAt: row.checkedInAt.toISOString(),
      })),
      photoCount: history.reduce((sum, row) => sum + Number(row.photoCount), 0),
    });
  } catch (error) {
    console.error("[hair-loss/check-in GET]", error);
    return NextResponse.json({ error: "Failed to load weekly check-in" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const weekKey = hairWeekKey();
    const photos = parseHairCheckInPhotos(body?.photos);

    const checkIn = await prisma.hairWeeklyCheckIn.upsert({
      where: {
        userId_weekKey: { userId: session.user.id, weekKey },
      },
      create: {
        userId: session.user.id,
        weekKey,
        overallFeeling: clampHairRating(body?.overallFeeling),
        sheddingLevel: clampHairRating(body?.sheddingLevel),
        scalpComfort: clampHairRating(body?.scalpComfort),
        confidence: clampHairRating(body?.confidence),
        notes: typeof body?.notes === "string" ? body.notes.trim().slice(0, 1000) : null,
        photos,
      },
      update: {
        overallFeeling: clampHairRating(body?.overallFeeling),
        sheddingLevel: clampHairRating(body?.sheddingLevel),
        scalpComfort: clampHairRating(body?.scalpComfort),
        confidence: clampHairRating(body?.confidence),
        notes: typeof body?.notes === "string" ? body.notes.trim().slice(0, 1000) : null,
        photos,
        checkedInAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      weekKey: checkIn.weekKey,
      id: checkIn.id,
    });
  } catch (error) {
    console.error("[hair-loss/check-in POST]", error);
    return NextResponse.json({ error: "Failed to save weekly check-in" }, { status: 500 });
  }
}
