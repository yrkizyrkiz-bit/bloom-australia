import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// GAP-021: Patient cannot self-add medications - all prescriptions are doctor-prescribed
// GAP-027: Surface script/pharmacy/dispensing statuses

// Script status descriptions for the patient portal
const SCRIPT_STATUS_DESCRIPTIONS: Record<string, { label: string; description: string }> = {
  SCRIPT_DRAFT: { label: "Script being prepared", description: "Your doctor is preparing your prescription" },
  SCRIPT_WRITTEN: { label: "Script written", description: "Your prescription has been written" },
  SCRIPT_SENT_TO_PHARMACY: { label: "Sent to pharmacy", description: "Your prescription has been sent to the pharmacy" },
  PHARMACY_PENDING: { label: "At pharmacy", description: "Pharmacy is preparing your medication" },
  DISPENSING: { label: "Being dispensed", description: "Your medication is being dispensed" },
  SHIPPED: { label: "Shipped", description: "Your medication has been shipped" },
  DELIVERED: { label: "Delivered", description: "Your medication has been delivered" },
};

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || session.user.id;

    // Only admin can view other users' prescriptions
    if (userId !== session.user.id && session.user.role?.toUpperCase() !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch user's journey status for context
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        journeyStatus: true,
        approvalStatus: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fetch doctor-prescribed medications from Prescription model
    const prescriptions = await prisma.prescription.findMany({
      where: {
        patientId: userId,
        status: "ACTIVE",
        category: "WEIGHT_MANAGEMENT",
      },
      select: {
        id: true,
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
        prescriberName: true,
        pharmacyName: true,
        pharmacyPhone: true,
        pharmacyAddress: true,
        status: true,
        scriptStatus: true,
        startDate: true,
        followUpDate: true,
        nextRefillDate: true,
        ePrescriptionId: true,
        ePrescriptionSent: true,
        createdAt: true,
        refills: {
          where: { status: { in: ["SHIPPED", "DELIVERED"] } },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            id: true,
            status: true,
            trackingNumber: true,
            deliveryMethod: true,
            filledAt: true,
            deliveredAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Transform prescriptions for patient portal
    const treatments = prescriptions.map((rx) => {
      const statusInfo = SCRIPT_STATUS_DESCRIPTIONS[rx.scriptStatus] || {
        label: rx.scriptStatus,
        description: "Status information unavailable",
      };

      // Calculate days into treatment
      const startDate = rx.startDate || rx.createdAt;
      const daysIntoTreatment = Math.floor((Date.now() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24));

      // Get latest refill info (for shipping tracking)
      const latestRefill = rx.refills[0];

      return {
        id: rx.id,
        // Medication details (safe for patient to see)
        medicationName: rx.medicationName,
        genericName: rx.genericName,
        strength: rx.strength,
        form: rx.form,
        dosage: rx.dosage,
        frequency: rx.frequency,
        instructions: rx.instructions,
        // Prescription status
        status: rx.status,
        scriptStatus: rx.scriptStatus,
        scriptStatusLabel: statusInfo.label,
        scriptStatusDescription: statusInfo.description,
        // Timing
        startDate: rx.startDate,
        followUpDate: rx.followUpDate,
        nextRefillDate: rx.nextRefillDate,
        daysSupply: rx.daysSupply,
        daysIntoTreatment,
        // Refills
        refillsTotal: rx.refillsTotal,
        refillsRemaining: rx.refillsRemaining,
        // Provider info (safe for patient)
        prescriberName: rx.prescriberName,
        pharmacyName: rx.pharmacyName,
        pharmacyPhone: rx.pharmacyPhone,
        // Shipping (if applicable)
        isShipped: rx.scriptStatus === "SHIPPED" || rx.scriptStatus === "DELIVERED",
        isDelivered: rx.scriptStatus === "DELIVERED",
        trackingNumber: latestRefill?.trackingNumber || null,
        deliveryMethod: latestRefill?.deliveryMethod || null,
        deliveredAt: latestRefill?.deliveredAt || null,
        // Flags
        isActive: rx.status === "ACTIVE",
        isReadyForNextRefill: rx.refillsRemaining > 0 && rx.nextRefillDate && new Date(rx.nextRefillDate) <= new Date(),
      };
    });

    // Determine overall treatment status
    const hasPrescription = treatments.length > 0;
    const activeTreatment = treatments.find((t) => t.isActive);
    const isApproved = user.approvalStatus === "APPROVED" || user.approvalStatus === "APPROVED_WITH_TESTS";

    return NextResponse.json({
      // Treatment list
      treatments,
      // Summary
      hasPrescription,
      isApproved,
      activeTreatmentCount: treatments.filter((t) => t.isActive).length,
      // Current treatment status (for timeline)
      currentScriptStatus: activeTreatment?.scriptStatus || null,
      currentScriptStatusLabel: activeTreatment?.scriptStatusLabel || null,
      currentScriptStatusDescription: activeTreatment?.scriptStatusDescription || null,
      // Journey context
      journeyStatus: user.journeyStatus,
      approvalStatus: user.approvalStatus,
    });
  } catch (error) {
    console.error("Error fetching treatments:", error);
    return NextResponse.json({ error: "Failed to fetch treatments" }, { status: 500 });
  }
}

// GAP-021: Remove POST endpoint - patients cannot self-add medications
// All prescriptions must be created by doctors via the admin decision route
