import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { sendEmail } from "@/lib/email";
import { SANATIVE_LEGAL } from "@/lib/legal/constants";
import {
  buildPublicGeorgePrompt,
  isValidContactEmail,
  publicGeorgeFallbackReply,
  sanitizeContactHistory,
  sanitizeContactMessage,
  visitorAskedForHuman,
} from "@/lib/public/contact-chat";
import { RATE_LIMITS, rateLimitBucketKey } from "@/lib/security/rate-limit-config";
import {
  enforceDbRateLimits,
  getClientIp,
  rateLimitExceededResponse,
} from "@/lib/security/rate-limit-http";

const anthropic = new Anthropic();

async function generatePublicReply(
  message: string,
  history: { role: "user" | "assistant"; content: string }[]
): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return publicGeorgeFallbackReply(message);
  }

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 180,
      system: buildPublicGeorgePrompt(),
      messages: [...history, { role: "user", content: message }],
    });
    const textContent = response.content.find((block) => block.type === "text");
    return textContent?.text?.trim() || publicGeorgeFallbackReply(message);
  } catch (error) {
    console.error("[contact-chat] AI reply failed", error);
    return publicGeorgeFallbackReply(message);
  }
}

async function notifySupportTeam(email: string, message: string, reply: string) {
  const transcript = [
    `Visitor email: ${email}`,
    "",
    `Visitor: ${message}`,
    `George: ${reply}`,
  ].join("\n");

  await sendEmail({
    to: SANATIVE_LEGAL.supportEmail,
    replyTo: email,
    process: "crm",
    subject: `Website chat from ${email}`,
    body: `<p>A visitor used George on the contact page.</p>
<p><strong>Email:</strong> ${email}</p>
<p><strong>Message:</strong></p>
<p>${message.replace(/</g, "&lt;")}</p>
<p><strong>George replied:</strong></p>
<p>${reply.replace(/</g, "&lt;")}</p>
<pre style="white-space:pre-wrap;font-family:inherit">${transcript.replace(/</g, "&lt;")}</pre>`,
  }).catch((error) => {
    console.error("[contact-chat] support email failed", error);
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const message = sanitizeContactMessage(body.message);
    const history = sanitizeContactHistory(body.history);

    if (!isValidContactEmail(email)) {
      return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 });
    }
    if (!message) {
      return NextResponse.json({ error: "Please enter a short message." }, { status: 400 });
    }

    const limited = await enforceDbRateLimits([
      {
        bucketKey: rateLimitBucketKey("contact-chat:ip", getClientIp(request)),
        config: RATE_LIMITS.contactChatIp,
      },
      {
        bucketKey: rateLimitBucketKey("contact-chat:email", email),
        config: RATE_LIMITS.contactChatEmail,
      },
    ]);
    if (!limited.allowed) {
      return rateLimitExceededResponse(limited.retryAfterSec);
    }

    const reply = await generatePublicReply(message, history);
    const firstVisitorMessage = history.every((turn) => turn.role !== "user");
    if (firstVisitorMessage || visitorAskedForHuman(message)) {
      await notifySupportTeam(email, message, reply);
    }

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("[contact-chat] request failed", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again or email info@sanative.com.au." },
      { status: 500 }
    );
  }
}
