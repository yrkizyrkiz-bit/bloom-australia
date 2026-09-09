import Anthropic from "@anthropic-ai/sdk";
import {
  type HolisticHealthReport,
} from "@/lib/holistic-health-report-types";
import {
  answerReportAskQuestion,
  buildAskReportContext,
  buildReportAskItems,
  type ReportAskItem,
} from "@/lib/holistic-report-ask";

const CLAUDE_MODEL =
  process.env.HOLISTIC_HEALTH_AI_MODEL ||
  process.env.ORGAN_CARE_AI_MODEL ||
  process.env.ANTHROPIC_MODEL ||
  "claude-sonnet-4-6";

const CLAUDE_ASK_TIMEOUT_MS = Number(process.env.HOLISTIC_ASK_AI_TIMEOUT_MS || 45_000);
const CLAUDE_ASK_MAX_TOKENS = 700;

const ASK_TOOL = {
  name: "submit_report_ask_answer",
  description: "Submit a short patient-facing answer to one report question.",
  input_schema: {
    type: "object",
    required: ["intro", "bullets", "insight"],
    properties: {
      intro: {
        type: "string",
        description: "ONE short warm sentence only.",
      },
      bullets: {
        type: "array",
        description:
          "Prefer exactly 1 bullet (max 2). Title = Marker: value unit. Body = one short sentence that does NOT repeat the title, value, previous value, or 'Your result is…'.",
        items: {
          type: "object",
          required: ["title", "body"],
          properties: {
            title: { type: "string" },
            body: { type: "string" },
          },
        },
      },
      insight: {
        type: "string",
        description:
          "1–2 sentences max of clinical insight (e.g. CRP often rises after a cold/flu). Do not restate the bullet numbers. Not a diagnosis.",
      },
      closing: {
        type: "string",
        description: "Optional. One very short follow-up line, or empty string if insight already covers next steps.",
      },
    },
  },
} as const;

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeout: NodeJS.Timeout | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => reject(new Error("Claude ask timed out")), timeoutMs);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

function trimSentences(text: string, maxSentences: number): string {
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  return sentences.slice(0, maxSentences).join(" ");
}

function sanitizeAskAnswer(
  question: string,
  raw: Partial<ReportAskItem> | null | undefined
): ReportAskItem | null {
  if (!raw || typeof raw !== "object") return null;
  const intro = trimSentences(typeof raw.intro === "string" ? raw.intro.trim() : "", 1);
  const insight = trimSentences(typeof raw.insight === "string" ? raw.insight.trim() : "", 2);
  const closingRaw = typeof raw.closing === "string" ? raw.closing.trim() : "";
  const closing = closingRaw ? trimSentences(closingRaw, 1) : "";
  const bullets = Array.isArray(raw.bullets)
    ? raw.bullets
        .filter(
          (b): b is { title: string; body: string } =>
            Boolean(b) &&
            typeof b === "object" &&
            typeof (b as { title?: unknown }).title === "string" &&
            typeof (b as { body?: unknown }).body === "string"
        )
        .map((b) => ({
          title: b.title.trim(),
          body: trimSentences(b.body.trim(), 2),
        }))
        .filter((b) => b.title && b.body)
        .slice(0, 1)
    : [];

  if (!intro || bullets.length === 0 || !insight) return null;

  // Drop closing when it mostly repeats the insight / GP line.
  const keepClosing =
    closing &&
    !insight.toLowerCase().includes(closing.toLowerCase().slice(0, 40)) &&
    closing.length < 120;

  return {
    id: `claude-${Date.now()}`,
    question,
    intro,
    bullets,
    insight,
    closing: keepClosing ? closing : undefined,
  };
}

export async function generateHolisticAskAnswerWithClaude(input: {
  question: string;
  userName: string;
  report: HolisticHealthReport;
}): Promise<ReportAskItem> {
  const question = input.question.trim();
  const fallback = answerReportAskQuestion(
    input.report,
    question,
    buildReportAskItems(input.report)
  );

  if (!process.env.ANTHROPIC_API_KEY) {
    return fallback;
  }

  const context = buildAskReportContext(input.report);
  const prompt = `You are George, Sanative's friendly AI care companion answering ONE question about this member's blood-test report.

Member: ${input.userName}
Question: ${question}

REPORT CONTEXT (use only this — no web facts):
${context}

Style rules:
- Educational only. Do NOT diagnose, prescribe, or claim certainty.
- Australian patient-friendly language. Lab codes in brackets once if needed.
- Keep it SHORT and non-repetitive. Target under ~90 words total.
- Intro: ONE sentence.
- Bullets: prefer exactly 1 (never more than 2). Title = "Common name: value unit". Body = one short sentence with no repeated numbers or "Your result is…".
- Insight: 1–2 sentences on everyday clinical context (e.g. CRP often jumps after a cold/flu/infection). Do not restate the bullet.
- Closing: omit unless essential; if used, one short line only.
- Stay on-topic. Do NOT pad with unrelated markers.
- Speak as George in a warm, clear voice.

Submit via submit_report_ask_answer only.`;

  try {
    const anthropic = new Anthropic();
    const message = await withTimeout(
      anthropic.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: CLAUDE_ASK_MAX_TOKENS,
        tools: [ASK_TOOL as unknown as Anthropic.Tool],
        tool_choice: { type: "tool", name: "submit_report_ask_answer" },
        messages: [{ role: "user", content: prompt }],
      }),
      CLAUDE_ASK_TIMEOUT_MS
    );

    const toolUse = message.content.find(
      (block) => block.type === "tool_use" && block.name === "submit_report_ask_answer"
    );
    if (!toolUse || toolUse.type !== "tool_use") {
      return fallback;
    }

    const parsed = sanitizeAskAnswer(
      question,
      toolUse.input as Partial<ReportAskItem>
    );
    return parsed || fallback;
  } catch (error) {
    console.warn(
      "[holistic-report-ask] Claude failed:",
      error instanceof Error ? error.message : error
    );
    return fallback;
  }
}
