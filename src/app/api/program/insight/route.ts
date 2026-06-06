import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateWeeklyInsight } from "@/lib/program/weekly-insight";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const force = searchParams.get("force") === "true";

    const program = await prisma.memberProgram.findUnique({
      where: { userId: session.user.id },
    });

    if (!program) {
      return NextResponse.json({ success: false, message: "No active program" }, { status: 404 });
    }

    const weekMs = 7 * 24 * 60 * 60 * 1000;
    const programWeek = Math.floor(
      (Date.now() - new Date(program.startedAt).getTime()) / weekMs
    );

    const insight = await generateWeeklyInsight(
      session.user.id,
      program.id,
      programWeek,
      force
    );

    return NextResponse.json({ success: true, programWeek, insight });
  } catch (error) {
    console.error("[program/insight]", error);
    return NextResponse.json({ error: "Failed to generate insight" }, { status: 500 });
  }
}
