import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSMSProviderInfo, sendSMS } from "@/lib/sms";

// GET - Fetch SMS notifications
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get("memberId");
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50");

    const notifications = await prisma.sMSNotification.findMany({
      where: {
        ...(memberId && { recipientId: memberId }),
        ...(status && { status: status as "PENDING" | "SENT" | "FAILED" | "DELIVERED" }),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json({ notifications });
  } catch (error) {
    console.error("Error fetching SMS notifications:", error);
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}

// POST - Send SMS notification
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action, memberId, phone, message } = body;
    const providerInfo = getSMSProviderInfo();

    // Send SMS for follow-up reminder
    if (action === "sendFollowUpReminder") {
      const member = await prisma.user.findUnique({
        where: { id: memberId },
        select: { id: true, firstName: true, phone: true },
      });

      if (!member) {
        return NextResponse.json({ error: "Member not found" }, { status: 404 });
      }

      const phoneNumber = phone || member.phone;
      if (!phoneNumber) {
        return NextResponse.json({ error: "No phone number available" }, { status: 400 });
      }

      const smsMessage =
        message ||
        `Hi ${member.firstName}, this is a reminder from Sanative Health. Please contact us at your earliest convenience. Reply STOP to unsubscribe.`;

      const notification = await prisma.sMSNotification.create({
        data: {
          recipientId: memberId,
          recipientPhone: phoneNumber,
          message: smsMessage,
          status: "PENDING",
          provider: providerInfo.provider,
        },
      });

      const result = await sendSMS(phoneNumber, smsMessage);

      await prisma.sMSNotification.update({
        where: { id: notification.id },
        data: {
          status: result.success ? "SENT" : "FAILED",
          externalId: result.messageId,
          sentAt: result.success ? new Date() : null,
          errorMessage: result.error,
        },
      });

      await prisma.internalNote.create({
        data: {
          userId: memberId,
          memberId,
          authorId: session.user.id,
          authorName:
            `${session.user.firstName || ""} ${session.user.lastName || ""}`.trim() || "Admin",
          createdBy: session.user.id,
          category: "GENERAL",
          title: `SMS ${result.success ? "sent" : "failed"}`,
          content: `${result.success ? "Sent" : "Failed to send"} SMS to ${phoneNumber}\n\nMessage: ${smsMessage}${result.error ? `\n\nError: ${result.error}` : ""}`,
          isPinned: false,
        },
      });

      return NextResponse.json({
        success: result.success,
        notification,
        error: result.error,
      });
    }

    // Send bulk urgent follow-up reminders
    if (action === "sendUrgentFollowUpReminders") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const overdueFollowUps = await prisma.callLog.findMany({
        where: {
          followUpRequired: true,
          followUpDate: { lt: today },
        },
        take: 50,
      });

      const memberIds = [...new Set(overdueFollowUps.map((f) => f.memberId))];
      const members = await prisma.user.findMany({
        where: { id: { in: memberIds } },
        select: { id: true, firstName: true, phone: true },
      });
      const memberMap = new Map(members.map((m) => [m.id, m]));

      const results = [];
      for (const followUp of overdueFollowUps) {
        const member = memberMap.get(followUp.memberId);
        if (!member?.phone) continue;

        const smsMessage = `Hi ${member.firstName}, this is an urgent reminder from Sanative Health regarding: ${followUp.subject}. Please contact us as soon as possible. Reply STOP to unsubscribe.`;

        const notification = await prisma.sMSNotification.create({
          data: {
            recipientId: member.id,
            recipientPhone: member.phone,
            message: smsMessage,
            status: "PENDING",
            provider: providerInfo.provider,
          },
        });

        const result = await sendSMS(member.phone, smsMessage);

        await prisma.sMSNotification.update({
          where: { id: notification.id },
          data: {
            status: result.success ? "SENT" : "FAILED",
            externalId: result.messageId,
            sentAt: result.success ? new Date() : null,
            errorMessage: result.error,
          },
        });

        results.push({
          memberId: member.id,
          success: result.success,
          error: result.error,
        });
      }

      return NextResponse.json({
        success: true,
        sent: results.filter((r) => r.success).length,
        failed: results.filter((r) => !r.success).length,
        results,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error sending SMS:", error);
    return NextResponse.json({ error: "Failed to send SMS" }, { status: 500 });
  }
}
