import { sendEmail } from "@/lib/email";
import { LIVER_BIOMARKER_INSIGHTS_PRODUCT_SLUG } from "@/lib/membership/checkout-product-select";

export const LIVER_BIOMARKER_INSIGHTS_WELCOME_SUBJECT =
  "Welcome to Sanative";

const WELCOME_STEPS = [
  {
    title: "Meet your doctor",
    body: "Your Sanative doctor will review your health and arrange a pathology request if clinically appropriate.",
  },
  {
    title: "Get your blood tests",
    body: "Visit a convenient pathology collection centre near you.",
  },
  {
    title: "Discover your health insights",
    body: "Explore your biomarker results in the Sanative app, including your liver health insights and FIB-4 score, where available.",
  },
  {
    title: "Understand your results",
    body: "Have a follow-up consultation with your doctor to discuss your findings and develop a personalised goal plan.",
  },
] as const;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Only the $79 liver product — never $365 membership or other funnels. */
export function isLiverBiomarkerInsightsWelcomePurchase(
  purchaseType?: string | null
): boolean {
  return purchaseType === LIVER_BIOMARKER_INSIGHTS_PRODUCT_SLUG;
}

export function renderLiverBiomarkerInsightsWelcomeEmail(params: {
  firstName: string;
  magicLink: string;
  needsPassword: boolean;
}): { subject: string; html: string; text: string } {
  const firstName = params.firstName?.trim() ?? "";
  const greeting = firstName ? `Hi ${firstName},` : "Hi,";
  const safeGreeting = firstName ? `Hi ${escapeHtml(firstName)},` : "Hi,";
  const cta = params.needsPassword
    ? "Set your password & open your portal"
    : "Open your portal";
  const safeMagicLink = escapeHtml(params.magicLink);
  const stepsHtml = WELCOME_STEPS.map(
    (step) =>
      `<li><strong>${escapeHtml(step.title)}</strong> – ${escapeHtml(step.body)}</li>`
  ).join("");
  const stepsText = WELCOME_STEPS.map(
    (step, index) => `${index + 1}. ${step.title} – ${step.body}`
  ).join("\n");

  const html = `
  <div style="font-family: -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; color: #2c3628;">
    <p>${safeGreeting}</p>
    <h1 style="font-size: 22px; margin: 0 0 16px;">Welcome to Sanative! 💚</h1>
    <p>We're so happy to have you with us! You've taken an important step towards better understanding your health, and we're here to support you every step of the way.</p>
    <p>Your Sanative membership is now active. Simply use the secure link below to access your personal health portal.</p>
    <p style="margin: 28px 0;">
      <a href="${safeMagicLink}" style="background: #34412f; color: #ffffff; text-decoration: none; padding: 13px 26px; border-radius: 999px; font-weight: 600; display: inline-block;">${escapeHtml(cta)}</a>
    </p>
    <p style="font-size: 13px; color: #5c7a52;">This secure link signs you in automatically${params.needsPassword ? " and lets you choose a password" : ""}. If the button doesn't work, copy this URL into your browser:<br/>${safeMagicLink}</p>
    <p><strong>What happens next?</strong></p>
    <ol style="padding-left: 20px; line-height: 1.7;">
      ${stepsHtml}
    </ol>
    <p><em>We're with you all the way.</em></p>
    <p>Your health is personal, and your care should be too. We're excited to help you understand your numbers, make informed decisions and take charge of your wellbeing.</p>
    <p>Welcome aboard!</p>
    <p>Warm regards,<br/>The Sanative Health Team</p>
    <p style="font-size: 13px; color: #5c7a52; font-style: italic; margin-top: 24px;">
      Preventative medicine. Precise care.<br/>
      Longevity built for Australians.
    </p>
    <p style="font-size: 12px; color: #9aa79a; margin-top: 8px;">
      <a href="https://www.sanative.com.au" style="color: #5c7a52;">www.sanative.com.au</a>
    </p>
  </div>`;

  const text = [
    greeting,
    "",
    "Welcome to Sanative!",
    "",
    "We're so happy to have you with us! You've taken an important step towards better understanding your health, and we're here to support you every step of the way.",
    "",
    "Your Sanative membership is now active. Simply use the secure link below to access your personal health portal.",
    "",
    `${cta}: ${params.magicLink}`,
    "",
    "What happens next?",
    stepsText,
    "",
    "We're with you all the way.",
    "Your health is personal, and your care should be too. We're excited to help you understand your numbers, make informed decisions and take charge of your wellbeing.",
    "",
    "Welcome aboard!",
    "",
    "Warm regards,",
    "The Sanative Health Team",
    "Preventative medicine. Precise care.",
    "Longevity built for Australians.",
    "www.sanative.com.au",
  ].join("\n");

  return { subject: LIVER_BIOMARKER_INSIGHTS_WELCOME_SUBJECT, html, text };
}

/** Send the $79 liver welcome to the visitor. Not a Gmail draft. */
export async function sendLiverBiomarkerInsightsWelcomeEmail(params: {
  to: string;
  firstName: string;
  magicLink: string;
  needsPassword: boolean;
}) {
  const rendered = renderLiverBiomarkerInsightsWelcomeEmail(params);
  return sendEmail({
    process: "membership",
    to: params.to,
    subject: rendered.subject,
    body: rendered.html,
    text: rendered.text,
  });
}
