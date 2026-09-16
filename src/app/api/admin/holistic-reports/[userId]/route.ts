import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  isStaffRole,
  loadCurrentHolisticDraft,
  saveHolisticDraftEdits,
} from "@/lib/holistic-report-approval";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !isStaffRole(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { userId } = await params;
    const draft = await loadCurrentHolisticDraft(userId);
    if (!draft) return NextResponse.json({ error: "Report not found" }, { status: 404 });
    return NextResponse.json({
      userId: draft.member.id,
      memberName: `${draft.member.firstName} ${draft.member.lastName}`.trim(),
      email: draft.member.email,
      report: draft.report,
      updatedAt: draft.updatedAt,
    });
  } catch (error) {
    console.error("[admin/holistic-reports/user] GET", error);
    return NextResponse.json({ error: "Failed to load report" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !isStaffRole(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { userId } = await params;
    const draft = await loadCurrentHolisticDraft(userId);
    if (!draft) return NextResponse.json({ error: "Report not found" }, { status: 404 });
    if (session.user.role?.toUpperCase() === "DOCTOR" && draft.report.assignedDoctorId !== session.user.id) {
      return NextResponse.json({ error: "Only the assigned doctor can edit this report" }, { status: 403 });
    }

    const body = await request.json();
    const report = await saveHolisticDraftEdits({
      userId,
      editor: {
        id: session.user.id,
        firstName: session.user.firstName,
        lastName: session.user.lastName,
        email: session.user.email,
        role: session.user.role,
      },
      patch: {
        reportTitle: typeof body.reportTitle === "string" ? body.reportTitle : undefined,
        executiveSummary:
          typeof body.executiveSummary === "string" ? body.executiveSummary : undefined,
        careTeamHandoffSummary:
          typeof body.careTeamHandoffSummary === "string" ? body.careTeamHandoffSummary : undefined,
        retestingGuidance:
          typeof body.retestingGuidance === "string" ? body.retestingGuidance : undefined,
        urgentActions: Array.isArray(body.urgentActions) ? body.urgentActions : undefined,
        recommendations: Array.isArray(body.recommendations) ? body.recommendations : undefined,
        questionsForCareTeam: Array.isArray(body.questionsForCareTeam)
          ? body.questionsForCareTeam
          : undefined,
      },
    });
    return NextResponse.json({ report });
  } catch (error) {
    console.error("[admin/holistic-reports/user] PATCH", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save report" },
      { status: 400 }
    );
  }
}
