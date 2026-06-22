import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  cancelMemberProgramSubscription,
  type CancelMembershipEffective,
} from "@/lib/billing/cancel-subscription";

const STAFF_ROLES = ["ADMIN", "CARE_PARTNER"];

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !STAFF_ROLES.includes(session.user.role || "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const memberId = body?.memberId as string | undefined;
    const program = body?.program as string | undefined;
    const effective = body?.effective as CancelMembershipEffective | undefined;
    const reason = body?.reason as string | undefined;

    if (!memberId || !program) {
      return NextResponse.json(
        { error: "memberId and program are required" },
        { status: 400 }
      );
    }

    if (effective && effective !== "period_end" && effective !== "immediate") {
      return NextResponse.json({ error: "Invalid effective date option" }, { status: 400 });
    }

    const staff = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { firstName: true, lastName: true },
    });

    const result = await cancelMemberProgramSubscription({
      memberId,
      program,
      effective: effective ?? "period_end",
      reason,
      cancelledBy: session.user.id,
      cancelledByName: staff
        ? `${staff.firstName} ${staff.lastName}`.trim()
        : session.user.email ?? "Admin",
    });

    return NextResponse.json({
      success: true,
      ...result,
      message:
        result.effective === "period_end"
          ? `${result.programLabel} will cancel at the end of the billing period${
              result.accessEndsAt
                ? ` (${new Date(result.accessEndsAt).toLocaleDateString("en-AU")})`
                : ""
            }.`
          : `${result.programLabel} membership cancelled immediately.`,
    });
  } catch (error) {
    console.error("[admin/billing/cancel-subscription]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to cancel subscription" },
      { status: 500 }
    );
  }
}
