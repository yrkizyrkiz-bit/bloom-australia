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
  sanitizeContactMobile,
  sanitizeContactName,
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
  history: { role: "user" | "assistant"; content: string }[],
  options?: { hasMobile?: boolean; requireMobile?: boolean; firstName?: string }
): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return publicGeorgeFallbackReply(message, options);
  }

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 180,
      system: buildPublicGeorgePrompt(options),
      messages: [...history, { role: "user", content: message }],
    });
    const textContent = response.content.find((block) => block.type === "text");
    return textContent?.text?.trim() || publicGeorgeFallbackReply(message, options);
  } catch (error) {
    console.error("[contact-chat] AI reply failed", error);
    return publicGeorgeFallbackReply(message, options);
  }
}

async function notifySupportTeam(
  email: string,
  mobile: string | null,
  message: string,
  reply: string,
  firstName?: string
) {
  const visitorLabel = firstName ? `${firstName} (${email})` : email;
  const transcript = [
    firstName ? `Visitor name: ${firstName}` : null,
    `Visitor email: ${email}`,
    mobile ? `Visitor mobile: ${mobile}` : null,
    "",
    `Visitor: ${message}`,
    `George: ${reply}`,
  ]
    .filter((line): line is string => line !== null)
    .join("\n");

  await sendEmail({
    to: SANATIVE_LEGAL.supportEmail,
    replyTo: email,
    process: "crm",
    subject: `Website chat from ${visitorLabel}`,
    body: `<p>A visitor used George on the website.</p>
${firstName ? `<p><strong>Name:</strong> ${firstName.replace(/</g, "&lt;")}</p>` : ""}
<p><strong>Email:</strong> ${email}</p>
${mobile ? `<p><strong>Mobile:</strong> ${mobile.replace(/</g, "&lt;")}</p>` : ""}
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
    const rawMobile = typeof body.mobile === "string" ? body.mobile.trim() : "";
    const mobile = rawMobile ? sanitizeContactMobile(body.mobile) : null;
    const firstName = sanitizeContactName(body.firstName);
    const message = sanitizeContactMessage(body.message);
    const history = sanitizeContactHistory(body.history);
    const requireMobile = body.requireMobile === true;

    if (!isValidContactEmail(email)) {
      return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 });
    }
    if (rawMobile && !mobile) {
      return NextResponse.json(
        { error: "Please enter a valid Australian mobile so a care partner can call or text you back." },
        { status: 400 }
      );
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

    const reply = await generatePublicReply(message, history, {
      hasMobile: Boolean(mobile),
      requireMobile,
      firstName,
    });
    const firstVisitorMessage = history.every((turn) => turn.role !== "user");
    if (firstVisitorMessage || visitorAskedForHuman(message)) {
      await notifySupportTeam(email, mobile, message, reply, firstName);
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
