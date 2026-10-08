import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getEmailTransportInfo, sendEmail } from "@/lib/email";

interface EmailPayload {
  to: string | string[];
  subject: string;
  body: string;
  html?: string;
  templateId?: string;
  templateData?: Record<string, string>;
  trackOpens?: boolean;
  trackClicks?: boolean;
}

// Add tracking to email HTML
function addTracking(
  html: string,
  campaignId: string,
  email: string,
  baseUrl: string,
  trackOpens: boolean,
  trackClicks: boolean
): string {
  let trackedHtml = html;

  // Add click tracking to links
  if (trackClicks) {
    trackedHtml = trackedHtml.replace(
      /href="(https?:\/\/[^"]+)"/g,
      (match, url) => {
        const trackingUrl = `${baseUrl}/api/email/click?cid=${campaignId}&email=${encodeURIComponent(email)}&url=${encodeURIComponent(url)}`;
        return `href="${trackingUrl}"`;
      }
    );
  }

  // Add open tracking pixel
  if (trackOpens) {
    const trackingPixel = `<img src="${baseUrl}/api/email/track?cid=${campaignId}&email=${encodeURIComponent(email)}" width="1" height="1" style="display:none;" alt="" />`;
    // Insert before closing body tag or at the end
    if (trackedHtml.includes("</body>")) {
      trackedHtml = trackedHtml.replace("</body>", `${trackingPixel}</body>`);
    } else {
      trackedHtml += trackingPixel;
    }
  }

  return trackedHtml;
}

// Create HTML wrapper for plain text
function createHtmlEmail(body: string, campaignId: string, email: string, baseUrl: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; color: #333;">
  <div style="max-width: 600px; margin: 0 auto;">
    ${body.split('\n').map(line => `<p style="margin: 0 0 10px 0;">${line || '&nbsp;'}</p>`).join('\n')}
    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
    <p style="font-size: 12px; color: #888;">
      This email was sent by Sanative Health.
    </p>
  </div>
  <img src="${baseUrl}/api/email/track?cid=${campaignId}&email=${encodeURIComponent(email)}" width="1" height="1" style="display:none;" alt="" />
</body>
</html>`;
}

// POST /api/email/send - Send email to one or more recipients
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload: EmailPayload = await request.json();
    const { to, subject, body: emailBody, html, trackOpens = true, trackClicks = true } = payload;

    if (!to || !subject || (!emailBody && !html)) {
      return NextResponse.json(
        { error: "to, subject, and body (or html) are required" },
        { status: 400 }
      );
    }

    const recipients = Array.isArray(to) ? to : [to];
    const results: { email: string; success: boolean; messageId?: string; error?: string }[] = [];

    const transportInfo = getEmailTransportInfo();
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

    // Create email campaign for tracking
    const campaign = await prisma.emailCampaign.create({
      data: {
        subject,
        body: emailBody || "",
        sentBy: session.user.id,
        recipientCount: recipients.length,
        status: "SENDING",
      },
    });

    for (const recipient of recipients) {
      try {
        // Create tracked HTML
        let emailHtml = html || createHtmlEmail(emailBody || "", campaign.id, recipient, baseUrl);
        if (html) {
          emailHtml = addTracking(html, campaign.id, recipient, baseUrl, trackOpens, trackClicks);
        }

        const sendResult = await sendEmail({
          to: recipient,
          subject,
          body: emailHtml,
          process: "crm",
        });

        if (sendResult.success) {
          const messageId =
            sendResult.messageId ||
            `email_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
          results.push({
            email: recipient,
            success: true,
            messageId,
          });

          await prisma.emailEvent.create({
            data: {
              campaignId: campaign.id,
              recipientEmail: recipient,
              messageId,
              eventType: "SENT",
              metadata: { transport: transportInfo.transport },
            },
          });
        } else {
          results.push({
            email: recipient,
            success: false,
            error: sendResult.error || "Email send failed",
          });

          await prisma.emailEvent.create({
            data: {
              campaignId: campaign.id,
              recipientEmail: recipient,
              eventType: "BOUNCED",
              metadata: { error: sendResult.error, transport: transportInfo.transport },
            },
          });
        }

        // Log email activity for user
        const user = await prisma.user.findUnique({
          where: { email: recipient },
          select: { id: true },
        });

        if (user) {
          await prisma.activityLog.create({
            data: {
              userId: user.id,
              action: "EMAIL_SENT",
              entity: "email",
              entityId: campaign.id,
              details: {
                subject,
                sentBy: session.user.email,
                campaignId: campaign.id,
              },
            },
          });

          // Create notification for the user
          await prisma.notification.create({
            data: {
              userId: user.id,
              type: "INFO",
              title: "New message from Sanative",
              message: subject,
              category: "SYSTEM",
            },
          });
        }
      } catch (error) {
        console.error(`Error sending to ${recipient}:`, error);
        results.push({
          email: recipient,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    // Update campaign status
    await prisma.emailCampaign.update({
      where: { id: campaign.id },
      data: {
        status: failureCount === recipients.length ? "FAILED" : "SENT",
        sentCount: successCount,
        deliveredCount: transportInfo.transport === "mock" ? successCount : 0,
        bouncedCount: failureCount,
        sentAt: new Date(),
      },
    });

    // Log admin activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: recipients.length > 1 ? "BULK_EMAIL_SENT" : "EMAIL_SENT",
        entity: "email_campaign",
        entityId: campaign.id,
        details: {
          recipients: recipients.length,
          successCount,
          failureCount,
          subject,
          campaignId: campaign.id,
        },
      },
    });

    return NextResponse.json({
      success: true,
      mode: transportInfo.transport,
      campaignId: campaign.id,
      results,
      summary: {
        total: recipients.length,
        sent: successCount,
        failed: failureCount,
      },
      tracking: {
        opensEnabled: trackOpens,
        clicksEnabled: trackClicks,
        analyticsUrl: `/api/email/analytics?campaignId=${campaign.id}`,
      },
    });
  } catch (error) {
    console.error("Email send error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
