import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// SMS provider configuration
const SMS_PROVIDER = process.env.SMS_PROVIDER || 'mock';
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;
// Cellcast (Australian SMS provider - alphanumeric sender ID, ~$0.028/SMS)
const CELLCAST_API_KEY = process.env.CELLCAST_API_KEY;
const CELLCAST_SENDER_ID = process.env.CELLCAST_SENDER_ID || 'Sanative';

interface SendSMSResult {
  success: boolean;
  externalId?: string;
  error?: string;
}

/**
 * Send SMS using configured provider
 */
async function sendSMS(phone: string, message: string): Promise<SendSMSResult> {
  // Cellcast integration (Australian provider with alphanumeric sender ID)
  if (SMS_PROVIDER === 'cellcast' && CELLCAST_API_KEY) {
    try {
      // Format phone for Australian numbers
      let formattedPhone = phone.replace(/\s+/g, '');
      if (formattedPhone.startsWith('0')) {
        formattedPhone = '61' + formattedPhone.substring(1);
      } else if (!formattedPhone.startsWith('+') && !formattedPhone.startsWith('61')) {
        formattedPhone = '61' + formattedPhone;
      }
      formattedPhone = formattedPhone.replace('+', '');

      const response = await fetch('https://cellcast.com.au/api/v3/send-sms', {
        method: 'POST',
        headers: {
          'APPKEY': CELLCAST_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sms_text: message,
          numbers: [formattedPhone],
          from: CELLCAST_SENDER_ID,
        }),
      });

      const data = await response.json();

      if (data.success || data.status === 'success') {
        console.log(`[SMS Cellcast] Sent to ${phone}: ${message.substring(0, 50)}...`);
        return {
          success: true,
          externalId: String(data.message_id || data.id || `cellcast-${Date.now()}`),
        };
      }

      console.error('[SMS Cellcast] Error:', data);
      return {
        success: false,
        error: data.error || data.message || 'Cellcast send failed',
      };
    } catch (error) {
      console.error('[SMS Cellcast] Exception:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Cellcast error',
      };
    }
  }

  // Mock provider for development
  if (SMS_PROVIDER === 'mock' || (!TWILIO_ACCOUNT_SID && !CELLCAST_API_KEY)) {
    console.log(`[SMS Mock] To: ${phone}, Message: ${message}`);
    return {
      success: true,
      externalId: `mock-${Date.now()}`,
    };
  }

  // Twilio integration
  if (SMS_PROVIDER === 'twilio' && TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
    try {
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64')}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            To: phone,
            From: TWILIO_PHONE_NUMBER || '',
            Body: message,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || 'Failed to send SMS',
        };
      }

      return {
        success: true,
        externalId: data.sid,
      };
    } catch (error) {
      console.error('[SMS Twilio] Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  return {
    success: false,
    error: 'SMS provider not configured',
  };
}

// GET - Fetch SMS notifications
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get("memberId");
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50");

    const notifications = await prisma.sMSNotification.findMany({
      where: {
        ...(memberId && { recipientId: memberId }),
        ...(status && { status: status as any }),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json({ notifications });
  } catch (error) {
    console.error("Error fetching SMS notifications:", error);
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}

// POST - Send SMS notification
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action, memberId, phone, message, isUrgent } = body;

    // Send SMS for follow-up reminder
    if (action === "sendFollowUpReminder") {
      // Get the member
      const member = await prisma.user.findUnique({
        where: { id: memberId },
        select: { id: true, firstName: true, phone: true },
      });

      if (!member) {
        return NextResponse.json({ error: "Member not found" }, { status: 404 });
      }

      const phoneNumber = phone || member.phone;
      if (!phoneNumber) {
        return NextResponse.json({ error: "No phone number available" }, { status: 400 });
      }

      // Format message
      const smsMessage = message || `Hi ${member.firstName}, this is a reminder from Sanative Health. Please contact us at your earliest convenience. Reply STOP to unsubscribe.`;

      // Create notification record
      const notification = await prisma.sMSNotification.create({
        data: {
          recipientId: memberId,
          recipientPhone: phoneNumber,
          message: smsMessage,
          status: "PENDING",
          provider: SMS_PROVIDER,
        },
      });

      // Send SMS
      const result = await sendSMS(phoneNumber, smsMessage);

      // Update notification status
      await prisma.sMSNotification.update({
        where: { id: notification.id },
        data: {
          status: result.success ? "SENT" : "FAILED",
          externalId: result.externalId,
          sentAt: result.success ? new Date() : null,
          errorMessage: result.error,
        },
      });

      // Log internal note
      await prisma.internalNote.create({
        data: {
          userId: memberId,
          memberId,
          authorId: session.user.id,
          authorName: `${session.user.firstName || ''} ${session.user.lastName || ''}`.trim() || 'Admin',
          createdBy: session.user.id,
          category: "GENERAL",
          title: `SMS ${result.success ? 'sent' : 'failed'}`,
          content: `${result.success ? 'Sent' : 'Failed to send'} SMS to ${phoneNumber}\n\nMessage: ${smsMessage}${result.error ? `\n\nError: ${result.error}` : ''}`,
          isPinned: false,
        },
      });

      return NextResponse.json({
        success: result.success,
        notification,
        error: result.error,
      });
    }

    // Send bulk urgent follow-up reminders
    if (action === "sendUrgentFollowUpReminders") {
      // Get all overdue follow-ups
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const overdueFollowUps = await prisma.callLog.findMany({
        where: {
          followUpRequired: true,
          followUpDate: { lt: today },
        },
        take: 50,
      });

      // Get member details
      const memberIds = [...new Set(overdueFollowUps.map(f => f.memberId))];
      const members = await prisma.user.findMany({
        where: { id: { in: memberIds } },
        select: { id: true, firstName: true, phone: true },
      });
      const memberMap = new Map(members.map(m => [m.id, m]));

      const results = [];
      for (const followUp of overdueFollowUps) {
        const member = memberMap.get(followUp.memberId);
        if (!member?.phone) continue;

        const smsMessage = `Hi ${member.firstName}, this is an urgent reminder from Sanative Health regarding: ${followUp.subject}. Please contact us as soon as possible. Reply STOP to unsubscribe.`;

        const notification = await prisma.sMSNotification.create({
          data: {
            recipientId: member.id,
            recipientPhone: member.phone,
            message: smsMessage,
            status: "PENDING",
            provider: SMS_PROVIDER,
          },
        });

        const result = await sendSMS(member.phone, smsMessage);

        await prisma.sMSNotification.update({
          where: { id: notification.id },
          data: {
            status: result.success ? "SENT" : "FAILED",
            externalId: result.externalId,
            sentAt: result.success ? new Date() : null,
            errorMessage: result.error,
          },
        });

        results.push({
          memberId: member.id,
          success: result.success,
          error: result.error,
        });
      }

      return NextResponse.json({
        success: true,
        sent: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error sending SMS:", error);
    return NextResponse.json({ error: "Failed to send SMS" }, { status: 500 });
  }
}
