import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureMemberProgram } from "@/lib/program/start-program";

/** Manually start or refresh program (testing / backfill). */
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rx = await prisma.prescription.findFirst({
      where: {
        patientId: session.user.id,
        category: "WEIGHT_MANAGEMENT",
        status: "ACTIVE",
      },
      orderBy: { createdAt: "desc" },
    });

    if (!rx) {
      return NextResponse.json(
        { error: "No active weight management prescription found" },
        { status: 404 }
      );
    }

    const program = await ensureMemberProgram(session.user.id, rx.id);

    return NextResponse.json({
      success: true,
      programId: program.id,
      prescriptionId: rx.id,
    });
  } catch (error) {
    console.error("[program/start]", error);
    return NextResponse.json({ error: "Failed to start program" }, { status: 500 });
  }
}
