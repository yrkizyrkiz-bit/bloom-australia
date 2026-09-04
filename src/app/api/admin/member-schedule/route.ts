import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireClinicalStaff } from "@/lib/auth/require-clinical-staff";
import { loadMemberSchedule, updateMemberSchedule } from "@/lib/program/update-member-schedule";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireClinicalStaff();
  if (auth.error) return auth.error;

  const userId = request.nextUrl.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  try {
    const [schedule, history] = await Promise.all([
      loadMemberSchedule(userId),
      prisma.internalNote.findMany({
        where: { userId, title: "Program schedule updated" },
        orderBy: { createdAt: "desc" },
        take: 8,
        select: {
          id: true,
          content: true,
          authorName: true,
          createdAt: true,
        },
      }),
    ]);
    return NextResponse.json({
      schedule,
      history: history.map((note) => ({
        id: note.id,
        content: note.content,
        authorName: note.authorName,
        createdAt: note.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("[member-schedule GET]", error);
    return NextResponse.json({ error: "Failed to load schedule" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireClinicalStaff();
  if (auth.error) return auth.error;

  const body = await request.json();
  const userId = typeof body.userId === "string" ? body.userId : "";
  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  try {
    const actor = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { firstName: true, lastName: true, role: true },
    });
    const actorName = actor
      ? `${actor.firstName || ""} ${actor.lastName || ""}`.trim() || "Staff"
      : "Staff";

    const result = await updateMemberSchedule({
      userId,
      actorUserId: auth.userId,
      actorName,
      actorRole: String(actor?.role || auth.role || "STAFF"),
      activationDate: body.activationDate ?? null,
      firstDoseDate: body.firstDoseDate ?? null,
      nextDoseDate: body.nextDoseDate ?? null,
      frequency: body.frequency ?? null,
    });

    return NextResponse.json({
      schedule: result.snapshot,
      note: result.note
        ? {
            id: result.note.id,
            title: result.note.title,
            content: result.note.content,
            authorName: result.note.authorName,
            createdAt: result.note.createdAt.toISOString(),
          }
        : null,
    });
  } catch (error) {
    console.error("[member-schedule PATCH]", error);
    return NextResponse.json({ error: "Could not update schedule" }, { status: 500 });
  }
}
