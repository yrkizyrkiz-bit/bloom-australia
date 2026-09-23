import { prisma } from "@/lib/prisma";
import { startOfDayUTC } from "./dose-schedule";
import { DAILY_TRACKING_TITLE, loadNotificationSettings, notifyMember } from "@/lib/notifications/member-notify";
import { timeZoneDayBounds } from "@/lib/notifications/policy";

const DUE_COPY: Record<string, { title: string; message: string; url: string; overdue?: boolean }> = {
  DOSE: {
    title: "Medication due today",
    message: "Your dose is due today. Log it in your treatment hub when you have taken it.",
    url: "/dashboard/weight-management/treatment",
  },
  SIDE_EFFECT_CHECK: {
    title: "How are you feeling?",
    message: "Take a moment to check for side effects on your program.",
    url: "/dashboard/weight-management/treatment",
  },
  CHECK_IN: {
    title: "Weekly check-in",
    message: "Your check-in is due. A short note helps your care team see the week.",
    url: "/dashboard/weight-management/check-in",
  },
};

export async function sendProgramRemindersForUser(userId: string, memberProgramId: string) {
  const settings = await loadNotificationSettings(userId);
  const { start, end } = timeZoneDayBounds(settings.timezone);

  let sent = 0;
  const daily = await sendDailyTrackingPing(userId, start, end);
  if (daily.sent) sent++;

  const overdueDose = await prisma.programTask.findFirst({
    where: { memberProgramId, taskType: "DOSE", status: "OVERDUE" },
    select: { id: true },
  });
  if (overdueDose) {
    const result = await notifyMember({
      userId,
      intent: "PROGRAM_STEP",
      title: "Dose overdue",
      message: "A dose is still open. Log it when you can, or message your care team if you need to pause.",
      actionUrl: "/dashboard/weight-management/treatment",
      type: "WARNING",
      category: "REMINDER",
    });
    if (result.sent) sent++;
  }

  const todayStart = startOfDayUTC(new Date());
  const todayEnd = new Date(todayStart);
  todayEnd.setUTCDate(todayEnd.getUTCDate() + 1);

  const due = await prisma.programTask.findMany({
    where: {
      memberProgramId,
      status: "PENDING",
      scheduledFor: { gte: todayStart, lt: todayEnd },
      taskType: { in: ["DOSE", "SIDE_EFFECT_CHECK", "CHECK_IN"] },
    },
  });

  for (const task of due) {
    const copy = DUE_COPY[task.taskType];
    if (!copy) continue;
    const result = await notifyMember({
      userId,
      intent: "DUE_TODAY",
      title: copy.title,
      message: copy.message,
      actionUrl: copy.url,
      category: "REMINDER",
    });
    if (result.sent) sent++;
  }

  if (sent > 0) {
    await prisma.automationLog.create({
      data: {
        userId,
        automationType: "program_daily_reminder",
        triggerEvent: "cron",
        channel: "notification",
        status: "completed",
        metadata: { notificationsSent: sent },
      },
    });
  }

  return { sent };
}

async function sendDailyTrackingPing(
  userId: string,
  start: Date,
  end: Date
): Promise<{ sent: boolean }> {
  const [weight, meals] = await Promise.all([
    prisma.weightLog.findFirst({
      where: { userId, measuredAt: { gte: start, lt: end } },
      select: { id: true },
    }),
    prisma.mealLog.findMany({
      where: { userId, loggedAt: { gte: start, lt: end } },
      select: { calories: true },
    }),
  ]);

  const open: string[] = [];
  if (!weight) open.push("a weigh-in");
  if (meals.length === 0) {
    open.push("a meal");
  } else {
    const prefs = await prisma.weightManagementPreferences.findUnique({
      where: { userId },
      select: { dailyCalorieGoal: true },
    });
    const goal = prefs?.dailyCalorieGoal ?? 0;
    const calories = meals.reduce((sum, meal) => sum + (meal.calories ?? 0), 0);
    if (goal > 0 && calories < goal * 0.5) open.push("today's ring");
  }

  if (open.length === 0) return { sent: false };

  const listed = open.length === 1 ? open[0] : `${open.slice(0, -1).join(", ")} or ${open[open.length - 1]}`;
  return notifyMember({
    userId,
    intent: "DAILY_TRACKING",
    title: DAILY_TRACKING_TITLE,
    message: `Still open today: ${listed}. One log is enough to keep the day moving.`,
    actionUrl: "/dashboard/weight-management",
    category: "REMINDER",
  });
}

export async function sendMidweekNudge(userId: string, memberProgramId: string) {
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: "Australia/Sydney",
    weekday: "short",
  }).format(new Date());
  if (weekday !== "Wed") return { sent: false };

  const open = await prisma.programTask.findFirst({
    where: {
      memberProgramId,
      status: { in: ["PENDING", "OVERDUE"] },
      taskType: { in: ["DOSE", "CHECK_IN"] },
      scheduledFor: { lt: new Date() },
    },
    select: { taskType: true },
  });
  if (!open) return { sent: false };

  return notifyMember({
    userId,
    intent: "MIDWEEK_NUDGE",
    title: "Still open this week",
    message:
      open.taskType === "DOSE"
        ? "A dose from earlier this week is still open."
        : "Your check-in from earlier this week is still open.",
    actionUrl:
      open.taskType === "DOSE"
        ? "/dashboard/weight-management/treatment"
        : "/dashboard/weight-management/check-in",
    category: "REMINDER",
    dedupeDays: 7,
  });
}

/** One bell the day before a booked consult. Always sent. */
export async function sendConsultTomorrowPings() {
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const { start, end } = timeZoneDayBounds("Australia/Sydney", tomorrow);
  const appointments = await prisma.appointment.findMany({
    where: {
      status: "SCHEDULED",
      scheduledAt: { gte: start, lt: end },
    },
    select: { userId: true, title: true },
  });

  let sent = 0;
  const seen = new Set<string>();
  for (const appointment of appointments) {
    if (seen.has(appointment.userId)) continue;
    seen.add(appointment.userId);
    const result = await notifyMember({
      userId: appointment.userId,
      intent: "PROGRAM_STEP",
      title: "Consultation tomorrow",
      message: appointment.title
        ? `${appointment.title} is booked for tomorrow.`
        : "You have a consultation booked for tomorrow.",
      actionUrl: "/dashboard",
      category: "APPOINTMENT",
    });
    if (result.sent) sent++;
  }
  return { sent };
}
