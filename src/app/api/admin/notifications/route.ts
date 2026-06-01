import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSMSStats, getSMSProviderInfo, processPendingSMS } from "@/lib/sms";

// GET - Fetch notifications history
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !["ADMIN", "CARE_PARTNER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "all"; // sms, email, all
    const status = searchParams.get("status"); // PENDING, SENT, FAILED, DELIVERED
    const recipientId = searchParams.get("recipientId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

    // Build date filter
    const dateFilter = {
      ...(startDate && { gte: new Date(startDate) }),
      ...(endDate && { lte: new Date(endDate) }),
    };
    const hasDateFilter = Object.keys(dateFilter).length > 0;

    // Fetch SMS notifications
    let smsNotifications: Array<{
      id: string;
      type: "SMS";
      recipientId: string;
      recipient: string;
      subject: string | null;
      message: string;
      status: string;
      provider: string | null;
      externalId: string | null;
      sentAt: Date | null;
      errorMessage: string | null;
      createdAt: Date;
      recipientName?: string;
      recipientEmail?: string;
    }> = [];

    let smsTotal = 0;

    if (type === "sms" || type === "all") {
      const smsWhere = {
        ...(recipientId && { recipientId }),
        ...(status && { status: status as "PENDING" | "SENT" | "FAILED" | "DELIVERED" }),
        ...(hasDateFilter && { createdAt: dateFilter }),
      };

      const [rawSmsNotifications, total] = await Promise.all([
        prisma.sMSNotification.findMany({
          where: smsWhere,
          orderBy: { createdAt: "desc" },
          skip: type === "sms" ? skip : 0,
          take: type === "sms" ? limit : Math.ceil(limit / 2),
        }),
        prisma.sMSNotification.count({ where: smsWhere }),
      ]);

      smsTotal = total;

      // Fetch recipient names
      const recipientIds = [...new Set(rawSmsNotifications.map((n) => n.recipientId).filter(Boolean))];
      const userMap = new Map<string, { firstName: string; lastName: string; email: string }>();

      if (recipientIds.length > 0) {
        const users = await prisma.user.findMany({
          where: { id: { in: recipientIds } },
          select: { id: true, firstName: true, lastName: true, email: true },
        });
        users.forEach((u) => userMap.set(u.id, u));
      }

      smsNotifications = rawSmsNotifications.map((n) => {
        const user = userMap.get(n.recipientId);
        return {
          id: n.id,
          type: "SMS" as const,
          recipientId: n.recipientId,
          recipient: n.recipientPhone,
          subject: null,
          message: n.message,
          status: n.status,
          provider: n.provider,
          externalId: n.externalId,
          sentAt: n.sentAt,
          errorMessage: n.errorMessage,
          createdAt: n.createdAt,
          recipientName: user ? `${user.firstName} ${user.lastName}` : undefined,
          recipientEmail: user?.email,
        };
      });
    }

    // Fetch automation logs (which include emails)
    let emailNotifications: Array<{
      id: string;
      type: "EMAIL";
      recipientId: string;
      recipient: string;
      subject: string | null;
      message: string;
      status: string;
      provider: string | null;
      externalId: string | null;
      sentAt: Date | null;
      errorMessage: string | null;
      createdAt: Date;
      recipientName?: string;
    }> = [];

    let emailTotal = 0;

    if (type === "email" || type === "all") {
      const emailWhere = {
        automationType: { contains: "email" },
        ...(recipientId && { userId: recipientId }),
        ...(status && {
          status: status === "SENT" ? "completed" : status === "FAILED" ? "failed" : status.toLowerCase(),
        }),
        ...(hasDateFilter && { createdAt: dateFilter }),
      };

      const [logs, total] = await Promise.all([
        prisma.automationLog.findMany({
          where: emailWhere,
          orderBy: { createdAt: "desc" },
          skip: type === "email" ? skip : 0,
          take: type === "email" ? limit : Math.ceil(limit / 2),
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
          },
        }),
        prisma.automationLog.count({ where: emailWhere }),
      ]);

      emailNotifications = logs.map((log) => ({
        id: log.id,
        type: "EMAIL" as const,
        recipientId: log.userId || "",
        recipient: log.user?.email || "",
        subject: (log.metadata as Record<string, unknown>)?.subject as string || log.automationType,
        message: (log.metadata as Record<string, unknown>)?.body as string || JSON.stringify(log.metadata),
        status: log.status === "completed" ? "SENT" : log.status === "failed" ? "FAILED" : "PENDING",
        provider: "resend",
        externalId: (log.metadata as Record<string, unknown>)?.messageId as string || null,
        sentAt: log.status === "completed" ? log.createdAt : null,
        errorMessage: (log.metadata as Record<string, unknown>)?.error as string || null,
        createdAt: log.createdAt,
        recipientName: log.user ? `${log.user.firstName} ${log.user.lastName}` : undefined,
      }));

      emailTotal = total;
    }

    // Combine and sort
    const allNotifications = [...smsNotifications, ...emailNotifications].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );

    // Get SMS stats
    const smsStats = await getSMSStats({
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });

    const smsProviderInfo = getSMSProviderInfo();

    return NextResponse.json({
      notifications: type === "all" ? allNotifications.slice(0, limit) : allNotifications,
      pagination: {
        page,
        limit,
        total: type === "sms" ? smsTotal : type === "email" ? emailTotal : smsTotal + emailTotal,
        totalPages: Math.ceil(
          (type === "sms" ? smsTotal : type === "email" ? emailTotal : smsTotal + emailTotal) / limit
        ),
      },
      stats: {
        sms: smsStats,
        smsProvider: smsProviderInfo,
      },
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}

// POST - Process pending SMS or send new notification
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    // Process pending SMS queue
    if (action === "processPending") {
      const result = await processPendingSMS(body.limit || 50);
      return NextResponse.json({
        success: true,
        ...result,
      });
    }

    // Resend failed notification
    if (action === "resend" && body.notificationId) {
      const notification = await prisma.sMSNotification.findUnique({
        where: { id: body.notificationId },
      });

      if (!notification) {
        return NextResponse.json({ error: "Notification not found" }, { status: 404 });
      }

      // Reset status to pending for reprocessing
      await prisma.sMSNotification.update({
        where: { id: body.notificationId },
        data: {
          status: "PENDING",
          errorMessage: null,
        },
      });

      // Process immediately
      const result = await processPendingSMS(1);

      return NextResponse.json({
        success: true,
        ...result,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error processing notification action:", error);
    return NextResponse.json({ error: "Failed to process action" }, { status: 500 });
  }
}
