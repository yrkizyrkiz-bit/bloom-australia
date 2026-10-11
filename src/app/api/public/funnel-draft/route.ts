import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isEstablishedMember } from "@/lib/auth/member-identity-guard";
import { verifyResumeVerificationToken } from "@/lib/funnel/resume-verification-token";
import {
  draftReachedPayment,
  quizAnswersFromDraft,
  resumeWeightManagementStep,
  WM_FUNNEL_PAYMENT_STEP,
} from "@/lib/funnel/wm-funnel-draft";
import { RATE_LIMITS } from "@/lib/security/rate-limit-config";
import {
  enforceIpRateLimit,
  rateLimitExceededResponse,
} from "@/lib/security/rate-limit-http";

async function prospectiveUser(email: string, userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      passwordHash: true,
      subscriptionStatus: true,
      journeyStatus: true,
      memberStatus: true,
    },
  });
  if (!user || user.email.toLowerCase() !== email) return { error: "Account not found" as const, status: 403 };
  if (isEstablishedMember(user)) return { error: "member" as const, status: 409 };
  return { user };
}

function readIdentity(search: { email?: unknown; userId?: unknown }) {
  const email = typeof search.email === "string" ? search.email.toLowerCase().trim() : "";
  const userId = typeof search.userId === "string" ? search.userId : "";
  return { email, userId };
}

export async function GET(req: NextRequest) {
  try {
    const ipLimited = await enforceIpRateLimit(req, "funnel-draft:ip", RATE_LIMITS.checkEmailIp);
    if (!ipLimited.allowed) return rateLimitExceededResponse(ipLimited.retryAfterSec);

    const url = new URL(req.url);
    const { email, userId } = readIdentity({
      email: url.searchParams.get("email"),
      userId: url.searchParams.get("userId"),
    });
    if (!email || !userId) {
      return NextResponse.json({ error: "Account details are required" }, { status: 400 });
    }

    const resumeToken = req.headers.get("x-resume-token");
    const tokenCheck = verifyResumeVerificationToken(resumeToken || "", email);
    if (!tokenCheck.valid) {
      return NextResponse.json({ error: "Email verification required" }, { status: 401 });
    }

    const gate = await prospectiveUser(email, userId);
    if ("error" in gate) {
      return NextResponse.json({ error: "Unable to resume this application" }, { status: gate.status });
    }
    if (tokenCheck.userId && tokenCheck.userId !== userId) {
      return NextResponse.json({ error: "Unable to resume this application" }, { status: 403 });
    }

    const intake = await prisma.weightManagementIntake.findFirst({
      where: { userId },
      select: { quizData: true },
      orderBy: { updatedAt: "desc" },
    });
    const quiz = (intake?.quizData as Record<string, unknown> | null) ?? null;
    return NextResponse.json({
      resumeStep: resumeWeightManagementStep(quiz?._draftStep, draftReachedPayment(quiz)),
      quiz: quizAnswersFromDraft(quiz),
    });
  } catch (error) {
    console.error("[funnel-draft] get failed:", error);
    return NextResponse.json({ error: "Unable to resume this application" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const ipLimited = await enforceIpRateLimit(req, "funnel-draft:ip", RATE_LIMITS.checkEmailIp);
    if (!ipLimited.allowed) return rateLimitExceededResponse(ipLimited.retryAfterSec);

    const body = await req.json().catch(() => ({}));
    const { email, userId } = readIdentity(body as { email?: unknown; userId?: unknown });
    const draftStep = (body as { draftStep?: unknown }).draftStep;
    const quiz = (body as { quiz?: unknown }).quiz;
    if (!email || !userId || typeof quiz !== "object" || quiz === null) {
      return NextResponse.json({ error: "Account details are required" }, { status: 400 });
    }

    const gate = await prospectiveUser(email, userId);
    if ("error" in gate) {
      return NextResponse.json({ error: "Unable to save this application" }, { status: gate.status });
    }

    const answers = quizAnswersFromDraft(quiz as Record<string, unknown>);
    const reachedPayment =
      resumeWeightManagementStep(draftStep, false) >= WM_FUNNEL_PAYMENT_STEP;
    const stored = {
      ...answers,
      _draftStep: resumeWeightManagementStep(draftStep, reachedPayment),
      _reachedPayment: reachedPayment,
    };

    const existing = await prisma.weightManagementIntake.findFirst({
      where: { userId },
      select: { id: true, quizData: true },
      orderBy: { updatedAt: "desc" },
    });

    if (existing) {
      const previous = (existing.quizData as Record<string, unknown> | null) ?? {};
      await prisma.weightManagementIntake.update({
        where: { id: existing.id },
        data: { quizData: { ...previous, ...stored } },
      });
    } else {
      await prisma.weightManagementIntake.create({
        data: {
          userId,
          quizData: stored,
          paymentStatus: "UNPAID",
          portalStatus: "INTAKE_STARTED",
        },
      });
    }

    return NextResponse.json({
      ok: true,
      resumeStep: stored._draftStep,
    });
  } catch (error) {
    console.error("[funnel-draft] save failed:", error);
    return NextResponse.json({ error: "Unable to save this application" }, { status: 500 });
  }
}
