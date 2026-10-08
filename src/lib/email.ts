import { Resend } from "resend";
import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { isProductionRuntime } from "@/lib/security/jwt-secret";
import type { EmailProcessKey } from "@/lib/email-process";
import { formatFromHeader, resolveEmailIdentity } from "@/lib/email-identity";
import {
  clinicWelcomeEmail,
  patientWelcomeEmail,
  resultsReadyEmail,
  checkInReminderEmail,
  gpVisitReminderEmail,
  gpEnrolmentNotificationEmail,
  gpBiomarkerAlertEmail,
  orderConfirmationEmail,
  weightManagementOrderConfirmationEmail,
  pathologyReferralEmail,
} from "./email-templates";

export type EmailTransport = "google_workspace" | "resend" | "mock";

function googleSmtpConfigured(): boolean {
  return Boolean(process.env.GOOGLE_SMTP_USER && process.env.GOOGLE_SMTP_PASS);
}

function resendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

/** Resolve send engine. Gmail when configured; otherwise Resend until it is removed. */
export function resolveEmailTransport(): EmailTransport {
  const preferred = (process.env.EMAIL_PROVIDER || "resend").toLowerCase();
  if (preferred === "google_workspace" || preferred === "gmail") {
    if (googleSmtpConfigured()) return "google_workspace";
    if (resendConfigured()) {
      console.warn(
        "[Email] EMAIL_PROVIDER=google_workspace but SMTP is not set; falling back to Resend"
      );
      return "resend";
    }
    return "mock";
  }
  if (resendConfigured()) return "resend";
  if (googleSmtpConfigured()) return "google_workspace";
  return "mock";
}

export function getEmailTransportInfo() {
  const transport = resolveEmailTransport();
  return {
    transport,
    preferred: process.env.EMAIL_PROVIDER || "resend",
    googleConfigured: googleSmtpConfigured(),
    resendConfigured: resendConfigured(),
    smtpHost: process.env.GOOGLE_SMTP_HOST || "smtp-relay.gmail.com",
    smtpPort: Number(process.env.GOOGLE_SMTP_PORT || 587),
    smtpUser: process.env.GOOGLE_SMTP_USER || "",
  };
}

let resendClient: Resend | null = null;

function getResendClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) {
    return null;
  }
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

let googleTransporter: Transporter | null = null;

function getGoogleTransporter(): Transporter | null {
  if (!googleSmtpConfigured()) return null;
  if (!googleTransporter) {
    googleTransporter = nodemailer.createTransport({
      host: process.env.GOOGLE_SMTP_HOST || "smtp-relay.gmail.com",
      port: Number(process.env.GOOGLE_SMTP_PORT || 587),
      secure: Number(process.env.GOOGLE_SMTP_PORT || 587) === 465,
      auth: {
        user: process.env.GOOGLE_SMTP_USER,
        pass: process.env.GOOGLE_SMTP_PASS,
      },
    });
  }
  return googleTransporter;
}

interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// ============================================
// EMAIL SENDING FUNCTIONS
// ============================================

export async function sendClinicWelcomeEmail(
  to: string,
  data: {
    clinicName: string;
    gpName: string;
    qrToken: string;
  }
): Promise<SendEmailResult> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://sanative.com.au";
  const template = clinicWelcomeEmail({
    clinicName: data.clinicName,
    gpName: data.gpName,
    qrToken: data.qrToken,
    qrUrl: `${baseUrl}/join?clinic=${data.qrToken}`,
    loginUrl: `${baseUrl}/gp/login`,
  });

  return sendEmailInternal(to, template.subject, template.html, template.text, {
    process: "crm",
  });
}

export async function sendPatientWelcomeEmail(
  to: string,
  data: {
    firstName: string;
    lastName: string;
    program: string;
    carePartnerName: string;
  }
): Promise<SendEmailResult> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://sanative.com.au";
  const template = patientWelcomeEmail({
    firstName: data.firstName,
    lastName: data.lastName,
    program: data.program,
    carePartnerName: data.carePartnerName,
    loginUrl: `${baseUrl}/dashboard`,
  });

  return sendEmailInternal(to, template.subject, template.html, template.text, {
    process: "membership",
  });
}

/** Welcome email for the consolidated Sanative Membership funnel. */
export async function sendMembershipWelcomeEmail(params: {
  to: string;
  firstName: string;
  magicLink: string;
  needsPassword: boolean;
}): Promise<SendEmailResult> {
  const greeting = params.firstName ? `Hi ${params.firstName},` : "Hi,";
  const cta = params.needsPassword
    ? "Set your password & open your portal"
    : "Open your portal";
  const subject = "Welcome to Sanative: your membership is active";

  const html = `
  <div style="font-family: -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; color: #2c3628;">
    <h1 style="font-size: 22px; margin: 0 0 16px;">Welcome to Sanative</h1>
    <p>${greeting}</p>
    <p>Your Sanative Membership is active. It includes your comprehensive Essential biomarker panel plus your Biological Clock and Organ Care dashboards.</p>
    <p>Your membership <strong>auto-renews annually</strong> using the card on file. You can update your payment method or cancel anytime from your portal.</p>
    <p><strong>What happens next</strong></p>
    <ol style="padding-left: 20px; line-height: 1.7;">
      <li>Your doctor consultation: we'll confirm your booking by email.</li>
      <li>Your doctor issues your pathology request for the Essential panel.</li>
      <li>Results and personalised insights appear in your portal.</li>
    </ol>
    <p style="margin: 28px 0;">
      <a href="${params.magicLink}" style="background: #34412f; color: #ffffff; text-decoration: none; padding: 13px 26px; border-radius: 999px; font-weight: 600; display: inline-block;">${cta}</a>
    </p>
    <p style="font-size: 13px; color: #5c7a52;">This secure link signs you in automatically${params.needsPassword ? " and lets you choose a password" : ""}. If the button doesn't work, copy this URL into your browser:<br/>${params.magicLink}</p>
    <p style="font-size: 12px; color: #9aa79a; margin-top: 32px;">Sanative · doctor-led preventative care</p>
  </div>`;

  const text = [
    greeting,
    "",
    "Your Sanative Membership is active. It includes your comprehensive Essential biomarker panel plus your Biological Clock and Organ Care dashboards.",
    "Your membership auto-renews annually using the card on file. You can update your payment method or cancel anytime from your portal.",
    "",
    "What happens next:",
    "1. Your doctor consultation: we'll confirm your booking by email.",
    "2. Your doctor issues your pathology request for the Essential panel.",
    "3. Results and personalised insights appear in your portal.",
    "",
    `${cta}: ${params.magicLink}`,
  ].join("\n");

  return sendEmailInternal(params.to, subject, html, text, { process: "membership" });
}

/** Self-service password reset link. The link is the only place the token appears. */
export async function sendPasswordResetEmail(params: {
  to: string;
  firstName: string | null;
  resetLink: string;
  expiresInMinutes: number;
}): Promise<SendEmailResult> {
  const greeting = params.firstName ? `Hi ${params.firstName},` : "Hi,";
  const subject = "Reset your Sanative password";

  const html = `
  <div style="font-family: -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; color: #2c3628;">
    <h1 style="font-size: 22px; margin: 0 0 16px;">Reset your password</h1>
    <p>${greeting}</p>
    <p>We received a request to reset the password for your Sanative account. Choose a new password using the button below.</p>
    <p style="margin: 28px 0;">
      <a href="${params.resetLink}" style="background: #34412f; color: #ffffff; text-decoration: none; padding: 13px 26px; border-radius: 999px; font-weight: 600; display: inline-block;">Choose a new password</a>
    </p>
    <p style="font-size: 13px; color: #5c7a52;">This link expires in ${params.expiresInMinutes} minutes and can only be used once. If the button doesn't work, copy this URL into your browser:<br/>${params.resetLink}</p>
    <p style="font-size: 13px; color: #5c7a52;">If you didn't ask to reset your password, you can ignore this email. Your password won't change.</p>
    <p style="font-size: 12px; color: #9aa79a; margin-top: 32px;">Sanative · doctor-led preventative care</p>
  </div>`;

  const text = [
    greeting,
    "",
    "We received a request to reset the password for your Sanative account.",
    `Choose a new password here (expires in ${params.expiresInMinutes} minutes, single use):`,
    params.resetLink,
    "",
    "If you didn't ask to reset your password, you can ignore this email. Your password won't change.",
  ].join("\n");

  return sendEmailInternal(params.to, subject, html, text, { process: "auth" });
}

/** Renewal reminder for annual Sanative Membership (one-off billing model). */
export async function sendMembershipRenewalReminderEmail(params: {
  to: string;
  firstName: string;
  renewalDate: Date;
  priceLabel: string;
}): Promise<SendEmailResult> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://sanative.com.au";
  const renewUrl = `${baseUrl}/membership/checkout`;
  const greeting = params.firstName ? `Hi ${params.firstName},` : "Hi,";
  const dateLabel = params.renewalDate.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const subject = `Your Sanative Membership renews on ${dateLabel}`;

  const html = `
  <div style="font-family: -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; color: #2c3628;">
    <h1 style="font-size: 22px; margin: 0 0 16px;">Your membership renewal</h1>
    <p>${greeting}</p>
    <p>Your Sanative Membership is due for renewal on <strong>${dateLabel}</strong> (${params.priceLabel}). Renewing keeps your biomarker testing, Biological Clock and Organ Care dashboards, and doctor-led care active for another year.</p>
    <p style="margin: 28px 0;">
      <a href="${renewUrl}" style="background: #34412f; color: #ffffff; text-decoration: none; padding: 13px 26px; border-radius: 999px; font-weight: 600; display: inline-block;">Renew my membership</a>
    </p>
    <p style="font-size: 13px; color: #5c7a52;">Questions about your membership? Just reply to this email.</p>
    <p style="font-size: 12px; color: #9aa79a; margin-top: 32px;">Sanative · doctor-led preventative care</p>
  </div>`;

  const text = [
    greeting,
    "",
    `Your Sanative Membership is due for renewal on ${dateLabel} (${params.priceLabel}).`,
    "Renewing keeps your biomarker testing, dashboards and doctor-led care active for another year.",
    "",
    `Renew: ${renewUrl}`,
  ].join("\n");

  return sendEmailInternal(params.to, subject, html, text, { process: "membership" });
}

/** Sent when an unrenewed membership lapses and portal access is paused. */
export async function sendMembershipExpiredEmail(params: {
  to: string;
  firstName: string;
}): Promise<SendEmailResult> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://sanative.com.au";
  const renewUrl = `${baseUrl}/membership/checkout`;
  const greeting = params.firstName ? `Hi ${params.firstName},` : "Hi,";
  const subject = "Your Sanative Membership has expired";

  const html = `
  <div style="font-family: -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; color: #2c3628;">
    <h1 style="font-size: 22px; margin: 0 0 16px;">Your membership has expired</h1>
    <p>${greeting}</p>
    <p>Your Sanative Membership has lapsed, so access to your dashboards and included services is paused. Your health data is safe and will be right where you left it.</p>
    <p style="margin: 28px 0;">
      <a href="${renewUrl}" style="background: #34412f; color: #ffffff; text-decoration: none; padding: 13px 26px; border-radius: 999px; font-weight: 600; display: inline-block;">Reactivate my membership</a>
    </p>
    <p style="font-size: 12px; color: #9aa79a; margin-top: 32px;">Sanative · doctor-led preventative care</p>
  </div>`;

  const text = [
    greeting,
    "",
    "Your Sanative Membership has lapsed, so access to your dashboards and included services is paused.",
    "Your health data is safe and will be right where you left it.",
    "",
    `Reactivate: ${renewUrl}`,
  ].join("\n");

  return sendEmailInternal(params.to, subject, html, text, { process: "membership" });
}

/** Confirmation when a Sanative Membership is cancelled. */
export async function sendMembershipCancellationEmail(params: {
  to: string;
  firstName: string;
  /** ISO date access ends (period-end cancellations); null = immediate. */
  accessEndsAt: string | null;
}): Promise<SendEmailResult> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://sanative.com.au";
  const greeting = params.firstName ? `Hi ${params.firstName},` : "Hi,";
  const subject = "Your Sanative Membership has been cancelled";
  const accessLine = params.accessEndsAt
    ? `You'll keep full access until <strong>${new Date(params.accessEndsAt).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" })}</strong>.`
    : "Your access has now ended.";
  const accessLineText = params.accessEndsAt
    ? `You'll keep full access until ${new Date(params.accessEndsAt).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" })}.`
    : "Your access has now ended.";

  const html = `
  <div style="font-family: -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; color: #2c3628;">
    <h1 style="font-size: 22px; margin: 0 0 16px;">Membership cancelled</h1>
    <p>${greeting}</p>
    <p>We've cancelled your Sanative Membership as requested. ${accessLine}</p>
    <p>Your health records stay safely stored, if you rejoin, everything will be right where you left it.</p>
    <p style="margin: 28px 0;">
      <a href="${baseUrl}/membership/checkout" style="background: #34412f; color: #ffffff; text-decoration: none; padding: 13px 26px; border-radius: 999px; font-weight: 600; display: inline-block;">Rejoin Sanative</a>
    </p>
    <p style="font-size: 12px; color: #9aa79a; margin-top: 32px;">Sanative · doctor-led preventative care</p>
  </div>`;

  const text = [
    greeting,
    "",
    `We've cancelled your Sanative Membership as requested. ${accessLineText}`,
    "Your health records stay safely stored, if you rejoin, everything will be right where you left it.",
    "",
    `Rejoin: ${baseUrl}/membership/checkout`,
  ].join("\n");

  return sendEmailInternal(params.to, subject, html, text, { process: "membership" });
}

export async function sendResultsReadyEmail(
  to: string,
  data: {
    firstName: string;
    program: string;
    carePartnerName: string;
  }
): Promise<SendEmailResult> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://sanative.com.au";
  const template = resultsReadyEmail({
    firstName: data.firstName,
    program: data.program,
    carePartnerName: data.carePartnerName,
    resultsUrl: `${baseUrl}/dashboard/results`,
  });

  return sendEmailInternal(to, template.subject, template.html, template.text, {
    process: "clinical",
  });
}

export async function sendCheckInReminderEmail(
  to: string,
  data: {
    firstName: string;
    carePartnerName: string;
    checkInType: string;
    scheduledDate: string;
  }
): Promise<SendEmailResult> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://sanative.com.au";
  const template = checkInReminderEmail({
    firstName: data.firstName,
    carePartnerName: data.carePartnerName,
    checkInType: data.checkInType,
    scheduledDate: data.scheduledDate,
    dashboardUrl: `${baseUrl}/dashboard/messages`,
  });

  return sendEmailInternal(to, template.subject, template.html, template.text, {
    process: "clinical",
  });
}

export async function sendGpVisitReminderEmail(
  to: string,
  data: {
    firstName: string;
    clinicName: string;
    gpName: string;
    visitDate: string;
    visitTime?: string;
  }
): Promise<SendEmailResult> {
  const template = gpVisitReminderEmail({
    firstName: data.firstName,
    clinicName: data.clinicName,
    gpName: data.gpName,
    visitDate: data.visitDate,
    visitTime: data.visitTime,
  });

  return sendEmailInternal(to, template.subject, template.html, template.text, {
    process: "clinical",
  });
}

export async function sendGpEnrolmentNotificationEmail(
  to: string,
  data: {
    gpName: string;
    clinicName: string;
    patientName: string;
    program: string;
    enrolledAt: Date;
  }
): Promise<SendEmailResult> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://sanative.com.au";
  const template = gpEnrolmentNotificationEmail({
    gpName: data.gpName,
    clinicName: data.clinicName,
    patientName: data.patientName,
    program: data.program,
    enrolledAt: data.enrolledAt.toLocaleDateString("en-AU", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }),
    dashboardUrl: `${baseUrl}/gp/dashboard`,
  });

  return sendEmailInternal(to, template.subject, template.html, template.text, {
    process: "clinical",
  });
}

export async function sendGpBiomarkerAlertEmail(
  to: string,
  data: {
    gpName: string;
    clinicName: string;
    patientName: string;
    patientId: string;
    biomarkerName: string;
    value: string;
    unit: string;
    status: string;
  }
): Promise<SendEmailResult> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://sanative.com.au";
  const template = gpBiomarkerAlertEmail({
    gpName: data.gpName,
    clinicName: data.clinicName,
    patientName: data.patientName,
    biomarkerName: data.biomarkerName,
    value: data.value,
    unit: data.unit,
    status: data.status,
    dashboardUrl: `${baseUrl}/gp/patients/${data.patientId}`,
  });

  return sendEmailInternal(to, template.subject, template.html, template.text, {
    process: "clinical",
  });
}

export async function sendOrderConfirmationEmail(
  to: string,
  data: {
    firstName: string;
    program: string;
    originalAmount: number;
    discountAmount: number;
    discountType?: string;
    finalAmount: number;
  }
): Promise<SendEmailResult> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://sanative.com.au";
  const template = orderConfirmationEmail({
    firstName: data.firstName,
    program: data.program,
    orderDate: new Date().toLocaleDateString("en-AU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    originalAmount: data.originalAmount,
    discountAmount: data.discountAmount,
    discountType: data.discountType,
    finalAmount: data.finalAmount,
    dashboardUrl: `${baseUrl}/dashboard`,
  });

  return sendEmailInternal(to, template.subject, template.html, template.text, {
    process: "stripe",
  });
}

// ============================================
// WEIGHT MANAGEMENT CONFIRMATION EMAIL
// ============================================

export async function sendWeightManagementConfirmationEmail(
  to: string,
  data: {
    firstName: string;
    lastName: string;
    planName?: string;
    consultationDate: string;
    consultationTime: string;
    firstMonthPrice: number;
    discount: number;
    dueToday: number;
    ongoingPrice: number;
  }
): Promise<SendEmailResult> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://sanative.com.au";
  const template = weightManagementOrderConfirmationEmail({
    firstName: data.firstName,
    lastName: data.lastName,
    planName: data.planName || "Sanative Membership",
    consultationDate: data.consultationDate,
    consultationTime: data.consultationTime,
    firstMonthPrice: data.firstMonthPrice,
    discount: data.discount,
    dueToday: data.dueToday,
    ongoingPrice: data.ongoingPrice,
    orderDate: new Date().toLocaleDateString("en-AU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    dashboardUrl: `${baseUrl}/dashboard`,
  });

  return sendEmailInternal(to, template.subject, template.html, template.text, {
    process: "stripe",
  });
}

export async function sendPathologyReferralEmail(
  to: string,
  data: {
    firstName: string;
    doctorName: string;
    referralId: string;
    programSummary: string;
    fastingRequired: boolean;
    pdfFilename: string;
    pdfBase64: string;
  }
): Promise<SendEmailResult> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://sanative.com.au";
  const template = pathologyReferralEmail({
    firstName: data.firstName,
    doctorName: data.doctorName,
    referralId: data.referralId,
    programSummary: data.programSummary,
    fastingRequired: data.fastingRequired,
    dashboardUrl: `${baseUrl}/dashboard/biomarkers`,
  });

  return sendEmailInternal(to, template.subject, template.html, template.text, {
    process: "clinical",
    attachments: [
      {
        filename: data.pdfFilename,
        content: data.pdfBase64,
      },
    ],
  });
}

// ============================================
// CORE EMAIL SENDING FUNCTION
// ============================================

interface EmailAttachment {
  filename: string;
  content: string;
}

function looksLikeHtml(value: string): boolean {
  return /<\/?[a-z][\s\S]*>/i.test(value);
}

function htmlToPlainText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/(div|h[1-6]|li|tr)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#?\w+;/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  body: string;
  from?: string;
  replyTo?: string;
  tags?: Array<{ name: string; value: string }>;
  process?: EmailProcessKey;
  attachments?: EmailAttachment[];
}

export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult>;
export async function sendEmail(to: string, subject: string, html: string, text: string): Promise<SendEmailResult>;
export async function sendEmail(
  toOrOptions: string | SendEmailOptions,
  subject?: string,
  html?: string,
  text?: string
): Promise<SendEmailResult> {
  if (typeof toOrOptions === "object") {
    const { to, subject: subj, body, from, replyTo, process, attachments } = toOrOptions;
    const recipient = Array.isArray(to) ? to[0] : to;
    const text = looksLikeHtml(body) ? htmlToPlainText(body) : body;
    return sendEmailInternal(recipient, subj, body, text, {
      process,
      from,
      replyTo,
      attachments,
    });
  }

  return sendEmailInternal(toOrOptions, subject!, html!, text!);
}

interface SendEmailInternalOptions {
  process?: EmailProcessKey;
  from?: string;
  replyTo?: string;
  attachments?: EmailAttachment[];
}

async function sendEmailInternal(
  to: string,
  subject: string,
  html: string,
  text: string,
  options?: SendEmailInternalOptions
): Promise<SendEmailResult> {
  const identity = await resolveEmailIdentity(options?.process);
  if (!identity.enabled) {
    console.warn(
      `[Email] Process ${options?.process ?? "default"} is disabled; skipping send to ${to}`
    );
    return { success: false, error: "Email process is disabled" };
  }

  const from =
    options?.from || formatFromHeader(identity.fromName, identity.fromEmail);
  const replyTo = options?.replyTo || identity.replyTo;
  const transport = resolveEmailTransport();

  if (transport === "mock") {
    if (isProductionRuntime()) {
      console.error("[Email] No email transport configured; refusing to report success");
      return { success: false, error: "Email transport is not configured" };
    }
    console.log(`[Email] Would send via mock to ${to}: ${subject} (from ${from})`);
    return { success: true, messageId: "dev-mode-no-send" };
  }

  try {
    if (transport === "google_workspace") {
      const transporter = getGoogleTransporter();
      if (!transporter) {
        return { success: false, error: "Google Workspace SMTP is not configured" };
      }
      const info = await transporter.sendMail({
        from,
        to,
        subject,
        html,
        text,
        replyTo,
        attachments: options?.attachments?.map((attachment) => ({
          filename: attachment.filename,
          content: Buffer.from(attachment.content, "base64"),
        })),
      });
      const messageId =
        typeof info.messageId === "string" ? info.messageId : String(info.messageId ?? "");
      console.log(`[Email] Sent via Workspace to ${to}: ${subject} (${messageId})`);
      return { success: true, messageId };
    }

    const resend = getResendClient();
    if (!resend) {
      if (isProductionRuntime()) {
        console.error("[Email] RESEND_API_KEY is not configured; refusing to report success");
        return { success: false, error: "Email transport is not configured" };
      }
      console.log(`[Email] Would send to ${to}: ${subject}`);
      return { success: true, messageId: "dev-mode-no-send" };
    }

    const { data, error } = await resend.emails.send({
      from,
      to,
      subject,
      html,
      text,
      replyTo,
      attachments: options?.attachments,
    });

    if (error) {
      console.error("[Email] Send failed:", error);
      return {
        success: false,
        error: error.message,
      };
    }

    console.log(`[Email] Sent via Resend to ${to}: ${subject} (${data?.id})`);
    return {
      success: true,
      messageId: data?.id,
    };
  } catch (err) {
    console.error("[Email] Exception:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

// ============================================
// HELPER FUNCTIONS FOR BACKWARD COMPATIBILITY
// ============================================

/**
 * Replace template variables in text
 */
export function replaceTemplateVariables(
  text: string,
  variables: Record<string, string>
): string {
  let result = text;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`{{${key}}}`, "g"), value);
  }
  return result;
}

/**
 * Pre-defined email templates (for backward compatibility)
 */
export const EMAIL_TEMPLATES = {
  welcome: {
    name: "Welcome",
    slug: "welcome",
    category: "WELCOME",
    subject: "Welcome to Sanative Health, {{firstName}}!",
    body: `Hi {{firstName}},\n\nWelcome to Sanative Health! We're thrilled to have you join our community.\n\nBest regards,\nThe Sanative Health Team`,
    variables: ["firstName", "lastName", "email"],
  },
  resultsReady: {
    name: "Results Ready",
    slug: "results-ready",
    category: "RESULTS",
    subject: "Your Lab Results Are Ready, {{firstName}}",
    body: `Hi {{firstName}},\n\nYour latest lab results have been uploaded and are ready for you to view.\n\nBest regards,\nThe Sanative Health Team`,
    variables: ["firstName", "biomarkerCount", "dashboardUrl"],
  },
  reminder: {
    name: "Follow-up Reminder",
    slug: "reminder",
    category: "REMINDER",
    subject: "Reminder: {{reminderSubject}}",
    body: `Hi {{firstName}},\n\nThis is a friendly reminder about: {{reminderSubject}}\n\nBest regards,\nThe Sanative Health Team`,
    variables: ["firstName", "reminderSubject", "reminderDetails"],
  },
  appointmentConfirmation: {
    name: "Appointment Confirmation",
    slug: "appointment-confirmation",
    category: "APPOINTMENT",
    subject: "Appointment Confirmed: {{appointmentDate}}",
    body: `Hi {{firstName}},\n\nYour appointment has been confirmed for {{appointmentDate}}.\n\nBest regards,\nThe Sanative Health Team`,
    variables: ["firstName", "appointmentDate", "appointmentTime"],
  },
  followUp: {
    name: "Follow-up Required",
    slug: "follow-up",
    category: "FOLLOWUP",
    subject: "Following Up: {{subject}}",
    body: `Hi {{firstName}},\n\nWe're following up on our recent communication.\n\nBest regards,\n{{agentName}}\nSanative Health Care Team`,
    variables: ["firstName", "subject", "followUpMessage", "agentName"],
  },
};

export type EmailTemplateKey = keyof typeof EMAIL_TEMPLATES;

// ============================================
// BATCH EMAIL FUNCTIONS
// ============================================

export async function sendBatchEmails(
  emails: Array<{
    to: string;
    subject: string;
    html: string;
    text: string;
  }>
): Promise<SendEmailResult[]> {
  const results: SendEmailResult[] = [];

  for (const email of emails) {
    const result = await sendEmailInternal(email.to, email.subject, email.html, email.text);
    results.push(result);

    // Small delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return results;
}
