import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Fetch prescriptions
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get("patientId");
    const status = searchParams.get("status");
    const category = searchParams.get("category");
    const needsRefill = searchParams.get("needsRefill") === "true";

    // Determine what to fetch based on role
    const isAdmin = session.user.role === "ADMIN";
    const targetPatientId = isAdmin && patientId ? patientId : session.user.id;

    // Build where clause
    const where: Record<string, unknown> = {};

    if (!isAdmin || patientId) {
      where.patientId = targetPatientId;
    }

    if (status) {
      where.status = status;
    }

    if (category) {
      where.category = category;
    }

    // Filter for prescriptions that need refill soon (within 7 days)
    if (needsRefill) {
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
      where.nextRefillDate = { lte: sevenDaysFromNow };
      where.status = "ACTIVE";
      where.refillsRemaining = { gt: 0 };
    }

    const prescriptions = await prisma.prescription.findMany({
      where,
      include: {
        refills: {
          orderBy: { requestedAt: "desc" },
          take: 5,
        },
      },
      orderBy: [
        { status: "asc" },
        { nextRefillDate: "asc" },
      ],
    });

    // Get patient info if admin
    let patients: Record<string, { firstName: string; lastName: string; email: string }> = {};
    if (isAdmin && !patientId) {
      const patientIds = [...new Set(prescriptions.map(p => p.patientId))];
      const patientList = await prisma.user.findMany({
        where: { id: { in: patientIds } },
        select: { id: true, firstName: true, lastName: true, email: true },
      });
      patients = Object.fromEntries(patientList.map(p => [p.id, p]));
    }

    // Calculate stats
    const stats = {
      total: prescriptions.length,
      active: prescriptions.filter(p => p.status === "ACTIVE").length,
      pendingRefills: prescriptions.filter(p =>
        p.refills.some(r => r.status === "PENDING")
      ).length,
      needsRefillSoon: prescriptions.filter(p => {
        if (!p.nextRefillDate || p.refillsRemaining === 0) return false;
        const daysUntil = Math.ceil((new Date(p.nextRefillDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        return daysUntil <= 7 && daysUntil >= 0;
      }).length,
    };

    return NextResponse.json({
      prescriptions,
      patients,
      stats,
    });
  } catch (error) {
    console.error("Error fetching prescriptions:", error);
    return NextResponse.json({ error: "Failed to fetch prescriptions" }, { status: 500 });
  }
}

// POST - Create prescription (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "ADMIN") {
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
      route,
      quantity,
      quantityUnit,
      refillsTotal,
      daysSupply,
      startDate,
      endDate,
      pharmacyName,
      pharmacyAddress,
      pharmacyPhone,
      isPRN,
      isControlled,
      diagnosis,
      category,
      notes,
      patientNotes,
      sendEPrescription,
    } = body;

    if (!patientId || !medicationName || !strength || !dosage || !frequency || !quantity) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Calculate next refill date based on days supply
    let nextRefillDate: Date | null = null;
    if (daysSupply && daysSupply > 0) {
      nextRefillDate = new Date();
      nextRefillDate.setDate(nextRefillDate.getDate() + daysSupply - 7); // 7 days before running out
    }

    const prescription = await prisma.prescription.create({
      data: {
        patientId,
        medicationName,
        genericName,
        strength,
        form: form || "TABLET",
        dosage,
        frequency,
        instructions,
        route: route || "oral",
        quantity,
        quantityUnit: quantityUnit || "tablets",
        refillsTotal: refillsTotal || 0,
        refillsRemaining: refillsTotal || 0,
        daysSupply,
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : null,
        nextRefillDate,
        lastFilledAt: new Date(),
        prescriberId: session.user.id,
        prescriberName: `${session.user.firstName || ""} ${session.user.lastName || ""}`.trim() || "Admin",
        pharmacyName,
        pharmacyAddress,
        pharmacyPhone,
        isPRN: isPRN || false,
        isControlled: isControlled || false,
        diagnosis,
        category: category || "OTHER",
        notes,
        patientNotes,
        ePrescriptionSent: sendEPrescription || false,
        ePrescriptionSentAt: sendEPrescription ? new Date() : null,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "PRESCRIPTION_CREATED",
        entity: "prescription",
        entityId: prescription.id,
        details: {
          patientId,
          medicationName,
          strength,
        },
      },
    });

    // Create internal note for patient record
    await prisma.internalNote.create({
      data: {
        userId: patientId,
        memberId: patientId,
        authorId: session.user.id,
        authorName: `${session.user.firstName || ""} ${session.user.lastName || ""}`.trim() || "Admin",
        createdBy: session.user.id,
        category: "MEDICAL",
        title: `Prescription: ${medicationName} ${strength}`,
        content: `New prescription created:\n- ${medicationName} ${strength}\n- ${dosage} ${frequency}\n- ${refillsTotal} refills authorized`,
        isPinned: false,
      },
    });

    return NextResponse.json({ prescription });
  } catch (error) {
    console.error("Error creating prescription:", error);
    return NextResponse.json({ error: "Failed to create prescription" }, { status: 500 });
  }
}

// PATCH - Update prescription
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: "Prescription ID required" }, { status: 400 });
    }

    // Handle date conversions
    if (updateData.startDate) updateData.startDate = new Date(updateData.startDate);
    if (updateData.endDate) updateData.endDate = new Date(updateData.endDate);
    if (updateData.nextRefillDate) updateData.nextRefillDate = new Date(updateData.nextRefillDate);

    const prescription = await prisma.prescription.update({
      where: { id },
      data: updateData,
    });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "PRESCRIPTION_UPDATED",
        entity: "prescription",
        entityId: id,
        details: { updatedFields: Object.keys(updateData) },
      },
    });

    return NextResponse.json({ prescription });
  } catch (error) {
    console.error("Error updating prescription:", error);
    return NextResponse.json({ error: "Failed to update prescription" }, { status: 500 });
  }
}

// DELETE - Cancel/delete prescription
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const action = searchParams.get("action") || "cancel"; // cancel or delete

    if (!id) {
      return NextResponse.json({ error: "Prescription ID required" }, { status: 400 });
    }

    if (action === "delete") {
      await prisma.prescription.delete({ where: { id } });
    } else {
      await prisma.prescription.update({
        where: { id },
        data: { status: "CANCELLED" },
      });
    }

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: action === "delete" ? "PRESCRIPTION_DELETED" : "PRESCRIPTION_CANCELLED",
        entity: "prescription",
        entityId: id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting prescription:", error);
    return NextResponse.json({ error: "Failed to delete prescription" }, { status: 500 });
  }
}
