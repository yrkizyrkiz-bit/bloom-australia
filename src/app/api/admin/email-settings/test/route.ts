import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-clinical-staff";
import { getEmailTransportInfo, sendEmail } from "@/lib/email";
import { isEmailProcessKey } from "@/lib/email-process";

export async function POST(req: NextRequest) {
  const staff = await requireAdmin();
  if ("error" in staff) return staff.error;

  const body = await req.json().catch(() => null);
  const to = typeof body?.to === "string" ? body.to.trim() : "";
  const processKey = typeof body?.process === "string" ? body.process : "auth";

  if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    return NextResponse.json({ error: "A valid test recipient is required" }, { status: 400 });
  }
  if (!isEmailProcessKey(processKey)) {
    return NextResponse.json({ error: "Unknown email process" }, { status: 400 });
  }

  const transport = getEmailTransportInfo();
  const result = await sendEmail({
    to,
    process: processKey,
    subject: `Sanative test email (${processKey})`,
    body: `
      <p>This is a test email from Sanative admin.</p>
      <p>Process: <strong>${processKey}</strong></p>
      <p>Transport: <strong>${transport.transport}</strong></p>
      <p>If you received this, outbound mail for this process is working.</p>
    `,
  });

  if (!result.success) {
    return NextResponse.json(
      { success: false, error: result.error || "Send failed", transport: transport.transport },
      { status: 502 }
    );
  }

  return NextResponse.json({
    success: true,
    messageId: result.messageId,
    transport: transport.transport,
  });
}
