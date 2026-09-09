import { NextRequest, NextResponse, after } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  HOLISTIC_HEALTH_ANALYSIS_TYPE,
  getHolisticJobSecret,
  isHolisticGenerationError,
  isHolisticGenerationPending,
  isHolisticGenerationPendingStale,
  loadHolisticHealthReportContext,
  markHolisticHealthReportError,
  markHolisticHealthReportPending,
  normalizeHolisticHealthReport,
  runHolisticHealthReportJob,
} from "@/lib/holistic-health-report";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

function isNetlifyRuntime() {
  return (
    process.env.NETLIFY === "true" ||
    Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME) ||
    Boolean(process.env.URL?.includes("netlify.app")) ||
    Boolean(process.env.DEPLOY_PRIME_URL?.includes("netlify.app"))
  );
}

function siteOriginFromRequest(request: NextRequest) {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost || request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") || "https";
  if (host && !host.includes("localhost") && !host.startsWith("127.")) {
    return `${proto}://${host}`.replace(/\/$/, "");
  }

  const fromRequest = request.nextUrl?.origin;
  if (fromRequest && !fromRequest.includes("localhost") && !fromRequest.includes("127.0.0.1")) {
    return fromRequest.replace(/\/$/, "");
  }

  return (
    process.env.URL ||
    process.env.DEPLOY_PRIME_URL ||
    process.env.NEXTAUTH_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

/**
 * Kick the Netlify background function. Must return quickly — never await Claude here.
 * Background functions acknowledge with 202 immediately.
 */
async function enqueueHolisticReportJob(userId: string, origin: string) {
  const secret = getHolisticJobSecret();
  if (!secret) {
    throw new Error("HOLISTIC_REPORT_JOB_SECRET or NEXTAUTH_SECRET is required to enqueue Claude jobs");
  }

  const url = `${origin}/.netlify/functions/holistic-health-report-background`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-holistic-job-secret": secret,
    },
    body: JSON.stringify({ userId }),
    // Background should 202 in <1s. Never let a hung enqueue burn the sync API budget.
    signal: AbortSignal.timeout(8_000),
  });

  if (!res.ok && res.status !== 202) {
    const body = await res.text().catch(() => "");
    throw new Error(`Failed to enqueue Claude report job (${res.status})${body ? `: ${body}` : ""}`);
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = request.nextUrl.searchParams.get("userId") || session.user.id;
    if (userId !== session.user.id && session.user.role?.toUpperCase() !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const context = await loadHolisticHealthReportContext(userId);
    if (!context) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const cachedReport = await prisma.aIAnalysisCache.findUnique({
      where: {
        userId_analysisType: { userId, analysisType: HOLISTIC_HEALTH_ANALYSIS_TYPE },
      },
    });

    let cachedData = cachedReport?.analysisData;
    let generating =
      isHolisticGenerationPending(cachedData) &&
      cachedReport?.biomarkerHash === context.biomarkerHash;

    // Dead pending rows (gateway killed enqueue / job never started) — surface as retryable.
    // Fresh jobs (member mid-run) stay generating until Claude finishes or this threshold passes.
    if (generating && isHolisticGenerationPendingStale(cachedData)) {
      await markHolisticHealthReportError({
        userId,
        biomarkerHash: context.biomarkerHash,
        message: "Report timed out on the server. Please try again.",
      });
      cachedData = {
        status: "error",
        message: "Report timed out on the server. Please try again.",
        failedAt: new Date().toISOString(),
        biomarkerHash: context.biomarkerHash,
      };
      generating = false;
    }

    const generationError =
      isHolisticGenerationError(cachedData) && cachedReport?.biomarkerHash === context.biomarkerHash
        ? cachedData.message
        : null;

    const normalized = normalizeHolisticHealthReport(
      cachedData as Record<string, unknown> | null,
      cachedReport && !generating && !generationError ? context : undefined
    );

    // Never serve the deterministic failover seed as the member-facing report.
    const report = normalized?.aiProvider === "claude" ? normalized : null;
    const hasReadyReport =
      Boolean(report) && cachedReport?.biomarkerHash === context.biomarkerHash;
    const canGenerate =
      context.biomarkerCount > 0 &&
      !generating &&
      (!hasReadyReport || Boolean(generationError));

    return NextResponse.json({
      report,
      cached: hasReadyReport,
      generating,
      generationError,
      canGenerate,
      requiresNewBloodTest: hasReadyReport && !canGenerate,
      biomarkerCount: context.biomarkerCount,
      overallHealthScore: context.healthScores.overall,
      dataDate: context.dataDate,
      resultsStale: context.resultsStale,
      generatedAt: hasReadyReport ? cachedReport?.updatedAt?.toISOString() || null : null,
      programs: context.programs,
    });
  } catch (error) {
    console.error("[holistic-health-report] GET", error);
    return NextResponse.json({ error: "Failed to load holistic health report" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const userId = body.userId || session.user.id;
    if (userId !== session.user.id && session.user.role?.toUpperCase() !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const context = await loadHolisticHealthReportContext(userId);
    if (!context) return NextResponse.json({ error: "User not found" }, { status: 404 });

    if (!context.biomarkerHash || context.biomarkerCount === 0) {
      return NextResponse.json(
        { error: "No biomarker results found", requiresBiomarkers: true },
        { status: 400 }
      );
    }

    const existingReport = await prisma.aIAnalysisCache.findUnique({
      where: {
        userId_analysisType: { userId, analysisType: HOLISTIC_HEALTH_ANALYSIS_TYPE },
      },
    });

    const existingData = existingReport?.analysisData;
    const sameHash = existingReport?.biomarkerHash === context.biomarkerHash;
    const pendingFresh =
      sameHash &&
      isHolisticGenerationPending(existingData) &&
      !isHolisticGenerationPendingStale(existingData);
    const readyReport =
      sameHash &&
      !isHolisticGenerationPending(existingData) &&
      !isHolisticGenerationError(existingData)
        ? normalizeHolisticHealthReport(existingData as Record<string, unknown>, context)
        : null;

    // Allow replacing a clinical/deterministic cache with the full Claude report.
    const isClaudeReady = readyReport?.aiProvider === "claude";

    if (isClaudeReady) {
      return NextResponse.json(
        {
          report: readyReport,
          cached: true,
          blocked: true,
          reason:
            "A holistic report already exists for your latest blood test. Upload new results to generate another.",
          dataDate: context.dataDate,
          resultsStale: context.resultsStale,
        },
        { status: 409 }
      );
    }

    const origin = siteOriginFromRequest(request);
    const onNetlify = isNetlifyRuntime();

    // Fresh in-flight job: acknowledge and let the client keep polling (do not double-enqueue).
    if (pendingFresh) {
      return NextResponse.json(
        {
          generating: true,
          cached: false,
          message: "Claude is preparing your comprehensive report. This usually takes 1–2 minutes.",
          dataDate: context.dataDate,
          resultsStale: context.resultsStale,
        },
        { status: 202 }
      );
    }

    await markHolisticHealthReportPending({
      userId,
      biomarkerHash: context.biomarkerHash,
    });

    if (!onNetlify) {
      await runHolisticHealthReportJob(userId);
      const cached = await prisma.aIAnalysisCache.findUnique({
        where: {
          userId_analysisType: { userId, analysisType: HOLISTIC_HEALTH_ANALYSIS_TYPE },
        },
      });
      const report = normalizeHolisticHealthReport(
        cached?.analysisData as Record<string, unknown> | null,
        context
      );
      if (!report || report.aiProvider !== "claude") {
        throw new Error("Claude report did not persist correctly");
      }
      return NextResponse.json(
        {
          report,
          cached: false,
          generating: false,
          usedFallback: false,
          dataDate: context.dataDate,
          resultsStale: context.resultsStale,
        },
        { status: 201 }
      );
    }

    // Return 202 immediately so the sync Next route never hits the gateway timeout.
    // Enqueue runs in after() with the same runtime secret the background function uses.
    after(async () => {
      try {
        await enqueueHolisticReportJob(userId, origin);
      } catch (error) {
        console.error("[holistic-health-report] enqueue failed", error);
        await markHolisticHealthReportError({
          userId,
          biomarkerHash: context.biomarkerHash,
          message:
            error instanceof Error
              ? error.message
              : "Failed to start Claude report job. Please try again.",
        });
      }
    });

    return NextResponse.json(
      {
        generating: true,
        cached: false,
        message: "Claude is preparing your comprehensive report. This usually takes 1–2 minutes.",
        dataDate: context.dataDate,
        resultsStale: context.resultsStale,
      },
      { status: 202 }
    );
  } catch (error) {
    console.error("[holistic-health-report] POST", error);
    const message = error instanceof Error ? error.message : "Failed to generate holistic health report";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
