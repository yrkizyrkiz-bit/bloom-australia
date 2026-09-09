/**
 * Source for the Netlify background function.
 * Bundled at build time into netlify/functions/holistic-health-report-background.js
 * so @/ path aliases resolve and the job can run up to ~15 minutes.
 */
import {
  getHolisticJobSecret,
  runHolisticHealthReportJob,
} from "../src/lib/holistic-health-report";

type HandlerEvent = {
  headers?: Record<string, string | undefined>;
  body?: string | null;
};

function header(event: HandlerEvent, name: string) {
  const headers = event.headers || {};
  const lower = name.toLowerCase();
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === lower) return value;
  }
  return undefined;
}

export async function handler(event: HandlerEvent) {
  const secret = getHolisticJobSecret();
  const provided = header(event, "x-holistic-job-secret");
  if (!secret || provided !== secret) {
    return { statusCode: 401, body: "Unauthorized" };
  }

  let userId = "";
  try {
    const payload = JSON.parse(event.body || "{}") as { userId?: string };
    userId = payload.userId || "";
  } catch {
    return { statusCode: 400, body: "Invalid JSON body" };
  }

  if (!userId) {
    return { statusCode: 400, body: "userId is required" };
  }

  try {
    await runHolisticHealthReportJob(userId);
    return { statusCode: 200, body: JSON.stringify({ ok: true, userId }) };
  } catch (error) {
    console.error("[holistic-health-report-background]", error);
    // Persist error state inside runHolisticHealthReportJob; still return 200 so Netlify
    // does not retry a deterministic failure (e.g. missing API key).
    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: false,
        userId,
        error: error instanceof Error ? error.message : String(error),
      }),
    };
  }
}
