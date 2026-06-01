import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/email/status - Check email configuration status
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sendgridApiKey = process.env.SENDGRID_API_KEY;
    const fromEmail = process.env.EMAIL_FROM || "noreply@sanative.com.au";
    const fromName = process.env.EMAIL_FROM_NAME || "Sanative Health";

    const isConfigured = !!sendgridApiKey && sendgridApiKey.startsWith("SG.");

    return NextResponse.json({
      configured: isConfigured,
      mode: isConfigured ? "sendgrid" : "simulation",
      fromEmail,
      fromName,
      message: isConfigured
        ? "SendGrid is configured. Emails will be delivered."
        : "SendGrid not configured. Emails will be simulated (logged to console).",
      setupInstructions: !isConfigured ? {
        steps: [
          "1. Create a free SendGrid account at https://sendgrid.com/free/",
          "2. Verify your sender email address",
          "3. Create an API key with Mail Send permission",
          "4. Add SENDGRID_API_KEY to your .env file",
          "5. Restart the development server"
        ],
        envExample: 'SENDGRID_API_KEY="SG.your-api-key-here"'
      } : null
    });
  } catch (error) {
    console.error("Error checking email status:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
