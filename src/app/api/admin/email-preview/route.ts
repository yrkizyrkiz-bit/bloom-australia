import { NextRequest, NextResponse } from "next/server";
import { requireClinicalStaff } from "@/lib/auth/require-clinical-staff";
import { renderPreviewTemplate } from "@/lib/email/render-preview-template";

export async function POST(req: NextRequest) {
  try {
    const staff = await requireClinicalStaff();
    if ("error" in staff) {
      return staff.error;
    }

    const { templateId, data } = await req.json();

    if (!templateId || !data) {
      return NextResponse.json(
        { error: "Missing templateId or data" },
        { status: 400 }
      );
    }

    const template = renderPreviewTemplate(templateId, data);
    if (!template) {
      return NextResponse.json({ error: "Unknown template" }, { status: 400 });
    }

    return NextResponse.json({
      html: template.html,
      subject: template.subject,
      text: template.text,
    });
  } catch (error) {
    console.error("Email preview error:", error);
    return NextResponse.json(
      { error: "Failed to generate preview" },
      { status: 500 }
    );
  }
}
