import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2026-04-22.dahlia",
});

// NOTE: Medication prescriptions are now created via the Doctor Dashboard
// using manual entry. This route handles pre-approval triage only.

// GET /api/admin/wm-approvals - Get all pending weight management approvals
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !["ADMIN", "DOCTOR", "CARE_PARTNER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "PENDING";

    // Fetch weight management patients with specified approval status
    const patients = await prisma.user.findMany({
      where: {
        subscriptionTier: "weight_management",
        approvalStatus: status as "PENDING" | "APPROVED" | "DECLINED" | "DEFERRED",
        journeyStatus: {
          in: ["CONSULTATION_PAID", "CONSULTATION_BOOKED", "PRE_TRIAGE_PENDING", "PRE_TRIAGE_COMPLETE", "AWAITING_DOCTOR_DECISION"],
        },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        dateOfBirth: true,
        triageScore: true,
        approvalStatus: true,
        journeyStatus: true,
        createdAt: true,
        healthProfile: {
          select: {
            systolicBP: true,
            diastolicBP: true,
            onBPMedication: true,
          },
        },
        consultationBookings: {
          where: {
            status: { in: ["SLOT_HELD", "BOOKING_CONFIRMED", "BOOKING_COMPLETED"] },
          },
          orderBy: { scheduledAt: "desc" },
          take: 1,
          select: {
            id: true,
            scheduledAt: true,
            status: true,
          },
        },
        internalNotes: {
          where: {
            category: "MEDICAL",
          },
          select: {
            id: true,
            title: true,
            content: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: 5,
        },
        weightLogs: {
          orderBy: { measuredAt: "desc" },
          take: 1,
          select: {
            weight: true,
            measuredAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Transform data for frontend
    const patientsWithBMI = patients.map((patient) => {
      const weight = patient.weightLogs[0]?.weight;
      return {
        ...patient,
        currentWeight: weight || null,
        consultationDate: patient.consultationBookings[0]?.scheduledAt || null,
        consultationStatus: patient.consultationBookings[0]?.status || null,
        flaggedConditions: patient.internalNotes,
      };
    });

    return NextResponse.json({ patients: patientsWithBMI });
  } catch (error) {
    console.error("Error fetching WM approvals:", error);
    return NextResponse.json({ error: "Failed to fetch approvals" }, { status: 500 });
  }
}

// PATCH /api/admin/wm-approvals - Update approval status
// NOTE: This is for triage/pre-approval workflow only.
// Actual prescriptions are created via Doctor Dashboard with manual medication entry.
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !["ADMIN", "DOCTOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { userId, action, planTier, declineReason, deferDate, notes, requiredTests } = body;

    if (!userId || !action) {
      return NextResponse.json({ error: "userId and action are required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        assignedCarePartnerId: true,
        dateOfBirth: true,
        gender: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const doctorName = `Dr. ${session.user.firstName || ""} ${session.user.lastName || ""}`.trim() || "Doctor";

    // Handle different approval actions
    switch (action) {
      case "APPROVE": {
        // IMPORTANT: This action no longer creates prescriptions automatically.
        // It marks the patient as ready for doctor consultation/prescription.
        // The doctor must use the Doctor Dashboard to create prescriptions manually.

        // Update user status to AWAITING_DOCTOR_CALL - doctor needs to prescribe via dashboard
        await prisma.user.update({
          where: { id: userId },
          data: {
            approvalStatus: "PENDING", // Still pending until doctor prescribes
            journeyStatus: "AWAITING_DOCTOR_CALL",
            subscriptionTier: planTier || "weight_management",
          },
        });

        // Create task for doctor to complete consultation and prescribe
        await prisma.careCommunication.create({
          data: {
            userId,
            type: "CONSULTATION",
            priority: "HIGH",
            subject: `Doctor Consultation Required: ${user.firstName} ${user.lastName}`,
            notes: `Patient has been triaged and is ready for doctor consultation.

**Action Required:**
1. Review patient brief in Doctor Dashboard
2. Complete phone consultation
3. Make treatment decision and prescribe medication (if approved)

Plan: ${planTier || "weight_management"}
${notes ? `\nTriage Notes: ${notes}` : ""}

**Use Doctor Dashboard to complete this action.**`,
            status: "PENDING",
            dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
          },
        });

        // Add internal note
        await prisma.internalNote.create({
          data: {
            userId,
            memberId: userId,
            authorId: session.user.id,
            authorName: doctorName,
            createdBy: session.user.id,
            category: "MEDICAL",
            title: "Triage Complete - Ready for Doctor",
            content: `Patient triaged and ready for doctor consultation.

**Plan:** ${planTier || "weight_management"}
${notes ? `**Notes:** ${notes}` : ""}

**Next Step:** Doctor to complete consultation via Doctor Dashboard and prescribe treatment.`,
            isPinned: false,
          },
        });

        // Log automation
        await prisma.automationLog.create({
          data: {
            userId,
            automationType: "triage_complete",
            triggerEvent: "manual_triage",
            channel: "admin_portal",
            status: "completed",
            metadata: {
              triagedBy: session.user.id,
              planTier,
              notes,
            },
          },
        });

        return NextResponse.json({
          success: true,
          status: "AWAITING_DOCTOR_CALL",
          message: "Patient triaged. Doctor consultation task created. Prescription must be created via Doctor Dashboard.",
        });
      }

      case "DECLINE": {
        // Update user status - Care partner will manage communication
        await prisma.user.update({
          where: { id: userId },
          data: {
            approvalStatus: "DECLINED",
            journeyStatus: "DECLINED",
          },
        });

        // Add internal note with decline reason
        await prisma.internalNote.create({
          data: {
            userId,
            memberId: userId,
            authorId: session.user.id,
            authorName: doctorName,
            createdBy: session.user.id,
            category: "MEDICAL",
            title: "Triage Declined",
            content: `Patient declined at triage stage.

**Reason:** ${declineReason || "Not specified"}
**Action Required:** Care partner to contact patient and manage communication.

${notes ? `**Notes:** ${notes}` : ""}`,
            isPinned: true,
          },
        });

        // Log automation
        await prisma.automationLog.create({
          data: {
            userId,
            automationType: "triage_decline",
            triggerEvent: "manual_decline",
            channel: "admin_portal",
            status: "completed",
            metadata: {
              declinedBy: session.user.id,
              declineReason,
              notes,
              requiresCarePartnerAction: true,
            },
          },
        });

        return NextResponse.json({
          success: true,
          status: "DECLINED",
          message: "Patient declined. Care partner will manage patient communication.",
        });
      }

      case "APPROVE_WITH_TESTS": {
        // Approved but requires blood tests before doctor consultation
        const testsList = requiredTests || ["HbA1c", "Lipid Panel", "Kidney Function"];

        await prisma.user.update({
          where: { id: userId },
          data: {
            approvalStatus: "DEFERRED",
            journeyStatus: "TESTS_ORDERED",
            subscriptionTier: planTier || "weight_management",
          },
        });

        // Add internal note with required tests
        await prisma.internalNote.create({
          data: {
            userId,
            memberId: userId,
            authorId: session.user.id,
            authorName: doctorName,
            createdBy: session.user.id,
            category: "MEDICAL",
            title: "Conditionally Approved - Blood Tests Required",
            content: `Patient conditionally approved for weight management program.

**Status:** Approved pending completion of required blood tests

**Required Tests:**
${testsList.map((test: string) => `- ${test}`).join("\n")}

**Next Steps:**
1. Care partner to arrange blood tests with patient
2. Once results received, doctor to review and complete consultation
3. Prescription will be created after test review via Doctor Dashboard

${notes ? `**Notes:** ${notes}` : ""}`,
            isPinned: true,
          },
        });

        // Create care task for blood test coordination
        if (user.assignedCarePartnerId) {
          await prisma.careCommunication.create({
            data: {
              userId,
              type: "PATHOLOGY_REQUEST",
              priority: "HIGH",
              subject: `Blood Tests Required: ${user.firstName} ${user.lastName}`,
              notes: `Patient has been conditionally approved but requires blood tests.

**Required Tests:**
${testsList.map((test: string) => `- ${test}`).join("\n")}

**Actions:**
1. Contact patient to arrange blood tests
2. Provide pathology referral or instructions
3. Follow up on results within 7 days
4. Submit results for doctor review`,
              status: "PENDING",
              dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
              assignedTo: user.assignedCarePartnerId,
            },
          });

          // Notify care partner
          const carePartner = await prisma.user.findUnique({
            where: { id: user.assignedCarePartnerId },
            select: { email: true, firstName: true },
          });

          if (carePartner) {
            const adminUrl = `${process.env.NEXTAUTH_URL || "https://sanative.com.au"}/admin/crm/customers/${userId}`;
            await sendEmail({
              to: carePartner.email,
              subject: `Action Required: Blood Tests Needed - ${user.firstName} ${user.lastName}`,
              body: `
                <h2>Conditional Approval - Blood Tests Required</h2>
                <p>Hi ${carePartner.firstName},</p>
                <p><strong>${user.firstName} ${user.lastName}</strong> has been conditionally approved.</p>

                <div style="background:#fef3c7;border:1px solid #fcd34d;border-radius:8px;padding:16px;margin:16px 0;">
                  <h3 style="margin:0 0 12px 0;color:#92400e;">Required Blood Tests</h3>
                  <ul style="margin:0;padding-left:20px;color:#92400e;">
                    ${testsList.map((test: string) => `<li>${test}</li>`).join("")}
                  </ul>
                </div>

                <h3>Next Steps:</h3>
                <ol>
                  <li>Contact patient to arrange blood tests</li>
                  <li>Provide pathology referral or nearest collection center</li>
                  <li>Follow up on results within 7 days</li>
                  <li>Submit results for doctor consultation</li>
                </ol>

                <div style="margin: 24px 0;">
                  <a href="${adminUrl}" style="display:inline-block;background:#f59e0b;color:white;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;">
                    View Patient Profile
                  </a>
                </div>
              `,
            });
          }
        }

        // Send notification to patient about conditional approval
        await sendEmail({
          to: user.email,
          subject: "Almost there! One more step for your Sanative Weight Management Program",
          body: `
            <h2>Hi ${user.firstName},</h2>
            <p>Great news! Your assessment has been reviewed and you're almost ready to begin the Sanative Weight Management Program.</p>

            <div style="background:#fef3c7;border:1px solid #fcd34d;border-radius:8px;padding:16px;margin:20px 0;">
              <h3 style="margin:0 0 12px 0;color:#92400e;">One More Step</h3>
              <p style="margin:0;color:#92400e;">Before we can start your treatment, we need some routine blood tests to ensure we can provide you with the safest and most effective care.</p>
            </div>

            <p>Your care partner will be in touch within 24-48 hours to help arrange these tests. They can guide you to a convenient pathology collection center.</p>

            <p>Once we receive your results, our doctor will complete the final review and you'll be ready to start your program!</p>

            <p>If you have any questions in the meantime, feel free to reply to this email.</p>

            <p style="color:#666;margin-top:24px;">The Sanative Health Team</p>
          `,
        });

        // Log automation
        await prisma.automationLog.create({
          data: {
            userId,
            automationType: "conditional_approval",
            triggerEvent: "approve_with_tests",
            channel: "admin_portal",
            status: "completed",
            metadata: {
              approvedBy: session.user.id,
              requiredTests: testsList,
              planTier,
              notes,
            },
          },
        });

        return NextResponse.json({
          success: true,
          status: "APPROVED_WITH_TESTS",
          requiredTests: testsList,
          message: "Patient conditionally approved. Blood tests required before doctor consultation.",
        });
      }

      case "DEFER": {
        // Update user status
        await prisma.user.update({
          where: { id: userId },
          data: {
            approvalStatus: "DEFERRED",
            journeyStatus: "AWAITING_DOCTOR_DECISION",
          },
        });

        // Create follow-up appointment if date provided
        if (deferDate) {
          await prisma.appointment.create({
            data: {
              userId,
              type: "FOLLOW_UP",
              title: "Weight Management Follow-up Review",
              description: notes || "Deferred triage - follow-up review required",
              scheduledAt: new Date(deferDate),
              duration: 15,
              status: "SCHEDULED",
              followUpRequired: true,
              followUpDate: new Date(deferDate),
            },
          });
        }

        // Add internal note
        await prisma.internalNote.create({
          data: {
            userId,
            memberId: userId,
            authorId: session.user.id,
            authorName: doctorName,
            createdBy: session.user.id,
            category: "MEDICAL",
            title: "Triage Deferred",
            content: `Triage deferred for follow-up review.${deferDate ? `\nFollow-up scheduled: ${new Date(deferDate).toLocaleDateString()}` : ""}${notes ? `\n\nNotes: ${notes}` : ""}`,
            isPinned: true,
          },
        });

        return NextResponse.json({ success: true, status: "DEFERRED" });
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error updating approval:", error);
    return NextResponse.json({ error: "Failed to update approval" }, { status: 500 });
  }
}
