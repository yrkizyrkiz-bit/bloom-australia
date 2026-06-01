import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";

// Initialize Anthropic client (uses ANTHROPIC_API_KEY from environment)
const anthropic = new Anthropic();

// GET - Get active chat session and messages
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    // If specific session requested
    if (sessionId) {
      const chatSession = await prisma.chatSession.findUnique({
        where: { id: sessionId },
        include: {
          messages: {
            orderBy: { createdAt: "asc" },
          },
        },
      });

      if (!chatSession || chatSession.memberId !== userId) {
        return NextResponse.json({ error: "Session not found" }, { status: 404 });
      }

      return NextResponse.json(chatSession);
    }

    // Get active session for user
    const activeSession = await prisma.chatSession.findFirst({
      where: {
        memberId: userId,
        status: { in: ["WAITING", "ACTIVE", "AI_HANDLING"] },
      },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    // Get available coaches
    const availableCoaches = await prisma.coachAvailability.findMany({
      where: {
        status: "ONLINE",
        activeChats: { lt: prisma.coachAvailability.fields.maxChats },
      },
    });

    return NextResponse.json({
      session: activeSession,
      coachesAvailable: availableCoaches.length > 0,
    });
  } catch (error) {
    console.error("Error fetching chat:", error);
    return NextResponse.json({ error: "Failed to fetch chat" }, { status: 500 });
  }
}

// POST - Start new chat session or send message
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const { action, message, sessionId } = body;

    // Start new session
    if (action === "start") {
      // Check for existing active session
      const existingSession = await prisma.chatSession.findFirst({
        where: {
          memberId: userId,
          status: { in: ["WAITING", "ACTIVE", "AI_HANDLING"] },
        },
      });

      if (existingSession) {
        return NextResponse.json({
          session: existingSession,
          message: "Existing session found"
        });
      }

      // Check for available coaches
      const availableCoach = await prisma.coachAvailability.findFirst({
        where: {
          status: "ONLINE",
          activeChats: { lt: 3 },
        },
        orderBy: { activeChats: "asc" },
      });

      // Create new session
      const newSession = await prisma.chatSession.create({
        data: {
          memberId: userId,
          coachId: availableCoach?.coachId || null,
          status: availableCoach ? "WAITING" : "AI_HANDLING",
          isAiHandled: !availableCoach,
        },
        include: { messages: true },
      });

      // Add welcome message
      const welcomeMessage = availableCoach
        ? "Welcome to our Care Team chat! A health coach will be with you shortly. How can we help you today?"
        : "Hey there! My team is helping others at the moment, but don't worry - I'm your AI-trained buddy here to help! Let's see if I can impress you. What's on your mind today?";

      await prisma.chatMessage.create({
        data: {
          sessionId: newSession.id,
          senderId: availableCoach ? "SYSTEM" : "AI",
          senderType: availableCoach ? "SYSTEM" : "AI",
          message: welcomeMessage,
        },
      });

      // Update coach active chats if assigned
      if (availableCoach) {
        await prisma.coachAvailability.update({
          where: { coachId: availableCoach.coachId },
          data: { activeChats: { increment: 1 } },
        });
      }

      return NextResponse.json({
        session: newSession,
        isAiHandled: !availableCoach,
      });
    }

    // Send message
    if (action === "message" && sessionId && message) {
      const chatSession = await prisma.chatSession.findUnique({
        where: { id: sessionId },
      });

      if (!chatSession || chatSession.memberId !== userId) {
        return NextResponse.json({ error: "Session not found" }, { status: 404 });
      }

      // Save member message
      const memberMessage = await prisma.chatMessage.create({
        data: {
          sessionId,
          senderId: userId,
          senderType: "MEMBER",
          message,
        },
      });

      // Update last message time
      await prisma.chatSession.update({
        where: { id: sessionId },
        data: { lastMessageAt: new Date() },
      });

      // If AI handled, generate response
      if (chatSession.isAiHandled || chatSession.status === "AI_HANDLING") {
        const aiResponse = await generateAIResponse(sessionId, message);

        const aiMessage = await prisma.chatMessage.create({
          data: {
            sessionId,
            senderId: "AI",
            senderType: "AI",
            message: aiResponse,
          },
        });

        return NextResponse.json({
          memberMessage,
          aiMessage,
        });
      }

      return NextResponse.json({ memberMessage });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error in chat:", error);
    return NextResponse.json({ error: "Failed to process chat" }, { status: 500 });
  }
}

// DELETE - End chat session
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID required" }, { status: 400 });
    }

    const chatSession = await prisma.chatSession.findUnique({
      where: { id: sessionId },
      include: { messages: true },
    });

    if (!chatSession || chatSession.memberId !== userId) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Get coach name if applicable
    let coachName = null;
    if (chatSession.coachId) {
      const coach = await prisma.user.findUnique({
        where: { id: chatSession.coachId },
        select: { firstName: true, lastName: true },
      });
      coachName = coach ? `${coach.firstName} ${coach.lastName}` : null;
    }

    // Archive the chat history
    await prisma.memberChatHistory.create({
      data: {
        memberId: userId,
        sessionId: chatSession.id,
        coachId: chatSession.coachId,
        coachName,
        wasAiHandled: chatSession.isAiHandled,
        transcript: chatSession.messages.map(m => ({
          id: m.id,
          senderId: m.senderId,
          senderType: m.senderType,
          message: m.message,
          createdAt: m.createdAt,
        })),
        summary: chatSession.summary,
        startedAt: chatSession.startedAt,
        endedAt: new Date(),
        messageCount: chatSession.messages.length,
      },
    });

    // Update coach availability
    if (chatSession.coachId) {
      await prisma.coachAvailability.update({
        where: { coachId: chatSession.coachId },
        data: { activeChats: { decrement: 1 } },
      });
    }

    // Delete session and messages (cascade)
    await prisma.chatSession.delete({
      where: { id: sessionId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error ending chat:", error);
    return NextResponse.json({ error: "Failed to end chat" }, { status: 500 });
  }
}

// Generate AI response using Claude
async function generateAIResponse(sessionId: string, userMessage: string): Promise<string> {
  try {
    // Get recent messages for context
    const recentMessages = await prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    // Build conversation history - ensure it starts with user message
    const allMessages = recentMessages
      .reverse()
      .filter(m => m.senderType === "MEMBER" || m.senderType === "AI");

    const firstUserIndex = allMessages.findIndex(m => m.senderType === "MEMBER");
    const relevantMessages = firstUserIndex >= 0 ? allMessages.slice(firstUserIndex) : [];

    const conversationHistory: { role: "user" | "assistant"; content: string }[] = relevantMessages
      .slice(0, -1)
      .map(m => ({
        role: m.senderType === "MEMBER" ? "user" as const : "assistant" as const,
        content: m.message,
      }));

    const systemPrompt = `You are a friendly health buddy for Sanative Health, an Australian telehealth company.

IMPORTANT - Keep responses SHORT:
- Maximum 2-3 sentences
- Be direct and helpful
- No repetition or filler words
- One clear point per response

You help with: weight management, men's health (hair, ED, vitality), biomarkers, general wellness.

Guidelines:
- Casual, warm tone - like a helpful friend
- Australian English spelling
- For emergencies: call 000
- For medical specifics: suggest speaking with a health coach
- Never diagnose or change medication dosages`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 150,
      system: systemPrompt,
      messages: [
        ...conversationHistory,
        { role: "user", content: userMessage }
      ],
    });

    const textContent = response.content.find(block => block.type === "text");
    return textContent?.text || "Hmm, I'm having a bit of trouble thinking right now. Give me another go, or feel free to reach out to our care team directly!";
  } catch (error: unknown) {
    console.error("AI response error:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
    }
    return "Oops! I hit a small snag there. Mind trying again? If this keeps happening, our care team at support@sanative.com.au would love to help!";
  }
}

// Fallback responses when AI is not available
function generateFallbackResponse(userMessage: string): string {
  const message = userMessage.toLowerCase();

  if (message.includes("weight") || message.includes("diet") || message.includes("meal")) {
    return "Ooh, weight management questions - I love these! Our program is pretty awesome - we've got personalised meal plans, regular check-ins, and medication support all wrapped up together. For the really specific stuff, our health coaches are absolute legends at reviewing your progress and goals. Also, have a peek at our Learn section - there's heaps of great content there!";
  }

  if (message.includes("hair") || message.includes("finasteride") || message.includes("minoxidil")) {
    return "Ah, the hair journey! Great question. Our treatment plans typically include FDA-approved medications like Finasteride and Minoxidil - the real deal stuff that actually works. Now, patience is key here - most people start seeing results around the 3-6 month mark. Stick with it! For personalised advice, our health coaches can give you the lowdown on what to expect.";
  }

  if (message.includes("medication") || message.includes("dose") || message.includes("side effect")) {
    return "When it comes to your specific medication, dosage, or any side effects you might be noticing, I've gotta be straight with you - that's really a conversation for your healthcare provider. They know your full history and can give you proper personalised guidance. If you're having any severe side effects though, please don't wait - get medical attention right away!";
  }

  if (message.includes("emergency") || message.includes("urgent") || message.includes("chest pain")) {
    return "Whoa, hold up! If this is a medical emergency, please call 000 right now or get to your nearest emergency department. This chat isn't the place for emergencies - your safety comes first!";
  }

  return "Hey, great to chat with you! I'm here to help with questions about our health programs - weight management, men's health, biomarkers, you name it. For the really personalised medical stuff, our health coaches or your healthcare provider would be your best bet. So, what would you like to know more about? I'm all ears!";
}
