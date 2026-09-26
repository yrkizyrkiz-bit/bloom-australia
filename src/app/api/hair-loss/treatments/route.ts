import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { startHairTreatmentFromFirstDose } from "@/lib/program/hair-treatment";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const prescriptionId = typeof body?.prescriptionId === "string" ? body.prescriptionId : "";
    const firstDoseDate = typeof body?.firstDoseDate === "string" ? body.firstDoseDate : "";

    if (!prescriptionId || !firstDoseDate) {
      return NextResponse.json(
        { error: "Prescription and first dose date are required" },
        { status: 400 }
      );
    }

    const result = await startHairTreatmentFromFirstDose({
      userId: session.user.id,
      prescriptionId,
      firstDoseDate,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to start hair treatment";
    const status =
      message === "No completed hair prescription found"
        ? 404
        : message === "This treatment already has logged doses"
          ? 409
          : 400;
    console.error("[hair-loss/treatments POST]", error);
    return NextResponse.json({ error: message }, { status });
  }
}
