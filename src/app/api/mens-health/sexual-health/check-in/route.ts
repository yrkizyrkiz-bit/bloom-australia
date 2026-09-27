import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  SEXUAL_CHECK_IN_TITLE,
  alreadyCheckedInSexualWeek,
  clampSexualRating,
  normalizeSexualSideEffect,
  parseSexualCheckInContent,
  serializeSexualCheckInContent,
  sexualWeekKey,
} from "@/lib/mens-sexual-health/weekly-check-in";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const weekKey = sexualWeekKey();
    const notes = await prisma.internalNote.findMany({
      where: {
        userId: session.user.id,
        title: SEXUAL_CHECK_IN_TITLE,
        category: "MEDICAL",
      },
      orderBy: { updatedAt: "desc" },
      take: 24,
    });

    const parsed = notes
      .map((note) => {
        const content = parseSexualCheckInContent(note.content);
        if (!content) return null;
        return { note, content };
      })
      .filter((row): row is NonNullable<typeof row> => Boolean(row));

    const thisWeek = parsed.find((row) => row.content.weekKey === weekKey) ?? null;
    const history = parsed.slice(0, 12).map(({ note, content }) => ({
      id: note.id,
      weekKey: content.weekKey,
      confidence: content.confidence,
      sideEffects: content.sideEffects,
      notes: content.notes,
      checkedInAt: content.completedAt,
    }));

    return NextResponse.json({
      weekKey,
      checkInNeeded: !alreadyCheckedInSexualWeek(thisWeek?.content.weekKey),
      thisWeek: thisWeek
        ? {
            id: thisWeek.note.id,
            weekKey: thisWeek.content.weekKey,
            confidence: thisWeek.content.confidence,
            sideEffects: thisWeek.content.sideEffects,
            notes: thisWeek.content.notes,
            checkedInAt: thisWeek.content.completedAt,
          }
        : null,
      history,
    });
  } catch (error) {
    console.error("[mens-health/sexual-health/check-in GET]", error);
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
    const weekKey = sexualWeekKey();
    const confidence = clampSexualRating(body?.confidence);
    const sideEffects = normalizeSexualSideEffect(body?.sideEffects);
    const notes =
      typeof body?.notes === "string" ? body.notes.trim().slice(0, 1000) : null;
    const completedAt = new Date().toISOString();
    const content = serializeSexualCheckInContent({
      weekKey,
      confidence,
      sideEffects,
      notes,
      completedAt,
    });

    const existingNotes = await prisma.internalNote.findMany({
      where: {
        userId: session.user.id,
        title: SEXUAL_CHECK_IN_TITLE,
        category: "MEDICAL",
      },
      orderBy: { updatedAt: "desc" },
      take: 24,
    });

    const existing =
      existingNotes.find((note) => {
        const parsed = parseSexualCheckInContent(note.content);
        return parsed?.weekKey === weekKey;
      }) ?? null;

    const note = existing
      ? await prisma.internalNote.update({
          where: { id: existing.id },
          data: { content },
        })
      : await prisma.internalNote.create({
          data: {
            userId: session.user.id,
            memberId: session.user.id,
            title: SEXUAL_CHECK_IN_TITLE,
            content,
            category: "MEDICAL",
            authorName: "Member",
            createdBy: session.user.id,
            authorId: session.user.id,
          },
        });

    return NextResponse.json({
      success: true,
      weekKey,
      id: note.id,
    });
  } catch (error) {
    console.error("[mens-health/sexual-health/check-in POST]", error);
    return NextResponse.json({ error: "Failed to save weekly check-in" }, { status: 500 });
  }
}
