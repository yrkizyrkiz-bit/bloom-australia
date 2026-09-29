import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCareSupportStaff } from "@/lib/care-support/auth";

export async function GET() {
  try {
    const session = await requireCareSupportStaff();
    if (!session) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const threads = await prisma.careSupportThread.findMany({
      orderBy: { lastMessageAt: "desc" },
      take: 100,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    const withUnread = await Promise.all(
      threads.map(async (thread) => {
        const unreadCount = await prisma.careSupportMessage.count({
          where: {
            threadId: thread.id,
            senderRole: "MEMBER",
            readByStaff: false,
          },
        });
        const latest = thread.messages[0] ?? null;
        return {
          id: thread.id,
          subject: thread.subject,
          status: thread.status,
          lastMessageAt: thread.lastMessageAt.toISOString(),
          createdAt: thread.createdAt.toISOString(),
          unreadCount,
          preview: latest?.body?.slice(0, 140) || "",
          member: {
            id: thread.user.id,
            name: `${thread.user.firstName} ${thread.user.lastName}`.trim(),
            email: thread.user.email,
          },
        };
      })
    );

    withUnread.sort((a, b) => {
      if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
      if (b.unreadCount > 0 && a.unreadCount === 0) return 1;
      return (
        new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
      );
    });

    return NextResponse.json({ threads: withUnread });
  } catch (error) {
    console.error("[admin/care-support/threads GET]", error);
    return NextResponse.json({ error: "Failed to load threads" }, { status: 500 });
  }
}
