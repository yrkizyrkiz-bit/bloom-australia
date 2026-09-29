import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function notifyCareStaff(params: {
  memberUserId: string;
  memberName: string;
  subject: string;
  threadId: string;
  assignedCarePartnerId?: string | null;
}) {
  let staffIds: string[] = [];
  if (params.assignedCarePartnerId) {
    staffIds = [params.assignedCarePartnerId];
  } else {
    const partners = await prisma.user.findMany({
      where: { role: "CARE_PARTNER" },
      select: { id: true },
      take: 20,
    });
    staffIds = partners.map((p) => p.id);
  }

  if (staffIds.length === 0) {
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true },
      take: 5,
    });
    staffIds = admins.map((a) => a.id);
  }

  await Promise.all(
    staffIds.map((userId) =>
      prisma.notification
        .create({
          data: {
            userId,
            type: "INFO",
            title: "New member message",
            message: `${params.memberName}: ${params.subject}`,
            actionUrl: `/admin/care-comms/messages?thread=${params.threadId}`,
            category: "SYSTEM",
          },
        })
        .catch((err) => console.error("[care-support] notify staff", err))
    )
  );
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const threads = await prisma.careSupportThread.findMany({
      where: { userId: session.user.id },
      orderBy: { lastMessageAt: "desc" },
      include: {
        messages: { orderBy: { createdAt: "asc" } },
      },
    });

    await prisma.careSupportMessage.updateMany({
      where: {
        thread: { userId: session.user.id },
        senderRole: "STAFF",
        readByMember: false,
      },
      data: { readByMember: true },
    });

    return NextResponse.json({
      threads: threads.map((thread) => ({
        id: thread.id,
        subject: thread.subject,
        status: thread.status,
        lastMessageAt: thread.lastMessageAt.toISOString(),
        createdAt: thread.createdAt.toISOString(),
        unreadCount: 0,
        messages: thread.messages.map((m) => ({
          id: m.id,
          senderId: m.senderId,
          senderRole: m.senderRole,
          body: m.body,
          createdAt: m.createdAt.toISOString(),
          readByStaff: m.readByStaff,
          readByMember: m.senderRole === "STAFF" ? true : m.readByMember,
        })),
      })),
    });
  } catch (error) {
    console.error("[care-support/messages GET]", error);
    return NextResponse.json({ error: "Failed to load messages" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const subject = typeof body.subject === "string" ? body.subject.trim() : "";
    const message = typeof body.body === "string" ? body.body.trim() : typeof body.message === "string" ? body.message.trim() : "";

    if (!subject || !message) {
      return NextResponse.json(
        { error: "Subject and message are required" },
        { status: 400 }
      );
    }

    const now = new Date();
    const thread = await prisma.careSupportThread.create({
      data: {
        userId: session.user.id,
        subject,
        status: "OPEN",
        lastMessageAt: now,
        messages: {
          create: {
            senderId: session.user.id,
            senderRole: "MEMBER",
            body: message,
            readByMember: true,
            readByStaff: false,
          },
        },
      },
      include: { messages: true },
    });

    const member = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { firstName: true, lastName: true, email: true, assignedCarePartnerId: true },
    });

    const memberName =
      [member?.firstName, member?.lastName].filter(Boolean).join(" ") ||
      member?.email ||
      "Member";

    await notifyCareStaff({
      memberUserId: session.user.id,
      memberName,
      subject,
      threadId: thread.id,
      assignedCarePartnerId: member?.assignedCarePartnerId,
    });

    return NextResponse.json({
      thread: {
        id: thread.id,
        subject: thread.subject,
        status: thread.status,
        lastMessageAt: thread.lastMessageAt.toISOString(),
        createdAt: thread.createdAt.toISOString(),
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
    console.error("[care-support/messages POST]", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
