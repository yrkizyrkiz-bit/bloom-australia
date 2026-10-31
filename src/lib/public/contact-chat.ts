import { SANATIVE_PRICING_BRIEF } from "@/lib/membership/membership-benefits";

export type ContactChatTurn = {
  role: "user" | "assistant";
  content: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** AU mobile: 04xxxxxxxx, +614xxxxxxxx, 614xxxxxxxx, or 4xxxxxxxx. Allows spaces/dashes. */
const AU_MOBILE_PATTERN = /^(\+?61|0)?4\d{8}$/;
const MAX_MESSAGE_LENGTH = 2000;
const MAX_HISTORY = 20;
const MAX_NAME_LENGTH = 80;

export function isValidContactEmail(email: string): boolean {
  return EMAIL_PATTERN.test(email.trim().toLowerCase());
}

export function isValidContactMobile(mobile: string): boolean {
  const cleaned = mobile.replace(/[\s\-().]/g, "");
  return AU_MOBILE_PATTERN.test(cleaned);
}

export function sanitizeContactMobile(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const mobile = value.replace(/\s+/g, " ").trim();
  if (!mobile || !isValidContactMobile(mobile)) return null;
  return mobile;
}

export function sanitizeContactName(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const name = value.replace(/\s+/g, " ").trim();
  if (!name || name.length > MAX_NAME_LENGTH) return undefined;
  return name;
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

export function buildPublicGeorgePrompt(options?: {
  hasMobile?: boolean;
  requireMobile?: boolean;
  firstName?: string;
}): string {
  const nameNote = options?.firstName
    ? `The visitor's first name is ${options.firstName}. Use it sparingly and naturally.`
    : "";
  const mobileNote = options?.requireMobile
    ? options?.hasMobile
      ? "They have already given a mobile number. Do not ask for it again."
      : "They have not given a mobile yet. Ask once, early, for an Australian mobile so a care partner can call or text if you cannot answer."
    : "They opened chat from the contact page. Do not ask for a mobile number.";
  const followUpNote = options?.requireMobile
    ? "If they need a person for something other than published pricing, say the team will follow up using the email and mobile they provided."
    : "If they need a person for something other than published pricing, say the team will follow up using the email they provided.";

  return `You are George, the friendly AI care companion for Sanative, an Australian doctor-led clinic. You are chatting with a website visitor who is not signed in — including people who opened chat from a liver assessment or other public page. You are not a clinician and not Dr Wayne Haywood.

Keep replies SHORT: 2–4 sentences, Australian English, warm and direct. Do not use markdown or links.
When they ask about price, membership, $365, $120, $360, or weight loss cost, answer the two-fee structure yourself. Do not bounce them to the team for this.
Never say medicines or pathology fees are extra only after the 30 days. Those are always separate. The 30 days is only included care-program time; ongoing program care after that is also separate.

${SANATIVE_PRICING_BRIEF}

You can also explain:
- How to join, log in, or leave a question for the team
- That a care partner can pick up questions you cannot answer, and may call or text them
- That care options are discussed privately if clinically appropriate
- Programs in general terms: weight management, hair health, menopause, men's health, organ care, biomarker insights

You cannot:
- Diagnose, prescribe, interpret personal symptoms or quiz results as a condition, or promise health outcomes
- Give medical advice or a diagnosis
- Give emergency advice beyond telling them to call 000
- Invent wait times, Medicare rebates, or that Sanative performs pathology itself

${mobileNote}
${nameNote}
${followUpNote}
If they already have a membership, point them to log in at /login for portal support.
For privacy questions, they can email info@sanative.com.au with the subject "Privacy request".
For anything urgent or an emergency, tell them to call 000.`;
}

export function publicGeorgeFallbackReply(
  message: string,
  options?: { requireMobile?: boolean }
): string {
  const text = message.toLowerCase();
  if (visitorAskedForHuman(text)) {
    return options?.requireMobile
      ? "I have passed this to the Sanative team with your email and mobile. A care partner can follow up from there. For anything urgent or an emergency, call 000."
      : "I have passed this to the Sanative team with your email. A care partner can follow up from there. For anything urgent or an emergency, call 000.";
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
  if (text.includes("120") || text.includes("360") || text.includes("weight")) {
    return "Sanative membership is $365 a year and includes your health check plus the first 30 days of one eligible program, such as weight management. After that first month, Weight Management Care is a separate $360 every three months — $120 a month, billed quarterly — and only if you choose to continue. Medicines, pharmacy and pathology fees are always separate, not only after those 30 days.";
  }
  if (
    text.includes("price") ||
    text.includes("cost") ||
    text.includes("365") ||
    text.includes("membership") ||
    text.includes("included") ||
    text.includes("pathology")
  ) {
    return "The Sanative membership is $365 a year — about $1 a day, billed annually. It includes your health check with 85+ biomarker insights, a doctor consult, personalised dashboards in the app, and the first 30 days of one eligible care program. Medicines and pathology/lab fees are always separate. After those 30 days, continuing a care program is also billed separately.";
  }
  if (text.includes("login") || text.includes("portal") || text.includes("already a member")) {
    return "If you already have a Sanative membership, log in at /login and chat from your portal — that is the most secure way to reach your care team. I can still take a note here if you prefer.";
  }
  return options?.requireMobile
    ? "Thanks for writing in. I can help with how Sanative works, membership, or how to get started. Leave your email and mobile so a care partner can follow up if you need a person. For anything urgent or an emergency, call 000."
    : "Thanks for writing in. I can help with how Sanative works, membership, or how to get started. Leave your email so a care partner can follow up if you need a person. For anything urgent or an emergency, call 000.";
}
