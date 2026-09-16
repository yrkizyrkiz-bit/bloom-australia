import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { assignHolisticDoctor, canAssignHolisticDoctor } from "@/lib/holistic-report-approval";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !canAssignHolisticDoctor(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { userId } = await params;
    const body = await request.json();
    const doctorId = typeof body.doctorId === "string" ? body.doctorId : "";
    if (!doctorId) return NextResponse.json({ error: "doctorId is required" }, { status: 400 });
    const report = await assignHolisticDoctor({ userId, doctorId });
    return NextResponse.json({ report });
  } catch (error) {
    console.error("[admin/holistic-reports/assign] POST", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to assign doctor" },
      { status: 400 }
    );
  }
}
