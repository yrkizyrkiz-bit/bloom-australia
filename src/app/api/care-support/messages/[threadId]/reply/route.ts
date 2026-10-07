import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ threadId: string }> };

async function notifyCareStaff(params: {
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
            title: "Member reply",
            message: `${params.memberName}: ${params.subject}`,
            actionUrl: `/admin/care-comms/messages?thread=${params.threadId}`,
            category: "SYSTEM",
          },
        })
        .catch((err) => console.error("[care-support] notify staff on reply", err))
    )
  );
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { threadId } = await params;
    const body = await request.json();
    const text = typeof body.body === "string" ? body.body.trim() : "";
    if (!text) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const thread = await prisma.careSupportThread.findFirst({
      where: { id: threadId, userId: session.user.id },
      select: { id: true, subject: true, status: true },
    });
    if (!thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }
    if (thread.status === "CLOSED") {
      return NextResponse.json(
        { error: "This conversation is closed. Start a new message instead." },
        { status: 400 }
      );
    }

    const now = new Date();
    const [message] = await prisma.$transaction([
      prisma.careSupportMessage.create({
        data: {
          threadId,
          senderId: session.user.id,
          senderRole: "MEMBER",
          body: text,
          readByMember: true,
          readByStaff: false,
        },
      }),
      prisma.careSupportThread.update({
        where: { id: threadId },
        data: { lastMessageAt: now, status: "OPEN" },
      }),
    ]);

    const member = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        firstName: true,
        lastName: true,
        email: true,
        assignedCarePartnerId: true,
      },
    });
    const memberName =
      [member?.firstName, member?.lastName].filter(Boolean).join(" ") ||
      member?.email ||
      "Member";

    await notifyCareStaff({
      memberName,
      subject: thread.subject,
      threadId,
      assignedCarePartnerId: member?.assignedCarePartnerId,
    });

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
    console.error("[care-support/messages/[threadId]/reply POST]", error);
    return NextResponse.json({ error: "Failed to send reply" }, { status: 500 });
  }
}
