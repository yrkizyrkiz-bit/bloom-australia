import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GAP-027: Journey status descriptions for patient portal
// UAT8-GAP-006: Updated to reflect "Approved with testing" model
const STAGE_DESCRIPTIONS: Record<string, { stage: string; description: string }> = {
  // Pre-consultation
  LEAD: { stage: "pre-consultation", description: "Starting your health journey" },
  CONSENTED: { stage: "pre-consultation", description: "Consent received" },
  SURVEY_COMPLETED: { stage: "pre-consultation", description: "Health assessment complete" },
  CONSULTATION_BOOKING_STARTED: { stage: "pre-consultation", description: "Booking your consultation" },
  CONSULTATION_BOOKED: { stage: "pre-consultation", description: "Consultation booked" },
  CONSULTATION_PAID: { stage: "pre-consultation", description: "Payment received — awaiting consultation" },

  // Pre-triage
  PRE_TRIAGE_PENDING: { stage: "pre-consultation", description: "Care team reviewing your details" },
  PRE_TRIAGE_COMPLETE: { stage: "pre-consultation", description: "Ready for doctor consultation" },

  // Consultation
  AWAITING_DOCTOR_CALL: { stage: "consultation", description: "Doctor will call at your scheduled time" },
  CONSULT_COMPLETED: { stage: "consultation", description: "Consultation complete — awaiting decision" },
  AWAITING_DOCTOR_DECISION: { stage: "consultation", description: "Doctor reviewing your case" },

  // UAT8-GAP-006: Approved with testing - patient proceeds while tests are tracked
  // These statuses no longer block the program
  APPROVED_PENDING_TESTS: { stage: "approved", description: "Program approved — blood tests ordered for monitoring" },
  TESTS_ORDERED: { stage: "approved", description: "Program approved — blood tests being arranged" },
  AWAITING_TESTS: { stage: "approved", description: "Program approved — awaiting test results" },
  RESULTS_RECEIVED: { stage: "approved", description: "Test results received — under review" },
  FINAL_DOCTOR_REVIEW: { stage: "approved", description: "Doctor reviewing your test results" },

  // Approved
  APPROVED: { stage: "approved", description: "Doctor approved — preparing your program" },
  DECLINED: { stage: "declined", description: "Program not suitable at this time" },
  REFUND_PENDING: { stage: "refund", description: "Refund is being processed" },
  REFUNDED: { stage: "refund", description: "Refund has been processed" },

  // Script/Pharmacy (Note: SCRIPT_DRAFT is a ScriptStatus, not a JourneyStatus)
  SCRIPT_WRITTEN: { stage: "treatment-prep", description: "Prescription written" },
  PHARMACY_PENDING: { stage: "treatment-prep", description: "Pharmacy preparing your treatment" },
  DISPENSING: { stage: "treatment-prep", description: "Treatment being dispensed" },
  SHIPPED: { stage: "delivery", description: "Treatment dispatched" },
  DELIVERED: { stage: "delivery", description: "Treatment delivered" },

  // Onboarding & Active
  ONBOARDING_PENDING: { stage: "onboarding", description: "Complete your onboarding steps" },
  ONBOARDING_COMPLETE: { stage: "onboarding", description: "Onboarding complete" },
  ACTIVE: { stage: "active", description: "Program active" },

  // Other states
  PAUSED: { stage: "paused", description: "Program paused" },
  CANCELLED: { stage: "cancelled", description: "Program cancelled" },
  CHURNED: { stage: "churned", description: "Program ended" },
};

// Statuses that indicate approval (UAT8-GAP-006: includes testing statuses)
const APPROVED_STATUSES = [
  "APPROVED", "APPROVED_PENDING_TESTS", "TESTS_ORDERED", "AWAITING_TESTS",
  "RESULTS_RECEIVED", "FINAL_DOCTOR_REVIEW", "SCRIPT_WRITTEN",
  "PHARMACY_PENDING", "DISPENSING", "SHIPPED", "DELIVERED",
  "ONBOARDING_PENDING", "ONBOARDING_COMPLETE", "ACTIVE"
];

// UAT8-GAP-006: Statuses where tests are being tracked (but don't block program)
const TESTS_TRACKING_STATUSES = [
  "APPROVED_PENDING_TESTS", "TESTS_ORDERED", "AWAITING_TESTS",
  "RESULTS_RECEIVED", "FINAL_DOCTOR_REVIEW"
];

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch user with related data
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        journeyStatus: true,
        subscriptionStatus: true,
        approvalStatus: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fetch prescription data for Weight Management
    const prescription = await prisma.prescription.findFirst({
      where: {
        patientId: session.user.id,
        category: "WEIGHT_MANAGEMENT",
        status: "ACTIVE",
      },
      select: {
        id: true,
        scriptStatus: true,
        pharmacyName: true,
        prescriberName: true,
        startDate: true,
        createdAt: true,
        refills: {
          where: { status: { in: ["SHIPPED", "DELIVERED"] } },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            trackingNumber: true,
            deliveredAt: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const latestBooking = await prisma.consultationBooking.findFirst({
      where: {
        userId: session.user.id,
        status: "BOOKING_CONFIRMED",
      },
      orderBy: { scheduledAt: "desc" },
      select: {
        scheduledAt: true,
        doctorName: true,
      },
    });

    // Fetch WeightManagementIntake for comprehensive status
    const intake = await prisma.weightManagementIntake.findFirst({
      where: { userId: session.user.id },
      select: {
        id: true,
        selectedPlan: true,
        paymentStatus: true,
        bookingStatus: true,
        doctorReviewStatus: true,
        portalStatus: true,
        scheduledAt: true,
        paidAt: true,
        doctorDecision: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // UAT8-GAP-006: Fetch pending pathology tasks for tests tracking
    const pendingTestsTasks = await prisma.careCommunication.findMany({
      where: {
        userId: session.user.id,
        type: "PATHOLOGY_REQUEST",
        status: { in: ["PENDING", "IN_PROGRESS"] },
      },
      select: {
        id: true,
        subject: true,
        notes: true,
        status: true,
        dueDate: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    const journeyStatus = user.journeyStatus || "LEAD";
    const stageInfo = STAGE_DESCRIPTIONS[journeyStatus] || { stage: "unknown", description: "Status unknown" };

    // Determine prescription status from actual record
    const hasPrescription = prescription !== null;
    const scriptStatus = prescription?.scriptStatus || null;

    // UAT8-GAP-006: Check if tests are being tracked (doesn't block program)
    const hasTestsTracking = TESTS_TRACKING_STATUSES.includes(journeyStatus) ||
                             user.approvalStatus === "APPROVED_WITH_TESTS" ||
                             pendingTestsTasks.length > 0;

    // Legacy flag for backward compatibility - now false since tests don't block
    const pendingTests = false; // UAT8-GAP-006: Tests no longer block program

    // Determine effective status for timeline (combines journey and script status)
    let effectiveStatus: string = journeyStatus;
    if (hasPrescription && scriptStatus) {
      // Use scriptStatus for more accurate timeline when prescription exists
      if (journeyStatus === "APPROVED" && scriptStatus !== "SCRIPT_DRAFT") {
        effectiveStatus = scriptStatus;
      }
    }

    const effectiveStageInfo = STAGE_DESCRIPTIONS[effectiveStatus] || stageInfo;

    // UAT8-GAP-006: Determine if user is approved (includes APPROVED_WITH_TESTS)
    const isApproved = APPROVED_STATUSES.includes(journeyStatus) ||
                       user.approvalStatus === "APPROVED" ||
                       user.approvalStatus === "APPROVED_WITH_TESTS";

    return NextResponse.json({
      // Journey status
      journeyStatus,
      stage: effectiveStageInfo.stage,
      stageDescription: effectiveStageInfo.description,

      // Approval status (UAT8-GAP-006: includes APPROVED_WITH_TESTS)
      isApproved,
      approvalStatus: user.approvalStatus,

      // UAT8-GAP-006: Tests tracking info (doesn't block program)
      hasTestsTracking,
      testsTrackingInfo: hasTestsTracking ? {
        message: "Blood tests are being tracked for your ongoing care",
        tasks: pendingTestsTasks.map(task => ({
          id: task.id,
          subject: task.subject,
          status: task.status,
          dueDate: task.dueDate?.toISOString() || null,
        })),
        count: pendingTestsTasks.length,
      } : null,

      // Legacy field for backward compatibility
      pendingTests,

      // Prescription status
      hasPrescription,
      scriptStatus,
      prescriptionId: prescription?.id || null,
      pharmacyName: prescription?.pharmacyName || null,
      prescriberName: prescription?.prescriberName || null,

      // Shipping info (if applicable)
      trackingNumber: prescription?.refills?.[0]?.trackingNumber || null,
      isShipped: scriptStatus === "SHIPPED" || scriptStatus === "DELIVERED",
      isDelivered: scriptStatus === "DELIVERED",
      deliveredAt: prescription?.refills?.[0]?.deliveredAt || null,

      // Activation status
      isActive: journeyStatus === "ACTIVE",
      subscriptionStatus: user.subscriptionStatus,

      consultation: (() => {
        const scheduled =
          latestBooking?.scheduledAt || intake?.scheduledAt || null;
        if (!scheduled) return null;
        const d = new Date(scheduled);
        return {
          date: d.toISOString(),
          time: d.toLocaleTimeString("en-AU", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          }),
          status: "BOOKING_CONFIRMED",
          doctorName: latestBooking?.doctorName || null,
        };
      })(),

      // Intake data (for comprehensive status)
      intake: intake ? {
        id: intake.id,
        selectedPlan: intake.selectedPlan,
        paymentStatus: intake.paymentStatus,
        bookingStatus: intake.bookingStatus,
        doctorReviewStatus: intake.doctorReviewStatus,
        portalStatus: intake.portalStatus,
        scheduledAt: intake.scheduledAt,
        paidAt: intake.paidAt,
        doctorDecision: intake.doctorDecision,
      } : null,

      // Timeline helper (effective status for UI)
      effectiveStatus,
    });
  } catch (error) {
    console.error("Error fetching journey status:", error);
    return NextResponse.json(
      { error: "Failed to fetch journey status" },
      { status: 500 }
    );
  }
}
