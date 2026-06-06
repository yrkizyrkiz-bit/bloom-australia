import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

// Script status progression rules
const VALID_TRANSITIONS: Record<string, string[]> = {
  SCRIPT_DRAFT: ["SCRIPT_WRITTEN"],
  SCRIPT_WRITTEN: ["SCRIPT_SENT_TO_PHARMACY"],
  SCRIPT_SENT_TO_PHARMACY: ["PHARMACY_PENDING"],
  PHARMACY_PENDING: ["DISPENSING"],
  DISPENSING: ["SHIPPED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [], // Terminal state
};

// Journey status progression based on script status
const JOURNEY_STATUS_MAP: Record<string, string> = {
  SCRIPT_DRAFT: "APPROVED",
  SCRIPT_WRITTEN: "SCRIPT_WRITTEN",
  SCRIPT_SENT_TO_PHARMACY: "PHARMACY_PENDING",
  PHARMACY_PENDING: "PHARMACY_PENDING",
  DISPENSING: "DISPENSING",
  SHIPPED: "SHIPPED",
  DELIVERED: "DELIVERED",
};

// GET /api/admin/scripts - Get scripts with optional filters
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !["ADMIN", "DOCTOR", "CARE_PARTNER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const scriptStatus = searchParams.get("scriptStatus");
    const patientId = searchParams.get("patientId");

    // Build filter
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (scriptStatus) where.scriptStatus = scriptStatus;
    if (patientId) where.patientId = patientId;

    const prescriptions = await prisma.prescription.findMany({
      where,
      select: {
        id: true,
        patientId: true,
        medicationName: true,
        genericName: true,
        strength: true,
        form: true,
        dosage: true,
        frequency: true,
        instructions: true,
        quantity: true,
        quantityUnit: true,
        daysSupply: true,
        refillsTotal: true,
        refillsRemaining: true,
        prescribedAt: true,
        startDate: true,
        followUpDate: true,
        prescriberName: true,
        pharmacyName: true,
        pharmacyAddress: true,
        pharmacyPhone: true,
        status: true,
        scriptStatus: true,
        category: true,
        notes: true,
        pharmacyNotes: true,
        safetyCounsellingNotes: true,
        ePrescriptionId: true,
        ePrescriptionSent: true,
        ePrescriptionSentAt: true,
        createdAt: true,
        updatedAt: true,
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            journeyStatus: true,
            addressLine1: true,
            suburb: true,
            state: true,
            postcode: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Get counts by script status
    const counts = await prisma.prescription.groupBy({
      by: ["scriptStatus"],
      _count: { id: true },
      where: { status: "ACTIVE" },
    });

    const statusCounts = counts.reduce(
      (acc, item) => {
        acc[item.scriptStatus] = item._count.id;
        return acc;
      },
      {} as Record<string, number>
    );

    return NextResponse.json({
      prescriptions,
      counts: statusCounts,
    });
  } catch (error) {
    console.error("Error fetching scripts:", error);
    return NextResponse.json({ error: "Failed to fetch scripts" }, { status: 500 });
  }
}

// PATCH /api/admin/scripts - Update script status
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !["ADMIN", "DOCTOR", "CARE_PARTNER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      prescriptionId,
      newStatus,
      // Pharmacy details
      pharmacyName,
      pharmacyAddress,
      pharmacyPhone,
      // Shipping details
      trackingNumber,
      deliveryMethod,
      // Notes
      notes,
      // ePrescription
      ePrescriptionId,
    } = body;

    if (!prescriptionId || !newStatus) {
      return NextResponse.json(
        { error: "prescriptionId and newStatus are required" },
        { status: 400 }
      );
    }

    // Fetch current prescription
    const prescription = await prisma.prescription.findUnique({
      where: { id: prescriptionId },
      include: {
        patient: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            journeyStatus: true,
            assignedCarePartnerId: true,
          },
        },
      },
    });

    if (!prescription) {
      return NextResponse.json({ error: "Prescription not found" }, { status: 404 });
    }

    // Validate status transition
    const currentStatus = prescription.scriptStatus;
    const allowedTransitions = VALID_TRANSITIONS[currentStatus] || [];

    if (!allowedTransitions.includes(newStatus)) {
      return NextResponse.json(
        {
          error: `Invalid status transition from ${currentStatus} to ${newStatus}. Allowed: ${allowedTransitions.join(", ") || "none"}`,
        },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {
      scriptStatus: newStatus,
      notes: notes || prescription.notes,
    };

    // Add status-specific data
    if (newStatus === "SCRIPT_SENT_TO_PHARMACY" || newStatus === "PHARMACY_PENDING") {
      if (pharmacyName) updateData.pharmacyName = pharmacyName;
      if (pharmacyAddress) updateData.pharmacyAddress = pharmacyAddress;
      if (pharmacyPhone) updateData.pharmacyPhone = pharmacyPhone;
      if (ePrescriptionId) {
        updateData.ePrescriptionId = ePrescriptionId;
        updateData.ePrescriptionSent = true;
        updateData.ePrescriptionSentAt = new Date();
      }
    }

    // Update prescription
    const updatedPrescription = await prisma.prescription.update({
      where: { id: prescriptionId },
      data: updateData,
    });

    // Update user journey status
    const newJourneyStatus = JOURNEY_STATUS_MAP[newStatus];
    if (newJourneyStatus) {
      // If the patient is in the onboarding flow, do not overwrite the onboarding journey status.
      // This keeps the patient experience consistent while scripts/pharmacy progresses in the background.
      const shouldPreserveJourney = [
        "ONBOARDING_PENDING",
        "ONBOARDING_COMPLETE",
        "ACTIVE",
      ].includes(prescription.patient.journeyStatus || "");

      if (!shouldPreserveJourney) {
        await prisma.user.update({
          where: { id: prescription.patientId },
          data: {
            journeyStatus:
              newJourneyStatus as
                | "APPROVED"
                | "SCRIPT_WRITTEN"
                | "PHARMACY_PENDING"
                | "DISPENSING"
                | "SHIPPED"
                | "DELIVERED",
          },
        });
        try {
          const { syncWMJourneyFromScript } = await import(
            "@/lib/weight-management/journey-sync"
          );
          await syncWMJourneyFromScript(prescription.patientId, newStatus);
        } catch {
          /* WM intake sync optional */
        }
      }
    }

    // Handle status-specific actions
    const user = prescription.patient;
    const doctorName = `${session.user.firstName || ""} ${session.user.lastName || ""}`.trim() || "Sanative Team";

    switch (newStatus) {
      case "SCRIPT_WRITTEN": {
        try {
          const { ensureMemberProgram } = await import("@/lib/program/start-program");
          await ensureMemberProgram(prescription.patientId, prescriptionId);
          const { syncWMJourneyFromScript } = await import("@/lib/weight-management/journey-sync");
          await syncWMJourneyFromScript(prescription.patientId, "SCRIPT_WRITTEN");
          const { ensureWMProgramMember } = await import("@/lib/wm/ensure-program-member");
          await ensureWMProgramMember(prescription.patientId);
        } catch (programError) {
          console.error("[Scripts] Member program start failed:", programError);
        }

        // Script finalized - create pharmacy dispatch task
        await prisma.careCommunication.create({
          data: {
            userId: prescription.patientId,
            type: "PHARMACY_DISPATCH",
            priority: "HIGH",
            subject: `Send Script to Pharmacy: ${user.firstName} ${user.lastName}`,
            notes: `Script has been finalized.

Prescription ID: ${prescriptionId}

**Next Steps:**
1. Select pharmacy partner
2. Send ePrescription or fax script
3. Update status to SCRIPT_SENT_TO_PHARMACY

${notes ? `Notes: ${notes}` : ""}`,
            status: "PENDING",
            dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
            assignedTo: user.assignedCarePartnerId || undefined,
          },
        });

        // Log activity
        await prisma.activityLog.create({
          data: {
            userId: prescription.patientId,
            action: "SCRIPT_FINALIZED",
            entity: "prescription",
            entityId: prescriptionId,
            details: {
              updatedBy: session.user.id,
              previousStatus: currentStatus,
              newStatus,
              timestamp: new Date().toISOString(),
            },
          },
        });
        break;
      }

      case "SCRIPT_SENT_TO_PHARMACY": {
        // Create pharmacy pending task
        await prisma.careCommunication.create({
          data: {
            userId: prescription.patientId,
            type: "PHARMACY_DISPATCH",
            priority: "NORMAL",
            subject: `Await Pharmacy Confirmation: ${user.firstName} ${user.lastName}`,
            notes: `Script sent to pharmacy. Awaiting confirmation.

Pharmacy: ${pharmacyName || "TBD"}
ePrescription ID: ${ePrescriptionId || "N/A"}

Follow up if no confirmation within 24 hours.`,
            status: "PENDING",
            dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
            assignedTo: user.assignedCarePartnerId || undefined,
          },
        });
        break;
      }

      case "PHARMACY_PENDING": {
        // Pharmacy confirmed receipt
        await prisma.activityLog.create({
          data: {
            userId: prescription.patientId,
            action: "PHARMACY_CONFIRMED",
            entity: "prescription",
            entityId: prescriptionId,
            details: {
              updatedBy: session.user.id,
              pharmacyName,
              timestamp: new Date().toISOString(),
            },
          },
        });
        break;
      }

      case "DISPENSING": {
        // Pharmacy is preparing medication
        await prisma.careCommunication.create({
          data: {
            userId: prescription.patientId,
            type: "SHIPPING",
            priority: "NORMAL",
            subject: `Medication Dispensing: ${user.firstName} ${user.lastName}`,
            notes: `Pharmacy is preparing medication.

Await confirmation of dispatch and tracking number.`,
            status: "PENDING",
            dueDate: new Date(Date.now() + 48 * 60 * 60 * 1000),
            assignedTo: user.assignedCarePartnerId || undefined,
          },
        });
        break;
      }

      case "SHIPPED": {
        // Medication shipped - create refill tracking
        const refillData: Record<string, unknown> = {
          prescriptionId,
          requestedAt: new Date(),
          requestedBy: session.user.id,
          requestMethod: "AUTO",
          status: "SHIPPED",
          processedAt: new Date(),
          processedBy: session.user.id,
          quantityFilled: prescription.quantity,
          pharmacyName: prescription.pharmacyName,
          filledAt: new Date(),
          deliveryMethod: deliveryMethod || "STANDARD_SHIPPING",
        };

        if (trackingNumber) {
          refillData.trackingNumber = trackingNumber;
        }

        await prisma.prescriptionRefill.create({
          data: refillData as Parameters<typeof prisma.prescriptionRefill.create>[0]["data"],
        });

        // Send shipping notification to patient
        await sendEmail({
          to: user.email,
          subject: "Your Sanative order has shipped",
          body: `
            <h2>Hi ${user.firstName},</h2>
            <p>Great news! Your order is on its way.</p>
            ${trackingNumber ? `<p><strong>Tracking Number:</strong> ${trackingNumber}</p>` : ""}
            <p>You should receive your delivery within 2-5 business days.</p>
            <h3>What to expect:</h3>
            <ul>
              <li>Your package will arrive in discreet packaging</li>
              <li>Storage instructions are included in the package</li>
              <li>Our care team will follow up after delivery</li>
            </ul>
            <p>If you have any questions, please contact our care team.</p>
            <p style="color:#666;margin-top:24px;">The Sanative Health Team</p>
          `,
        });

        // Create delivery follow-up task
        await prisma.careCommunication.create({
          data: {
            userId: prescription.patientId,
            type: "FOLLOW_UP",
            priority: "NORMAL",
            subject: `Post-Delivery Follow-up: ${user.firstName} ${user.lastName}`,
            notes: `Medication has been shipped.

${trackingNumber ? `Tracking: ${trackingNumber}` : ""}

Follow up in 5-7 days to:
1. Confirm delivery received
2. Check patient has started treatment
3. Answer any questions
4. Update status to DELIVERED`,
            status: "PENDING",
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            assignedTo: user.assignedCarePartnerId || undefined,
          },
        });

        await prisma.activityLog.create({
          data: {
            userId: prescription.patientId,
            action: "MEDICATION_SHIPPED",
            entity: "prescription",
            entityId: prescriptionId,
            details: {
              updatedBy: session.user.id,
              trackingNumber,
              deliveryMethod,
              timestamp: new Date().toISOString(),
            },
          },
        });
        break;
      }

      case "DELIVERED": {
        // Update refill record — delivery is logistics only; program activation is manual on welcome call
        await prisma.prescriptionRefill.updateMany({
          where: { prescriptionId, status: "SHIPPED" },
          data: {
            status: "DELIVERED",
            deliveredAt: new Date(),
          },
        });

        const preserveJourney = [
          "ONBOARDING_PENDING",
          "ONBOARDING_COMPLETE",
          "ACTIVE",
        ].includes(prescription.patient.journeyStatus || "");

        if (!preserveJourney) {
          await prisma.user.update({
            where: { id: prescription.patientId },
            data: { journeyStatus: "DELIVERED" },
          });
        }

        await prisma.activityLog.create({
          data: {
            userId: prescription.patientId,
            action: "MEDICATION_DELIVERED",
            entity: "prescription",
            entityId: prescriptionId,
            details: {
              updatedBy: session.user.id,
              patientActivated: false,
              timestamp: new Date().toISOString(),
            },
          },
        });
        break;
      }
    }

    // Log status change
    await prisma.automationLog.create({
      data: {
        userId: prescription.patientId,
        automationType: "script_status_change",
        triggerEvent: `${currentStatus}_to_${newStatus}`,
        channel: "admin_portal",
        status: "completed",
        metadata: {
          prescriptionId,
          previousStatus: currentStatus,
          newStatus,
          updatedBy: session.user.id,
          updatedByName: doctorName,
        },
      },
    });

    return NextResponse.json({
      success: true,
      prescription: updatedPrescription,
      previousStatus: currentStatus,
      newStatus,
      journeyStatus: JOURNEY_STATUS_MAP[newStatus],
    });
  } catch (error) {
    console.error("Error updating script status:", error);
    return NextResponse.json({ error: "Failed to update script" }, { status: 500 });
  }
}

// POST /api/admin/scripts - Create prescription (for manual script creation)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !["ADMIN", "DOCTOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      patientId,
      medicationName,
      genericName,
      strength,
      form,
      dosage,
      frequency,
      instructions,
      quantity,
      quantityUnit,
      daysSupply,
      repeats,
      startDate,
      followUpDate,
      pharmacyNotes,
      safetyCounsellingNotes,
      diagnosis,
      notes,
    } = body;

    // Validate required fields
    if (!patientId || !medicationName || !dosage || !frequency || !form) {
      return NextResponse.json(
        { error: "patientId, medicationName, dosage, frequency, and form are required" },
        { status: 400 }
      );
    }

    // Verify patient exists
    const patient = await prisma.user.findUnique({
      where: { id: patientId },
      select: { id: true, firstName: true, lastName: true, email: true },
    });

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    const doctorName = `Dr. ${session.user.firstName || ""} ${session.user.lastName || ""}`.trim();

    // Create prescription
    const prescription = await prisma.prescription.create({
      data: {
        patientId,
        medicationName: medicationName.trim(),
        genericName: genericName?.trim() || null,
        strength: strength?.trim() || "",
        form,
        dosage: dosage.trim(),
        frequency: frequency.trim(),
        instructions: instructions?.trim() || null,
        quantity: quantity || 1,
        quantityUnit: quantityUnit?.trim() || "units",
        daysSupply: daysSupply || 28,
        refillsTotal: repeats || 0,
        refillsRemaining: repeats || 0,
        prescriberId: session.user.id,
        prescriberName: doctorName,
        status: "ACTIVE",
        scriptStatus: "SCRIPT_DRAFT",
        category: "WEIGHT_MANAGEMENT",
        diagnosis: diagnosis || "Weight management program",
        notes: notes?.trim() || null,
        pharmacyNotes: pharmacyNotes?.trim() || null,
        safetyCounsellingNotes: safetyCounsellingNotes?.trim() || null,
        startDate: startDate ? new Date(startDate) : new Date(),
        followUpDate: followUpDate ? new Date(followUpDate) : null,
        nextRefillDate: new Date(Date.now() + (daysSupply || 28) * 24 * 60 * 60 * 1000),
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: patientId,
        action: "PRESCRIPTION_CREATED",
        entity: "prescription",
        entityId: prescription.id,
        details: {
          createdBy: session.user.id,
          prescriberName: doctorName,
          scriptStatus: "SCRIPT_DRAFT",
          timestamp: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json({
      success: true,
      prescription,
      message: "Prescription created in DRAFT status",
    });
  } catch (error) {
    console.error("Error creating prescription:", error);
    return NextResponse.json({ error: "Failed to create prescription" }, { status: 500 });
  }
}
