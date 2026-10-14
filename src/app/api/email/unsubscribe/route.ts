import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveAppBaseUrl } from "@/lib/app-base-url";
import { verifyUnsubscribeToken } from "@/lib/email/unsubscribe-token";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// GET /api/email/unsubscribe?token=signedOpaqueToken
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return new Response(
        generateHTML("Invalid Link", "The unsubscribe link is invalid or has expired."),
        { headers: { "Content-Type": "text/html; charset=utf-8" } }
      );
    }

    const userId = verifyUnsubscribeToken(token);
    if (!userId) {
      return new Response(
        generateHTML("Invalid Link", "The unsubscribe link is invalid or has expired."),
        { headers: { "Content-Type": "text/html; charset=utf-8" } }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, firstName: true },
    });

    if (!user) {
      return new Response(
        generateHTML("User Not Found", "We couldn't find your account. You may have already been unsubscribed."),
        { headers: { "Content-Type": "text/html; charset=utf-8" } }
      );
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        marketingOptIn: false,
        unsubscribedAt: new Date(),
      },
    });

    await prisma.automationLog.create({
      data: {
        userId: user.id,
        automationType: "email_unsubscribe",
        triggerEvent: "user_click",
        channel: "email",
        status: "completed",
        metadata: { email: user.email },
      },
    }).catch(console.error);

    const baseUrl = resolveAppBaseUrl({ request });
    const firstName = escapeHtml(user.firstName || "there");
    const settingsUrl = escapeHtml(`${baseUrl}/dashboard/settings`);

    return new Response(
      generateHTML(
        "You've Been Unsubscribed",
        `<p>Hi ${firstName},</p>
         <p>You have been successfully unsubscribed from Sanative marketing emails.</p>
         <p>You will still receive important account and transactional emails related to your health program.</p>
         <p style="margin-top: 24px; color: #666; font-size: 14px;">
           Changed your mind? You can update your email preferences anytime in your
           <a href="${settingsUrl}" style="color: #059669;">account settings</a>.
         </p>`
      ),
      { headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  } catch (error) {
    console.error("Unsubscribe error:", error);
    return new Response(
      generateHTML("Something Went Wrong", "We encountered an error processing your request. Please try again or contact support."),
      { headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }
}

function generateHTML(title: string, content: string): string {
  const safeTitle = escapeHtml(title);
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${safeTitle} - Sanative</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f5f5f5;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 12px;
      padding: 48px;
      max-width: 480px;
      text-align: center;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    .logo {
      font-family: Georgia, serif;
      font-size: 28px;
      color: #2c3628;
      margin-bottom: 32px;
    }
    h1 {
      font-size: 24px;
      color: #1a1a1a;
      margin-bottom: 16px;
    }
    p {
      color: #666;
      line-height: 1.6;
      margin-bottom: 12px;
    }
    a {
      color: #059669;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">sanative</div>
    <h1>${safeTitle}</h1>
    <div>${content}</div>
  </div>
</body>
</html>
  `;
}
