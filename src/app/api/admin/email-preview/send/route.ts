import { NextRequest, NextResponse } from "next/server";
import { requireClinicalStaff } from "@/lib/auth/require-clinical-staff";
import { sendEmail } from "@/lib/email";
import { renderPreviewTemplate } from "@/lib/email/render-preview-template";

export async function POST(req: NextRequest) {
  try {
    const staff = await requireClinicalStaff();
    if ("error" in staff) {
      return staff.error;
    }

    const { to, templateId, data } = await req.json();
    const recipient = typeof to === "string" ? to.trim() : "";

    if (!recipient || !recipient.includes("@")) {
      return NextResponse.json(
        { success: false, error: "Enter an email address" },
        { status: 400 }
      );
    }

    if (!templateId || !data) {
      return NextResponse.json(
        { success: false, error: "Choose a template first" },
        { status: 400 }
      );
    }

    const template = renderPreviewTemplate(templateId, data);
    if (!template) {
      return NextResponse.json(
        { success: false, error: "Unknown template" },
        { status: 400 }
      );
    }

    const result = await sendEmail({
      to: recipient,
      subject: template.subject,
      body: template.html,
      text: template.text,
      process: "crm",
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Failed to send email" },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      subject: template.subject,
      messageId: result.messageId,
    });
  } catch (error) {
    console.error("Email template send error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send email" },
      { status: 500 }
    );
  }
}
