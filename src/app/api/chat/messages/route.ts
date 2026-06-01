import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Get messages for a session (for polling)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const isAdmin = session.user.role === "ADMIN";
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");
    const after = searchParams.get("after"); // Message ID to get messages after

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID required" }, { status: 400 });
    }

    // Verify access to session
    const chatSession = await prisma.chatSession.findUnique({
      where: { id: sessionId },
    });

    if (!chatSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Check authorization
    if (!isAdmin && chatSession.memberId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Build query
    const whereClause: Record<string, unknown> = { sessionId };

    if (after) {
      const afterMessage = await prisma.chatMessage.findUnique({
        where: { id: after },
      });
      if (afterMessage) {
        whereClause.createdAt = { gt: afterMessage.createdAt };
      }
    }

    const messages = await prisma.chatMessage.findMany({
      where: whereClause,
      orderBy: { createdAt: "asc" },
    });

    // Mark messages as read for the other party
    const unreadMessages = messages.filter(m => !m.isRead);
    if (unreadMessages.length > 0) {
      const senderTypesToMark = isAdmin ? ["MEMBER"] : ["COACH", "AI", "SYSTEM"];
      await prisma.chatMessage.updateMany({
        where: {
          id: { in: unreadMessages.filter(m => senderTypesToMark.includes(m.senderType)).map(m => m.id) },
          isRead: false,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      messages,
      session: {
        id: chatSession.id,
        status: chatSession.status,
        isAiHandled: chatSession.isAiHandled,
        coachId: chatSession.coachId,
      },
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}
