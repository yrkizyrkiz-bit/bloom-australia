import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDevVerificationCode } from "@/lib/auth/dev-verification";
import { isProductionRuntime } from "@/lib/security/jwt-secret";
import { RATE_LIMITS, rateLimitBucketKey } from "@/lib/security/rate-limit-config";
import {
  enforceDbRateLimits,
  enforceIpRateLimit,
  rateLimitExceededResponse,
} from "@/lib/security/rate-limit-http";
import { getSMSProviderInfo, sendSMS as sendSmsViaProvider } from "@/lib/sms";
import { sendEmail as sendAppEmail } from "@/lib/email";

// Generate 6-digit code
function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendSMS(phone: string, message: string): Promise<boolean> {
  const providerInfo = getSMSProviderInfo();
  if (!providerInfo.configured && providerInfo.provider !== "mock") {
    if (isProductionRuntime()) {
      console.error("[SMS] No SMS provider configured; refusing to report success");
      return false;
    }
  }

  const result = await sendSmsViaProvider(phone, message);
  if (!result.success) {
    console.error("[SMS] Verification send failed:", result.error);
  }
  return result.success;
}

// Set EMAIL_DEV_MODE=true to skip sending and only log codes to console.
// Ignored in production builds.
const EMAIL_DEV_MODE = process.env.EMAIL_DEV_MODE === 'true' && !isProductionRuntime();

function logCodeForLocalTesting(label: string, email: string, code: string, extra?: string) {
  // Verification codes only ever reach logs outside production.
  if (isProductionRuntime()) return;
  console.log(`\n========================================`);
  console.log(`[${label}]`);
  console.log(`To: ${email}`);
  console.log(`Code: ${code}`);
  if (extra) console.log(extra);
  console.log(`========================================\n`);
}

async function sendVerificationEmail(email: string, code: string): Promise<boolean> {
  if (EMAIL_DEV_MODE) {
    logCodeForLocalTesting("EMAIL VERIFICATION CODE", email, code);
    return true;
  }

  const html = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; background-color: #f5f5f5;">
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
              <div style="text-align: center; margin-bottom: 32px;">
                <span style="font-size: 28px; font-weight: 600; color: #2c3628; font-family: Georgia, serif;">Sanative</span>
              </div>
              <div style="background: white; border-radius: 16px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <h1 style="font-size: 22px; color: #1a1a1a; margin: 0 0 16px 0; text-align: center;">
                  Your verification code
                </h1>
                <p style="color: #666; font-size: 14px; line-height: 1.6; text-align: center; margin: 0 0 24px 0;">
                  Enter this code to verify your account
                </p>
                <div style="background: #f8faf7; border: 2px solid #e6ebe3; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
                  <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #2c3628; font-family: monospace;">${code}</span>
                </div>
                <p style="color: #888; font-size: 13px; line-height: 1.5; text-align: center; margin: 0;">
                  This code expires in <strong>10 minutes</strong>.<br>
                  If you didn't request this code, you can safely ignore this email.
                </p>
              </div>
              <div style="text-align: center; margin-top: 32px;">
                <p style="color: #999; font-size: 12px; margin: 0;">
                  Sanative Health<br>
                  Sydney, Australia
                </p>
              </div>
            </div>
          </body>
          </html>
        `;

  const result = await sendAppEmail({
    to: email,
    subject: "Your Sanative verification code",
    body: html,
    process: "auth",
  });

  if (!result.success) {
    logCodeForLocalTesting(
      "EMAIL FAILED - VERIFICATION CODE",
      email,
      code,
      result.error
    );
    return !isProductionRuntime();
  }

  console.log(`[Email] Successfully sent verification to ${email}`);
  return true;
}

export async function POST(req: NextRequest) {
  try {
    const ipLimited = await enforceIpRateLimit(
      req,
      "send-verification:ip",
      RATE_LIMITS.sendVerificationIp
    );
    if (!ipLimited.allowed) {
      return rateLimitExceededResponse(ipLimited.retryAfterSec);
    }

    const { contact, type } = await req.json();
    // type: 'email' | 'phone'

    if (!contact || !type) {
      return NextResponse.json(
        { error: "Missing contact or type" },
        { status: 400 }
      );
    }

    const normalizedContact = contact.toLowerCase().trim();
    const contactLimited = await enforceDbRateLimits([
      {
        bucketKey: rateLimitBucketKey("send-verification:contact", normalizedContact),
        config: RATE_LIMITS.sendVerificationContact,
      },
    ]);
    if (!contactLimited.allowed) {
      return rateLimitExceededResponse(contactLimited.retryAfterSec);
    }

    // Validate format
    if (type === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(contact)) {
        return NextResponse.json(
          { error: "Invalid email format" },
          { status: 400 }
        );
      }
    } else if (type === 'phone') {
      // Australian phone validation
      const phoneClean = contact.replace(/\s/g, '');
      if (!/^(\+61|0)[4-9]\d{8}$/.test(phoneClean)) {
        return NextResponse.json(
          { error: "Invalid Australian phone number" },
          { status: 400 }
        );
      }
    }

    // Generate code (use the temporary dev code when it is configured)
    const devCode = getDevVerificationCode();
    const code = devCode ?? generateCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store verification code
    await prisma.verificationCode.upsert({
      where: {
        contact_type: {
          contact: contact.toLowerCase().trim(),
          type,
        },
      },
      update: {
        code,
        expiresAt,
        attempts: 0,
        verified: false,
      },
      create: {
        contact: contact.toLowerCase().trim(),
        type,
        code,
        expiresAt,
        attempts: 0,
        verified: false,
      },
    });

    // Send verification code
    let sent = false;

    // Log the code for easy local testing only; never in production
    if (!isProductionRuntime()) {
      console.log(`[Verification] Code for ${contact}: ${code}`);
    }

    if (devCode) {
      console.warn("[DEV] Skipping email/SMS send; DEV_VERIFICATION_CODE is set");
      sent = true;
    } else if (type === 'email') {
      sent = await sendVerificationEmail(contact, code);
    } else {
      const message = `Your Sanative verification code is: ${code}. Expires in 10 minutes.`;
      sent = await sendSMS(contact, message);
    }

    if (!sent) {
      return NextResponse.json(
        { error: `Failed to send verification ${type === 'email' ? 'email' : 'SMS'}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Verification code sent to ${type === 'email' ? contact : '•••• ' + contact.slice(-4)}`,
      ...(devCode ? { devBypass: true } : {}),
    });
  } catch (error) {
    console.error("Error sending verification:", error);
    return NextResponse.json(
      { error: "Failed to send verification code" },
      { status: 500 }
    );
  }
}
