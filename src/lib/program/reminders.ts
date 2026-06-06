import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { startOfDayUTC } from "./dose-schedule";

const TASK_REMINDER_COPY: Record<string, { title: string; message: string; url: string }> = {
  WEIGH_IN: {
    title: "Log your weight",
    message: "A quick weigh-in keeps your program on track.",
    url: "/dashboard/weight-management/track",
  },
  DOSE: {
    title: "Medication reminder",
    message: "Your dose is due today — log it in your treatment hub when taken.",
    url: "/dashboard/weight-management/treatment",
  },
  SIDE_EFFECT_CHECK: {
    title: "How are you feeling?",
    message: "Take 30 seconds to check for side effects on your program.",
    url: "/dashboard/weight-management/treatment",
  },
  MEAL_LOG: {
    title: "Log your meals",
    message: "Tracking meals helps your care team personalise support.",
    url: "/dashboard/weight-management/meals",
  },
  EXERCISE: {
    title: "Move today",
    message: "Log any activity — even a short walk counts.",
    url: "/dashboard/weight-management/exercise",
  },
  CHECK_IN: {
    title: "Weekly check-in",
    message: "Reflect on your week and set a focus for the days ahead.",
    url: "/dashboard/weight-management/check-in",
  },
};

export async function sendProgramRemindersForUser(userId: string, memberProgramId: string) {
  const prefs = await prisma.weightManagementPreferences.findUnique({
    where: { userId },
  });

  if (prefs && !prefs.trackingReminders) return { sent: 0 };

  const todayStart = startOfDayUTC(new Date());
  const todayEnd = new Date(todayStart);
  todayEnd.setUTCDate(todayEnd.getUTCDate() + 1);

  const pending = await prisma.programTask.findMany({
    where: {
      memberProgramId,
      status: { in: ["PENDING", "OVERDUE"] },
      scheduledFor: { gte: todayStart, lt: todayEnd },
      taskType: { in: ["WEIGH_IN", "DOSE", "SIDE_EFFECT_CHECK", "MEAL_LOG", "EXERCISE", "CHECK_IN"] },
    },
  });

  if (pending.length === 0) return { sent: 0 };

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, firstName: true },
  });

  if (!user?.email) return { sent: 0 };

  const alreadyToday = await prisma.notification.findMany({
    where: {
      userId,
      category: "REMINDER",
      createdAt: { gte: todayStart },
    },
    select: { title: true },
  });
  const sentTitles = new Set(alreadyToday.map((n) => n.title));

  let sent = 0;
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

  for (const task of pending.slice(0, 3)) {
    const copy = TASK_REMINDER_COPY[task.taskType];
    if (!copy || sentTitles.has(copy.title)) continue;

    await prisma.notification.create({
      data: {
        userId,
        type: "INFO",
        category: "REMINDER",
        title: copy.title,
        message: copy.message,
        actionUrl: copy.url,
      },
    });

    sentTitles.add(copy.title);
    sent++;
  }

  if (sent > 0 && pending.length >= 2) {
    try {
      const items = pending
        .slice(0, 3)
        .map((t) => TASK_REMINDER_COPY[t.taskType]?.title)
        .filter(Boolean)
        .join(", ");

      await sendEmail({
        to: user.email,
        subject: `Your program today — ${user.firstName || "there"}`,
        body: `
          <h2>Hi ${user.firstName || "there"},</h2>
          <p>Here's what's on your Sanative weight program for today:</p>
          <ul>${pending
            .slice(0, 3)
            .map((t) => `<li>${TASK_REMINDER_COPY[t.taskType]?.title || t.taskType}</li>`)
            .join("")}</ul>
          <p><a href="${baseUrl}/dashboard/weight-management" style="display:inline-block;background:#059669;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">Open my program</a></p>
          <p style="color:#666;font-size:12px;">Reminders: ${items}. Turn off in program settings.</p>
        `,
      });
    } catch (e) {
      console.error("[program reminders] email failed", e);
    }
  }

  if (sent > 0) {
    await prisma.automationLog.create({
      data: {
        userId,
        automationType: "program_daily_reminder",
        triggerEvent: "cron",
        channel: "notification",
        status: "completed",
        metadata: { taskCount: pending.length, notificationsSent: sent },
      },
    });
  }

  return { sent };
}
