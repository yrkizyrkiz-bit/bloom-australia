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
  programStartedAt?: string | null;
  daysOnProgram?: number;
  planTier?: string | null;
  phase?: string | null;
  medicationName?: string | null;
  weeklyTargetLossKg?: number | null;
};

function formatPlanLabel(planTier?: string | null) {
  const tier = (planTier || "CORE").toUpperCase();
  if (tier === "PRECISION") return "Sanative Precision";
  if (tier === "ESSENTIAL") return "Sanative Essential";
  return "Sanative Core";
}

function formatWeeklyLossGoal(weeklyTargetLossKg?: number | null): string {
  if (weeklyTargetLossKg == null || !Number.isFinite(weeklyTargetLossKg) || weeklyTargetLossKg <= 0) {
    return "your goals";
  }
  const rounded = Math.round(weeklyTargetLossKg * 10) / 10;
  return `your goals (about ${rounded} kg average loss per week)`;
}

/** Welcome note for the first few days — no “missed days” language. */
export function buildEarlyProgramWelcomeInsight(input: {
  memberName?: string | null;
  programWeek?: number;
  planTier?: string | null;
  phase?: string | null;
  medicationName?: string | null;
  dosage?: string | null;
  weeklyTargetLossKg?: number | null;
}): WeeklyInsightPayload {
  const name = input.memberName?.trim() || "there";
  const plan = formatPlanLabel(input.planTier);
  const goalsLine = formatWeeklyLossGoal(input.weeklyTargetLossKg);
  const medication = input.medicationName?.trim();
  const dosage = input.dosage?.trim();
  const medBit = medication
    ? dosage
      ? `meds (${medication} ${dosage})`
      : `meds (${medication})`
    : "meds";

  return {
    summary: `Welcome, ${name} — lovely to have you here. I'm George, your new friend on this journey, and I'm excited to join you.`,
    bullets: [
      `This is your first week on ${plan}, so familiarise yourself with the program and settle in.`,
      `Please check in and complete your rings — daily would be fantastic.`,
      `Keep on top of your activities, calories, and ${medBit}, and we should stay right on track for ${goalsLine}.`,
    ],
    focusArea: "Complete your rings today",
    encouragement: "I'll keep track myself and update you as we go — let's do this!",
  };
}

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
- Never suggest a dose change.

Program start rules:
- Only judge days on or after their program start date.
- If they started mid-week, do not mention gaps, catch-up, missed earlier weekdays, or “days before start”.
- In the first few days, write as George — their warm companion on the journey. Welcome them by name, introduce yourself, encourage daily rings, and mention activities, calories, and meds. If a weekly loss target is known, reference it naturally.`;

  const daysOnProgram = input.daysOnProgram ?? 0;
  const startNote = input.programStartedAt
    ? `Program commenced ${new Date(input.programStartedAt).toLocaleDateString("en-AU", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      })} (${daysOnProgram} day${daysOnProgram === 1 ? "" : "s"} on the program so far).`
    : "Program start date unknown — still do not invent missed earlier weekdays.";

  const weeklyGoalNote =
    input.weeklyTargetLossKg != null && input.weeklyTargetLossKg > 0
      ? `Weekly loss goal: about ${Math.round(input.weeklyTargetLossKg * 10) / 10} kg average per week.`
      : "Weekly loss goal: not set yet.";

  const userPrompt = `Week ${input.programWeek + 1} note for ${input.memberName} (${input.phase.toLowerCase()}).

${startNote}
Plan: ${formatPlanLabel(input.planTier)}.
${weeklyGoalNote}

Medication: ${input.medicationNote || "No medication schedule on file."}
Dose status: ${input.doseStatus || "unknown"}

Since the program started they have ${input.weightLogs} weigh-in${input.weightLogs === 1 ? "" : "s"}${
    input.weightChangeKg != null ? ` (change ${input.weightChangeKg} kg)` : ""
  }, ${input.mealLogs} meal${input.mealLogs === 1 ? "" : "s"}, and ${input.exerciseSessions} movement session${
    input.exerciseSessions === 1 ? "" : "s"
  } (${input.exerciseMinutes} min).
Side effects mentioned: ${input.sideEffectReports}.
${input.biomarkerNote || ""}

If they are still in their first few days: welcome them as George, give a short program summary, encourage daily rings, and remind them about activities, calories, and meds. Do not talk about missed days before they started.`;

  return { systemPrompt, userPrompt };
}

export function buildFriendlyFallbackInsight(
  memberName: string,
  programWeek: number,
  ctx: InsightContext
): WeeklyInsightPayload {
  const earlyDays = (ctx.daysOnProgram ?? 0) > 0 && (ctx.daysOnProgram ?? 0) <= 3;
  if (earlyDays) {
    return buildEarlyProgramWelcomeInsight({
      memberName,
      programWeek,
      planTier: ctx.planTier,
      phase: ctx.phase,
      medicationName: ctx.medicationName,
      weeklyTargetLossKg: ctx.weeklyTargetLossKg,
    });
  }

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

  if ((ctx.daysOnProgram ?? 0) > 0 && (ctx.daysOnProgram ?? 0) <= 3) {
    const welcome = buildEarlyProgramWelcomeInsight({
      memberName: program?.user.firstName || ctx.memberName,
      programWeek,
      planTier: ctx.planTier,
      phase: ctx.phase,
      medicationName: ctx.medication,
      weeklyTargetLossKg: ctx.weeklyTargetLossKg,
    });
    await prisma.programWeekSummary.upsert({
      where: {
        memberProgramId_programWeek: { memberProgramId, programWeek },
      },
      create: {
        memberProgramId,
        programWeek,
        summary: welcome.summary,
        focusArea: welcome.focusArea,
        insights: { ...welcome, contextHash: hash },
      },
      update: {
        summary: welcome.summary,
        focusArea: welcome.focusArea,
        insights: { ...welcome, contextHash: hash },
        generatedAt: new Date(),
      },
    });
    return welcome;
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
    planTier: ctx.planTier,
    medicationNote: ctx.medicationNote,
    doseStatus: ctx.doseStatus,
    weightLogs: ctx.weightLogs,
    weightChangeKg: ctx.weightChangeKg,
    mealLogs: ctx.mealLogs,
    exerciseSessions: ctx.exerciseSessions,
    exerciseMinutes: ctx.exerciseMinutes,
    sideEffectReports: ctx.sideEffectReports,
    programStartedAt: ctx.programStartedAt,
    daysOnProgram: ctx.daysOnProgram,
    weeklyTargetLossKg: ctx.weeklyTargetLossKg,
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
