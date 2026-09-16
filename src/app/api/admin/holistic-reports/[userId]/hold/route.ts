import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { holdHolisticReport } from "@/lib/holistic-report-approval";

export const dynamic = "force-dynamic";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role?.toUpperCase() !== "DOCTOR") {
      return NextResponse.json({ error: "Only the assigned doctor can hold a report" }, { status: 403 });
    }
    const { userId } = await params;
    const report = await holdHolisticReport({
      userId,
      doctor: {
        id: session.user.id,
        firstName: session.user.firstName,
        lastName: session.user.lastName,
        email: session.user.email,
        role: session.user.role,
      },
    });
    return NextResponse.json({ report });
  } catch (error) {
    console.error("[admin/holistic-reports/hold] POST", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to hold report" },
      { status: 400 }
    );
  }
}
