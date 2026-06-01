import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

// Contraindications that require immediate escalation
const SERIOUS_CONTRAINDICATIONS = [
  "eating_disorder",
  "pregnancy",
  "breastfeeding",
  "type_1_diabetes",
  "pancreatitis",
  "medullary_thyroid_cancer",
  "men2_syndrome",
  "severe_kidney_disease",
  "severe_liver_disease",
  "gallbladder_disease",
];

// GET /api/admin/triage - Fetch triage queue
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !["ADMIN", "CARE_PARTNER", "DOCTOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "PRE_TRIAGE_PENDING";
    const carePartnerId = searchParams.get("carePartnerId");

    // Define status groups
    const statusGroups: Record<string, string[]> = {
      "all": ["LEAD", "SURVEY_COMPLETED", "CONSULTATION_BOOKED", "CONSULTATION_PAID", "PRE_TRIAGE_PENDING", "PRE_TRIAGE_COMPLETE", "AWAITING_DOCTOR_DECISION", "APPROVED_PENDING_TESTS", "DECLINED"],
      "pre_payment": ["LEAD", "SURVEY_COMPLETED", "CONSULTATION_BOOKED"],
      "CONSULTATION_PAID": ["CONSULTATION_PAID"],
      "PRE_TRIAGE_PENDING": ["PRE_TRIAGE_PENDING"],
      "AWAITING_DOCTOR_DECISION": ["AWAITING_DOCTOR_DECISION", "PRE_TRIAGE_COMPLETE"],
      "APPROVED_PENDING_TESTS": ["APPROVED_PENDING_TESTS"],
      "DECLINED": ["DECLINED"],
    };

    // Build where clause
    const whereClause: Record<string, unknown> = {
      subscriptionTier: "weight_management",
      journeyStatus: {
        in: statusGroups[status] || [status],
      },
    };

    // Care partners only see their assigned patients
    if (session.user.role === "CARE_PARTNER") {
      whereClause.assignedCarePartnerId = session.user.id;
    } else if (carePartnerId) {
      whereClause.assignedCarePartnerId = carePartnerId;
    }

    const patients = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        dateOfBirth: true,
        gender: true,
        triageScore: true,
        journeyStatus: true,
        approvalStatus: true,
        assignedCarePartnerId: true,
        createdAt: true,
        updatedAt: true,
        // Health data
        healthProfile: {
          select: {
            systolicBP: true,
            diastolicBP: true,
            onBPMedication: true,
            smokingStatus: true,
            familyHistoryCVD: true,
          },
        },
        // Weight data for BMI calculation
        weightLogs: {
          orderBy: { measuredAt: "desc" },
          take: 1,
          select: { weight: true },
        },
        weightGoals: {
          take: 1,
          select: { startWeight: true, targetWeight: true },
        },
        // Medical conditions flagged as internal notes
        internalNotes: {
          where: { category: "MEDICAL" },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            title: true,
            content: true,
            isPinned: true,
            createdAt: true,
          },
        },
        // Consultation booking
        consultationBookings: {
          orderBy: { scheduledAt: "desc" },
          take: 1,
          select: {
            id: true,
            scheduledAt: true,
            status: true,
            completedAt: true,
          },
        },
        // Appointments
        appointments: {
          where: { type: "CONSULTATION" },
          orderBy: { scheduledAt: "desc" },
          take: 1,
          select: {
            id: true,
            scheduledAt: true,
            status: true,
            doctorId: true,
          },
        },
      },
      orderBy: [
        { triageScore: "desc" }, // Higher triage scores first (more urgent)
        { createdAt: "asc" }, // Then by oldest first
      ],
    });

    // Fetch care partners for assignment dropdown
    const carePartners = await prisma.user.findMany({
      where: {
        role: "CARE_PARTNER",
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
    });

    // Fetch doctors for assignment
    const doctors = await prisma.user.findMany({
      where: {
        role: "DOCTOR",
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
    });

    // Transform patient data with computed fields
    const patientsWithMetrics = patients.map((patient) => {
      const weight = patient.weightLogs[0]?.weight || patient.weightGoals[0]?.startWeight;
      const height = 170; // Default height in cm - should be stored in healthProfile

      // Calculate BMI
      let bmi: number | null = null;
      if (weight && height) {
        bmi = Math.round((weight / Math.pow(height / 100, 2)) * 10) / 10;
      }

      // Check for contraindications in medical notes
      const medicalConditions = patient.internalNotes.map((note) => ({
        ...note,
        isSevere: SERIOUS_CONTRAINDICATIONS.some(
          (c) => note.title.toLowerCase().includes(c.replace(/_/g, " ")) ||
                 note.content.toLowerCase().includes(c.replace(/_/g, " "))
        ),
      }));

      const hasContraindications = medicalConditions.some((c) => c.isSevere);

      // Calculate age
      let age: number | null = null;
      if (patient.dateOfBirth) {
        const today = new Date();
        const birthDate = new Date(patient.dateOfBirth);
        age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
      }

      return {
        ...patient,
        age,
        bmi,
        currentWeight: weight || null,
        medicalConditions,
        hasContraindications,
        consultationDate: patient.consultationBookings[0]?.scheduledAt || null,
        consultationStatus: patient.consultationBookings[0]?.status || null,
        assignedDoctorId: patient.appointments[0]?.doctorId || null,
      };
    });

    // Get global stats (counts across all statuses for the header badges)
    const allWMPatients = await prisma.user.findMany({
      where: {
        subscriptionTier: "weight_management",
        journeyStatus: {
          in: ["PRE_TRIAGE_PENDING", "AWAITING_DOCTOR_DECISION", "PRE_TRIAGE_COMPLETE", "APPROVED_PENDING_TESTS", "DECLINED"],
        },
      },
      select: {
        journeyStatus: true,
        triageScore: true,
      },
    });

    const stats = {
      pendingTriage: allWMPatients.filter((p) => p.journeyStatus === "PRE_TRIAGE_PENDING").length,
      awaitingApproval: allWMPatients.filter((p) => p.journeyStatus === "AWAITING_DOCTOR_DECISION" || p.journeyStatus === "PRE_TRIAGE_COMPLETE").length,
      highRisk: patientsWithMetrics.filter((p) => (p.triageScore || 0) >= 70).length,
      withContraindications: patientsWithMetrics.filter((p) => p.hasContraindications).length,
      pendingTests: allWMPatients.filter((p) => p.journeyStatus === "APPROVED_PENDING_TESTS").length,
      declined: allWMPatients.filter((p) => p.journeyStatus === "DECLINED").length,
    };

    return NextResponse.json({
      patients: patientsWithMetrics,
      carePartners,
      doctors,
      stats,
    });
  } catch (error) {
    console.error("Error fetching triage queue:", error);
    return NextResponse.json({ error: "Failed to fetch triage queue" }, { status: 500 });
  }
}

// PATCH /api/admin/triage - Update triage status
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !["ADMIN", "CARE_PARTNER", "DOCTOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      userId,
      action,
      assignedCarePartnerId,
      assignedDoctorId,
      patientBrief,
      triageScore,
      escalationReason,
      notes,
    } = body;

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
        journeyStatus: true,
        assignedCarePartnerId: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    switch (action) {
      case "ASSIGN_CARE_PARTNER": {
        if (!assignedCarePartnerId) {
          return NextResponse.json({ error: "Care partner ID required" }, { status: 400 });
        }

        await prisma.user.update({
          where: { id: userId },
          data: {
            assignedCarePartnerId,
            journeyStatus: user.journeyStatus === "CONSULTATION_PAID" ? "PRE_TRIAGE_PENDING" : user.journeyStatus,
          },
        });

        // Get care partner details
        const carePartner = await prisma.user.findUnique({
          where: { id: assignedCarePartnerId },
          select: { firstName: true, lastName: true, email: true },
        });

        // Log the assignment
        await prisma.internalNote.create({
          data: {
            userId,
            memberId: userId,
            authorId: session.user.id,
            authorName: `${session.user.firstName || ""} ${session.user.lastName || ""}`.trim() || "System",
            createdBy: session.user.id,
            category: "GENERAL",
            title: "Care Partner Assigned",
            content: `Assigned to care partner: ${carePartner?.firstName} ${carePartner?.lastName}`,
            isPinned: false,
          },
        });

        // Create automation log
        await prisma.automationLog.create({
          data: {
            userId,
            automationType: "care_partner_assigned",
            triggerEvent: "manual_assignment",
            channel: "admin_portal",
            status: "completed",
            metadata: { carePartnerId: assignedCarePartnerId, assignedBy: session.user.id },
          },
        });

        return NextResponse.json({ success: true, action: "CARE_PARTNER_ASSIGNED" });
      }

      case "START_TRIAGE": {
        // Transition from CONSULTATION_PAID to TRIAGE_PENDING
        await prisma.user.update({
          where: { id: userId },
          data: {
            journeyStatus: "PRE_TRIAGE_PENDING",
            assignedCarePartnerId: assignedCarePartnerId || user.assignedCarePartnerId || session.user.id,
          },
        });

        await prisma.internalNote.create({
          data: {
            userId,
            memberId: userId,
            authorId: session.user.id,
            authorName: `${session.user.firstName || ""} ${session.user.lastName || ""}`.trim() || "Care Partner",
            createdBy: session.user.id,
            category: "GENERAL",
            title: "Triage Started",
            content: `Triage process initiated by ${session.user.firstName || "care partner"}`,
            isPinned: false,
          },
        });

        return NextResponse.json({ success: true, action: "TRIAGE_STARTED" });
      }

      case "SAVE_PATIENT_BRIEF": {
        if (!patientBrief) {
          return NextResponse.json({ error: "Patient brief content required" }, { status: 400 });
        }

        // Save patient brief as a pinned medical note
        await prisma.internalNote.create({
          data: {
            userId,
            memberId: userId,
            authorId: session.user.id,
            authorName: `${session.user.firstName || ""} ${session.user.lastName || ""}`.trim() || "Care Partner",
            createdBy: session.user.id,
            category: "MEDICAL",
            title: "Patient Brief for Doctor Review",
            content: patientBrief,
            isPinned: true,
          },
        });

        // Update triage score if provided
        if (triageScore !== undefined) {
          await prisma.user.update({
            where: { id: userId },
            data: { triageScore },
          });
        }

        return NextResponse.json({ success: true, action: "BRIEF_SAVED" });
      }

      case "COMPLETE_TRIAGE": {
        if (!assignedDoctorId) {
          return NextResponse.json({ error: "Doctor assignment required to complete triage" }, { status: 400 });
        }

        const carePartnerName = `${session.user.firstName || ""} ${session.user.lastName || ""}`.trim() || "Care Partner";
        const triageCompletedAt = new Date();

        // Update user status
        await prisma.user.update({
          where: { id: userId },
          data: {
            journeyStatus: "AWAITING_DOCTOR_DECISION",
            triageScore: triageScore ?? undefined,
          },
        });

        // Create appointment for doctor review
        await prisma.appointment.create({
          data: {
            userId,
            type: "CONSULTATION",
            title: "Weight Management Doctor Review",
            description: notes || "Patient ready for doctor approval review",
            scheduledAt: new Date(), // Immediate review
            duration: 15,
            status: "SCHEDULED",
            doctorId: assignedDoctorId,
            patientBriefSent: true,
          },
        });

        // Get doctor details
        const doctor = await prisma.user.findUnique({
          where: { id: assignedDoctorId },
          select: { firstName: true, lastName: true, email: true },
        });

        // Create detailed triage completion record (pinned for visibility)
        await prisma.internalNote.create({
          data: {
            userId,
            memberId: userId,
            authorId: session.user.id,
            authorName: carePartnerName,
            createdBy: session.user.id,
            category: "MEDICAL",
            title: "✓ TRIAGE COMPLETED",
            content: `## Triage Review Record

**Completed By:** ${carePartnerName}
**Completed At:** ${triageCompletedAt.toLocaleString('en-AU', { dateStyle: 'full', timeStyle: 'short' })}
**Triage Score:** ${triageScore || 'Not calculated'}/100
**Risk Level:** ${triageScore && triageScore >= 70 ? 'HIGH' : triageScore && triageScore >= 40 ? 'MODERATE' : 'LOW'}

**Assigned Doctor:** Dr. ${doctor?.firstName} ${doctor?.lastName}
**Status:** Awaiting Doctor Approval

${notes ? `**Care Partner Notes:**\n${notes}` : ''}

---
*This record confirms the care partner has reviewed the patient intake data, medical history, and prepared a brief for doctor review.*`,
            isPinned: true,
          },
        });

        // Notify doctor via email
        if (doctor?.email) {
          await sendEmail({
            to: doctor.email,
            subject: `Patient Ready for Review: ${user.firstName} ${user.lastName}`,
            body: `
              <h2>New Patient Awaiting Approval</h2>
              <p>A patient has completed triage and is ready for your review:</p>
              <ul>
                <li><strong>Patient:</strong> ${user.firstName} ${user.lastName}</li>
                <li><strong>Email:</strong> ${user.email}</li>
                <li><strong>Triage Score:</strong> ${triageScore || "Not calculated"}</li>
              </ul>
              <div style="margin: 24px 0;">
                <a href="${process.env.NEXTAUTH_URL || "https://sanative.com.au"}/admin/weight-management/approvals"
                   style="display:inline-block;background:#059669;color:white;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;">
                  Review Patient
                </a>
              </div>
              <p style="color:#666;">Please review the patient brief and medical notes before making an approval decision.</p>
            `,
          });
        }

        // Create automation log with full triage details
        await prisma.automationLog.create({
          data: {
            userId,
            automationType: "triage_completed",
            triggerEvent: "manual_completion",
            channel: "admin_portal",
            status: "completed",
            metadata: {
              carePartnerId: session.user.id,
              carePartnerName,
              carePartnerEmail: session.user.email,
              doctorId: assignedDoctorId,
              doctorName: `Dr. ${doctor?.firstName} ${doctor?.lastName}`,
              triageScore,
              triageCompletedAt: triageCompletedAt.toISOString(),
              notes: notes || null,
            },
          },
        });

        return NextResponse.json({
          success: true,
          action: "TRIAGE_COMPLETED",
          triageRecord: {
            completedBy: carePartnerName,
            completedAt: triageCompletedAt.toISOString(),
            triageScore,
            assignedDoctor: `Dr. ${doctor?.firstName} ${doctor?.lastName}`,
          }
        });
      }

      case "ESCALATE": {
        if (!escalationReason) {
          return NextResponse.json({ error: "Escalation reason required" }, { status: 400 });
        }

        // Create urgent internal note
        await prisma.internalNote.create({
          data: {
            userId,
            memberId: userId,
            authorId: session.user.id,
            authorName: `${session.user.firstName || ""} ${session.user.lastName || ""}`.trim() || "Care Partner",
            createdBy: session.user.id,
            category: "MEDICAL",
            title: "⚠️ ESCALATION: Contraindication Alert",
            content: `Patient flagged for urgent review.\n\nReason: ${escalationReason}${notes ? `\n\nAdditional notes: ${notes}` : ""}`,
            isPinned: true,
          },
        });

        // Update triage score to indicate high risk
        await prisma.user.update({
          where: { id: userId },
          data: {
            triageScore: Math.max(triageScore || 0, 90), // Minimum 90 for escalations
          },
        });

        // Create care communication task
        await prisma.careCommunication.create({
          data: {
            userId,
            type: "FOLLOW_UP",
            priority: "HIGH",
            subject: "Contraindication Escalation - Urgent Review Required",
            notes: escalationReason,
            status: "PENDING",
            dueDate: new Date(), // Immediate
          },
        });

        // Notify all doctors
        const allDoctors = await prisma.user.findMany({
          where: { role: "DOCTOR" },
          select: { email: true, firstName: true },
        });

        for (const doc of allDoctors) {
          await sendEmail({
            to: doc.email,
            subject: `⚠️ URGENT: Patient Escalation - ${user.firstName} ${user.lastName}`,
            body: `
              <h2 style="color: #dc2626;">Urgent Patient Escalation</h2>
              <p>A patient has been flagged with a potential contraindication requiring immediate review:</p>
              <ul>
                <li><strong>Patient:</strong> ${user.firstName} ${user.lastName}</li>
                <li><strong>Reason:</strong> ${escalationReason}</li>
              </ul>
              <div style="margin: 24px 0;">
                <a href="${process.env.NEXTAUTH_URL || "https://sanative.com.au"}/admin/crm/customers/${userId}"
                   style="display:inline-block;background:#dc2626;color:white;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;">
                  Review Now
                </a>
              </div>
            `,
          });
        }

        return NextResponse.json({ success: true, action: "ESCALATED" });
      }

      case "ASSIGN_DOCTOR_TO_BOOKING": {
        // UNIFIED CALENDAR: Assign a doctor to the patient's consultation booking
        // This happens during triage after the patient has booked a slot
        if (!assignedDoctorId) {
          return NextResponse.json({ error: "Doctor ID is required" }, { status: 400 });
        }

        // Get doctor details
        const doctor = await prisma.user.findUnique({
          where: { id: assignedDoctorId, role: "DOCTOR" },
          select: { id: true, firstName: true, lastName: true, email: true },
        });

        if (!doctor) {
          return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
        }

        // Find the patient's active consultation booking
        const consultationBooking = await prisma.consultationBooking.findFirst({
          where: {
            userId,
            status: { in: ["SLOT_HELD", "BOOKING_CONFIRMED"] },
          },
          orderBy: { scheduledAt: "desc" },
        });

        if (!consultationBooking) {
          return NextResponse.json({ error: "No active consultation booking found for this patient" }, { status: 404 });
        }

        // Check if doctor is available at this time
        const existingDoctorBooking = await prisma.consultationBooking.findFirst({
          where: {
            scheduledAt: consultationBooking.scheduledAt,
            doctorId: assignedDoctorId,
            status: { in: ["SLOT_HELD", "BOOKING_CONFIRMED"] },
            id: { not: consultationBooking.id },
          },
        });

        if (existingDoctorBooking) {
          return NextResponse.json({
            error: `Dr. ${doctor.firstName} ${doctor.lastName} is already booked at this time`
          }, { status: 409 });
        }

        // Update the booking with the assigned doctor
        const doctorName = `Dr. ${doctor.firstName} ${doctor.lastName}`;
        await prisma.consultationBooking.update({
          where: { id: consultationBooking.id },
          data: {
            doctorId: assignedDoctorId,
            doctorName,
          },
        });

        // Create internal note
        await prisma.internalNote.create({
          data: {
            userId,
            memberId: userId,
            authorId: session.user.id,
            authorName: `${session.user.firstName || ""} ${session.user.lastName || ""}`.trim() || "Care Partner",
            createdBy: session.user.id,
            category: "GENERAL",
            title: "Doctor Assigned to Consultation",
            content: `Assigned ${doctorName} to consultation on ${consultationBooking.scheduledAt.toLocaleDateString("en-AU", {
              weekday: "long", day: "numeric", month: "long", hour: "numeric", minute: "2-digit"
            })}`,
            isPinned: false,
          },
        });

        // Log activity
        await prisma.activityLog.create({
          data: {
            userId,
            action: "DOCTOR_ASSIGNED_TO_BOOKING",
            entity: "consultation_booking",
            entityId: consultationBooking.id,
            details: {
              doctorId: assignedDoctorId,
              doctorName,
              scheduledAt: consultationBooking.scheduledAt.toISOString(),
              assignedBy: session.user.id,
            },
          },
        });

        return NextResponse.json({
          success: true,
          action: "DOCTOR_ASSIGNED_TO_BOOKING",
          booking: {
            id: consultationBooking.id,
            scheduledAt: consultationBooking.scheduledAt.toISOString(),
            doctorId: assignedDoctorId,
            doctorName,
          }
        });
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error updating triage:", error);
    return NextResponse.json({ error: "Failed to update triage" }, { status: 500 });
  }
}

// POST /api/admin/triage - Trigger triage for consultation-paid users
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !["ADMIN", "CARE_PARTNER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    if (action === "AUTO_ASSIGN") {
      // Auto-assign unassigned CONSULTATION_PAID patients to available care partners
      const unassignedPatients = await prisma.user.findMany({
        where: {
          subscriptionTier: "weight_management",
          journeyStatus: { in: ["CONSULTATION_PAID", "CONSULTATION_BOOKED"] },
          assignedCarePartnerId: null,
        },
        select: { id: true },
      });

      // Get care partners with their patient counts
      const carePartners = await prisma.user.findMany({
        where: { role: "CARE_PARTNER" },
        select: {
          id: true,
          _count: {
            select: {
              // Count users where this care partner is assigned
            },
          },
        },
      });

      // Simple round-robin assignment
      let assignmentCount = 0;
      for (let i = 0; i < unassignedPatients.length; i++) {
        const carePartner = carePartners[i % carePartners.length];
        if (carePartner) {
          await prisma.user.update({
            where: { id: unassignedPatients[i].id },
            data: {
              assignedCarePartnerId: carePartner.id,
              journeyStatus: "PRE_TRIAGE_PENDING",
            },
          });
          assignmentCount++;
        }
      }

      return NextResponse.json({
        success: true,
        assigned: assignmentCount,
        message: `Auto-assigned ${assignmentCount} patients to care partners`,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error in triage POST:", error);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}
