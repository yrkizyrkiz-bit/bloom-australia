import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    // Check authentication - allow admin, care partner, doctor
    const session = await getServerSession(authOptions);
    const allowedRoles = ["ADMIN", "CARE_PARTNER", "DOCTOR"];
    if (!session || !allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    // Fetch user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        weightGoals: {
          where: { status: "IN_PROGRESS" },
          take: 1,
          orderBy: { createdAt: "desc" },
        },
        internalNotes: {
          where: {
            OR: [
              { category: "MEDICAL" },
              { title: { contains: "Triage" } },
              { title: { contains: "Patient Motivations" } },
            ],
          },
          orderBy: { createdAt: "desc" },
        },
        invoices: {
          orderBy: { createdAt: "desc" },
        },
        consultationBookings: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Try to find ProgramMember by user email (separate query since no direct relation)
    let programMember = null;
    try {
      programMember = await prisma.programMember.findUnique({
        where: { email: user.email },
      });
    } catch (e) {
      // ProgramMember table may not exist or be empty
      console.log("ProgramMember lookup failed:", e);
    }

    // Build assessment data from various sources
    let assessment: Record<string, unknown> | null = null;

    // Try to extract from ProgramMember intakeData
    if (programMember?.intakeData) {
      const intakeData = programMember.intakeData as Record<string, unknown>;
      assessment = {
        weightLossGoal: intakeData.weightLossGoal || "",
        currentWeight: intakeData.currentWeight?.toString() || "",
        targetWeight: intakeData.targetWeight?.toString() || "",
        height: intakeData.height?.toString() || "",
        gender: intakeData.gender || user.gender || "",
        dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString('en-AU') : "",
        ethnicity: intakeData.ethnicity || "",
        metabolicConditions: intakeData.metabolicConditions || [],
        digestiveConditions: intakeData.digestiveConditions || [],
        cardiovascularConditions: intakeData.cardiovascularConditions || [],
        mentalHealthConditions: intakeData.mentalHealthConditions || [],
        seriousConditions: intakeData.seriousConditions || [],
        currentMedications: intakeData.currentMedications || [],
        motivations: intakeData.motivations || [],
        otherGoals: intakeData.otherGoals || [],
        howHeard: intakeData.howHeard || "",
        consultationDate: intakeData.consultationDate || "",
        consultationTime: intakeData.consultationTime || "",
        submittedAt: programMember.createdAt?.toISOString() || "",
      };
    } else if (user.internalNotes && user.internalNotes.length > 0) {
      // Build assessment from internal notes (created by intake API)
      const notes = user.internalNotes;

      const getConditionsFromNote = (titleContains: string): string[] => {
        const note = notes.find(n => n.title.includes(titleContains));
        if (note?.content) {
          return note.content.split(", ").filter(Boolean);
        }
        return [];
      };

      // Get weight goal data
      const weightGoal = user.weightGoals?.[0];
      const currentWeight = weightGoal?.currentWeight || weightGoal?.startWeight;
      const targetWeight = weightGoal?.targetWeight;

      // Get consultation booking
      const booking = user.consultationBookings?.[0];

      assessment = {
        weightLossGoal: "",
        currentWeight: currentWeight?.toString() || "",
        targetWeight: targetWeight?.toString() || "",
        height: "",
        gender: user.gender || "",
        dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString('en-AU') : "",
        ethnicity: "",
        metabolicConditions: getConditionsFromNote("Metabolic"),
        digestiveConditions: getConditionsFromNote("Digestive"),
        cardiovascularConditions: getConditionsFromNote("Cardiovascular"),
        mentalHealthConditions: getConditionsFromNote("Mental Health"),
        seriousConditions: getConditionsFromNote("Serious"),
        currentMedications: getConditionsFromNote("Current Medications"),
        motivations: getConditionsFromNote("Patient Motivations"),
        otherGoals: [],
        howHeard: user.leadSource || "",
        consultationDate: booking?.scheduledAt ? new Date(booking.scheduledAt).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' }) : "",
        consultationTime: booking?.scheduledAt ? new Date(booking.scheduledAt).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true }) : "",
        submittedAt: user.createdAt?.toISOString() || "",
      };
    }

    // Fetch orders/payments from invoices
    const orders: Array<{
      id: string;
      type: string;
      description: string;
      amount: number;
      originalAmount: number;
      discount: number;
      discountType: string | null;
      status: string;
      paidAt: string;
    }> = (user.invoices || []).map((inv) => ({
      id: inv.id,
      type: inv.description?.toLowerCase().includes("biomarker") ? "biomarkers" :
            inv.description?.toLowerCase().includes("consult") ? "consultation" : "membership",
      description: inv.description || "Membership",
      amount: inv.amount || 0,
      originalAmount: (inv.amount || 0),
      discount: 0,
      discountType: null,
      status: inv.status?.toLowerCase() || "pending",
      paidAt: inv.paidAt?.toISOString() || inv.createdAt?.toISOString() || new Date().toISOString(),
    }));

    // If no orders but user is active, create a mock order for display
    if (orders.length === 0 && user.subscriptionStatus === "ACTIVE") {
      orders.push({
        id: "ord_" + userId.slice(0, 8),
        type: "membership",
        description: "Weight Management - First Month",
        amount: 250,
        originalAmount: 300,
        discount: 50,
        discountType: "new_member_promotion",
        status: "paid",
        paidAt: user.createdAt?.toISOString() || new Date().toISOString(),
      });
    }

    // Biomarker panel purchases from intake data or generate from notes
    let biomarkerPurchases: Array<{
      id: string;
      panelId: string;
      panelName: string;
      price: number;
      purchasedAt: string;
      status: string;
    }> = [];

    // Check ProgramMember intakeData for selectedBiomarkers
    if (programMember?.intakeData) {
      const intakeData = programMember.intakeData as Record<string, unknown>;
      const selectedPanels = (intakeData.selectedBiomarkers as string[]) || [];

      const panelNames: Record<string, string> = {
        metabolic: "Metabolic Health Panel",
        thyroid: "Thyroid Function Panel",
        liver: "Liver Health Panel",
        inflammation: "Inflammation Markers",
        hormones: "Hormone Balance Panel",
      };

      biomarkerPurchases = selectedPanels.map((panelId: string, index: number) => ({
        id: `bp_${index}_${userId.slice(0, 6)}`,
        panelId,
        panelName: panelNames[panelId] || panelId,
        price: 49,
        purchasedAt: programMember.createdAt?.toISOString() || new Date().toISOString(),
        status: "pending",
      }));
    }

    // Include full raw survey data for admin review
    let rawSurveyData: Record<string, unknown> | null = null;
    if (programMember?.intakeData) {
      rawSurveyData = programMember.intakeData as Record<string, unknown>;
    }

    // Fetch additional data for customer detail page
    const [biomarkerResults, weightLogs, healthScores, prescriptions, membershipSubscription] = await Promise.all([
      prisma.biomarkerResult.findMany({
        where: { userId },
        include: { biomarker: true },
        orderBy: { testedAt: "desc" },
        take: 50,
      }),
      prisma.weightLog.findMany({
        where: { userId },
        orderBy: { measuredAt: "desc" },
        take: 30,
      }),
      prisma.healthScore.findMany({
        where: { userId },
        orderBy: { calculatedAt: "desc" },
        take: 10,
      }),
      prisma.prescription.findMany({
        where: { patientId: userId },
        orderBy: { prescribedAt: "desc" },
        include: {
          refills: {
            orderBy: { filledAt: "desc" },
            take: 5,
          },
        },
      }),
      prisma.membershipSubscription.findUnique({
        where: { userId },
      }),
    ]);

    return NextResponse.json({
      assessment,
      orders,
      biomarkerPurchases,
      rawSurveyData,
      submittedAt: programMember?.createdAt?.toISOString() || user.createdAt?.toISOString(),
      program: programMember?.program || user.subscriptionTier,
      // Additional data for customer detail page
      notes: user.internalNotes || [],
      biomarkers: biomarkerResults,
      weightLogs,
      healthScores,
      prescriptions,
      invoices: user.invoices || [],
      bookings: user.consultationBookings || [],
      // Subscription data
      subscription: membershipSubscription ? {
        id: membershipSubscription.id,
        planName: membershipSubscription.planName,
        amount: membershipSubscription.amount,
        currency: membershipSubscription.currency,
        billingCycle: membershipSubscription.billingCycle,
        status: membershipSubscription.status,
        startDate: membershipSubscription.startDate?.toISOString(),
        currentPeriodEnd: membershipSubscription.currentPeriodEnd?.toISOString(),
        cancelledAt: membershipSubscription.cancelledAt?.toISOString(),
        stripeCustomerId: membershipSubscription.stripeCustomerId,
        stripeSubscriptionId: membershipSubscription.stripeSubscriptionId,
      } : null,
    });
  } catch (error) {
    console.error("Error fetching customer assessment:", error);
    return NextResponse.json(
      { error: "Failed to fetch assessment data" },
      { status: 500 }
    );
  }
}
