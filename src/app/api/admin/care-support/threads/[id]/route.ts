import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCareSupportStaff } from "@/lib/care-support/auth";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const session = await requireCareSupportStaff();
    if (!session) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const thread = await prisma.careSupportThread.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        messages: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    await prisma.careSupportMessage.updateMany({
      where: {
        threadId: id,
        senderRole: "MEMBER",
        readByStaff: false,
      },
      data: { readByStaff: true },
    });

    return NextResponse.json({
      thread: {
        id: thread.id,
        subject: thread.subject,
        status: thread.status,
        lastMessageAt: thread.lastMessageAt.toISOString(),
        createdAt: thread.createdAt.toISOString(),
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
          readByStaff: m.readByStaff,
          readByMember: m.readByMember,
        })),
      },
    });
  } catch (error) {
    console.error("[admin/care-support/threads/[id] GET]", error);
    return NextResponse.json({ error: "Failed to load thread" }, { status: 500 });
  }
}
