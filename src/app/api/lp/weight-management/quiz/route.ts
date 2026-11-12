import { NextRequest, NextResponse } from "next/server";
import { validateLpWmQuizAnswers } from "@/lib/lp/weight-management-funnel";
import { TO_PROCESS_STATUS, findToProcessByAccessToken, saveToProcessQuiz } from "@/lib/lp/to-process";
import { RATE_LIMITS } from "@/lib/security/rate-limit-config";
import {
  enforceIpRateLimit,
  rateLimitExceededResponse,
} from "@/lib/security/rate-limit-http";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const accessToken = String(body.accessToken || "").trim();
    if (accessToken.length < 32) {
      return NextResponse.json({ error: "Session expired. Please start again." }, { status: 401 });
    }

    const ipLimited = await enforceIpRateLimit(
      req,
      "lp-wm-quiz:ip",
      RATE_LIMITS.checkoutIp
    );
    if (!ipLimited.allowed) {
      return rateLimitExceededResponse(ipLimited.retryAfterSec);
    }

    const quiz = validateLpWmQuizAnswers(body.answers);
    if (!quiz.ok) {
      return NextResponse.json({ error: quiz.error }, { status: 400 });
    }

    const row = await findToProcessByAccessToken(accessToken);
    if (!row) {
      return NextResponse.json({ error: "Session expired. Please start again." }, { status: 404 });
    }

    await saveToProcessQuiz(
      row.id,
      quiz.value,
      row.status === TO_PROCESS_STATUS.lead ? undefined : TO_PROCESS_STATUS.quizComplete
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[lp/weight-management/quiz]", error);
    return NextResponse.json({ error: "Failed to save your answers" }, { status: 500 });
  }
}
