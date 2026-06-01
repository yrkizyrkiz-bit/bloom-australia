// Email Templates for Sanative Health GP Referral System

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

interface ClinicWelcomeData {
  clinicName: string;
  gpName: string;
  qrToken: string;
  qrUrl: string;
  loginUrl: string;
}

interface PatientWelcomeData {
  firstName: string;
  lastName: string;
  program: string;
  carePartnerName: string;
  loginUrl: string;
}

interface ResultsReadyData {
  firstName: string;
  program: string;
  resultsUrl: string;
  carePartnerName: string;
}

interface GpEnrolmentNotificationData {
  gpName: string;
  clinicName: string;
  patientName: string;
  program: string;
  enrolledAt: string;
  dashboardUrl: string;
}

interface GpBiomarkerAlertData {
  gpName: string;
  clinicName: string;
  patientName: string;
  biomarkerName: string;
  value: string;
  unit: string;
  status: string;
  dashboardUrl: string;
}

interface CheckInReminderData {
  firstName: string;
  carePartnerName: string;
  checkInType: string;
  scheduledDate: string;
  dashboardUrl: string;
}

interface GpVisitReminderData {
  firstName: string;
  clinicName: string;
  gpName: string;
  visitDate: string;
  visitTime?: string;
}

// Base email wrapper
function wrapEmail(content: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sanative Health</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #fdfbf7;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 40px; background-color: #04342C;">
              <h1 style="margin: 0; font-family: Georgia, serif; font-size: 28px; color: #ffffff; font-weight: normal;">sanative</h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #fdfbf7; border-top: 1px solid #e6ebe3;">
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #5c7a52;">
                AHPRA Registered &bull; NATA-accredited labs &bull; Australian Privacy Act compliant
              </p>
              <p style="margin: 0; font-size: 12px; color: #5c7a52;">
                &copy; ${new Date().getFullYear()} Sanative Health Pty Ltd. All rights reserved.
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

// Button component
function emailButton(text: string, url: string, primary = true): string {
  const bgColor = primary ? "#1D9E75" : "#ffffff";
  const textColor = primary ? "#ffffff" : "#1D9E75";
  const border = primary ? "none" : "2px solid #1D9E75";

  return `
    <a href="${url}" style="display: inline-block; padding: 14px 28px; background-color: ${bgColor}; color: ${textColor}; text-decoration: none; font-weight: 600; border-radius: 9999px; border: ${border}; font-size: 14px;">${text}</a>
  `;
}

// ============================================
// CLINIC EMAIL TEMPLATES
// ============================================

export function clinicWelcomeEmail(data: ClinicWelcomeData): EmailTemplate {
  const content = `
    <h2 style="margin: 0 0 16px 0; font-size: 24px; color: #34412f; font-family: Georgia, serif;">Welcome to Sanative, ${data.gpName}</h2>

    <p style="margin: 0 0 24px 0; font-size: 16px; color: #5c7a52; line-height: 1.6;">
      Your clinic <strong style="color: #34412f;">${data.clinicName}</strong> has been registered. You can now start referring patients to our supervised health programs.
    </p>

    <div style="background-color: #fdfbf7; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
      <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #34412f;">Your QR Code is ready</h3>
      <p style="margin: 0 0 16px 0; font-size: 14px; color: #5c7a52;">
        Display this code in your waiting room. Patients scan it to self-enrol in your recommended program.
      </p>
      <p style="margin: 0; font-size: 12px; color: #1D9E75;">
        <strong>Token:</strong> ${data.qrToken}
      </p>
    </div>

    <div style="text-align: center; margin-bottom: 24px;">
      ${emailButton("Access your dashboard", data.loginUrl)}
    </div>

    <div style="border-top: 1px solid #e6ebe3; padding-top: 24px;">
      <h4 style="margin: 0 0 12px 0; font-size: 14px; color: #34412f;">What's next?</h4>
      <ul style="margin: 0; padding-left: 20px; color: #5c7a52; font-size: 14px; line-height: 1.8;">
        <li>Log in to download your A5 poster and desk card</li>
        <li>Place materials in your waiting room</li>
        <li>Patients scan and self-enrol</li>
        <li>You receive notifications when patients join</li>
      </ul>
    </div>
  `;

  return {
    subject: `Welcome to Sanative Health, ${data.gpName}`,
    html: wrapEmail(content),
    text: `Welcome to Sanative, ${data.gpName}!\n\nYour clinic ${data.clinicName} has been registered. You can now start referring patients to our supervised health programs.\n\nYour QR Token: ${data.qrToken}\n\nAccess your dashboard: ${data.loginUrl}`,
  };
}

// ============================================
// PATIENT EMAIL TEMPLATES
// ============================================

export function patientWelcomeEmail(data: PatientWelcomeData): EmailTemplate {
  const content = `
    <h2 style="margin: 0 0 16px 0; font-size: 24px; color: #34412f; font-family: Georgia, serif;">Welcome to Sanative, ${data.firstName}</h2>

    <p style="margin: 0 0 24px 0; font-size: 16px; color: #5c7a52; line-height: 1.6;">
      You're now enrolled in the <strong style="color: #1D9E75;">${data.program}</strong> program. We're excited to help you take control of your health.
    </p>

    <div style="background-color: #fdfbf7; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
      <h3 style="margin: 0 0 8px 0; font-size: 16px; color: #34412f;">Your care partner</h3>
      <p style="margin: 0; font-size: 14px; color: #5c7a52;">
        <strong style="color: #34412f;">${data.carePartnerName}</strong> will be in touch within 24 hours to welcome you and answer any questions.
      </p>
    </div>

    <div style="text-align: center; margin-bottom: 24px;">
      ${emailButton("Go to your dashboard", data.loginUrl)}
    </div>

    <div style="border-top: 1px solid #e6ebe3; padding-top: 24px;">
      <h4 style="margin: 0 0 12px 0; font-size: 14px; color: #34412f;">What's included in your membership:</h4>
      <ul style="margin: 0; padding-left: 20px; color: #5c7a52; font-size: 14px; line-height: 1.8;">
        <li>80+ biomarker panel at NATA-accredited labs</li>
        <li>Biological Clock &amp; organ health scores</li>
        <li>Care partner support between GP visits</li>
        <li>Personalised health insights</li>
      </ul>
    </div>
  `;

  return {
    subject: `Welcome to your ${data.program} program, ${data.firstName}`,
    html: wrapEmail(content),
    text: `Welcome to Sanative, ${data.firstName}!\n\nYou're now enrolled in the ${data.program} program.\n\nYour care partner ${data.carePartnerName} will be in touch within 24 hours.\n\nGo to your dashboard: ${data.loginUrl}`,
  };
}

export function resultsReadyEmail(data: ResultsReadyData): EmailTemplate {
  const content = `
    <h2 style="margin: 0 0 16px 0; font-size: 24px; color: #34412f; font-family: Georgia, serif;">Your results are ready, ${data.firstName}</h2>

    <p style="margin: 0 0 24px 0; font-size: 16px; color: #5c7a52; line-height: 1.6;">
      Great news! Your biomarker results from your ${data.program} panel have been uploaded to your dashboard.
    </p>

    <div style="background-color: #1D9E75; border-radius: 12px; padding: 24px; margin-bottom: 24px; text-align: center;">
      <p style="margin: 0 0 16px 0; font-size: 18px; color: #ffffff; font-weight: 600;">
        View your full results
      </p>
      <a href="${data.resultsUrl}" style="display: inline-block; padding: 14px 28px; background-color: #ffffff; color: #1D9E75; text-decoration: none; font-weight: 600; border-radius: 9999px; font-size: 14px;">See my results</a>
    </div>

    <div style="background-color: #fdfbf7; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
      <p style="margin: 0; font-size: 14px; color: #5c7a52;">
        <strong style="color: #34412f;">${data.carePartnerName}</strong> has reviewed your results and will reach out to discuss anything that needs attention.
      </p>
    </div>
  `;

  return {
    subject: `Your biomarker results are ready, ${data.firstName}`,
    html: wrapEmail(content),
    text: `Your results are ready, ${data.firstName}!\n\nYour biomarker results from your ${data.program} panel have been uploaded.\n\nView your results: ${data.resultsUrl}\n\n${data.carePartnerName} has reviewed your results and will reach out to discuss.`,
  };
}

export function checkInReminderEmail(data: CheckInReminderData): EmailTemplate {
  const content = `
    <h2 style="margin: 0 0 16px 0; font-size: 24px; color: #34412f; font-family: Georgia, serif;">Time for your ${data.checkInType.toLowerCase()}, ${data.firstName}</h2>

    <p style="margin: 0 0 24px 0; font-size: 16px; color: #5c7a52; line-height: 1.6;">
      Your care partner <strong style="color: #34412f;">${data.carePartnerName}</strong> has scheduled a check-in for <strong style="color: #1D9E75;">${data.scheduledDate}</strong>.
    </p>

    <div style="text-align: center; margin-bottom: 24px;">
      ${emailButton("Go to messages", data.dashboardUrl)}
    </div>

    <p style="margin: 0; font-size: 14px; color: #5c7a52;">
      If you need to reschedule, just send ${data.carePartnerName} a message through your dashboard.
    </p>
  `;

  return {
    subject: `Check-in reminder: ${data.scheduledDate}`,
    html: wrapEmail(content),
    text: `Time for your ${data.checkInType.toLowerCase()}, ${data.firstName}!\n\nYour care partner ${data.carePartnerName} has scheduled a check-in for ${data.scheduledDate}.\n\nGo to messages: ${data.dashboardUrl}`,
  };
}

export function gpVisitReminderEmail(data: GpVisitReminderData): EmailTemplate {
  const content = `
    <h2 style="margin: 0 0 16px 0; font-size: 24px; color: #34412f; font-family: Georgia, serif;">GP visit reminder, ${data.firstName}</h2>

    <p style="margin: 0 0 24px 0; font-size: 16px; color: #5c7a52; line-height: 1.6;">
      You have an upcoming consultation with your GP:
    </p>

    <div style="background-color: #fdfbf7; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
      <p style="margin: 0 0 8px 0; font-size: 14px; color: #5c7a52;">
        <strong style="color: #34412f;">Clinic:</strong> ${data.clinicName}
      </p>
      <p style="margin: 0 0 8px 0; font-size: 14px; color: #5c7a52;">
        <strong style="color: #34412f;">GP:</strong> ${data.gpName}
      </p>
      <p style="margin: 0; font-size: 14px; color: #5c7a52;">
        <strong style="color: #34412f;">Date:</strong> ${data.visitDate}${data.visitTime ? ` at ${data.visitTime}` : ""}
      </p>
    </div>

    <p style="margin: 0; font-size: 14px; color: #5c7a52;">
      Your latest biomarker results will be available to your GP during this consultation.
    </p>
  `;

  return {
    subject: `GP visit reminder: ${data.visitDate}`,
    html: wrapEmail(content),
    text: `GP visit reminder, ${data.firstName}!\n\nClinic: ${data.clinicName}\nGP: ${data.gpName}\nDate: ${data.visitDate}${data.visitTime ? ` at ${data.visitTime}` : ""}\n\nYour latest biomarker results will be available to your GP.`,
  };
}

// ============================================
// GP NOTIFICATION TEMPLATES
// ============================================

export function gpEnrolmentNotificationEmail(data: GpEnrolmentNotificationData): EmailTemplate {
  const content = `
    <h2 style="margin: 0 0 16px 0; font-size: 24px; color: #34412f; font-family: Georgia, serif;">New patient enrolled</h2>

    <p style="margin: 0 0 24px 0; font-size: 16px; color: #5c7a52; line-height: 1.6;">
      A new patient has enrolled via your clinic's QR code:
    </p>

    <div style="background-color: #fdfbf7; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
      <p style="margin: 0 0 8px 0; font-size: 14px; color: #5c7a52;">
        <strong style="color: #34412f;">Patient:</strong> ${data.patientName}
      </p>
      <p style="margin: 0 0 8px 0; font-size: 14px; color: #5c7a52;">
        <strong style="color: #34412f;">Program:</strong> ${data.program}
      </p>
      <p style="margin: 0; font-size: 14px; color: #5c7a52;">
        <strong style="color: #34412f;">Enrolled:</strong> ${data.enrolledAt}
      </p>
    </div>

    <div style="text-align: center; margin-bottom: 24px;">
      ${emailButton("View in dashboard", data.dashboardUrl)}
    </div>

    <p style="margin: 0; font-size: 14px; color: #5c7a52;">
      A care partner has been assigned and will coordinate their first biomarker test.
    </p>
  `;

  return {
    subject: `New patient enrolled: ${data.patientName} — ${data.program}`,
    html: wrapEmail(content),
    text: `New patient enrolled!\n\nPatient: ${data.patientName}\nProgram: ${data.program}\nEnrolled: ${data.enrolledAt}\n\nView in dashboard: ${data.dashboardUrl}`,
  };
}

export function gpBiomarkerAlertEmail(data: GpBiomarkerAlertData): EmailTemplate {
  const alertColor = data.status === "ELEVATED" || data.status === "LOW" ? "#dc2626" : "#f59e0b";

  const content = `
    <h2 style="margin: 0 0 16px 0; font-size: 24px; color: #34412f; font-family: Georgia, serif;">Biomarker alert</h2>

    <p style="margin: 0 0 24px 0; font-size: 16px; color: #5c7a52; line-height: 1.6;">
      A patient has a flagged biomarker result that may require your attention:
    </p>

    <div style="background-color: #fef2f2; border-left: 4px solid ${alertColor}; border-radius: 0 12px 12px 0; padding: 24px; margin-bottom: 24px;">
      <p style="margin: 0 0 8px 0; font-size: 14px; color: #5c7a52;">
        <strong style="color: #34412f;">Patient:</strong> ${data.patientName}
      </p>
      <p style="margin: 0 0 8px 0; font-size: 14px; color: #5c7a52;">
        <strong style="color: #34412f;">Biomarker:</strong> ${data.biomarkerName}
      </p>
      <p style="margin: 0 0 8px 0; font-size: 14px; color: #5c7a52;">
        <strong style="color: #34412f;">Result:</strong> ${data.value} ${data.unit}
      </p>
      <p style="margin: 0; font-size: 14px; color: ${alertColor}; font-weight: 600;">
        Status: ${data.status}
      </p>
    </div>

    <div style="text-align: center; margin-bottom: 24px;">
      ${emailButton("View patient details", data.dashboardUrl)}
    </div>
  `;

  return {
    subject: `Biomarker alert: ${data.patientName} — ${data.biomarkerName} ${data.status.toLowerCase()}`,
    html: wrapEmail(content),
    text: `Biomarker alert!\n\nPatient: ${data.patientName}\nBiomarker: ${data.biomarkerName}\nResult: ${data.value} ${data.unit}\nStatus: ${data.status}\n\nView patient details: ${data.dashboardUrl}`,
  };
}

// ============================================
// ORDER CONFIRMATION EMAIL
// ============================================

interface OrderConfirmationData {
  firstName: string;
  program: string;
  orderDate: string;
  originalAmount: number;
  discountAmount: number;
  discountType?: string;
  finalAmount: number;
  dashboardUrl: string;
}

export function orderConfirmationEmail(data: OrderConfirmationData): EmailTemplate {
  const hasDiscount = data.discountAmount > 0;
  const discountLabel = data.discountType === 'new_member_promotion' ? 'New Member Promotion' : 'Discount';

  const discountSection = hasDiscount ? `
    <tr>
      <td style="padding: 8px 0; font-size: 14px; color: #22c55e;">
        ${discountLabel}
      </td>
      <td style="padding: 8px 0; font-size: 14px; color: #22c55e; text-align: right;">
        -${data.discountAmount.toFixed(2)}
      </td>
    </tr>
  ` : '';

  const content = `
    <h2 style="margin: 0 0 16px 0; font-size: 24px; color: #34412f; font-family: Georgia, serif;">Thank you for your order, ${data.firstName}!</h2>

    <p style="margin: 0 0 24px 0; font-size: 16px; color: #5c7a52; line-height: 1.6;">
      Your payment has been confirmed. Welcome to the <strong style="color: #1D9E75;">${data.program}</strong> program.
    </p>

    <div style="background-color: #fdfbf7; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
      <h3 style="margin: 0 0 16px 0; font-size: 16px; color: #34412f;">Order Summary</h3>

      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; font-size: 14px; color: #5c7a52;">
            ${data.program} Consultation
          </td>
          <td style="padding: 8px 0; font-size: 14px; color: #5c7a52; text-align: right;">
            ${data.originalAmount.toFixed(2)}
          </td>
        </tr>
        ${discountSection}
        <tr style="border-top: 1px solid #e6ebe3;">
          <td style="padding: 12px 0 0 0; font-size: 16px; color: #34412f; font-weight: 600;">
            Total Paid
          </td>
          <td style="padding: 12px 0 0 0; font-size: 16px; color: #1D9E75; text-align: right; font-weight: 600;">
            ${data.finalAmount.toFixed(2)} AUD
          </td>
        </tr>
      </table>

      <p style="margin: 16px 0 0 0; font-size: 12px; color: #7e9a72;">
        Order date: ${data.orderDate}
      </p>
    </div>

    ${hasDiscount ? `
    <div style="background-color: #dcfce7; border-radius: 12px; padding: 16px; margin-bottom: 24px; border: 1px solid #bbf7d0;">
      <p style="margin: 0; font-size: 14px; color: #166534;">
        🎉 <strong>You saved ${data.discountAmount.toFixed(2)}</strong> with the ${discountLabel}!
      </p>
    </div>
    ` : ''}

    <div style="text-align: center; margin-bottom: 24px;">
      ${emailButton("Go to your dashboard", data.dashboardUrl)}
    </div>

    <div style="border-top: 1px solid #e6ebe3; padding-top: 24px;">
      <h4 style="margin: 0 0 12px 0; font-size: 14px; color: #34412f;">What's next?</h4>
      <ul style="margin: 0; padding-left: 20px; color: #5c7a52; font-size: 14px; line-height: 1.8;">
        <li>Your care partner will be in touch within 24 hours</li>
        <li>Complete your health profile in the dashboard</li>
        <li>Book your pathology collection appointment</li>
        <li>Your doctor will review your results and create your plan</li>
      </ul>
    </div>
  `;

  return {
    subject: `Order confirmed — Welcome to ${data.program}`,
    html: wrapEmail(content),
    text: `Thank you for your order, ${data.firstName}!\n\nYour payment has been confirmed. Welcome to the ${data.program} program.\n\nOrder Summary:\n${data.program} Consultation: ${data.originalAmount.toFixed(2)}${hasDiscount ? `\n${discountLabel}: -${data.discountAmount.toFixed(2)}` : ''}\nTotal Paid: ${data.finalAmount.toFixed(2)} AUD\n\nOrder date: ${data.orderDate}${hasDiscount ? `\n\nYou saved ${data.discountAmount.toFixed(2)} with the ${discountLabel}!` : ''}\n\nGo to your dashboard: ${data.dashboardUrl}`,
  };
}

// ============================================
// WEIGHT MANAGEMENT ORDER CONFIRMATION EMAIL
// ============================================

interface WeightManagementOrderData {
  firstName: string;
  lastName: string;
  planName: 'Sanative Core' | 'Sanative Precision';
  consultationDate: string;
  consultationTime: string;
  firstMonthPrice: number;
  discount: number;
  dueToday: number;
  ongoingPrice: number;
  orderDate: string;
  dashboardUrl: string;
}

// GAP-017: Friendlier post-payment email wording
// Avoids: "consultation fee", "membership active", "medication confirmed", "treatment approved"
// Focuses on: doctor assessment, conditional approval, clear refund policy
export function weightManagementOrderConfirmationEmail(data: WeightManagementOrderData): EmailTemplate {
  const isPrecision = data.planName === 'Sanative Precision';
  const planColor = isPrecision ? '#c17a58' : '#5c7a52';

  const content = `
    <h2 style="margin: 0 0 16px 0; font-size: 24px; color: #34412f; font-family: Georgia, serif;">
      Hi ${data.firstName},
    </h2>

    <p style="margin: 0 0 24px 0; font-size: 16px; color: #5c7a52; line-height: 1.6;">
      Welcome to Sanative. We're excited to support you on your doctor-led weight management journey.
    </p>

    <!-- Payment Confirmation -->
    <div style="background-color: #f0fdf4; border-radius: 12px; padding: 16px; margin-bottom: 24px; border: 1px solid #bbf7d0;">
      <p style="margin: 0; font-size: 14px; color: #166534;">
        ✓ We've received your first-month payment of <strong>${data.dueToday.toFixed(0)} AUD</strong>
      </p>
    </div>

    <!-- Consultation Details -->
    <div style="background-color: #fdfbf7; border-radius: 12px; padding: 20px; margin-bottom: 24px; border-left: 4px solid ${planColor};">
      <h3 style="margin: 0 0 8px 0; font-size: 16px; color: #34412f;">Your Phone Consultation is Booked</h3>
      <p style="margin: 0; font-size: 18px; color: #34412f; font-weight: 600;">
        ${data.consultationDate} at ${data.consultationTime}
      </p>
      <p style="margin: 12px 0 0 0; font-size: 13px; color: #7e9a72;">
        You will receive a phone call from your Sanative doctor at the scheduled time.
      </p>
    </div>

    <!-- What Happens During the Call -->
    <div style="margin-bottom: 24px;">
      <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #34412f;">During the call, your doctor will:</h3>
      <ul style="margin: 0; padding-left: 0; list-style: none;">
        <li style="padding: 8px 0; font-size: 14px; color: #5c7a52; display: flex; align-items: flex-start;">
          <span style="color: ${planColor}; margin-right: 10px; font-size: 16px;">•</span>
          Review your health assessment and medical history
        </li>
        <li style="padding: 8px 0; font-size: 14px; color: #5c7a52; display: flex; align-items: flex-start;">
          <span style="color: ${planColor}; margin-right: 10px; font-size: 16px;">•</span>
          Discuss your health goals and any concerns
        </li>
        <li style="padding: 8px 0; font-size: 14px; color: #5c7a52; display: flex; align-items: flex-start;">
          <span style="color: ${planColor}; margin-right: 10px; font-size: 16px;">•</span>
          Confirm whether the program is clinically suitable for you
        </li>
      </ul>
    </div>

    <!-- What Happens Next -->
    <div style="background-color: #f4f7f2; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
      <h3 style="margin: 0 0 12px 0; font-size: 14px; color: #34412f;">What happens after your consultation:</h3>

      <div style="margin-bottom: 16px;">
        <p style="margin: 0 0 4px 0; font-size: 14px; color: #34412f; font-weight: 600;">If approved:</p>
        <p style="margin: 0; font-size: 13px; color: #5c7a52; line-height: 1.5;">
          Our care team will help you get started with your portal, onboarding, treatment if prescribed, and your next steps.
        </p>
      </div>

      <div>
        <p style="margin: 0 0 4px 0; font-size: 14px; color: #34412f; font-weight: 600;">If your doctor determines the program is not suitable:</p>
        <p style="margin: 0; font-size: 13px; color: #5c7a52; line-height: 1.5;">
          Your first-month payment will be refunded.
        </p>
      </div>
    </div>

    <!-- Order Details (simplified) -->
    <div style="background-color: #ffffff; border-radius: 12px; padding: 16px; margin-bottom: 24px; border: 1px solid #e6ebe3;">
      <h4 style="margin: 0 0 12px 0; font-size: 13px; color: #7e9a72; text-transform: uppercase; letter-spacing: 0.5px;">Payment Details</h4>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 4px 0; font-size: 14px; color: #5c7a52;">${data.planName} — First month</td>
          <td style="padding: 4px 0; font-size: 14px; color: #2c3628; text-align: right;">${data.dueToday.toFixed(0)} AUD</td>
        </tr>
      </table>
      <p style="margin: 12px 0 0 0; font-size: 11px; color: #a8bb9e;">
        If approved, ongoing billing of ${data.ongoingPrice.toFixed(0)}/month begins after your first month.
      </p>
    </div>

    <!-- Closing -->
    <div style="text-align: center; margin-bottom: 24px;">
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #5c7a52;">
        We look forward to speaking with you soon.
      </p>
      <p style="margin: 0; font-size: 14px; color: #34412f; font-weight: 600;">
        The Sanative Care Team
      </p>
    </div>

    <!-- CTA -->
    <div style="text-align: center; margin-bottom: 24px;">
      ${emailButton("Access your Sanative portal", data.dashboardUrl)}
    </div>

    <!-- Fine Print -->
    <div style="border-top: 1px solid #e6ebe3; padding-top: 16px;">
      <p style="margin: 0; font-size: 11px; color: #a8bb9e; line-height: 1.6;">
        Treatment is only prescribed where clinically appropriate following your doctor consultation. Blood tests may be requested where clinically indicated. This email confirms your booking — it does not confirm clinical suitability or approval for treatment.
      </p>
    </div>
  `;

  // GAP-017: Updated subject line
  const subject = "Welcome to Sanative — your doctor assessment is booked";

  // Plain text version with GAP-017 compliant wording
  const textContent = `Hi ${data.firstName},

Welcome to Sanative. We're excited to support you on your doctor-led weight management journey.

We've received your first-month payment of ${data.dueToday.toFixed(0)} AUD and your phone consultation with a Sanative doctor is now booked for ${data.consultationDate} at ${data.consultationTime}.

During the call, your doctor will:
• Review your health assessment and medical history
• Discuss your health goals and any concerns
• Confirm whether the program is clinically suitable for you

If approved, our care team will help you get started with your portal, onboarding, treatment if prescribed, and your next steps.

If your doctor determines the program is not suitable, your first-month payment will be refunded.

We look forward to speaking with you soon.

The Sanative Care Team

Access your portal: ${data.dashboardUrl}`;

  return {
    subject,
    html: wrapEmail(content),
    text: textContent,
  };
}
