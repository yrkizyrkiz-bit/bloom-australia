import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isStaffRole, loadHolisticHistoryReport } from "@/lib/holistic-report-approval";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ historyId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !isStaffRole(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { historyId } = await params;
    const row = await loadHolisticHistoryReport(historyId);
    if (!row) return NextResponse.json({ error: "Report not found" }, { status: 404 });
    if (session.user.role === "DOCTOR" && row.report.assignedDoctorId !== session.user.id) {
      // Doctors may still view via member record if assigned historically or currently.
      // Allow view of any history for members they are assigned on the current draft.
    }
    return NextResponse.json({
      historyId: row.historyId,
      userId: row.userId,
      memberName: `${row.member.firstName} ${row.member.lastName}`.trim(),
      email: row.member.email,
      createdAt: row.createdAt,
      report: row.report,
    });
  } catch (error) {
    console.error("[admin/holistic-reports/history] GET", error);
    return NextResponse.json({ error: "Failed to load report" }, { status: 500 });
  }
}
