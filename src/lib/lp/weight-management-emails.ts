import { SANATIVE_LEGAL } from "@/lib/legal/constants";
import { HOW_IT_WORKS_STEPS, PRICING } from "@/lib/lp/weight-management";
import { formatAppointmentSydney } from "@/lib/lp/weight-management-funnel";

export type LpWmEmailPayload = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  appointmentStart: string;
  paymentIntentId: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function wrapEmail(content: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sanative</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #fdfbf7;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          <tr>
            <td style="padding: 32px 40px; background-color: #04342C;">
              <h1 style="margin: 0; font-family: Georgia, serif; font-size: 28px; color: #ffffff; font-weight: normal;">sanative</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              ${content}
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 40px; background-color: #fdfbf7; border-top: 1px solid #e6ebe3;">
              <p style="margin: 0; font-size: 12px; color: #5c7a52;">
                &copy; ${new Date().getFullYear()} Sanative. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export function lpWmWelcomeEmail(data: LpWmEmailPayload): {
  subject: string;
  html: string;
  text: string;
} {
  const when = formatAppointmentSydney(data.appointmentStart);
  const firstName = escapeHtml(data.firstName);
  const nextSteps = HOW_IT_WORKS_STEPS.slice(1);
  const stepsHtml = nextSteps
    .map((step, i) => {
      const last = i === nextSteps.length - 1;
      return `
      <tr>
        <td valign="top" width="28" style="padding: 0 12px ${last ? "0" : "20px"} 0; font-size: 16px; font-weight: 600; line-height: 1.4; color: #34412f;">${i + 1}.</td>
        <td valign="top" style="padding: 0 0 ${last ? "0" : "20px"} 0;">
          <p style="margin: 0 0 4px 0; font-size: 16px; font-weight: 600; line-height: 1.4; color: #34412f;">${escapeHtml(step.title)}</p>
          <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #5c7a52;">${escapeHtml(step.body)}</p>
        </td>
      </tr>`;
    })
    .join("");
  const stepsText = nextSteps
    .map((step, i) => `${i + 1}. ${step.title}\n   ${step.body}`)
    .join("\n\n");
  const content = `
    <h2 style="margin: 0 0 16px 0; font-size: 24px; color: #34412f; font-family: Georgia, serif;">Welcome, ${firstName}</h2>
    <p style="margin: 0 0 16px 0; font-size: 16px; color: #5c7a52; line-height: 1.6;">
      Your phone consult is booked for <strong style="color: #34412f;">${escapeHtml(when)}</strong> (Sydney time).
    </p>
    <p style="margin: 0 0 16px 0; font-size: 16px; color: #5c7a52; line-height: 1.6;">
      A care partner will be in touch to confirm details.
    </p>
    <p style="margin: 0 0 20px 0; font-size: 16px; color: #5c7a52; line-height: 1.6;">
      Congratulations on completing the first step in your weight loss journey. Here are the next steps in order.
    </p>
    <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 24px 0;">${stepsHtml}</table>
    <p style="margin: 0 0 24px 0; font-size: 14px; color: #5c7a52; line-height: 1.6;">
      Questions? Email ${SANATIVE_LEGAL.supportEmail}.
    </p>
    <p style="margin: 0; font-size: 16px; color: #5c7a52; line-height: 1.6;">
      Kind regards,<br>
      Your Sanative Care Team
    </p>
  `;

  return {
    subject: `Your Sanative assessment is booked, ${data.firstName}`,
    html: wrapEmail(content),
    text: [
      `Welcome, ${data.firstName}`,
      "",
      `Your phone consult is booked for ${when} (Sydney time).`,
      "A care partner will be in touch to confirm details.",
      "",
      "Congratulations on completing the first step in your weight loss journey. Here are the next steps in order.",
      "",
      stepsText,
      "",
      `Questions? Email ${SANATIVE_LEGAL.supportEmail}.`,
      "",
      "Kind regards,",
      "Your Sanative Care Team",
    ].join("\n"),
  };
}

export function lpWmStaffNotificationEmail(data: LpWmEmailPayload): {
  subject: string;
  html: string;
  text: string;
} {
  const when = formatAppointmentSydney(data.appointmentStart);
  const name = `${data.firstName} ${data.lastName}`.trim();
  const rows = [
    ["Name", name],
    ["Email", data.email],
    ["Phone", data.phone],
    ["Consult", when],
    ["Payment", data.paymentIntentId],
    ["Amount", `$${PRICING.assessmentFee} AUD`],
  ];
  const htmlRows = rows
    .map(
      ([label, value]) =>
        `<tr>
          <td style="padding: 8px 0; color: #5c7a52; font-size: 14px; width: 120px;">${escapeHtml(label)}</td>
          <td style="padding: 8px 0; color: #34412f; font-size: 14px;">${escapeHtml(value)}</td>
        </tr>`
    )
    .join("");

  const content = `
    <h2 style="margin: 0 0 16px 0; font-size: 22px; color: #34412f; font-family: Georgia, serif;">New LP weight-management lead</h2>
    <p style="margin: 0 0 16px 0; font-size: 15px; color: #5c7a52; line-height: 1.6;">
      Paid $${PRICING.assessmentFee} guest assessment. Stored in to_process — no account created.
    </p>
    <table role="presentation" style="width: 100%; border-collapse: collapse;">${htmlRows}</table>
  `;

  return {
    subject: `LP weight management · ${name} · ${when}`,
    html: wrapEmail(content),
    text: [
      "New LP weight-management lead",
      "Paid guest assessment. Stored in to_process — no account created.",
      "",
      ...rows.map(([label, value]) => `${label}: ${value}`),
    ].join("\n"),
  };
}

export const LP_WM_STAFF_INBOX = SANATIVE_LEGAL.supportEmail;
