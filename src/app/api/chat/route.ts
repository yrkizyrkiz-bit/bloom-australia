import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";
import {
  ESCALATE_MARKER,
  escalateChatToCareTeam,
  memberRequestedCareTeam,
  shouldGeorgeRespond,
  stripEscalateMarker,
} from "@/lib/chat/escalate-to-care-team";

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
        const sessionWithMessages = await prisma.chatSession.findUnique({
          where: { id: existingSession.id },
          include: {
            messages: { orderBy: { createdAt: "asc" } },
          },
        });

        return NextResponse.json({
          session: sessionWithMessages ?? existingSession,
          message: "Existing session found",
        });
      }

      // Always start with George (AI). Care partners join via escalate → WAITING inbox.
      const newSession = await prisma.chatSession.create({
        data: {
          memberId: userId,
          coachId: null,
          status: "AI_HANDLING",
          isAiHandled: true,
        },
      });

      const welcomeMessage =
        "Hey! I'm George — your first stop for questions. I can help with your program, and if you need a care partner I'll bring them into this chat. What's on your mind?";

      await prisma.chatMessage.create({
        data: {
          sessionId: newSession.id,
          senderId: "AI",
          senderType: "AI",
          message: welcomeMessage,
        },
      });

      const sessionWithMessages = await prisma.chatSession.findUnique({
        where: { id: newSession.id },
        include: { messages: { orderBy: { createdAt: "asc" } } },
      });

      return NextResponse.json({
        session: sessionWithMessages,
        isAiHandled: true,
      });
    }

    // Member asks George to notify the care team (existing admin live-chat inbox)
    if (action === "requestCareTeam" && sessionId) {
      const chatSession = await prisma.chatSession.findUnique({
        where: { id: sessionId },
      });

      if (!chatSession || chatSession.memberId !== userId) {
        return NextResponse.json({ error: "Session not found" }, { status: 404 });
      }

      const result = await escalateChatToCareTeam(sessionId, {
        notifiedBy: "member",
        reason: typeof message === "string" ? message : null,
      });

      if (!result.session) {
        return NextResponse.json({ error: "Unable to notify care team" }, { status: 400 });
      }

      const sessionWithMessages = await prisma.chatSession.findUnique({
        where: { id: sessionId },
        include: { messages: { orderBy: { createdAt: "asc" } } },
      });

      return NextResponse.json({
        session: sessionWithMessages,
        escalated: result.escalated,
        alreadyWaiting: result.alreadyWaiting,
        systemMessage: result.systemMessage,
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

      // George answers until a care partner has joined the chat
      if (shouldGeorgeRespond(chatSession)) {
        const wantsCareTeam = memberRequestedCareTeam(message);
        const alreadyQueued =
          chatSession.status === "WAITING" && !chatSession.coachId;
        let aiText = await generateAIResponse(sessionId, message, userId, {
          careTeamQueued: alreadyQueued,
        });
        const { cleanText, shouldEscalate } = stripEscalateMarker(aiText);
        aiText = cleanText;

        if (wantsCareTeam && !shouldEscalate && !alreadyQueued) {
          if (!aiText.toLowerCase().includes("care partner")) {
            aiText =
              "Absolutely — I'll notify a care partner now so they can join this chat. Hang tight.";
          }
        }

        if (alreadyQueued && wantsCareTeam) {
          aiText =
            aiText ||
            "They're already notified — a care partner will join this chat as soon as someone is free. I'm still here in the meantime.";
        }

        const aiMessage = await prisma.chatMessage.create({
          data: {
            sessionId,
            senderId: "AI",
            senderType: "AI",
            message: aiText,
          },
        });

        let systemMessage = null;
        let updatedSession = null;
        if ((shouldEscalate || wantsCareTeam) && !alreadyQueued) {
          const result = await escalateChatToCareTeam(sessionId, {
            notifiedBy: "ai",
          });
          systemMessage = result.systemMessage;
          updatedSession = result.session;
        }

        return NextResponse.json({
          memberMessage,
          aiMessage,
          systemMessage,
          session: updatedSession
            ? {
                id: updatedSession.id,
                status: updatedSession.status,
                isAiHandled: updatedSession.isAiHandled,
                coachId: updatedSession.coachId,
              }
            : undefined,
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
async function generateAIResponse(
  sessionId: string,
  userMessage: string,
  userId: string,
  options?: { careTeamQueued?: boolean }
): Promise<string> {
  try {
    let memberBrief = "";
    try {
      const { buildGeorgeMemberBrief } = await import("@/lib/chat/george-member-brief");
      memberBrief = await buildGeorgeMemberBrief(userId);
    } catch (briefError) {
      console.error("[chat] member brief failed", briefError);
    }

    const careTeamNote = options?.careTeamQueued
      ? `

CARE TEAM STATUS: A care partner has already been notified and will join this chat when free. Keep helping the member yourself. Do NOT use ${ESCALATE_MARKER} again. If they ask about the wait, reassure them you're still here.`
      : "";

    // Get recent messages for context
    const recentMessages = await prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: "desc" },
      take: 14,
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

    const systemPrompt = `You are George, the friendly AI care companion for Sanative Health, an Australian telehealth company. You are the first point of contact in chat — a warm, encouraging mate on the member's health journey — not a clinician and not Dr George Wassif.

IMPORTANT - Keep responses SHORT:
- Maximum 2-3 sentences
- Be direct and helpful
- No repetition or filler words
- One clear point per response

You already have their portal data in MEMBER BRIEF below. Act like you have already checked it.
- Never ask whether they have logged meals, weight, exercise, meds, or side effects if the brief already shows the answer.
- Never ask for program, subscription, start weight, target, or current weight if those appear in the brief.
- Reference concrete facts from the brief when relevant (e.g. today's meals, latest weigh-in, plan tier, days on program).
- If something is missing from the brief, you may ask once — otherwise do not quiz them about data you can see.
- Prefer "I can see you've logged…" / "Your latest weigh-in shows…" over "Have you logged…?"

You help with: weight management, women's health (hormones, menopause, perimenopause, PCOS, fertility), men's health (hair, sexual health, vitality), biomarkers, treatment navigation, and general wellness.

Care team handoff:
- You are the default first contact. Solve simple questions yourself.
- If the member asks for a human/care partner/care team, OR the issue needs account changes, prescriptions, billing disputes, clinical judgement, severe side effects, or anything you cannot safely answer: tell them you are notifying a care partner, then end your reply with the exact token ${ESCALATE_MARKER} on its own (the system strips it and alerts the care team inbox).
- Keep chatting after escalate until a care partner actually joins — you are their companion while they wait.
- Do not invent that a care partner has already joined — only use the escalate token when first notifying them.

Guidelines:
- Speak in first person as George
- Casual, warm tone - like a helpful friend
- Australian English spelling
- For emergencies: call 000
- For medical specifics: suggest speaking with a care partner or your clinician
- Never diagnose, prescribe, change medication dosages, or interpret symptoms as a confirmed condition
- For pregnancy, severe pelvic pain, heavy bleeding, chest pain, fainting, stroke symptoms, or severe allergic reactions: recommend urgent clinical care or 000

${memberBrief || "MEMBER BRIEF: unavailable — ask only what you truly cannot know."}${careTeamNote}`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 180,
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
    return "Ooh, weight management questions — I love these! Our program includes personalised meal plans, regular check-ins, and ongoing clinical support. For the really specific stuff, your care partner is great at reviewing your progress and goals. Also, have a peek at our Learn section — there's heaps of great content there!";
  }

  if (message.includes("hair") || message.includes("finasteride") || message.includes("minoxidil")) {
    return "Ah, the hair journey! Great question. Our doctors create personalised hair loss care plans based on your assessment — specific treatment options are discussed privately in consultation. Patience is key: most people start noticing changes around the 3–6 month mark. For personalised advice, your care partner can walk you through what to expect.";
  }

  if (message.includes("medication") || message.includes("dose") || message.includes("side effect")) {
    return "When it comes to your specific medication, dosage, or any side effects you might be noticing, I've gotta be straight with you — that's really a conversation for your healthcare provider. They know your full history and can give you proper personalised guidance. If you're having any severe side effects though, please don't wait — get medical attention right away!";
  }

  if (message.includes("emergency") || message.includes("urgent") || message.includes("chest pain")) {
    return "Whoa, hold up! If this is a medical emergency, please call 000 right now or get to your nearest emergency department. This chat isn't the place for emergencies — your safety comes first!";
  }

  return "Hey, great to chat with you! I'm George, and I'm here to help with questions about our health programs — weight management, men's health, biomarkers, you name it. For the really personalised medical stuff, your care partner or healthcare provider would be your best bet. So, what would you like to know more about? I'm all ears!";
}
