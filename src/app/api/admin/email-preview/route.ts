import { NextRequest, NextResponse } from "next/server";
import {
  clinicWelcomeEmail,
  patientWelcomeEmail,
  resultsReadyEmail,
  checkInReminderEmail,
  gpVisitReminderEmail,
  gpEnrolmentNotificationEmail,
  gpBiomarkerAlertEmail,
  orderConfirmationEmail,
} from "@/lib/email-templates";

export async function POST(req: NextRequest) {
  try {
    const { templateId, data } = await req.json();

    if (!templateId || !data) {
      return NextResponse.json(
        { error: "Missing templateId or data" },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://sanative.com.au";
    let template;

    switch (templateId) {
      case "order_confirmation":
        template = orderConfirmationEmail({
          firstName: data.firstName || "Customer",
          program: data.program || "Weight Management",
          orderDate: data.orderDate || new Date().toLocaleDateString("en-AU"),
          originalAmount: parseFloat(data.originalAmount) || 49,
          discountAmount: 0,
          finalAmount: parseFloat(data.finalAmount) || 49,
          dashboardUrl: `${baseUrl}/dashboard`,
        });
        break;

      case "order_confirmation_discount":
        template = orderConfirmationEmail({
          firstName: data.firstName || "Customer",
          program: data.program || "Weight Management",
          orderDate: data.orderDate || new Date().toLocaleDateString("en-AU"),
          originalAmount: parseFloat(data.originalAmount) || 49,
          discountAmount: parseFloat(data.discountAmount) || 50,
          discountType: data.discountType || "new_member_promotion",
          finalAmount: parseFloat(data.finalAmount) || 0,
          dashboardUrl: `${baseUrl}/dashboard`,
        });
        break;

      case "patient_welcome":
        template = patientWelcomeEmail({
          firstName: data.firstName || "Patient",
          lastName: data.lastName || "",
          program: data.program || "Weight Management",
          carePartnerName: data.carePartnerName || "Mia",
          loginUrl: `${baseUrl}/dashboard`,
        });
        break;

      case "clinic_welcome":
        template = clinicWelcomeEmail({
          clinicName: data.clinicName || "Sample Clinic",
          gpName: data.gpName || "Dr. Smith",
          qrToken: data.qrToken || "ABC12345",
          qrUrl: `${baseUrl}/join?clinic=${data.qrToken || "ABC12345"}`,
          loginUrl: `${baseUrl}/gp/login`,
        });
        break;

      case "results_ready":
        template = resultsReadyEmail({
          firstName: data.firstName || "Patient",
          program: data.program || "Weight Management",
          carePartnerName: data.carePartnerName || "Sarah",
          resultsUrl: `${baseUrl}/dashboard/results`,
        });
        break;

      case "check_in_reminder":
        template = checkInReminderEmail({
          firstName: data.firstName || "Patient",
          carePartnerName: data.carePartnerName || "Mia",
          checkInType: data.checkInType || "Weekly Check-in",
          scheduledDate: data.scheduledDate || "Monday",
          dashboardUrl: `${baseUrl}/dashboard/messages`,
        });
        break;

      case "gp_visit_reminder":
        template = gpVisitReminderEmail({
          firstName: data.firstName || "Patient",
          clinicName: data.clinicName || "Sample Clinic",
          gpName: data.gpName || "Dr. Smith",
          visitDate: data.visitDate || "Tomorrow",
          visitTime: data.visitTime,
        });
        break;

      case "gp_enrolment":
        template = gpEnrolmentNotificationEmail({
          gpName: data.gpName || "Dr. Smith",
          clinicName: data.clinicName || "Sample Clinic",
          patientName: data.patientName || "John Doe",
          program: data.program || "Weight Management",
          enrolledAt: data.enrolledAt || new Date().toLocaleDateString("en-AU"),
          dashboardUrl: `${baseUrl}/gp/dashboard`,
        });
        break;

      case "gp_biomarker_alert":
        template = gpBiomarkerAlertEmail({
          gpName: data.gpName || "Dr. Smith",
          clinicName: data.clinicName || "Sample Clinic",
          patientName: data.patientName || "John Doe",
          biomarkerName: data.biomarkerName || "HbA1c",
          value: data.value || "7.5",
          unit: data.unit || "%",
          status: data.status || "HIGH",
          dashboardUrl: `${baseUrl}/gp/dashboard`,
        });
        break;

      default:
        return NextResponse.json(
          { error: "Unknown template" },
          { status: 400 }
        );
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
