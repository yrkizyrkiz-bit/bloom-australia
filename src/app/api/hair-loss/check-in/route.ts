import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  alreadyCheckedInHairWeek,
  clampHairRating,
  hairWeekKey,
  type HairCheckInPhoto,
} from "@/lib/hair-health/weekly-check-in";

const MAX_PHOTOS = 3;
const MAX_IMAGE_CHARS = 900_000;

function sanitizePhotos(input: unknown): HairCheckInPhoto[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter((photo) => photo && typeof photo.imageData === "string")
    .slice(0, MAX_PHOTOS)
    .map((photo, index) => ({
      id: typeof photo.id === "string" ? photo.id : `photo-${index + 1}`,
      angle: typeof photo.angle === "string" ? photo.angle : "hairline",
      imageData: String(photo.imageData).slice(0, MAX_IMAGE_CHARS),
      capturedAt:
        typeof photo.capturedAt === "string" ? photo.capturedAt : new Date().toISOString(),
    }))
    .filter((photo) => photo.imageData.startsWith("data:image/"));
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const weekKey = hairWeekKey();
    const checkIns = await prisma.hairWeeklyCheckIn.findMany({
      where: { userId: session.user.id },
      orderBy: { checkedInAt: "desc" },
      take: 12,
    });

    const thisWeek = checkIns.find((row) => row.weekKey === weekKey) || null;
    const photoCount = checkIns.reduce((sum, row) => {
      const photos = Array.isArray(row.photos) ? row.photos : [];
      return sum + photos.length;
    }, 0);

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
      history: checkIns.map((row) => ({
        id: row.id,
        weekKey: row.weekKey,
        overallFeeling: row.overallFeeling,
        sheddingLevel: row.sheddingLevel,
        scalpComfort: row.scalpComfort,
        confidence: row.confidence,
        notes: row.notes,
        photoCount: Array.isArray(row.photos) ? row.photos.length : 0,
        photos: row.photos,
        checkedInAt: row.checkedInAt.toISOString(),
      })),
      photoCount,
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
    const photos = sanitizePhotos(body?.photos);

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
