import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getLatestPortalQuizSubmissions } from "@/lib/portal-quiz-submissions";

const ALLOWED_ROLES = new Set(["ADMIN", "SUPER_ADMIN", "CARE_PARTNER", "DOCTOR"]);

function isStaffRole(role: string | undefined | null): boolean {
  if (!role) return false;
  return ALLOWED_ROLES.has(role.toUpperCase()) || role.toLowerCase() === "admin";
}

/** Latest in-portal quiz submission per program for a member record. */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!isStaffRole(session?.user?.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = new URL(req.url).searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const submissions = await getLatestPortalQuizSubmissions(userId);

    return NextResponse.json({
      submissions: submissions.map((q) => ({
        id: q.id,
        programKey: q.programKey,
        answers: q.answers,
        result: q.result,
        intent: q.intent,
        source: q.source,
        submittedAt: q.submittedAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("[admin/portal-quizzes]", error);
    return NextResponse.json({ error: "Failed to load portal quizzes" }, { status: 500 });
  }
}
