/**
 * SMS Service Library
 *
 * Supports:
 * - Twilio (primary)
 * - Cellcast (Australian, alphanumeric sender ID)
 * - MessageMedia (Australian)
 * - Mock (development)
 *
 * Usage:
 *   import { sendSMS, sendBulkSMS, queueSMS } from "@/lib/sms";
 *
 *   // Send immediately
 *   await sendSMS("+61412345678", "Hello!");
 *
 *   // Queue for background processing
 *   await queueSMS(userId, "+61412345678", "Hello!");
 */

import { prisma } from "./prisma";

export type SMSProvider = "twilio" | "cellcast" | "messagemedia" | "mock";

// ============================================
// CONFIGURATION
// ============================================

const DEFAULT_SENDER_ID = "Sanative";

function env(name: string): string {
  // Read at call time so Netlify/Next runtime secrets are not frozen as empty at build.
  return (process.env[name] || "").trim();
}

function smsProvider(): SMSProvider {
  const value = env("SMS_PROVIDER") || "twilio";
  if (
    value === "twilio" ||
    value === "cellcast" ||
    value === "messagemedia" ||
    value === "mock"
  ) {
    return value;
  }
  return "twilio";
}

// ============================================
// TYPES
// ============================================

export interface SendSMSResult {
  success: boolean;
  messageId?: string;
  provider?: string;
  error?: string;
  cost?: number;
}

export interface SMSMessage {
  to: string;
  message: string;
  senderId?: string;
}

function twilioAuth(): { user: string; pass: string } | null {
  const accountSid = env("TWILIO_ACCOUNT_SID");
  const authToken = env("TWILIO_AUTH_TOKEN");
  const apiKey = env("TWILIO_API_KEY");
  const apiSecret = env("TWILIO_API_SECRET");
  if (accountSid && authToken) {
    return { user: accountSid, pass: authToken };
  }
  if (apiKey && apiSecret) {
    return { user: apiKey, pass: apiSecret };
  }
  return null;
}

function isTwilioConfigured(): boolean {
  return Boolean(
    env("TWILIO_ACCOUNT_SID") &&
      twilioAuth() &&
      (env("TWILIO_PHONE_NUMBER") || env("TWILIO_MESSAGING_SERVICE_SID"))
  );
}

// ============================================
// PHONE NUMBER FORMATTING
// ============================================

/**
 * Format phone number for Australian numbers
 * Converts 0412345678 -> 61412345678
 */
export function formatAustralianPhone(phone: string): string {
  // Remove all non-digit characters
  let formatted = phone.replace(/\D/g, "");

  // Handle Australian numbers
  if (formatted.startsWith("0")) {
    formatted = "61" + formatted.substring(1);
  } else if (formatted.startsWith("4") && formatted.length === 9) {
    // Mobile starting with 4 without country code
    formatted = "61" + formatted;
  } else if (!formatted.startsWith("61") && formatted.length === 9) {
    formatted = "61" + formatted;
  }

  return formatted;
}

/**
 * Format phone number for E.164 (international standard)
 * Returns +61412345678 format
 */
export function formatE164(phone: string): string {
  const formatted = formatAustralianPhone(phone);
  return formatted.startsWith("+") ? formatted : `+${formatted}`;
}

/**
 * Validate Australian mobile number
 */
export function isValidAustralianMobile(phone: string): boolean {
  const formatted = formatAustralianPhone(phone);
  // Australian mobile numbers: 61 4XX XXX XXX (12 digits total)
  return /^614\d{8}$/.test(formatted);
}

// ============================================
// SMS PROVIDERS
// ============================================

/**
 * Send SMS via Twilio
 */
async function sendViaTwilio(to: string, message: string): Promise<SendSMSResult> {
  const accountSid = env("TWILIO_ACCOUNT_SID");
  const auth = twilioAuth();
  const fromNumber = env("TWILIO_PHONE_NUMBER");
  const messagingServiceSid = env("TWILIO_MESSAGING_SERVICE_SID");
  if (!accountSid || !auth) {
    return { success: false, error: "Twilio credentials not configured" };
  }
  if (!fromNumber && !messagingServiceSid) {
    return { success: false, error: "Twilio From number or messaging service not configured" };
  }

  try {
    const formattedPhone = formatE164(to);
    const body = new URLSearchParams({
      To: formattedPhone,
      Body: message,
    });
    if (messagingServiceSid) {
      body.set("MessagingServiceSid", messagingServiceSid);
    } else if (fromNumber) {
      body.set("From", fromNumber);
    }

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${auth.user}:${auth.pass}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("[SMS Twilio] Error:", data);
      return {
        success: false,
        provider: "twilio",
        error: data.message || "Twilio send failed",
      };
    }

    console.log(`[SMS Twilio] Sent to ${formattedPhone}: ${message.substring(0, 50)}...`);
    return {
      success: true,
      messageId: data.sid,
      provider: "twilio",
      cost: data.price ? parseFloat(data.price) : undefined,
    };
  } catch (error) {
    console.error("[SMS Twilio] Exception:", error);
    return {
      success: false,
      provider: "twilio",
      error: error instanceof Error ? error.message : "Twilio error",
    };
  }
}

/**
 * Send SMS via MessageMedia (Australian provider)
 * API Docs: https://developers.messagemedia.com/
 */
async function sendViaMessageMedia(to: string, message: string, senderId?: string): Promise<SendSMSResult> {
  const apiKey = env("MESSAGEMEDIA_API_KEY");
  const apiSecret = env("MESSAGEMEDIA_API_SECRET");
  if (!apiKey || !apiSecret) {
    return { success: false, error: "MessageMedia credentials not configured" };
  }

  try {
    const formattedPhone = formatE164(to);

    const response = await fetch("https://api.messagemedia.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString("base64")}`,
      },
      body: JSON.stringify({
        messages: [
          {
            content: message,
            destination_number: formattedPhone,
            source_number: senderId || env("MESSAGEMEDIA_SENDER_ID") || DEFAULT_SENDER_ID,
            format: "SMS",
          },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      console.error("[SMS MessageMedia] Error:", data);
      return {
        success: false,
        provider: "messagemedia",
        error: data.error?.message || data.message || "MessageMedia send failed",
      };
    }

    const messageResult = data.messages?.[0];
    console.log(`[SMS MessageMedia] Sent to ${formattedPhone}: ${message.substring(0, 50)}...`);

    return {
      success: true,
      messageId: messageResult?.message_id || `mm-${Date.now()}`,
      provider: "messagemedia",
    };
  } catch (error) {
    console.error("[SMS MessageMedia] Exception:", error);
    return {
      success: false,
      provider: "messagemedia",
      error: error instanceof Error ? error.message : "MessageMedia error",
    };
  }
}

/**
 * Send SMS via Cellcast (Australian provider)
 * Supports alphanumeric sender ID
 */
async function sendViaCellcast(to: string, message: string, senderId?: string): Promise<SendSMSResult> {
  const apiKey = env("CELLCAST_API_KEY");
  if (!apiKey) {
    return { success: false, error: "Cellcast API key not configured" };
  }

  try {
    const formattedPhone = formatAustralianPhone(to);

    const response = await fetch("https://cellcast.com.au/api/v3/send-sms", {
      method: "POST",
      headers: {
        APPKEY: apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sms_text: message,
        numbers: [formattedPhone],
        from: senderId || env("CELLCAST_SENDER_ID") || DEFAULT_SENDER_ID,
      }),
    });

    const data = await response.json();

    if (!data.success && data.status !== "success") {
      console.error("[SMS Cellcast] Error:", data);
      return {
        success: false,
        provider: "cellcast",
        error: data.error || data.message || "Cellcast send failed",
      };
    }

    console.log(`[SMS Cellcast] Sent to ${formattedPhone}: ${message.substring(0, 50)}...`);
    return {
      success: true,
      messageId: String(data.message_id || data.id || `cellcast-${Date.now()}`),
      provider: "cellcast",
      cost: data.cost ? parseFloat(data.cost) : 0.028, // Default Cellcast rate
    };
  } catch (error) {
    console.error("[SMS Cellcast] Exception:", error);
    return {
      success: false,
      provider: "cellcast",
      error: error instanceof Error ? error.message : "Cellcast error",
    };
  }
}

/**
 * Mock SMS sender for development
 */
async function sendViaMock(to: string, message: string): Promise<SendSMSResult> {
  console.log(`[SMS Mock] To: ${to}`);
  console.log(`[SMS Mock] Message: ${message}`);

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 100));

  return {
    success: true,
    messageId: `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    provider: "mock",
    cost: 0,
  };
}

// ============================================
// MAIN SMS FUNCTIONS
// ============================================

/**
 * Send SMS immediately using configured provider
 */
export async function sendSMS(
  to: string,
  message: string,
  options?: {
    senderId?: string;
    provider?: SMSProvider;
  }
): Promise<SendSMSResult> {
  const provider = options?.provider || smsProvider();

  // Validate phone number
  if (!isValidAustralianMobile(to)) {
    console.warn(`[SMS] Invalid Australian mobile number: ${to}`);
    // Still try to send - international numbers might be valid
  }

  switch (provider) {
    case "twilio": {
      if (!isTwilioConfigured()) {
        if (process.env.NODE_ENV === "production") {
          return { success: false, provider: "twilio", error: "Twilio credentials not configured" };
        }
        console.warn("[SMS] Twilio not configured; using mock in non-production");
        return sendViaMock(to, message);
      }
      return sendViaTwilio(to, message);
    }

    case "messagemedia":
      return sendViaMessageMedia(to, message, options?.senderId);

    case "cellcast": {
      if (!env("CELLCAST_API_KEY")) {
        if (process.env.NODE_ENV === "production") {
          return { success: false, provider: "cellcast", error: "Cellcast API key not configured" };
        }
        console.warn("[SMS] Cellcast not configured; using mock in non-production");
        return sendViaMock(to, message);
      }
      return sendViaCellcast(to, message, options?.senderId);
    }

    case "mock":
    default:
      return sendViaMock(to, message);
  }
}

/**
 * Queue SMS for background processing
 * Creates SMSNotification record that can be processed by cron job
 */
export async function queueSMS(
  recipientId: string,
  phone: string,
  message: string,
  options?: {
    priority?: "HIGH" | "NORMAL" | "LOW";
  }
): Promise<{ success: boolean; notificationId?: string; error?: string }> {
  try {
    const notification = await prisma.sMSNotification.create({
      data: {
        recipientId,
        recipientPhone: phone,
        message,
        status: "PENDING",
        provider: smsProvider(),
      },
    });

    console.log(`[SMS] Queued for ${phone} (ID: ${notification.id})`);
    return {
      success: true,
      notificationId: notification.id,
    };
  } catch (error) {
    console.error("[SMS] Failed to queue:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to queue SMS",
    };
  }
}

/**
 * Send SMS and log to database
 */
export async function sendAndLogSMS(
  recipientId: string,
  phone: string,
  message: string,
  options?: {
    senderId?: string;
    provider?: SMSProvider;
  }
): Promise<SendSMSResult & { notificationId?: string }> {
  // Create pending record
  const notification = await prisma.sMSNotification.create({
    data: {
      recipientId,
      recipientPhone: phone,
      message,
      status: "PENDING",
      provider: options?.provider || smsProvider(),
    },
  });

  // Send SMS
  const result = await sendSMS(phone, message, options);

  // Update record with result
  await prisma.sMSNotification.update({
    where: { id: notification.id },
    data: {
      status: result.success ? "SENT" : "FAILED",
      externalId: result.messageId,
      sentAt: result.success ? new Date() : null,
      errorMessage: result.error,
    },
  });

  return {
    ...result,
    notificationId: notification.id,
  };
}

/**
 * Send bulk SMS messages
 */
export async function sendBulkSMS(
  messages: SMSMessage[],
  options?: {
    delayBetweenMs?: number;
    provider?: SMSProvider;
  }
): Promise<{ sent: number; failed: number; results: SendSMSResult[] }> {
  const results: SendSMSResult[] = [];
  const delay = options?.delayBetweenMs || 100; // Default 100ms between messages

  for (const msg of messages) {
    const result = await sendSMS(msg.to, msg.message, {
      senderId: msg.senderId,
      provider: options?.provider,
    });
    results.push(result);

    // Delay between messages to avoid rate limiting
    if (delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  return {
    sent: results.filter((r) => r.success).length,
    failed: results.filter((r) => !r.success).length,
    results,
  };
}

/**
 * Process pending SMS notifications from database
 * Call this from a cron job
 */
export async function processPendingSMS(
  limit = 50
): Promise<{ processed: number; sent: number; failed: number }> {
  const pending = await prisma.sMSNotification.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" },
    take: limit,
  });

  let sent = 0;
  let failed = 0;

  for (const notification of pending) {
    const result = await sendSMS(notification.recipientPhone, notification.message);

    await prisma.sMSNotification.update({
      where: { id: notification.id },
      data: {
        status: result.success ? "SENT" : "FAILED",
        externalId: result.messageId,
        sentAt: result.success ? new Date() : null,
        errorMessage: result.error,
      },
    });

    if (result.success) {
      sent++;
    } else {
      failed++;
    }

    // Small delay between sends
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  console.log(`[SMS] Processed ${pending.length} pending: ${sent} sent, ${failed} failed`);
  return { processed: pending.length, sent, failed };
}

/**
 * Get SMS statistics
 */
export async function getSMSStats(
  options?: {
    startDate?: Date;
    endDate?: Date;
  }
): Promise<{
  total: number;
  sent: number;
  failed: number;
  pending: number;
  delivered: number;
}> {
  const where = {
    createdAt: {
      ...(options?.startDate && { gte: options.startDate }),
      ...(options?.endDate && { lte: options.endDate }),
    },
  };

  const [total, sent, failed, pending, delivered] = await Promise.all([
    prisma.sMSNotification.count({ where }),
    prisma.sMSNotification.count({ where: { ...where, status: "SENT" } }),
    prisma.sMSNotification.count({ where: { ...where, status: "FAILED" } }),
    prisma.sMSNotification.count({ where: { ...where, status: "PENDING" } }),
    prisma.sMSNotification.count({ where: { ...where, status: "DELIVERED" } }),
  ]);

  return { total, sent, failed, pending, delivered };
}

/**
 * Get configured SMS provider info
 */
export function getSMSProviderInfo(): {
  provider: string;
  configured: boolean;
  senderId: string;
} {
  const provider = smsProvider();
  let configured = false;

  switch (provider) {
    case "twilio":
      configured = isTwilioConfigured();
      break;
    case "messagemedia":
      configured = !!(env("MESSAGEMEDIA_API_KEY") && env("MESSAGEMEDIA_API_SECRET"));
      break;
    case "cellcast":
      configured = !!env("CELLCAST_API_KEY");
      break;
    case "mock":
      configured = true;
      break;
  }

  const senderId =
    provider === "twilio"
      ? env("TWILIO_PHONE_NUMBER") || DEFAULT_SENDER_ID
      : provider === "messagemedia"
      ? env("MESSAGEMEDIA_SENDER_ID") || DEFAULT_SENDER_ID
      : provider === "cellcast"
      ? env("CELLCAST_SENDER_ID") || DEFAULT_SENDER_ID
      : DEFAULT_SENDER_ID;

  return {
    provider,
    configured,
    senderId: senderId || DEFAULT_SENDER_ID,
  };
}
