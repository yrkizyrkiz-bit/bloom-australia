import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

// GET - Fetch refill requests
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const prescriptionId = searchParams.get("prescriptionId");
    const status = searchParams.get("status");
    const isAdmin = session.user.role === "ADMIN";

    // Build where clause
    const where: Record<string, unknown> = {};

    if (prescriptionId) {
      where.prescriptionId = prescriptionId;
    }

    if (status) {
      where.status = status;
    }

    // Non-admins can only see their own refills
    if (!isAdmin) {
      where.prescription = { patientId: session.user.id };
    }

    const refills = await prisma.prescriptionRefill.findMany({
      where,
      include: {
        prescription: {
          select: {
            id: true,
            medicationName: true,
            strength: true,
            patientId: true,
            refillsRemaining: true,
          },
        },
      },
      orderBy: { requestedAt: "desc" },
    });

    // Get patient info if admin
    let patients: Record<string, { firstName: string; lastName: string }> = {};
    if (isAdmin) {
      const patientIds = [...new Set(refills.map(r => r.prescription.patientId))];
      const patientList = await prisma.user.findMany({
        where: { id: { in: patientIds } },
        select: { id: true, firstName: true, lastName: true },
      });
      patients = Object.fromEntries(patientList.map(p => [p.id, p]));
    }

    return NextResponse.json({ refills, patients });
  } catch (error) {
    console.error("Error fetching refills:", error);
    return NextResponse.json({ error: "Failed to fetch refills" }, { status: 500 });
  }
}

// POST - Request a refill (patient) or process a refill (admin)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action, prescriptionId, refillId, ...data } = body;

    // Patient requesting a refill
    if (action === "request") {
      if (!prescriptionId) {
        return NextResponse.json({ error: "Prescription ID required" }, { status: 400 });
      }

      // Verify prescription belongs to user or user is admin
      const prescription = await prisma.prescription.findUnique({
        where: { id: prescriptionId },
      });

      if (!prescription) {
        return NextResponse.json({ error: "Prescription not found" }, { status: 404 });
      }

      if (prescription.patientId !== session.user.id && session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      if (prescription.status !== "ACTIVE") {
        return NextResponse.json({ error: "Prescription is not active" }, { status: 400 });
      }

      if (prescription.refillsRemaining <= 0) {
        return NextResponse.json({ error: "No refills remaining" }, { status: 400 });
      }

      // Check for pending refill request
      const pendingRefill = await prisma.prescriptionRefill.findFirst({
        where: {
          prescriptionId,
          status: { in: ["PENDING", "APPROVED", "PROCESSING"] },
        },
      });

      if (pendingRefill) {
        return NextResponse.json({
          error: "A refill request is already pending for this prescription"
        }, { status: 400 });
      }

      // Create refill request
      const refill = await prisma.prescriptionRefill.create({
        data: {
          prescriptionId,
          requestedBy: session.user.id,
          requestMethod: "APP",
          pharmacyName: data.pharmacyName || prescription.pharmacyName,
          deliveryMethod: data.deliveryMethod,
          notes: data.notes,
        },
      });

      // Log activity
      await prisma.activityLog.create({
        data: {
          userId: session.user.id,
          action: "REFILL_REQUESTED",
          entity: "prescription_refill",
          entityId: refill.id,
          details: { prescriptionId, medicationName: prescription.medicationName },
        },
      });

      return NextResponse.json({ refill, message: "Refill request submitted" });
    }

    // Admin processing a refill
    if (action === "process" && session.user.role === "ADMIN") {
      if (!refillId) {
        return NextResponse.json({ error: "Refill ID required" }, { status: 400 });
      }

      const refill = await prisma.prescriptionRefill.findUnique({
        where: { id: refillId },
        include: { prescription: true },
      });

      if (!refill) {
        return NextResponse.json({ error: "Refill not found" }, { status: 404 });
      }

      const { status, quantityFilled, pharmacyName, filledAt, pickupDate, trackingNumber, notes, denialReason } = data;

      // Update refill
      const updatedRefill = await prisma.prescriptionRefill.update({
        where: { id: refillId },
        data: {
          status,
          processedAt: new Date(),
          processedBy: session.user.id,
          quantityFilled,
          pharmacyName,
          filledAt: filledAt ? new Date(filledAt) : status === "APPROVED" ? new Date() : null,
          pickupDate: pickupDate ? new Date(pickupDate) : null,
          trackingNumber,
          notes,
          denialReason,
        },
      });

      // If approved, update prescription refills remaining and next refill date
      if (status === "APPROVED" || status === "READY_FOR_PICKUP" || status === "SHIPPED") {
        const newRefillsRemaining = Math.max(0, refill.prescription.refillsRemaining - 1);

        let nextRefillDate: Date | null = null;
        if (refill.prescription.daysSupply && newRefillsRemaining > 0) {
          nextRefillDate = new Date();
          nextRefillDate.setDate(nextRefillDate.getDate() + refill.prescription.daysSupply - 7);
        }

        await prisma.prescription.update({
          where: { id: refill.prescriptionId },
          data: {
            refillsRemaining: newRefillsRemaining,
            lastFilledAt: new Date(),
            nextRefillDate,
            status: newRefillsRemaining === 0 ? "COMPLETED" : "ACTIVE",
          },
        });
      }

      // Send notification to patient
      const patient = await prisma.user.findUnique({
        where: { id: refill.prescription.patientId },
        select: { email: true, firstName: true },
      });

      if (patient?.email) {
        const statusMessages: Record<string, string> = {
          APPROVED: "Your refill request has been approved and is being processed.",
          DENIED: `Your refill request has been denied. Reason: ${denialReason || "Please contact us for more information."}`,
          READY_FOR_PICKUP: "Your medication is ready for pickup at the pharmacy.",
          SHIPPED: `Your medication has been shipped. Tracking: ${trackingNumber || "Will be provided soon."}`,
        };

        if (statusMessages[status]) {
          await sendEmail({
            to: patient.email,
            subject: `Refill Update: ${refill.prescription.medicationName}`,
            body: `Hi ${patient.firstName},\n\n${statusMessages[status]}\n\nMedication: ${refill.prescription.medicationName} ${refill.prescription.strength}\n\nIf you have any questions, please contact our care team.\n\nSanative Health`,
          });
        }
      }

      // Log activity
      await prisma.activityLog.create({
        data: {
          userId: session.user.id,
          action: `REFILL_${status}`,
          entity: "prescription_refill",
          entityId: refillId,
        },
      });

      return NextResponse.json({ refill: updatedRefill });
    }

    // Admin approving refill quickly
    if (action === "approve" && session.user.role === "ADMIN") {
      if (!refillId) {
        return NextResponse.json({ error: "Refill ID required" }, { status: 400 });
      }

      const refill = await prisma.prescriptionRefill.findUnique({
        where: { id: refillId },
        include: { prescription: true },
      });

      if (!refill) {
        return NextResponse.json({ error: "Refill not found" }, { status: 404 });
      }

      // Update refill status to approved
      const updatedRefill = await prisma.prescriptionRefill.update({
        where: { id: refillId },
        data: {
          status: "APPROVED",
          processedAt: new Date(),
          processedBy: session.user.id,
          quantityFilled: refill.prescription.quantity,
          filledAt: new Date(),
        },
      });

      // Update prescription
      const newRefillsRemaining = Math.max(0, refill.prescription.refillsRemaining - 1);
      let nextRefillDate: Date | null = null;
      if (refill.prescription.daysSupply && newRefillsRemaining > 0) {
        nextRefillDate = new Date();
        nextRefillDate.setDate(nextRefillDate.getDate() + refill.prescription.daysSupply - 7);
      }

      await prisma.prescription.update({
        where: { id: refill.prescriptionId },
        data: {
          refillsRemaining: newRefillsRemaining,
          lastFilledAt: new Date(),
          nextRefillDate,
        },
      });

      return NextResponse.json({ refill: updatedRefill, message: "Refill approved" });
    }

    // Admin denying refill
    if (action === "deny" && session.user.role === "ADMIN") {
      if (!refillId) {
        return NextResponse.json({ error: "Refill ID required" }, { status: 400 });
      }

      const updatedRefill = await prisma.prescriptionRefill.update({
        where: { id: refillId },
        data: {
          status: "DENIED",
          processedAt: new Date(),
          processedBy: session.user.id,
          denialReason: data.denialReason || "Refill denied by prescriber",
        },
      });

      return NextResponse.json({ refill: updatedRefill, message: "Refill denied" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error processing refill:", error);
    return NextResponse.json({ error: "Failed to process refill" }, { status: 500 });
  }
}
