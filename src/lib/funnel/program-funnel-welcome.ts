import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { signMagicLoginToken } from "@/lib/magic-link";
import { normalizeProgramKey } from "@/lib/membership/keys";
import {
  getClinicalProgramFunnelConfig,
  type ClinicalFunnelProgramId,
} from "@/lib/funnel/clinical-program-funnel";

const PUBLIC_PROGRAM_FUNNEL_SOURCES = [
  "weight_management_assessment",
  "hair_assessment",
  "mens_health_assessment",
  "womens_health_assessment",
] as const;

const INCLUDED_LINE: Record<ClinicalFunnelProgramId, string> = {
  weight_management:
    "Your first 30 days of doctor-led medical weight loss care are included.",
  hair_loss: "Your first 30 days of doctor-led hair loss care are included.",
  mens_health: "Your first 30 days of doctor-led men's health care are included.",
  womens_health: "Your first 30 days of doctor-led women's wellness care are included.",
};

export type ProgramFunnelWelcomeCopy = {
  programId: ClinicalFunnelProgramId;
  programLabel: string;
  includedLine: string;
  subject: string;
  postCheckoutPath: string;
};

/** True for a payment started from a public program assessment, not membership checkout. */
export function isPublicProgramFunnelPayment(
  metadata?: { source?: string | null } | null
): boolean {
  const source = (metadata?.source || "").toLowerCase();
  return PUBLIC_PROGRAM_FUNNEL_SOURCES.some((item) => source.includes(item));
}

export function programFunnelWelcomeCopy(
  intentProgram?: string | null
): ProgramFunnelWelcomeCopy | null {
  const key = normalizeProgramKey(intentProgram);
  const programId: ClinicalFunnelProgramId | null =
    key === "HAIR_LOSS"
      ? "hair_loss"
      : key === "MENS_HEALTH_SEXUAL" || key === "MENS_HEALTH_VITALITY"
        ? "mens_health"
        : key === "WOMENS_HEALTH_SEXUAL" || key === "WOMENS_HEALTH_VITALITY"
          ? "womens_health"
          : key === "WEIGHT_MANAGEMENT"
            ? "weight_management"
            : null;
  if (!programId) return null;

  const config = getClinicalProgramFunnelConfig(programId, intentProgram);
  return {
    programId,
    programLabel: config.label,
    includedLine: INCLUDED_LINE[programId],
    subject: `Welcome to Sanative: your ${config.label} program is active`,
    postCheckoutPath: config.postCheckoutPath,
  };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function renderProgramFunnelWelcomeEmail(params: {
  firstName: string;
  copy: ProgramFunnelWelcomeCopy;
  magicLink: string;
  needsPassword: boolean;
}): { subject: string; html: string; text: string } {
  const greeting = params.firstName ? `Hi ${params.firstName},` : "Hi,";
  const safeGreeting = params.firstName
    ? `Hi ${escapeHtml(params.firstName)},`
    : "Hi,";
  const cta = params.needsPassword
    ? "Set your password & open your portal"
    : "Open your portal";
  const program = escapeHtml(params.copy.programLabel);
  const included = escapeHtml(params.copy.includedLine);

  const html = `
  <div style="font-family: -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; color: #2c3628;">
    <h1 style="font-size: 22px; margin: 0 0 16px;">Welcome to Sanative</h1>
    <p>${safeGreeting}</p>
    <p>Your Sanative Membership is active, and your ${program} program is ready. ${included} Your membership also includes Essential biomarker insights plus your Biological Clock and Organ Care dashboards.</p>
    <p>Your membership <strong>auto-renews annually</strong> using the card on file. You can update your payment method or cancel anytime from your portal.</p>
    <p><strong>What happens next</strong></p>
    <ol style="padding-left: 20px; line-height: 1.7;">
      <li>Book your doctor consultation to discuss your ${program} care.</li>
      <li>Your doctor issues your pathology request for the Essential panel.</li>
      <li>Results and personalised insights appear in your portal.</li>
    </ol>
    <p style="margin: 28px 0;">
      <a href="${escapeHtml(params.magicLink)}" style="background: #34412f; color: #ffffff; text-decoration: none; padding: 13px 26px; border-radius: 999px; font-weight: 600; display: inline-block;">${cta}</a>
    </p>
    <p style="font-size: 13px; color: #5c7a52;">This secure link signs you in automatically${params.needsPassword ? " and lets you choose a password" : ""}. If the button doesn't work, copy this URL into your browser:<br/>${escapeHtml(params.magicLink)}</p>
    <p style="font-size: 12px; color: #9aa79a; margin-top: 32px;">Sanative · doctor-led preventative care</p>
  </div>`;

  const text = [
    greeting,
    "",
    `Your Sanative Membership is active, and your ${params.copy.programLabel} program is ready. ${params.copy.includedLine} Your membership also includes Essential biomarker insights plus your Biological Clock and Organ Care dashboards.`,
    "Your membership auto-renews annually using the card on file. You can update your payment method or cancel anytime from your portal.",
    "",
    "What happens next:",
    `1. Book your doctor consultation to discuss your ${params.copy.programLabel} care.`,
    "2. Your doctor issues your pathology request for the Essential panel.",
    "3. Results and personalised insights appear in your portal.",
    "",
    `${cta}: ${params.magicLink}`,
  ].join("\n");

  return { subject: params.copy.subject, html, text };
}

/**
 * One welcome after a public program-funnel payment. Safe to call from both
 * the checkout finish request and the Stripe webhook.
 */
export async function sendProgramFunnelWelcomeOnce(params: {
  userId: string;
  intentProgram?: string | null;
  paymentIntentId: string;
  baseUrl: string;
}): Promise<void> {
  const copy = programFunnelWelcomeCopy(params.intentProgram);
  if (!copy || !params.paymentIntentId) return;

  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    select: { id: true, email: true, firstName: true, passwordHash: true },
  });
  if (!user?.email) return;

  const existing = await prisma.automationLog.findFirst({
    where: {
      userId: user.id,
      automationType: "program_funnel_welcome",
      triggerEvent: params.paymentIntentId,
    },
    orderBy: { createdAt: "desc" },
  });
  if (existing && existing.status !== "failed") return;

  const claim = existing
    ? await prisma.automationLog.update({
        where: { id: existing.id },
        data: { status: "pending" },
      })
    : await prisma.automationLog.create({
        data: {
          userId: user.id,
          automationType: "program_funnel_welcome",
          triggerEvent: params.paymentIntentId,
          channel: "email",
          status: "pending",
          metadata: {
            intentProgram: params.intentProgram || copy.programId,
            programLabel: copy.programLabel,
          },
        },
      });

  const baseUrl = params.baseUrl.replace(/\/$/, "");
  const magicLink = `${baseUrl}/auth/magic?token=${encodeURIComponent(
    signMagicLoginToken(user.id, user.email)
  )}&redirect=${encodeURIComponent(copy.postCheckoutPath)}`;

  const rendered = renderProgramFunnelWelcomeEmail({
    firstName: user.firstName || "",
    copy,
    magicLink,
    needsPassword: !user.passwordHash,
  });

  const result = await sendEmail({
    process: "membership",
    to: user.email,
    subject: rendered.subject,
    body: rendered.html,
    text: rendered.text,
  });

  await prisma.automationLog
    .update({
      where: { id: claim.id },
      data: {
        status: result.success ? "completed" : "failed",
        metadata: {
          intentProgram: params.intentProgram || copy.programId,
          programLabel: copy.programLabel,
          subject: rendered.subject,
          ...(result.success ? {} : { error: result.error || "send failed" }),
        },
      },
    })
    .catch((err) =>
      console.error("[program-funnel-welcome] could not record send:", err)
    );

  if (!result.success) {
    console.error("[program-funnel-welcome] send failed:", result.error);
  }
}
