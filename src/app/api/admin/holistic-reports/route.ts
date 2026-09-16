import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  canAssignHolisticDoctor,
  isStaffRole,
  listDoctorsForAssignment,
  listMemberHolisticReports,
  listPendingHolisticReports,
} from "@/lib/holistic-report-approval";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !isStaffRole(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = request.nextUrl.searchParams.get("userId");
    if (userId) {
      const reports = await listMemberHolisticReports(userId);
      return NextResponse.json({ reports });
    }

    const assignedOnly = session.user.role?.toUpperCase() === "DOCTOR";
    const items = await listPendingHolisticReports(
      assignedOnly ? { assignedDoctorId: session.user.id } : undefined
    );
    const doctors = canAssignHolisticDoctor(session.user.role)
      ? await listDoctorsForAssignment()
      : [];

    return NextResponse.json({ items, doctors, count: items.length });
  } catch (error) {
    console.error("[admin/holistic-reports] GET", error);
    return NextResponse.json({ error: "Failed to load reports" }, { status: 500 });
  }
}
