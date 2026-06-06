import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/admin/doctor/my-patients - Get patients assigned to this doctor
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !["ADMIN", "DOCTOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const doctorId = searchParams.get("doctorId") || session.user.id;
    const includeCareComs = searchParams.get("includeCareComs") === "true";

    // Get all consultations assigned to this doctor
    const consultations = await prisma.consultationBooking.findMany({
      where: {
        doctorId,
      },
      select: {
        userId: true,
        scheduledAt: true,
        status: true,
        completedAt: true,
        selectedPlan: true,
      },
      distinct: ["userId"],
    });

    const patientIds = consultations
      .filter(c => c.userId)
      .map(c => c.userId as string);

    // Get unique patients assigned to this doctor
    const patients = await prisma.user.findMany({
      where: {
        id: { in: patientIds },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        dateOfBirth: true,
        gender: true,
        journeyStatus: true,
        approvalStatus: true,
        subscriptionStatus: true,
        subscriptionTier: true,
        triageScore: true,
        createdAt: true,
        // Health data
        weightLogs: {
          orderBy: { measuredAt: "desc" },
          take: 1,
          select: { weight: true, measuredAt: true },
        },
        weightGoals: {
          take: 1,
          select: { startWeight: true, targetWeight: true },
        },
        // Prescription data
        prescriptions: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            id: true,
            medicationName: true,
            status: true,
            scriptStatus: true,
            createdAt: true,
          },
        },
        // Latest consultation for this doctor
        consultationBookings: {
          where: { doctorId },
          orderBy: { scheduledAt: "desc" },
          take: 1,
          select: {
            id: true,
            scheduledAt: true,
            status: true,
            completedAt: true,
            selectedPlan: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculate patient stats
    let careCommunications: Array<{
      id: string;
      userId: string;
      patientName: string;
      type: string;
      priority: string | null;
      subject: string | null;
      notes: string | null;
      status: string;
      dueDate: string | null;
      createdAt: string;
    }> = [];

    if (includeCareComs) {
      // Get care communications for these patients
      const careComs = await prisma.careCommunication.findMany({
        where: {
          userId: { in: patientIds },
          status: { not: "COMPLETED" },
        },
        orderBy: [
          { priority: "desc" },
          { dueDate: "asc" },
        ],
        take: 50,
      });

      // Map patient names
      const patientMap = new Map(patients.map(p => [p.id, `${p.firstName} ${p.lastName}`]));

      careCommunications = careComs.map(cc => ({
        id: cc.id,
        userId: cc.userId,
        patientName: patientMap.get(cc.userId) || "Unknown",
        type: cc.type,
        priority: cc.priority,
        subject: cc.subject,
        notes: cc.notes,
        status: cc.status,
        dueDate: cc.dueDate?.toISOString() || null,
        createdAt: cc.createdAt.toISOString(),
      }));
    }

    // Transform patients with computed fields
    const transformedPatients = patients.map(patient => {
      const consultation = patient.consultationBookings[0];
      const prescription = patient.prescriptions[0];
      const currentWeight = patient.weightLogs[0]?.weight;
      const targetWeight = patient.weightGoals[0]?.targetWeight;

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

      // Calculate BMI
      const height = 170; // Default - should be stored in profile
      let bmi: number | null = null;
      if (currentWeight && height) {
        bmi = Math.round((currentWeight / Math.pow(height / 100, 2)) * 10) / 10;
      }

      return {
        id: patient.id,
        firstName: patient.firstName,
        lastName: patient.lastName,
        fullName: `${patient.firstName} ${patient.lastName}`.trim(),
        email: patient.email,
        phone: patient.phone,
        age,
        gender: patient.gender,
        journeyStatus: patient.journeyStatus,
        approvalStatus: patient.approvalStatus,
        subscriptionStatus: patient.subscriptionStatus,
        subscriptionTier: patient.subscriptionTier,
        triageScore: patient.triageScore,
        currentWeight,
        targetWeight,
        bmi,
        createdAt: patient.createdAt.toISOString(),
        // Latest consultation
        consultation: consultation ? {
          id: consultation.id,
          scheduledAt: consultation.scheduledAt.toISOString(),
          status: consultation.status,
          completedAt: consultation.completedAt?.toISOString() || null,
          selectedPlan: consultation.selectedPlan,
        } : null,
        // Latest prescription
        prescription: prescription ? {
          id: prescription.id,
          medicationName: prescription.medicationName,
          status: prescription.status,
          scriptStatus: prescription.scriptStatus,
        } : null,
      };
    });

    // Calculate stats
    const stats = {
      totalPatients: patients.length,
      activePatients: patients.filter(p => p.subscriptionStatus === "ACTIVE").length,
      pendingApproval: patients.filter(p => p.approvalStatus === "PENDING").length,
      approved: patients.filter(p => p.approvalStatus === "APPROVED").length,
      declined: patients.filter(p => p.approvalStatus === "DECLINED").length,
      pendingCareComms: careCommunications.filter(cc => cc.status === "PENDING").length,
      highPriorityCareComms: careCommunications.filter(cc => cc.priority === "HIGH").length,
    };

    return NextResponse.json({
      patients: transformedPatients,
      careCommunications,
      stats,
    });
  } catch (error) {
    console.error("Error fetching doctor's patients:", error);
    return NextResponse.json(
      { error: "Failed to fetch patients" },
      { status: 500 }
    );
  }
}
