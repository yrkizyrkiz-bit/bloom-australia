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

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Sanative - Your Verification Code</title>
</head>
<body style="margin:0;padding:0;background-color:#f7f6f3;">
<div style="font-family:Georgia, 'Times New Roman', serif;max-width:520px;margin:0 auto;padding:32px 20px;color:#2c3628;">
<p style="font-size:20px;margin:0 0 24px;">Sanative</p>
<p style="font-size:16px;line-height:1.5;margin:0 0 16px;">You requested a verification code for Sanative.</p>
<p style="font-size:28px;font-weight:600;letter-spacing:0.15em;margin:0 0 16px;">${code}</p>
<p style="font-size:15px;line-height:1.5;margin:0 0 8px;">This code expires in 10 minutes. Enter it on sanative.com.au.</p>
<p style="font-size:15px;line-height:1.5;margin:0 0 24px;">If you did not request this, please ignore this email.</p>
<p style="font-size:13px;line-height:1.5;color:#5c6656;margin:0;">Sanative<br>Sydney, Australia<br><a href="https://sanative.com.au" style="color:#5c6656;">https://sanative.com.au</a></p>
</div>
</body>
</html>`;

  const text = [
    "You requested a verification code for Sanative.",
    "",
    code,
    "",
    "This code expires in 10 minutes. Enter it on sanative.com.au.",
    "If you did not request this, please ignore this email.",
    "",
    "Sanative",
    "Sydney, Australia",
    "https://sanative.com.au",
  ].join("\n");

  const result = await sendAppEmail({
    to: email,
    subject: "Sanative - Your Verification Code",
    body: html,
    text,
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
