import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import { buildProgramContext, contextHash } from "./build-context";
import { evaluateBiomarkerFlags, applyBiomarkerEscalations } from "./biomarker-rules";

const anthropic = new Anthropic();

export type WeeklyInsightPayload = {
  summary: string;
  bullets: string[];
  focusArea: string;
  encouragement: string;
};

export async function generateWeeklyInsight(
  userId: string,
  memberProgramId: string,
  programWeek: number,
  force = false
): Promise<WeeklyInsightPayload | null> {
  const existing = await prisma.programWeekSummary.findUnique({
    where: {
      memberProgramId_programWeek: { memberProgramId, programWeek },
    },
  });

  const ctx = await buildProgramContext(userId, memberProgramId);
  const hash = contextHash(ctx);

  if (existing && !force) {
    const stored = existing.insights as WeeklyInsightPayload & { contextHash?: string };
    if (stored.contextHash === hash && existing.summary) {
      return {
        summary: existing.summary,
        bullets: stored.bullets || [],
        focusArea: existing.focusArea || stored.focusArea || "",
        encouragement: stored.encouragement || "",
      };
    }
  }

  const program = await prisma.memberProgram.findUnique({
    where: { id: memberProgramId },
  });

  let biomarkerNote = "";
  if (program?.planTier === "PRECISION") {
    const { flags, summary } = await evaluateBiomarkerFlags(userId);
    if (summary) biomarkerNote = `Biomarker notes: ${summary}`;
    if (flags.length > 0) {
      await applyBiomarkerEscalations(userId, memberProgramId, flags);
    }
  }

  const systemPrompt = `You are a warm, concise health program coach for Sanative Health (Australian telehealth, weight management).

Output ONLY valid JSON with this shape:
{
  "summary": "2 sentences max",
  "bullets": ["3 short insight bullets"],
  "focusArea": "one priority for next week",
  "encouragement": "one uplifting sentence"
}

Rules:
- Australian English
- No medical diagnosis or dose changes
- Reference the member's actual data when provided
- If adherence is low, be supportive not judgmental
- Precision members may have biomarker context — mention lifestyle focus only, not treatment changes`;

  const userPrompt = `Week ${programWeek + 1} program review for ${ctx.memberName}.
Plan: ${ctx.planTier}
Phase: ${ctx.phase}
Medication: ${ctx.medication || "weight management program"}
Weight logs this week: ${ctx.weightLogs}${ctx.weightChangeKg != null ? ` (change ${ctx.weightChangeKg} kg)` : ""}
Meals logged: ${ctx.mealLogs}
Exercise: ${ctx.exerciseSessions} sessions, ${ctx.exerciseMinutes} min
Dose adherence: ${ctx.doseAdherencePct ?? "n/a"}%
Task completion: ${ctx.taskAdherencePct ?? "n/a"}%
Side effect reports: ${ctx.sideEffectReports}
${biomarkerNote}`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 400,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const text = response.content.find((b) => b.type === "text")?.text || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");

    const parsed = JSON.parse(jsonMatch[0]) as WeeklyInsightPayload;

    await prisma.programWeekSummary.upsert({
      where: {
        memberProgramId_programWeek: { memberProgramId, programWeek },
      },
      create: {
        memberProgramId,
        programWeek,
        summary: parsed.summary,
        focusArea: parsed.focusArea,
        insights: { ...parsed, contextHash: hash },
      },
      update: {
        summary: parsed.summary,
        focusArea: parsed.focusArea,
        insights: { ...parsed, contextHash: hash },
        generatedAt: new Date(),
      },
    });

    await prisma.automationLog.create({
      data: {
        userId,
        automationType: "weekly_program_insight",
        triggerEvent: force ? "manual" : "cron",
        channel: "claude",
        status: "completed",
        metadata: { programWeek, planTier: ctx.planTier },
      },
    });

    return parsed;
  } catch (error) {
    console.error("[weekly-insight]", error);

    const fallback: WeeklyInsightPayload = {
      summary: `You're in week ${programWeek + 1} of your program. Keep logging weight and completing your daily tasks.`,
      bullets: [
        ctx.weightChangeKg != null && ctx.weightChangeKg < 0
          ? `Weight trend: ${Math.abs(ctx.weightChangeKg)} kg down this week.`
          : "Log your weight at the same time each day for the clearest trend.",
        ctx.mealLogs > 0
          ? `${ctx.mealLogs} meals logged — great awareness.`
          : "Try logging at least two meals a day this week.",
        "Message your care partner if side effects are bothering you.",
      ],
      focusArea: "Consistent daily logging",
      encouragement: "Small steps each day add up — you're building lasting habits.",
    };

    await prisma.programWeekSummary.upsert({
      where: {
        memberProgramId_programWeek: { memberProgramId, programWeek },
      },
      create: {
        memberProgramId,
        programWeek,
        summary: fallback.summary,
        focusArea: fallback.focusArea,
        insights: fallback,
      },
      update: {
        summary: fallback.summary,
        focusArea: fallback.focusArea,
        insights: fallback,
        generatedAt: new Date(),
      },
    });

    return fallback;
  }
}
