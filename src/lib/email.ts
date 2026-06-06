import { Resend } from "resend";
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
} from "./email-templates";

// Lazy-initialized Resend client (avoids build-time errors when env var is missing)
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

// Sender — aligned with verification route (EMAIL_FROM / EMAIL_FROM_NAME)
const EMAIL_FROM = process.env.EMAIL_FROM || "onboarding@resend.dev";
const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME || "Sanative Health";

function getFromAddress(): string {
  if (process.env.FROM_EMAIL) {
    return process.env.FROM_EMAIL;
  }
  return `${EMAIL_FROM_NAME} <${EMAIL_FROM}>`;
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

  return sendEmailInternal(to, template.subject, template.html, template.text);
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

  return sendEmailInternal(to, template.subject, template.html, template.text);
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

  return sendEmailInternal(to, template.subject, template.html, template.text);
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

  return sendEmailInternal(to, template.subject, template.html, template.text);
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

  return sendEmailInternal(to, template.subject, template.html, template.text);
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

  return sendEmailInternal(to, template.subject, template.html, template.text);
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

  return sendEmailInternal(to, template.subject, template.html, template.text);
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

  return sendEmailInternal(to, template.subject, template.html, template.text);
}

// ============================================
// WEIGHT MANAGEMENT CONFIRMATION EMAIL
// ============================================

export async function sendWeightManagementConfirmationEmail(
  to: string,
  data: {
    firstName: string;
    lastName: string;
    planName: 'Sanative Core' | 'Sanative Precision';
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
    planName: data.planName,
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

  return sendEmailInternal(to, template.subject, template.html, template.text);
}

// ============================================
// CORE EMAIL SENDING FUNCTION
// ============================================

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  body: string;
  from?: string;
  replyTo?: string;
  tags?: Array<{ name: string; value: string }>;
}

// Overloaded sendEmail for backward compatibility
export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult>;
export async function sendEmail(to: string, subject: string, html: string, text: string): Promise<SendEmailResult>;
export async function sendEmail(
  toOrOptions: string | SendEmailOptions,
  subject?: string,
  html?: string,
  text?: string
): Promise<SendEmailResult> {
  // Handle object-style call (backward compatibility)
  if (typeof toOrOptions === "object") {
    const { to, subject: subj, body } = toOrOptions;
    const recipient = Array.isArray(to) ? to[0] : to;
    return sendEmailInternal(recipient, subj, body, body);
  }

  // Handle positional arguments
  return sendEmailInternal(toOrOptions, subject!, html!, text!);
}

async function sendEmailInternal(
  to: string,
  subject: string,
  html: string,
  text: string
): Promise<SendEmailResult> {
  // Get the lazily-initialized Resend client
  const resend = getResendClient();

  // Check if API key is configured
  if (!resend) {
    console.log(`[Email] Would send to ${to}: ${subject}`);
    console.log("[Email] RESEND_API_KEY not configured - email not sent");
    return {
      success: true,
      messageId: "dev-mode-no-send",
    };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: getFromAddress(),
      to,
      subject,
      html,
      text,
    });

    if (error) {
      console.error("[Email] Send failed:", error);
      return {
        success: false,
        error: error.message,
      };
    }

    console.log(`[Email] Sent to ${to}: ${subject} (${data?.id})`);
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
