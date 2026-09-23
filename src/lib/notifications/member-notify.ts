import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import type { NotificationCategory, NotificationType } from "@prisma/client";
import {
  allowsEmail,
  allowsNotification,
  extraDailyCap,
  isCappedExtra,
  normaliseFrequency,
  timeZoneDayBounds,
  type NotificationIntent,
} from "./policy";

const DAILY_TRACKING_TITLE = "Today's tracking";

export async function loadNotificationSettings(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      firstName: true,
      timezone: true,
      notificationFrequency: true,
      dailyTrackingPing: true,
    },
  });
  return {
    email: user?.email ?? null,
    firstName: user?.firstName ?? null,
    timezone: user?.timezone || "Australia/Sydney",
    frequency: normaliseFrequency(user?.notificationFrequency),
    dailyTrackingPing: user?.dailyTrackingPing ?? true,
  };
}

export async function notifyMember(input: {
  userId: string;
  intent: NotificationIntent;
  title: string;
  message: string;
  category?: NotificationCategory;
  type?: NotificationType;
  actionUrl?: string;
  /** Skip if the same title was already sent inside this many days. Default 1. */
  dedupeDays?: number;
  /** Set false when the caller already sends its own email. Default true when the intent allows email. */
  email?: boolean;
}): Promise<{ sent: boolean; reason?: string }> {
  const settings = await loadNotificationSettings(input.userId);
  if (
    !allowsNotification({
      frequency: settings.frequency,
      dailyTrackingPing: settings.dailyTrackingPing,
      intent: input.intent,
    })
  ) {
    return { sent: false, reason: "preference" };
  }

  const { start } = timeZoneDayBounds(settings.timezone);
  const dedupeDays = input.dedupeDays ?? 1;
  const since = new Date(start.getTime() - (dedupeDays - 1) * 24 * 60 * 60 * 1000);

  const existing = await prisma.notification.findFirst({
    where: { userId: input.userId, title: input.title, createdAt: { gte: since } },
    select: { id: true },
  });
  if (existing) return { sent: false, reason: "duplicate" };

  if (isCappedExtra(input.intent)) {
    const cap = extraDailyCap(settings.frequency);
    const extrasToday = await prisma.notification.count({
      where: {
        userId: input.userId,
        category: "REMINDER",
        title: { not: DAILY_TRACKING_TITLE },
        createdAt: { gte: start },
      },
    });
    if (extrasToday >= cap) return { sent: false, reason: "cap" };
  }

  const category =
    input.category ??
    (input.intent === "RESULTS_READY"
      ? "BIOMARKER"
      : input.intent === "DAILY_TRACKING" || isCappedExtra(input.intent)
        ? "REMINDER"
        : "SYSTEM");

  await prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type ?? (input.intent === "RESULTS_READY" ? "SUCCESS" : "INFO"),
      category,
      title: input.title,
      message: input.message,
      actionUrl: input.actionUrl,
    },
  });

  if (input.email !== false && allowsEmail(settings.frequency, input.intent) && settings.email) {
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const link = input.actionUrl ? `${baseUrl}${input.actionUrl}` : `${baseUrl}/dashboard`;
    try {
      await sendEmail({
        to: settings.email,
        subject: input.title,
        body: `
          <h2>Hi ${settings.firstName || "there"},</h2>
          <p>${input.message}</p>
          <p><a href="${link}" style="display:inline-block;background:#059669;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">Open Sanative</a></p>
          <p style="color:#666;font-size:12px;">Notification frequency is in Account settings.</p>
        `,
      });
    } catch (error) {
      console.error("[notifyMember] email failed", error);
    }
  }

  return { sent: true };
}

export { DAILY_TRACKING_TITLE };
