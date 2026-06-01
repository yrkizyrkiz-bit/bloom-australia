import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/admin/doctor/patient-brief/[id] - Get comprehensive patient brief
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !["ADMIN", "DOCTOR", "CARE_PARTNER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: userId } = await params;

    // Fetch comprehensive patient data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        dateOfBirth: true,
        gender: true,
        addressLine1: true,
        addressLine2: true,
        suburb: true,
        state: true,
        postcode: true,
        journeyStatus: true,
        approvalStatus: true,
        triageScore: true,
        subscriptionTier: true,
        createdAt: true,
        healthProfile: {
          select: {
            systolicBP: true,
            diastolicBP: true,
            onBPMedication: true,
            smokingStatus: true,
            familyHistoryCVD: true,
            exerciseFrequency: true,
          },
        },
        weightLogs: {
          orderBy: { measuredAt: "desc" },
          take: 5,
          select: {
            weight: true,
            measuredAt: true,
            notes: true,
          },
        },
        weightGoals: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            startWeight: true,
            targetWeight: true,
            currentWeight: true,
            notes: true,
          },
        },
        internalNotes: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            title: true,
            content: true,
            category: true,
            isPinned: true,
            createdAt: true,
            authorName: true,
          },
        },
        consultationBookings: {
          orderBy: { scheduledAt: "desc" },
          take: 5,
          select: {
            id: true,
            scheduledAt: true,
            status: true,
            completedAt: true,
            notes: true,
            doctorName: true,
            selectedPlan: true,
            riskFlags: true,
            patientBmi: true,
          },
        },
        biomarkerResults: {
          orderBy: { testedAt: "desc" },
          take: 20,
          select: {
            biomarkerId: true,
            value: true,
            status: true,
            testedAt: true,
            notes: true,
          },
        },
        prescriptions: {
          orderBy: { prescribedAt: "desc" },
          take: 5,
          select: {
            id: true,
            medicationName: true,
            dosage: true,
            frequency: true,
            status: true,
            prescribedAt: true,
            prescriberName: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    // Fetch program member data for quiz responses
    const programMember = await prisma.programMember.findUnique({
      where: { email: user.email },
      select: {
        intakeData: true,
        program: true,
        membershipStatus: true,
        membershipStart: true,
      },
    });

    // Calculate age
    const age = user.dateOfBirth
      ? Math.floor(
          (new Date().getTime() - new Date(user.dateOfBirth).getTime()) /
            (1000 * 60 * 60 * 24 * 365.25)
        )
      : null;

    // Calculate BMI
    const currentWeight = user.weightLogs[0]?.weight;
    const height = (programMember?.intakeData as Record<string, unknown>)?.height;
    let bmi: number | null = null;
    if (currentWeight && height) {
      const heightM = Number(height) / 100;
      bmi = Math.round((currentWeight / (heightM * heightM)) * 10) / 10;
    }

    // Extract intake data for structured display
    const intakeData = (programMember?.intakeData || {}) as Record<string, unknown>;

    // Categorize conditions from intake
    const conditions = {
      metabolic: (intakeData.metabolicConditions as string[]) || [],
      digestive: (intakeData.digestiveConditions as string[]) || [],
      cardiovascular: (intakeData.cardiovascularConditions as string[]) || [],
      mentalHealth: (intakeData.mentalHealthConditions as string[]) || [],
      serious: ((intakeData.seriousConditions as string[]) || []).filter(
        (c) => c !== "None of these apply"
      ),
    };

    // Extract medications
    const currentMedications = ((intakeData.currentMedications as string[]) || []).filter(
      (m) => m !== "None of the above"
    );

    // Extract motivations and goals
    const motivations = (intakeData.motivations as string[]) || [];
    const weightLossGoal = intakeData.weightLossGoal as string;
    const previousAttempts = (intakeData.previousAttempts as string[]) || [];

    // Identify risk flags
    const riskFlags: string[] = [];
    if (conditions.serious.length > 0) {
      riskFlags.push(...conditions.serious);
    }
    if (bmi && bmi >= 40) {
      riskFlags.push("BMI ≥ 40 (Class III Obesity)");
    }
    if (conditions.mentalHealth.some((c) =>
      c.toLowerCase().includes("anorexia") ||
      c.toLowerCase().includes("bulimia")
    )) {
      riskFlags.push("Eating disorder history");
    }
    if (currentMedications.includes("Insulin")) {
      riskFlags.push("On insulin therapy");
    }
    if (user.healthProfile?.systolicBP && user.healthProfile.systolicBP >= 180) {
      riskFlags.push("Severe hypertension");
    }

    // Build comprehensive brief
    const patientBrief = {
      // Basic Info
      patient: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: `${user.firstName} ${user.lastName}`.trim(),
        email: user.email,
        phone: user.phone,
        dateOfBirth: user.dateOfBirth?.toISOString() || null,
        age,
        gender: user.gender,
        address: [user.addressLine1, user.addressLine2, user.suburb, user.state, user.postcode]
          .filter(Boolean)
          .join(", "),
      },

      // Clinical Status
      status: {
        journeyStatus: user.journeyStatus,
        approvalStatus: user.approvalStatus,
        triageScore: user.triageScore,
        subscriptionTier: user.subscriptionTier,
        selectedPlan: user.consultationBookings[0]?.selectedPlan || null,
        registeredAt: user.createdAt.toISOString(),
      },

      // Weight & Metrics
      metrics: {
        currentWeight,
        startWeight: user.weightGoals[0]?.startWeight || currentWeight,
        targetWeight: user.weightGoals[0]?.targetWeight || null,
        height: height ? Number(height) : null,
        bmi,
        bmiCategory: bmi
          ? bmi < 18.5
            ? "Underweight"
            : bmi < 25
            ? "Normal"
            : bmi < 30
            ? "Overweight"
            : bmi < 35
            ? "Obese Class I"
            : bmi < 40
            ? "Obese Class II"
            : "Obese Class III"
          : null,
        weightHistory: user.weightLogs.map((w) => ({
          weight: w.weight,
          date: w.measuredAt.toISOString(),
        })),
      },

      // Health Profile
      healthProfile: {
        bloodPressure: user.healthProfile
          ? {
              systolic: user.healthProfile.systolicBP,
              diastolic: user.healthProfile.diastolicBP,
              onMedication: user.healthProfile.onBPMedication,
            }
          : null,
        smokingStatus: user.healthProfile?.smokingStatus || "UNKNOWN",
        familyHistoryCVD: user.healthProfile?.familyHistoryCVD || false,
        exerciseFrequency: user.healthProfile?.exerciseFrequency || "UNKNOWN",
      },

      // Medical History
      medicalHistory: {
        conditions,
        currentMedications,
        hasContraindications: conditions.serious.length > 0,
      },

      // Risk Assessment
      riskAssessment: {
        riskFlags,
        riskLevel:
          riskFlags.length >= 3
            ? "HIGH"
            : riskFlags.length >= 1
            ? "MODERATE"
            : "LOW",
        triageScore: user.triageScore,
        recommendation:
          riskFlags.length >= 3
            ? "Requires careful clinical review"
            : riskFlags.length >= 1
            ? "Review flagged conditions"
            : "Appears suitable for standard protocol",
      },

      // Patient Goals & Motivation
      patientGoals: {
        weightLossGoal,
        motivations,
        previousAttempts,
        otherGoals: (intakeData.otherGoals as string[]) || [],
      },

      // Clinical Notes
      clinicalNotes: user.internalNotes.map((note) => ({
        id: note.id,
        title: note.title,
        content: note.content,
        category: note.category,
        isPinned: note.isPinned,
        createdAt: note.createdAt.toISOString(),
        author: note.authorName,
      })),

      // Consultation History
      consultationHistory: user.consultationBookings.map((booking) => ({
        id: booking.id,
        scheduledAt: booking.scheduledAt.toISOString(),
        status: booking.status,
        completedAt: booking.completedAt?.toISOString() || null,
        doctorName: booking.doctorName,
        notes: booking.notes,
      })),

      // Biomarker Results (if any)
      biomarkers:
        user.biomarkerResults.length > 0
          ? user.biomarkerResults.map((r) => ({
              biomarkerId: r.biomarkerId,
              value: r.value,
              status: r.status,
              testedAt: r.testedAt.toISOString(),
            }))
          : null,

      // Previous Prescriptions
      prescriptionHistory: user.prescriptions.map((rx) => ({
        id: rx.id,
        medication: rx.medicationName,
        dosage: rx.dosage,
        frequency: rx.frequency,
        status: rx.status,
        prescribedAt: rx.prescribedAt.toISOString(),
        prescriber: rx.prescriberName,
      })),

      // Intake Data (raw, for reference)
      rawIntakeData: intakeData,
    };

    // Log brief access for audit
    await prisma.activityLog.create({
      data: {
        userId,
        action: "PATIENT_BRIEF_VIEWED",
        entity: "patient_brief",
        entityId: userId,
        details: {
          viewedBy: session.user.id,
          viewerRole: session.user.role,
          timestamp: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json(patientBrief);
  } catch (error) {
    console.error("Error fetching patient brief:", error);
    return NextResponse.json(
      { error: "Failed to fetch patient brief" },
      { status: 500 }
    );
  }
}
