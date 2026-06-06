import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

// GET - Get all active chat sessions for coach
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const coachId = session.user.id;
    const { searchParams } = new URL(request.url);
    const view = searchParams.get("view") || "my"; // my, all, history

    if (view === "history") {
      // Get chat history for all members
      const history = await prisma.memberChatHistory.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
      });

      // Get member details
      const memberIds = [...new Set(history.map(h => h.memberId))];
      const members = await prisma.user.findMany({
        where: { id: { in: memberIds } },
        select: { id: true, firstName: true, lastName: true, email: true },
      });

      const memberMap = new Map(members.map(m => [m.id, m]));

      return NextResponse.json({
        history: history.map(h => ({
          ...h,
          member: memberMap.get(h.memberId),
        })),
      });
    }

    // Get active sessions based on view type
    let activeSessions;

    if (view === "all") {
      activeSessions = await prisma.chatSession.findMany({
        where: {
          status: { in: ["WAITING", "ACTIVE", "AI_HANDLING"] }
        },
        include: {
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
        orderBy: { lastMessageAt: "desc" },
      });
    } else {
      activeSessions = await prisma.chatSession.findMany({
        where: {
          OR: [
            { coachId, status: { in: ["WAITING", "ACTIVE"] } },
            { status: "WAITING", coachId: null },
          ]
        },
        include: {
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
        orderBy: { lastMessageAt: "desc" },
      });
    }

    // Get member details
    const memberIds = activeSessions.map(s => s.memberId);
    const members = await prisma.user.findMany({
      where: { id: { in: memberIds } },
      select: { id: true, firstName: true, lastName: true, email: true },
    });

    const memberMap = new Map(members.map(m => [m.id, m]));

    // Get coach availability
    let availability = await prisma.coachAvailability.findUnique({
      where: { coachId },
    });

    if (!availability) {
      availability = await prisma.coachAvailability.create({
        data: { coachId, status: "OFFLINE" },
      });
    }

    return NextResponse.json({
      sessions: activeSessions.map(s => ({
        ...s,
        member: memberMap.get(s.memberId),
        lastMessage: s.messages[0] || null,
      })),
      availability,
      waitingCount: activeSessions.filter(s => s.status === "WAITING" && !s.coachId).length,
    });
  } catch (error) {
    console.error("Error fetching admin chats:", error);
    return NextResponse.json({ error: "Failed to fetch chats" }, { status: 500 });
  }
}

// POST - Coach actions (join chat, send message, set availability)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const coachId = session.user.id;
    const body = await request.json();
    const { action, sessionId, message, status } = body;

    // Set availability
    if (action === "setStatus") {
      const availability = await prisma.coachAvailability.upsert({
        where: { coachId },
        update: {
          status,
          lastActiveAt: new Date(),
        },
        create: {
          coachId,
          status,
        },
      });

      return NextResponse.json({ availability });
    }

    // Join a waiting chat
    if (action === "join" && sessionId) {
      const chatSession = await prisma.chatSession.findUnique({
        where: { id: sessionId },
      });

      if (!chatSession) {
        return NextResponse.json({ error: "Session not found" }, { status: 404 });
      }

      // Update session with coach
      const updatedSession = await prisma.chatSession.update({
        where: { id: sessionId },
        data: {
          coachId,
          status: "ACTIVE",
          isAiHandled: false,
        },
        include: { messages: true },
      });

      // Add system message
      await prisma.chatMessage.create({
        data: {
          sessionId,
          senderId: "SYSTEM",
          senderType: "SYSTEM",
          message: `${session.user.firstName ? `${session.user.firstName} from your care team` : "A care partner"} has joined the chat.`,
        },
      });

      // Update coach active chats
      await prisma.coachAvailability.upsert({
        where: { coachId },
        update: {
          activeChats: { increment: 1 },
          lastActiveAt: new Date(),
        },
        create: {
          coachId,
          status: "ONLINE",
          activeChats: 1,
        },
      });

      return NextResponse.json({ session: updatedSession });
    }

    // Send message
    if (action === "message" && sessionId && message) {
      const chatSession = await prisma.chatSession.findUnique({
        where: { id: sessionId },
      });

      if (!chatSession || chatSession.coachId !== coachId) {
        return NextResponse.json({ error: "Session not found or not assigned to you" }, { status: 404 });
      }

      const coachMessage = await prisma.chatMessage.create({
        data: {
          sessionId,
          senderId: coachId,
          senderType: "COACH",
          message,
        },
      });

      await prisma.chatSession.update({
        where: { id: sessionId },
        data: { lastMessageAt: new Date() },
      });

      return NextResponse.json({ message: coachMessage });
    }

    // Transfer to AI
    if (action === "transferToAI" && sessionId) {
      const chatSession = await prisma.chatSession.findUnique({
        where: { id: sessionId },
      });

      if (!chatSession) {
        return NextResponse.json({ error: "Session not found" }, { status: 404 });
      }

      await prisma.chatSession.update({
        where: { id: sessionId },
        data: {
          coachId: null,
          status: "AI_HANDLING",
          isAiHandled: true,
        },
      });

      await prisma.chatMessage.create({
        data: {
          sessionId,
          senderId: "SYSTEM",
          senderType: "SYSTEM",
          message: "You've been transferred to our AI assistant. How can I help you?",
        },
      });

      // Decrement coach active chats
      await prisma.coachAvailability.update({
        where: { coachId },
        data: { activeChats: { decrement: 1 } },
      });

      return NextResponse.json({ success: true });
    }

    // End chat (from coach side)
    if (action === "end" && sessionId) {
      const chatSession = await prisma.chatSession.findUnique({
        where: { id: sessionId },
        include: { messages: true },
      });

      if (!chatSession) {
        return NextResponse.json({ error: "Session not found" }, { status: 404 });
      }

      // Get member name
      const member = await prisma.user.findUnique({
        where: { id: chatSession.memberId },
        select: { firstName: true, lastName: true },
      });

      // Archive the chat
      await prisma.memberChatHistory.create({
        data: {
          memberId: chatSession.memberId,
          sessionId: chatSession.id,
          coachId: chatSession.coachId,
          coachName: session.user.firstName ? `${session.user.firstName} ${session.user.lastName || ''}` : null,
          wasAiHandled: chatSession.isAiHandled,
          transcript: chatSession.messages.map(m => ({
            id: m.id,
            senderId: m.senderId,
            senderType: m.senderType,
            message: m.message,
            createdAt: m.createdAt,
          })),
          startedAt: chatSession.startedAt,
          endedAt: new Date(),
          messageCount: chatSession.messages.length,
        },
      });

      // Update session status
      await prisma.chatSession.update({
        where: { id: sessionId },
        data: { status: "ENDED", endedAt: new Date() },
      });

      // Decrement coach active chats
      if (chatSession.coachId) {
        await prisma.coachAvailability.update({
          where: { coachId: chatSession.coachId },
          data: { activeChats: { decrement: 1 } },
        });
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error in admin chat:", error);
    return NextResponse.json({ error: "Failed to process" }, { status: 500 });
  }
}
