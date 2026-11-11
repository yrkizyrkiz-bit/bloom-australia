import { NextRequest, NextResponse } from "next/server";
import { LP_WM_QUIZ_STEPS } from "@/lib/lp/weight-management-funnel";
import { TO_PROCESS_STATUS, findToProcessByAccessToken, saveToProcessQuiz } from "@/lib/lp/to-process";
import { RATE_LIMITS } from "@/lib/security/rate-limit-config";
import {
  enforceIpRateLimit,
  rateLimitExceededResponse,
} from "@/lib/security/rate-limit-http";

export async function POST(req: NextRequest) {
  try {
    const ipLimited = await enforceIpRateLimit(
      req,
      "lp-wm-quiz:ip",
      RATE_LIMITS.checkoutIp
    );
    if (!ipLimited.allowed) {
      return rateLimitExceededResponse(ipLimited.retryAfterSec);
    }

    const body = await req.json().catch(() => ({}));
    const accessToken = String(body.accessToken || "").trim();
    if (accessToken.length < 32) {
      return NextResponse.json({ error: "Session expired. Please start again." }, { status: 401 });
    }

    const answersIn = body.answers && typeof body.answers === "object" ? body.answers : {};
    const answers: Record<string, string> = {};
    for (const step of LP_WM_QUIZ_STEPS) {
      const value = String((answersIn as Record<string, unknown>)[step.id] ?? "").trim();
      const valid = step.options.some((option) => option.id === value);
      if (!valid) {
        return NextResponse.json({ error: "Please answer every question." }, { status: 400 });
      }
      answers[step.id] = value;
    }

    const row = await findToProcessByAccessToken(accessToken);
    if (!row) {
      return NextResponse.json({ error: "Session expired. Please start again." }, { status: 404 });
    }
    if (row.status === TO_PROCESS_STATUS.lead) {
      return NextResponse.json({ error: "Please complete payment first." }, { status: 409 });
    }

    await saveToProcessQuiz(row.id, answers);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[lp/weight-management/quiz]", error);
    return NextResponse.json({ error: "Failed to save your answers" }, { status: 500 });
  }
}
