import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  HAIR_COMPARE_WEEK_LIMIT,
  parseHairTimelinePhotos,
  type HairTimelineWeek,
} from "@/lib/hair-health/compare-photos";

type TimelineRow = {
  weekKey: string;
  checkedInAt: Date;
  photos: unknown;
};

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rows = await prisma.$queryRaw<TimelineRow[]>`
      SELECT
        "weekKey",
        "checkedInAt",
        (
          SELECT COALESCE(
            jsonb_agg(
              jsonb_build_object(
                'id', photo->>'id',
                'angle', photo->>'angle',
                'capturedAt', photo->>'capturedAt'
              )
              ORDER BY photo->>'capturedAt'
            ),
            '[]'::jsonb
          )
          FROM jsonb_array_elements(
            CASE
              WHEN jsonb_typeof("photos"::jsonb) = 'array' THEN "photos"::jsonb
              ELSE '[]'::jsonb
            END
          ) AS photo
        ) AS photos
      FROM "HairWeeklyCheckIn"
      WHERE "userId" = ${session.user.id}
      ORDER BY "checkedInAt" DESC
      LIMIT ${HAIR_COMPARE_WEEK_LIMIT}
    `;

    const weeks: HairTimelineWeek[] = rows
      .map((row) => ({
        weekKey: row.weekKey,
        checkedInAt: row.checkedInAt.toISOString(),
        photos: parseHairTimelinePhotos(row.photos),
      }))
      .filter((week) => week.photos.length > 0);

    return NextResponse.json({
      weeks,
      photoCount: weeks.reduce((sum, week) => sum + week.photos.length, 0),
    });
  } catch (error) {
    console.error("[hair-loss/compare GET]", error);
    return NextResponse.json({ error: "Failed to load photo timeline" }, { status: 500 });
  }
}
