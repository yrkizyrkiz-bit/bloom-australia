import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Fetch GP notifications
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const clinic = await prisma.clinic.findUnique({
      where: { leadGpEmail: session.user.email },
    });

    if (!clinic) {
      return NextResponse.json(
        { success: false, message: "No clinic found for this account" },
        { status: 404 }
      );
    }

    const notifications = await prisma.gpNotification.findMany({
      where: { clinicId: clinic.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const unreadCount = notifications.filter((n) => !n.read).length;

    return NextResponse.json({
      success: true,
      data: {
        notifications: notifications.map((n) => ({
          id: n.id,
          type: n.type.toLowerCase(),
          message: n.message,
          patientName: n.patientName,
          patientId: n.patientId,
          read: n.read,
          createdAt: n.createdAt,
          timestamp: formatTimestamp(n.createdAt),
        })),
        unreadCount,
      },
    });
  } catch (error) {
    console.error("Get GP notifications error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to get notifications" },
      { status: 500 }
    );
  }
}

// PUT - Mark notifications as read
export async function PUT() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const clinic = await prisma.clinic.findUnique({
      where: { leadGpEmail: session.user.email },
    });

    if (!clinic) {
      return NextResponse.json(
        { success: false, message: "No clinic found for this account" },
        { status: 404 }
      );
    }

    await prisma.gpNotification.updateMany({
      where: {
        clinicId: clinic.id,
        read: false,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Notifications marked as read",
    });
  } catch (error) {
    console.error("Mark notifications read error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update notifications" },
      { status: 500 }
    );
  }
}

function formatTimestamp(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 1) {
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    return diffMinutes <= 1 ? "Just now" : `${diffMinutes} minutes ago`;
  } else if (diffHours < 24) {
    return diffHours === 1 ? "1 hour ago" : `${diffHours} hours ago`;
  } else if (diffDays === 1) {
    return "Yesterday";
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return date.toLocaleDateString("en-AU", {
      day: "numeric",
      month: "short",
    });
  }
}
