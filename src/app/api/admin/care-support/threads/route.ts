import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCareSupportStaff } from "@/lib/care-support/auth";
import { memberCareSupportInboxUrl } from "@/lib/care-support/member-inbox-url";
import { notifyMember } from "@/lib/notifications/member-notify";

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

/** Staff-initiated message to a member (creates a new care-support thread). */
export async function POST(request: NextRequest) {
  try {
    const session = await requireCareSupportStaff();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const memberId = typeof body.memberId === "string" ? body.memberId.trim() : "";
    const subject =
      typeof body.subject === "string" ? body.subject.trim() : "Message from your care team";
    const message =
      typeof body.body === "string"
        ? body.body.trim()
        : typeof body.message === "string"
          ? body.message.trim()
          : "";

    if (!memberId) {
      return NextResponse.json({ error: "Member is required" }, { status: 400 });
    }
    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const member = await prisma.user.findUnique({
      where: { id: memberId },
      select: {
        id: true,
        role: true,
        firstName: true,
        lastName: true,
        email: true,
        gender: true,
        subscriptionTier: true,
      },
    });
    if (!member || member.role !== "MEMBER") {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    const now = new Date();
    const thread = await prisma.careSupportThread.create({
      data: {
        userId: member.id,
        subject: subject || "Message from your care team",
        status: "OPEN",
        lastMessageAt: now,
        messages: {
          create: {
            senderId: session.user.id,
            senderRole: "STAFF",
            body: message,
            readByStaff: true,
            readByMember: false,
          },
        },
      },
      include: {
        messages: { orderBy: { createdAt: "asc" } },
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    const actionUrl = memberCareSupportInboxUrl(member);
    await notifyMember({
      userId: member.id,
      intent: "CARE_MESSAGE",
      title: "Message from your care team",
      message: subject || message.slice(0, 120),
      actionUrl,
      category: "SYSTEM",
      dedupeDays: 0,
    }).catch((err) => console.error("[care-support] notify member on staff start", err));

    return NextResponse.json({
      thread: {
        id: thread.id,
        subject: thread.subject,
        status: thread.status,
        lastMessageAt: thread.lastMessageAt.toISOString(),
        createdAt: thread.createdAt.toISOString(),
        unreadCount: 0,
        preview: message.slice(0, 140),
        member: {
          id: thread.user.id,
          name: `${thread.user.firstName} ${thread.user.lastName}`.trim(),
          email: thread.user.email,
        },
        messages: thread.messages.map((m) => ({
          id: m.id,
          senderId: m.senderId,
          senderRole: m.senderRole,
          body: m.body,
          createdAt: m.createdAt.toISOString(),
        })),
      },
    });
  } catch (error) {
    console.error("[admin/care-support/threads POST]", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
