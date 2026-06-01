import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendSMS } from "@/lib/sms";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !["ADMIN", "CARE_PARTNER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { notificationId, type } = body;

    if (!notificationId || !type) {
      return NextResponse.json(
        { error: "notificationId and type are required" },
        { status: 400 }
      );
    }

    if (type === "sms") {
      // Get the SMS notification
      const notification = await prisma.sMSNotification.findUnique({
        where: { id: notificationId },
      });

      if (!notification) {
        return NextResponse.json({ error: "Notification not found" }, { status: 404 });
      }

      if (notification.status !== "FAILED") {
        return NextResponse.json(
          { error: "Only failed notifications can be retried" },
          { status: 400 }
        );
      }

      // Retry sending
      const result = await sendSMS(notification.recipientPhone, notification.message);

      // Update notification record
      await prisma.sMSNotification.update({
        where: { id: notificationId },
        data: {
          status: result.success ? "SENT" : "FAILED",
          externalId: result.messageId,
          sentAt: result.success ? new Date() : null,
          errorMessage: result.error,
        },
      });

      // Log the retry attempt
      await prisma.activityLog.create({
        data: {
          userId: session.user.id,
          action: "SMS_RETRY",
          entity: "sms_notification",
          entityId: notificationId,
          details: {
            success: result.success,
            provider: result.provider,
            error: result.error,
            retriedBy: session.user.email,
          },
        },
      });

      return NextResponse.json({
        success: result.success,
        message: result.success ? "SMS sent successfully" : "SMS failed to send",
        error: result.error,
      });
    }

    return NextResponse.json({ error: "Invalid notification type" }, { status: 400 });
  } catch (error) {
    console.error("Error retrying notification:", error);
    return NextResponse.json(
      { error: "Failed to retry notification" },
      { status: 500 }
    );
  }
}
