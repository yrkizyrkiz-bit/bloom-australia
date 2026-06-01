import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

// Abandoned cart email template
function getAbandonedCartEmail(data: {
  firstName: string;
  program: string;
  userId: string;
  discountCode?: string;
  discountAmount?: number;
  resumeUrl: string;
}): { subject: string; html: string } {
  const programNames: Record<string, string> = {
    weight_management: "Weight Management",
    womens_health: "Women's Health",
    mens_health: "Men's Health",
    hair_loss: "Hair Loss Treatment",
    fatty_liver: "Metabolic Health",
  };

  const programName = programNames[data.program] || "Health";
  const baseUrl = process.env.NEXTAUTH_URL || "https://sanative.com.au";
  const unsubscribeUrl = `${baseUrl}/api/email/unsubscribe?token=${data.userId}`;

  const subject = `${data.firstName}, your ${programName} assessment is waiting`;

  const discountSection = data.discountCode ? `
    <div style="background: linear-gradient(135deg, #5c7a52 0%, #7e9a72 100%); border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center;">
      <p style="margin: 0 0 8px 0; font-size: 14px; color: rgba(255,255,255,0.9); text-transform: uppercase; letter-spacing: 1px;">
        Special Offer
      </p>
      <p style="margin: 0 0 8px 0; font-size: 32px; font-weight: bold; color: #ffffff;">
        Save $${data.discountAmount || 50}
      </p>
      <p style="margin: 0; font-size: 14px; color: rgba(255,255,255,0.8);">
        Use code <strong style="color: #ffffff; background: rgba(255,255,255,0.2); padding: 4px 12px; border-radius: 4px;">${data.discountCode}</strong>
      </p>
    </div>
  ` : '';

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Complete Your Assessment</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #fdfbf7;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 40px; background-color: #2c3628;">
              <h1 style="margin: 0; font-family: Georgia, serif; font-size: 28px; color: #ffffff; font-weight: normal;">sanative</h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 16px 0; font-size: 24px; color: #2c3628; font-family: Georgia, serif;">
                Hi ${data.firstName},
              </h2>

              <p style="margin: 0 0 24px 0; font-size: 16px; color: #5c7a52; line-height: 1.6;">
                We noticed you started your ${programName} assessment but didn't complete the booking. Your personalised health profile is still waiting for you.
              </p>

              <div style="background-color: #f4f7f2; border-radius: 12px; padding: 20px; margin: 24px 0;">
                <p style="margin: 0 0 12px 0; font-size: 14px; color: #7e9a72; text-transform: uppercase; letter-spacing: 1px;">
                  What you'll get
                </p>
                <ul style="margin: 0; padding: 0 0 0 20px; color: #2c3628;">
                  <li style="margin-bottom: 8px;">Doctor video consultation</li>
                  <li style="margin-bottom: 8px;">Personalised treatment plan</li>
                  <li style="margin-bottom: 8px;">Prescription medication (if appropriate)</li>
                  <li style="margin-bottom: 8px;">Ongoing care partner support</li>
                </ul>
              </div>

              ${discountSection}

              <div style="text-align: center; margin: 32px 0;">
                <a href="${data.resumeUrl}" style="display: inline-block; background-color: #2c3628; color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 50px; font-weight: 600; font-size: 16px;">
                  Complete Your Booking
                </a>
              </div>

              <p style="margin: 24px 0 0 0; font-size: 14px; color: #7e9a72; text-align: center;">
                Questions? Reply to this email or call us at 1300 XXX XXX
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #fdfbf7; border-top: 1px solid #e6ebe3;">
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #5c7a52;">
                AHPRA Registered • NATA-accredited labs • Australian Privacy Act compliant
              </p>
              <p style="margin: 0; font-size: 12px; color: #a8bb9e;">
                © ${new Date().getFullYear()} Sanative Health. All rights reserved.
              </p>
              <p style="margin: 12px 0 0 0; font-size: 11px; color: #a8bb9e;">
                You received this email because you started a Sanative Health assessment.<br>
                <a href="${unsubscribeUrl}" style="color: #7e9a72;">Unsubscribe from marketing emails</a> •
                <a href="https://sanative.com.au/privacy" style="color: #7e9a72;">Privacy Policy</a><br>
                Sanative Health Pty Ltd • Australia
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return { subject, html };
}

// POST /api/email/abandoned-cart - Send abandoned cart recovery email
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, includeDiscount = true } = body;

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    // Fetch user including marketing preferences
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        subscriptionTier: true,
        subscriptionStatus: true,
        marketingOptIn: true,
        unsubscribedAt: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Skip if user has unsubscribed from marketing emails
    if (user.unsubscribedAt) {
      return NextResponse.json({
        success: false,
        skipped: true,
        reason: "User has unsubscribed from marketing emails",
      });
    }

    // Only send to users who are INACTIVE (haven't paid)
    if (user.subscriptionStatus !== "INACTIVE") {
      return NextResponse.json({
        error: "User is not in abandoned cart state",
        status: user.subscriptionStatus,
      }, { status: 400 });
    }

    // Generate discount code if requested
    let discountCode: string | undefined;
    let discountAmount: number | undefined;

    if (includeDiscount) {
      discountCode = `COMEBACK${user.id.slice(-6).toUpperCase()}`;
      discountAmount = 50;
    }

    // Build resume URL
    const baseUrl = process.env.NEXTAUTH_URL || "https://sanative.com.au";
    const resumeUrl = `${baseUrl}/weight-management/assessment?resume=true&user=${user.id}`;

    // Generate email content with userId for unsubscribe link
    const { subject, html } = getAbandonedCartEmail({
      firstName: user.firstName || "there",
      program: user.subscriptionTier || "weight_management",
      userId: user.id,
      discountCode,
      discountAmount,
      resumeUrl,
    });

    // Send email
    await sendEmail({
      to: user.email,
      subject,
      body: html,
    });

    // Log the automation
    await prisma.automationLog.create({
      data: {
        userId: user.id,
        automationType: "abandoned_cart_recovery",
        triggerEvent: "manual_send",
        channel: "email",
        status: "completed",
        metadata: {
          discountCode,
          discountAmount,
        },
      },
    }).catch(console.error);

    return NextResponse.json({
      success: true,
      message: `Abandoned cart email sent to ${user.email}`,
      discountCode,
    });
  } catch (error) {
    console.error("Error sending abandoned cart email:", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}

// GET /api/email/abandoned-cart - Get list of users eligible for recovery emails
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const hoursAgo = parseInt(searchParams.get("hoursAgo") || "24");

    // Find users who:
    // 1. Have INACTIVE subscription status
    // 2. Have a subscription tier (started a program)
    // 3. Created more than X hours ago (give them time to complete)
    // 4. Haven't received a recovery email recently (check automation logs)
    // 5. Haven't unsubscribed from marketing emails

    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - hoursAgo);

    const eligibleUsers = await prisma.user.findMany({
      where: {
        subscriptionStatus: "INACTIVE",
        subscriptionTier: { not: null },
        createdAt: { lt: cutoffDate },
        unsubscribedAt: null, // Exclude unsubscribed users
        // Exclude users who received recovery email in last 7 days
        NOT: {
          automationLogs: {
            some: {
              automationType: "abandoned_cart_recovery",
              createdAt: {
                gt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
              },
            },
          },
        },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        subscriptionTier: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({
      count: eligibleUsers.length,
      users: eligibleUsers,
    });
  } catch (error) {
    console.error("Error fetching abandoned cart users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
