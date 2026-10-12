import {
  clinicWelcomeEmail,
  patientWelcomeEmail,
  resultsReadyEmail,
  checkInReminderEmail,
  gpVisitReminderEmail,
  gpEnrolmentNotificationEmail,
  gpBiomarkerAlertEmail,
  orderConfirmationEmail,
  type EmailTemplate,
} from "@/lib/email-templates";

export function renderPreviewTemplate(
  templateId: string,
  data: Record<string, string | undefined>
): EmailTemplate | null {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://sanative.com.au";

  switch (templateId) {
    case "order_confirmation":
      return orderConfirmationEmail({
        firstName: data.firstName || "Customer",
        program: data.program || "Weight Management",
        orderDate: data.orderDate || new Date().toLocaleDateString("en-AU"),
        originalAmount: parseFloat(data.originalAmount || "") || 49,
        discountAmount: 0,
        finalAmount: parseFloat(data.finalAmount || "") || 49,
        dashboardUrl: `${baseUrl}/dashboard`,
      });

    case "order_confirmation_discount":
      return orderConfirmationEmail({
        firstName: data.firstName || "Customer",
        program: data.program || "Weight Management",
        orderDate: data.orderDate || new Date().toLocaleDateString("en-AU"),
        originalAmount: parseFloat(data.originalAmount || "") || 49,
        discountAmount: parseFloat(data.discountAmount || "") || 50,
        discountType: data.discountType || "new_member_promotion",
        finalAmount: parseFloat(data.finalAmount || "") || 0,
        dashboardUrl: `${baseUrl}/dashboard`,
      });

    case "patient_welcome":
      return patientWelcomeEmail({
        firstName: data.firstName || "Patient",
        lastName: data.lastName || "",
        program: data.program || "Weight Management",
        carePartnerName: data.carePartnerName || "Mia",
        loginUrl: `${baseUrl}/dashboard`,
      });

    case "clinic_welcome":
      return clinicWelcomeEmail({
        clinicName: data.clinicName || "Sample Clinic",
        gpName: data.gpName || "Dr. Smith",
        qrToken: data.qrToken || "ABC12345",
        qrUrl: `${baseUrl}/join?clinic=${data.qrToken || "ABC12345"}`,
        loginUrl: `${baseUrl}/gp/login`,
      });

    case "results_ready":
      return resultsReadyEmail({
        firstName: data.firstName || "Patient",
        program: data.program || "Weight Management",
        carePartnerName: data.carePartnerName || "Sarah",
        resultsUrl: `${baseUrl}/dashboard/results`,
      });

    case "check_in_reminder":
      return checkInReminderEmail({
        firstName: data.firstName || "Patient",
        carePartnerName: data.carePartnerName || "Mia",
        checkInType: data.checkInType || "Weekly Check-in",
        scheduledDate: data.scheduledDate || "Monday",
        dashboardUrl: `${baseUrl}/dashboard/messages`,
      });

    case "gp_visit_reminder":
      return gpVisitReminderEmail({
        firstName: data.firstName || "Patient",
        clinicName: data.clinicName || "Sample Clinic",
        gpName: data.gpName || "Dr. Smith",
        visitDate: data.visitDate || "Tomorrow",
        visitTime: data.visitTime,
      });

    case "gp_enrolment":
      return gpEnrolmentNotificationEmail({
        gpName: data.gpName || "Dr. Smith",
        clinicName: data.clinicName || "Sample Clinic",
        patientName: data.patientName || "John Doe",
        program: data.program || "Weight Management",
        enrolledAt: data.enrolledAt || new Date().toLocaleDateString("en-AU"),
        dashboardUrl: `${baseUrl}/gp/dashboard`,
      });

    case "gp_biomarker_alert":
      return gpBiomarkerAlertEmail({
        gpName: data.gpName || "Dr. Smith",
        clinicName: data.clinicName || "Sample Clinic",
        patientName: data.patientName || "John Doe",
        biomarkerName: data.biomarkerName || "HbA1c",
        value: data.value || "7.5",
        unit: data.unit || "%",
        status: data.status || "HIGH",
        dashboardUrl: `${baseUrl}/gp/dashboard`,
      });

    default:
      return null;
  }
}
