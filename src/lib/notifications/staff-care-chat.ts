import { prisma } from "@/lib/prisma";
import { sendWebPushToUser } from "@/lib/notifications/web-push";

const STAFF_ROLES = ["CARE_PARTNER", "ADMIN", "admin", "SUPER_ADMIN"] as const;

/**
 * In-app + Web Push alerts when a member needs a care partner in Live Chat.
 * Prefer the member's assigned care partner; otherwise notify all care partners + admins.
 */
export async function notifyStaffOfCareChatRequest(input: {
  memberId: string;
  sessionId: string;
}): Promise<{ notifiedUserIds: string[] }> {
  const member = await prisma.user.findUnique({
    where: { id: input.memberId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      assignedCarePartnerId: true,
    },
  });
  if (!member) return { notifiedUserIds: [] };

  const memberName =
    `${member.firstName || ""} ${member.lastName || ""}`.trim() || "A member";
  const title = "Live Chat — care partner needed";
  const message = `${memberName} asked for a care partner to join Live Chat.`;
  const actionUrl = `/admin/chat?session=${input.sessionId}`;

  let recipientIds: string[] = [];

  if (member.assignedCarePartnerId) {
    const assigned = await prisma.user.findFirst({
      where: {
        id: member.assignedCarePartnerId,
        role: { in: [...STAFF_ROLES] },
      },
      select: { id: true },
    });
    if (assigned) recipientIds = [assigned.id];
  }

  if (recipientIds.length === 0) {
    const staff = await prisma.user.findMany({
      where: { role: { in: [...STAFF_ROLES] } },
      select: { id: true },
    });
    recipientIds = staff.map((row) => row.id);
  }

  // Deduplicate
  recipientIds = [...new Set(recipientIds)];
  if (recipientIds.length === 0) return { notifiedUserIds: [] };

  // Avoid spamming the same chat request within a short window.
  const since = new Date(Date.now() - 2 * 60 * 1000);
  const recent = await prisma.notification.findMany({
    where: {
      userId: { in: recipientIds },
      title,
      actionUrl,
      createdAt: { gte: since },
    },
    select: { userId: true },
  });
  const alreadyNotified = new Set(recent.map((row) => row.userId));
  const toNotify = recipientIds.filter((id) => !alreadyNotified.has(id));
  if (toNotify.length === 0) return { notifiedUserIds: [] };

  await prisma.notification.createMany({
    data: toNotify.map((userId) => ({
      userId,
      type: "ALERT" as const,
      category: "SYSTEM" as const,
      title,
      message,
      actionUrl,
    })),
  });

  await Promise.all(
    toNotify.map((userId) =>
      sendWebPushToUser(userId, {
        title,
        body: message,
        url: actionUrl,
        tag: `care-chat-${input.sessionId}`,
        requireInteraction: true,
      }).catch((err) => {
        console.error("[staff-care-chat] push failed", userId, err);
        return { sent: 0, failed: 0 };
      })
    )
  );

  return { notifiedUserIds: toNotify };
}
