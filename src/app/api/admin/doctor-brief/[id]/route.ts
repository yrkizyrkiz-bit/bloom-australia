import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GAP-014: Doctor Brief API
// Returns comprehensive patient information for doctor consultation

function calculateAge(dateOfBirth: Date | null): number | null {
  if (!dateOfBirth) return null;
  const today = new Date();
  let age = today.getFullYear() - dateOfBirth.getFullYear();
  const monthDiff = today.getMonth() - dateOfBirth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
    age--;
  }
  return age;
}

function getBMICategory(bmi: number | null): string | null {
  if (!bmi) return null;
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Normal";
  if (bmi < 30) return "Overweight";
  if (bmi < 35) return "Obese Class I";
  if (bmi < 40) return "Obese Class II";
  return "Obese Class III";
}

function calculateBMI(weight: number | null, height: number | null): number | null {
  if (!weight || !height) return null;
  const heightInMeters = height / 100;
  return weight / (heightInMeters * heightInMeters);
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: intakeId } = await params;

    // First try to find by intakeId in ConsultationBooking
    let consultation = await prisma.consultationBooking.findFirst({
      where: { intakeId },
      include: {
        user: {
          include: {
            healthProfile: true,
            weightLogs: {
              orderBy: { loggedAt: "desc" },
              take: 1,
            },
            internalNotes: {
              orderBy: { createdAt: "desc" },
              take: 10,
            },
          },
        },
      },
    });

    // If not found, try to find by booking ID
    if (!consultation) {
      consultation = await prisma.consultationBooking.findUnique({
        where: { id: intakeId },
        include: {
          user: {
            include: {
              healthProfile: true,
              weightLogs: {
                orderBy: { loggedAt: "desc" },
                take: 1,
              },
              internalNotes: {
                orderBy: { createdAt: "desc" },
                take: 10,
              },
            },
          },
        },
      });
    }

    // If still not found, try to find by user ID
    if (!consultation) {
      const user = await prisma.user.findUnique({
        where: { id: intakeId },
        include: {
          healthProfile: true,
          weightLogs: {
            orderBy: { loggedAt: "desc" },
            take: 1,
          },
          internalNotes: {
            orderBy: { createdAt: "desc" },
            take: 10,
          },
          consultationBookings: {
            orderBy: { scheduledAt: "desc" },
            take: 1,
          },
        },
      });

      if (user && user.consultationBookings.length > 0) {
        const booking = user.consultationBookings[0];
        // Create a consultation-like object with user data
        consultation = {
          ...booking,
          user: {
            ...user,
            healthProfile: user.healthProfile,
            weightLogs: user.weightLogs,
            internalNotes: user.internalNotes,
          },
        } as unknown as typeof consultation;
      }
    }

    if (!consultation || !consultation.user) {
      return NextResponse.json(
        { error: "Brief not found" },
        { status: 404 }
      );
    }

    const user = consultation.user;
    const healthProfile = user.healthProfile;

    // Get program member data for intake information
    const programMember = await prisma.programMember.findFirst({
      where: { userId: user.id },
    });

    const intakeData = (programMember?.intakeData as Record<string, unknown>) || {};

    // Extract medical history from intake data or health profile
    const medicalHistory = {
      conditions: (intakeData.conditions as string[]) || [],
      metabolicConditions: (intakeData.metabolicConditions as string[]) || [],
      digestiveConditions: (intakeData.digestiveConditions as string[]) || [],
      cardiovascularConditions: (intakeData.cardiovascularConditions as string[]) || [],
      mentalHealthConditions: (intakeData.mentalHealthConditions as string[]) || [],
      seriousConditions: (intakeData.seriousConditions as string[]) || [],
    };

    // Extract medications from intake data
    const rawMedications = (intakeData.currentMedications as string) || "";
    const medications = rawMedications
      .split(/[,;\n]/)
      .filter(Boolean)
      .map((med: string) => ({
        name: med.trim(),
        dose: null,
        frequency: null,
      }));

    // Extract allergies
    const allergies = (intakeData.allergies as string[]) || [];

    // Calculate metrics - height is stored in intake data, not healthProfile
    const weight = user.weightLogs[0]?.weight || (intakeData.currentWeight as number) || null;
    const height = (intakeData.height as number) || null;
    const bmi = calculateBMI(weight, height) || (intakeData.bmi as number) || null;

    const response = {
      patient: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName || "",
        fullName: `${user.firstName} ${user.lastName || ""}`.trim(),
        email: user.email,
        phone: user.phone || consultation.patientPhone,
        dateOfBirth: user.dateOfBirth?.toISOString() || null,
        age: calculateAge(user.dateOfBirth),
        gender: user.gender,
      },
      metrics: {
        height,
        weight,
        bmi,
        bmiCategory: getBMICategory(bmi),
      },
      consultation: {
        id: consultation.id,
        scheduledAt: consultation.scheduledAt.toISOString(),
        appointmentType: consultation.appointmentType,
        selectedPlan: consultation.selectedPlan,
        status: consultation.status,
        doctorName: consultation.doctorName,
      },
      medicalHistory,
      medications,
      allergies,
      riskFlags: consultation.riskFlags || [],
      consent: {
        status: "CONSENTED",
        consentedAt: (intakeData.consentedAt as string) || null,
        privacyAccepted: (intakeData.privacyAccepted as boolean) || true,
        termsAccepted: (intakeData.termsAccepted as boolean) || true,
      },
      payment: {
        status: consultation.paymentIntentId ? "PAID" : "PENDING",
        paymentIntentId: consultation.paymentIntentId,
        amount: consultation.selectedPlan === "PRECISION" ? 39900 : 24900,
        plan: consultation.selectedPlan,
      },
      intakeData,
      documents: [], // TODO: Implement document uploads
      notes: user.internalNotes.map((note) => ({
        id: note.id,
        content: note.content,
        category: note.category,
        createdAt: note.createdAt.toISOString(),
        authorName: note.authorName || "System",
      })),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching doctor brief:", error);
    return NextResponse.json(
      { error: "Failed to load doctor brief" },
      { status: 500 }
    );
  }
}
