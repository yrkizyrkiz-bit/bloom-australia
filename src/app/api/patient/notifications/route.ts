import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Fetch notifications
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const member = await prisma.programMember.findUnique({
      where: { email: session.user.email },
    });

    if (!member) {
      return NextResponse.json(
        { success: false, message: "Member not found" },
        { status: 404 }
      );
    }

    const notifications = await prisma.memberNotification.findMany({
      where: { memberId: member.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    const unreadCount = notifications.filter((n) => !n.read).length;

    return NextResponse.json({
      success: true,
      data: {
        notifications: notifications.map((n) => ({
          id: n.id,
          type: n.type,
          message: n.message,
          read: n.read,
          createdAt: n.createdAt,
        })),
        unreadCount,
      },
    });
  } catch (error) {
    console.error("Get notifications error:", error);
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

    const member = await prisma.programMember.findUnique({
      where: { email: session.user.email },
    });

    if (!member) {
      return NextResponse.json(
        { success: false, message: "Member not found" },
        { status: 404 }
      );
    }

    await prisma.memberNotification.updateMany({
      where: {
        memberId: member.id,
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
