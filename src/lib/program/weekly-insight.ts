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
  preActivation?: boolean;
};

export function isProgramReadyForWeeklyInsight(input: {
  journeyStatus?: string | null;
  programActive?: boolean | null;
  startedAt?: Date | string | null;
  now?: Date;
}): boolean {
  if (input.programActive === false) return false;
  if (input.journeyStatus !== "ACTIVE") return false;
  if (!input.startedAt) return false;
  const started =
    input.startedAt instanceof Date ? input.startedAt : new Date(input.startedAt);
  if (Number.isNaN(started.getTime())) return false;
  return started.getTime() <= (input.now ?? new Date()).getTime();
}

export function buildPreActivationInsight(memberName?: string | null): WeeklyInsightPayload {
  const name = memberName?.trim();
  const who = name ? `${name}, your` : "Your";
  return {
    summary: `${who} program has not started yet. Weekly insights begin after your care team activates the program.`,
    bullets: [
      "There is no weekly progress to review until the program is activated.",
      "Dose adherence is not measured until your first scheduled dose after activation.",
      "You can still log meals, movement, and weight so there is a clear baseline when the program begins.",
    ],
    focusArea: "Wait for program activation",
    encouragement: "You are all set for a proper start once your program is activated.",
    preActivation: true,
  };
}

type InsightContext = {
  memberName: string;
  medicationNote?: string;
  doseStatus?: string;
  weightLogs: number;
  weightChangeKg: number | null;
  mealLogs: number;
  exerciseSessions: number;
  exerciseMinutes: number;
  sideEffectReports: number;
};

export function buildWeeklyInsightPrompts(input: InsightContext & {
  programWeek: number;
  phase: string;
  biomarkerNote?: string;
}): { systemPrompt: string; userPrompt: string } {
  const systemPrompt = `You write a short weekly note for a real person on Sanative Health, an Australian weight-management program.

Sound like a warm, switched-on care partner — human, specific, and easy to read. Write the way you would text someone you actually like.

Output ONLY valid JSON:
{
  "summary": "2 sentences max",
  "bullets": ["3 short lines"],
  "focusArea": "one gentle priority",
  "encouragement": "one genuine sentence"
}

Voice:
- Australian English. Use their first name once if it feels natural.
- Friendly and motivating. No corporate coach voice, no dashboard speak.
- Do not say adherence, compliance, logged, task completion, programme engagement, barriers, or solid foundation.
- Do not sound like a bot listing metrics.

Medication rules:
- Trust the medication note. Use the stated frequency and dates only.
- Never treat medication as daily unless the note says it is daily.
- If a dose is not due yet, do not say they missed it, skipped it, or have low medication follow-through.
- Never suggest a dose change.`;

  const userPrompt = `Week ${input.programWeek + 1} note for ${input.memberName} (${input.phase.toLowerCase()}).

Medication: ${input.medicationNote || "No medication schedule on file."}
Dose status: ${input.doseStatus || "unknown"}

This week they have ${input.weightLogs} weigh-in${input.weightLogs === 1 ? "" : "s"}${
    input.weightChangeKg != null ? ` (change ${input.weightChangeKg} kg)` : ""
  }, ${input.mealLogs} meal${input.mealLogs === 1 ? "" : "s"}, and ${input.exerciseSessions} movement session${
    input.exerciseSessions === 1 ? "" : "s"
  } (${input.exerciseMinutes} min).
Side effects mentioned: ${input.sideEffectReports}.
${input.biomarkerNote || ""}

Write about how the week actually felt from this, not a scorecard.`;

  return { systemPrompt, userPrompt };
}

export function buildFriendlyFallbackInsight(
  memberName: string,
  programWeek: number,
  ctx: InsightContext
): WeeklyInsightPayload {
  const name = memberName.trim() || "there";
  const doseLine =
    ctx.doseStatus === "not_due_yet"
      ? ctx.medicationNote || "Your next dose is still ahead — nothing to take today."
      : ctx.doseStatus === "overdue"
        ? "When you have a moment, pop into Treatment and mark your scheduled dose."
        : "Your dose schedule is on track.";

  return {
    summary: `Hey ${name}, you're in week ${programWeek + 1}. ${
      ctx.mealLogs > 0 || ctx.exerciseSessions > 0
        ? "You've already put some good days on the board."
        : "This week is a fresh start — no pressure, just a couple of small wins."
    }`,
    bullets: [
      ctx.weightChangeKg != null && ctx.weightChangeKg < 0
        ? `Nice one — you're ${Math.abs(ctx.weightChangeKg)} kg down from your recent weigh-ins.`
        : "A weigh-in at the same time of day makes the trend much easier to trust.",
      ctx.mealLogs > 0
        ? `Those ${ctx.mealLogs} meals you added help us see what actually works for you.`
        : "If you can, add a meal or two when it is easy — even a rough note is useful.",
      doseLine,
    ],
    focusArea:
      ctx.doseStatus === "not_due_yet"
        ? "Settle into meals and movement before your first dose"
        : "Keep the week simple and kind",
    encouragement: "You're doing this at a human pace, and that is exactly right.",
  };
}

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

  const program = await prisma.memberProgram.findUnique({
    where: { id: memberProgramId },
    include: {
      user: { select: { firstName: true, journeyStatus: true } },
    },
  });

  if (
    !isProgramReadyForWeeklyInsight({
      journeyStatus: program?.user.journeyStatus || ctx.journeyStatus,
      programActive: program?.isActive ?? ctx.programActive,
      startedAt: program?.startedAt ?? null,
    })
  ) {
    const fallback = buildPreActivationInsight(program?.user.firstName || ctx.memberName);
    await prisma.programWeekSummary.upsert({
      where: {
        memberProgramId_programWeek: { memberProgramId, programWeek },
      },
      create: {
        memberProgramId,
        programWeek,
        summary: fallback.summary,
        focusArea: fallback.focusArea,
        insights: { ...fallback, contextHash: hash },
      },
      update: {
        summary: fallback.summary,
        focusArea: fallback.focusArea,
        insights: { ...fallback, contextHash: hash },
        generatedAt: new Date(),
      },
    });
    await prisma.automationLog.create({
      data: {
        userId,
        automationType: "weekly_program_insight",
        triggerEvent: force ? "manual" : "cron",
        channel: "pre_activation",
        status: "completed",
        metadata: { programWeek, planTier: ctx.planTier, skippedClaude: true },
      },
    });
    return fallback;
  }

  if (existing && !force) {
    const stored = existing.insights as WeeklyInsightPayload & { contextHash?: string };
    if (stored.contextHash === hash && existing.summary && !stored.preActivation) {
      return {
        summary: existing.summary,
        bullets: stored.bullets || [],
        focusArea: existing.focusArea || stored.focusArea || "",
        encouragement: stored.encouragement || "",
      };
    }
  }

  let biomarkerNote = "";
  if (program?.planTier === "PRECISION") {
    const { flags, summary } = await evaluateBiomarkerFlags(userId);
    if (summary) biomarkerNote = `Biomarker notes: ${summary}`;
    if (flags.length > 0) {
      await applyBiomarkerEscalations(userId, memberProgramId, flags);
    }
  }

  const { systemPrompt, userPrompt } = buildWeeklyInsightPrompts({
    memberName: ctx.memberName,
    programWeek,
    phase: ctx.phase,
    medicationNote: ctx.medicationNote,
    doseStatus: ctx.doseStatus,
    weightLogs: ctx.weightLogs,
    weightChangeKg: ctx.weightChangeKg,
    mealLogs: ctx.mealLogs,
    exerciseSessions: ctx.exerciseSessions,
    exerciseMinutes: ctx.exerciseMinutes,
    sideEffectReports: ctx.sideEffectReports,
    biomarkerNote,
  });

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

    const fallback = buildFriendlyFallbackInsight(ctx.memberName, programWeek, ctx);

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
