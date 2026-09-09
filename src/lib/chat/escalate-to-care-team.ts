import { prisma } from "@/lib/prisma";

export const ESCALATE_MARKER = "[ESCALATE_CARE_TEAM]";

type EscalateResult = {
  escalated: boolean;
  alreadyWaiting: boolean;
  session: {
    id: string;
    status: string;
    isAiHandled: boolean;
    coachId: string | null;
    lastMessageAt: Date | null;
  } | null;
  systemMessage: {
    id: string;
    senderId: string;
    senderType: string;
    message: string;
    isRead: boolean;
    createdAt: Date;
  } | null;
};

/**
 * Flip an AI (or idle) chat into the care-team waiting queue used by AdminChatPanel.
 * Unassigned WAITING sessions appear in the existing live-chat inbox.
 */
export async function escalateChatToCareTeam(
  sessionId: string,
  options?: { reason?: string | null; notifiedBy?: "member" | "ai" }
): Promise<EscalateResult> {
  const chatSession = await prisma.chatSession.findUnique({
    where: { id: sessionId },
  });

  if (!chatSession || chatSession.status === "ENDED" || chatSession.status === "ARCHIVED") {
    return { escalated: false, alreadyWaiting: false, session: null, systemMessage: null };
  }

  if (chatSession.status === "WAITING" && !chatSession.coachId) {
    return {
      escalated: false,
      alreadyWaiting: true,
      session: chatSession,
      systemMessage: null,
    };
  }

  if (chatSession.status === "ACTIVE" && chatSession.coachId) {
    return {
      escalated: false,
      alreadyWaiting: false,
      session: chatSession,
      systemMessage: null,
    };
  }

  const reason = options?.reason?.trim();
  const byAi = options?.notifiedBy === "ai";

  const updated = await prisma.chatSession.update({
    where: { id: sessionId },
    data: {
      // Queue for care team, but keep George responding until someone joins.
      status: "WAITING",
      isAiHandled: true,
      coachId: null,
      lastMessageAt: new Date(),
    },
  });

  let message: string;
  if (byAi) {
    message = reason
      ? `George has asked a care partner to join. Reason: ${reason} Meanwhile he will keep chatting with you.`
      : "George has asked a care partner to join this chat. He will keep helping you until they arrive.";
  } else {
    message =
      "A care partner has been notified and will join this chat shortly. George will keep chatting with you until they arrive.";
  }

  const systemMessage = await prisma.chatMessage.create({
    data: {
      sessionId,
      senderId: "SYSTEM",
      senderType: "SYSTEM",
      message,
    },
  });

  return {
    escalated: true,
    alreadyWaiting: false,
    session: updated,
    systemMessage,
  };
}

export function stripEscalateMarker(text: string): {
  cleanText: string;
  shouldEscalate: boolean;
} {
  const shouldEscalate = text.includes(ESCALATE_MARKER);
  const cleanText = text
    .split(ESCALATE_MARKER)
    .join("")
    .replace(new RegExp("\\n{3,}", "g"), "\n\n")
    .trim();
  return { cleanText, shouldEscalate };
}

/**
 * True while George should still answer — including the wait for a care partner.
 * Stops once a care partner has joined (ACTIVE + coachId).
 */
export function shouldGeorgeRespond(session: {
  status: string;
  isAiHandled: boolean;
  coachId?: string | null;
}): boolean {
  if (session.status === "ENDED" || session.status === "ARCHIVED") return false;
  if (session.status === "ACTIVE" && session.coachId) return false;
  if (session.status === "AI_HANDLING") return true;
  if (session.status === "WAITING" && !session.coachId) return true;
  return session.isAiHandled;
}

const CARE_TEAM_REQUEST_PATTERNS: RegExp[] = [
  new RegExp(
    String.raw`\b(talk|speak|chat)\b.{0,24}\b(care\s*(partner|team)|human|person|someone|coach|nurse|real (person|human))\b`,
    "i"
  ),
  new RegExp(
    String.raw`\b(care\s*(partner|team)|human|real person)\b.{0,16}\b(please|now|join|help)\b`,
    "i"
  ),
  new RegExp(String.raw`\b(get|bring|call)\b.{0,16}\b(care\s*(partner|team)|human)\b`, "i"),
  new RegExp(String.raw`\bescalat(e|ion)\b`, "i"),
];

/** Member phrasing that clearly asks for a human care partner. */
export function memberRequestedCareTeam(message: string): boolean {
  return CARE_TEAM_REQUEST_PATTERNS.some((pattern) => pattern.test(message));
}
