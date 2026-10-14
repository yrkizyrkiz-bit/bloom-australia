import { SANATIVE_PRICING_BRIEF } from "@/lib/membership/membership-benefits";

export type ContactChatTurn = {
  role: "user" | "assistant";
  content: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_MESSAGE_LENGTH = 2000;
const MAX_HISTORY = 20;

export function isValidContactEmail(email: string): boolean {
  return EMAIL_PATTERN.test(email.trim().toLowerCase());
}

export function sanitizeContactMessage(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const message = value.replace(/\s+/g, " ").trim();
  if (!message || message.length > MAX_MESSAGE_LENGTH) return null;
  return message;
}

export function sanitizeContactHistory(raw: unknown): ContactChatTurn[] {
  if (!Array.isArray(raw)) return [];
  const turns: ContactChatTurn[] = [];
  for (const item of raw.slice(-MAX_HISTORY)) {
    if (!item || typeof item !== "object") continue;
    const role = (item as { role?: unknown }).role;
    const content = sanitizeContactMessage((item as { content?: unknown }).content);
    if ((role === "user" || role === "assistant") && content) {
      turns.push({ role, content });
    }
  }
  return turns;
}

export function visitorAskedForHuman(message: string): boolean {
  return /\b(human|person|someone|care (team|partner)|real doctor|speak to|talk to|call me)\b/i.test(
    message
  );
}

export function buildPublicGeorgePrompt(): string {
  return `You are George, the friendly AI care companion for Sanative, an Australian doctor-led clinic. You are chatting with a website visitor who is not signed in. You are not a clinician and not Dr Wayne Haywood.

Keep replies SHORT: 2–4 sentences, Australian English, warm and direct. Do not use markdown or links.
When they ask about price, membership, $365, $120, $360, or weight loss cost, answer the two-fee structure yourself. Do not bounce them to the team for this.

${SANATIVE_PRICING_BRIEF}

You can also explain:
- How to join, log in, or leave a question for the team
- That care options are discussed privately if clinically appropriate
- Programs in general terms: weight management, hair health, menopause, men's health, organ care, biomarker insights

You cannot:
- Diagnose, prescribe, interpret personal symptoms as a condition, or promise health outcomes
- Give emergency advice beyond telling them to call 000
- Invent wait times, Medicare rebates, or that Sanative performs pathology itself

If they need a person for something other than published pricing, say the team will follow up at the email they provided.
If they already have a membership, point them to log in at /login for portal support.
For privacy questions, they can email info@sanative.com.au with the subject "Privacy request".`;
}

export function publicGeorgeFallbackReply(message: string): string {
  const text = message.toLowerCase();
  if (visitorAskedForHuman(text)) {
    return "I have passed this to the Sanative team with your email. Someone will follow up from there. For anything urgent or an emergency, call 000.";
  }
  if (text.includes("hair")) {
    return "Hair Health starts with Sanative membership at $365 a year, which includes your health check and the first 30 days of Hair Health. After that, Hair Health Care is $90 every three months if you continue. Medicines, pharmacy and pathology fees are not included.";
  }
  if (text.includes("menopause") || text.includes("women")) {
    return "Women's Health starts with Sanative membership at $365 a year, which includes your health check and the first 30 days of Women's Health. After that, ongoing care is $240 every three months if you continue. Medicines, pharmacy and pathology fees are not included.";
  }
  if (text.includes("erectile") || text.includes("men's") || text.includes("mens")) {
    return "Men's Health starts with Sanative membership at $365 a year, which includes your health check and the first 30 days of Men's Health. After that, ongoing care is $240 every three months if you continue. Medicines, pharmacy and pathology fees are not included.";
  }
  if (text.includes("organ") || text.includes("liver") || text.includes("heart") || text.includes("kidney")) {
    return "Organ Care is included with Sanative membership — heart, liver and kidney insights sit in the app after your biomarker results. It is not a separate paid program.";
  }
  if (
    text.includes("price") ||
    text.includes("cost") ||
    text.includes("365") ||
    text.includes("120") ||
    text.includes("360") ||
    text.includes("weight") ||
    text.includes("membership") ||
    text.includes("included") ||
    text.includes("pathology")
  ) {
    return "Sanative membership is $365 a year and includes your health check plus the first 30 days of one eligible program, such as weight management. After that first month, Weight Management Care is a separate $360 every three months — $120 a month, billed quarterly — and only if you choose to continue. Medicines, pharmacy and pathology fees are not included.";
  }
  if (text.includes("login") || text.includes("portal") || text.includes("already a member")) {
    return "If you already have a Sanative membership, log in at /login and chat from your portal — that is the most secure way to reach your care team. I can still take a note here if you prefer.";
  }
  return "Thanks for writing in. I can help with how Sanative works, membership, or how to get started. Leave your email so the team can follow up if you need a person.";
}
