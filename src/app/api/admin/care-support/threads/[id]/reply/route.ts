import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCareSupportStaff } from "@/lib/care-support/auth";
import { memberCareSupportInboxUrl } from "@/lib/care-support/member-inbox-url";
import { notifyMember } from "@/lib/notifications/member-notify";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const session = await requireCareSupportStaff();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const text = typeof body.body === "string" ? body.body.trim() : "";
    if (!text) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const thread = await prisma.careSupportThread.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        subject: true,
        user: { select: { gender: true, subscriptionTier: true } },
      },
    });
    if (!thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    const now = new Date();
    const [message] = await prisma.$transaction([
      prisma.careSupportMessage.create({
        data: {
          threadId: id,
          senderId: session.user.id,
          senderRole: "STAFF",
          body: text,
          readByStaff: true,
          readByMember: false,
        },
      }),
      prisma.careSupportThread.update({
        where: { id },
        data: { lastMessageAt: now, status: "OPEN" },
      }),
    ]);

    await notifyMember({
      userId: thread.userId,
      intent: "CARE_MESSAGE",
      title: "Reply from your care team",
      message: `Re: ${thread.subject}`,
      actionUrl: memberCareSupportInboxUrl(thread.user),
      category: "SYSTEM",
      dedupeDays: 0,
    }).catch((err) => console.error("[care-support] notify member", err));

    return NextResponse.json({
      message: {
        id: message.id,
        senderId: message.senderId,
        senderRole: message.senderRole,
        body: message.body,
        createdAt: message.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("[admin/care-support/threads/[id]/reply POST]", error);
    return NextResponse.json({ error: "Failed to send reply" }, { status: 500 });
  }
}
