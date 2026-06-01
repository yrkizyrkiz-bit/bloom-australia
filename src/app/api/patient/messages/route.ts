import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Fetch messages
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
      include: {
        carePartner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!member) {
      return NextResponse.json(
        { success: false, message: "Member not found" },
        { status: 404 }
      );
    }

    const messages = await prisma.memberMessage.findMany({
      where: { memberId: member.id },
      orderBy: { createdAt: "asc" },
    });

    // Mark unread messages as read
    await prisma.memberMessage.updateMany({
      where: {
        memberId: member.id,
        read: false,
        senderType: { not: "PATIENT" },
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        messages: messages.map((msg) => ({
          id: msg.id,
          senderId: msg.senderId,
          senderType: msg.senderType,
          senderName:
            msg.senderType === "PATIENT"
              ? "You"
              : msg.senderType === "CARE_PARTNER"
                ? `${member.carePartner?.firstName} ${member.carePartner?.lastName}`
                : "System",
          body: msg.body,
          timestamp: msg.createdAt,
          read: msg.read,
        })),
        carePartner: member.carePartner
          ? {
              id: member.carePartner.id,
              name: `${member.carePartner.firstName} ${member.carePartner.lastName}`,
            }
          : null,
        unreadCount: messages.filter(
          (m) => !m.read && m.senderType !== "PATIENT"
        ).length,
      },
    });
  } catch (error) {
    console.error("Get messages error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to get messages" },
      { status: 500 }
    );
  }
}

// POST - Send a message
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { message } = body;

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json(
        { success: false, message: "Message is required" },
        { status: 400 }
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

    const newMessage = await prisma.memberMessage.create({
      data: {
        memberId: member.id,
        senderType: "PATIENT",
        senderId: member.id,
        body: message.trim(),
        read: true, // Patient's own messages are marked as read
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: newMessage.id,
        senderId: newMessage.senderId,
        senderType: newMessage.senderType,
        senderName: "You",
        body: newMessage.body,
        timestamp: newMessage.createdAt,
        read: newMessage.read,
      },
    });
  } catch (error) {
    console.error("Send message error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to send message" },
      { status: 500 }
    );
  }
}
