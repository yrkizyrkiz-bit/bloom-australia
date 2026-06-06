import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import {
  CLINIC_TIMEZONE,
  formatDateInTimezone,
  formatTimeInTimezone,
  resolveAustralianTimezone,
} from "@/lib/australia-timezone";
import { buildAssessmentFromQuizData } from "@/lib/quiz-assessment";
import { resolvePlanTierFromStrings } from "@/lib/billing/catalog";

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

    // Fetch user (retry once for Neon cold-start / transient P1001)
    const userInclude = {
      weightGoals: {
        where: { status: "IN_PROGRESS" as const },
        take: 1,
        orderBy: { createdAt: "desc" as const },
      },
      internalNotes: {
        where: {
          OR: [
            { category: "MEDICAL" as const },
            { title: { contains: "Triage" } },
            { title: { contains: "Patient Motivations" } },
          ],
        },
        orderBy: { createdAt: "desc" as const },
      },
      invoices: {
        orderBy: { createdAt: "desc" as const },
      },
      consultationBookings: {
        orderBy: { scheduledAt: "desc" as const },
        take: 20,
      },
    };

    const fetchUser = () =>
      prisma.user.findUnique({
        where: { id: userId },
        include: userInclude,
      });

    let user;
    try {
      user = await fetchUser();
    } catch (firstError) {
      const code = (firstError as { code?: string })?.code;
      if (code === "P1001") {
        await new Promise((resolve) => setTimeout(resolve, 600));
        user = await fetchUser();
      } else {
        throw firstError;
      }
    }

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const patientTimezone =
      user.timezone ?? resolveAustralianTimezone(user.state, user.postcode) ?? CLINIC_TIMEZONE;

    const formatBookingDate = (scheduledAt: Date) =>
      formatDateInTimezone(scheduledAt, patientTimezone, {
        weekday: "short",
        day: "numeric",
        month: "short",
      });

    const formatBookingTime = (scheduledAt: Date) =>
      formatTimeInTimezone(scheduledAt, patientTimezone);

    let programMember = null;
    try {
      programMember = await prisma.programMember.findFirst({
        where: {
          OR: [{ email: user.email }, { userId }],
        },
      });
    } catch (e) {
      console.log("ProgramMember lookup failed:", e);
    }

    const wmIntake = await prisma.weightManagementIntake.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { quizData: true, completedAt: true, createdAt: true },
    });

    const quizData =
      (programMember?.intakeData as Record<string, unknown> | null) ||
      (wmIntake?.quizData as Record<string, unknown> | null) ||
      null;

    const booking = user.consultationBookings?.[0];

    // Build assessment data from quiz intake (ProgramMember or WeightManagementIntake)
    let assessment: Record<string, unknown> | null = null;

    if (quizData) {
      assessment = buildAssessmentFromQuizData(quizData, user, booking);
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
        consultationDate: booking?.scheduledAt ? formatBookingDate(new Date(booking.scheduledAt)) : "",
        consultationTime: booking?.scheduledAt ? formatBookingTime(new Date(booking.scheduledAt)) : "",
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

    const rawSurveyData = quizData;

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

    let billingSummary = null;
    try {
      const { getMemberBillingSummary } = await import(
        "@/lib/billing/member-billing-summary"
      );
      billingSummary = await getMemberBillingSummary(userId);
    } catch (billingError) {
      console.error("Billing summary failed for customer assessment:", billingError);
    }

    const paidInvoices = (user.invoices || []).filter((inv) => inv.status === "PAID");
    const firstPaidInvoice = paidInvoices[0];
    const fallbackPlanTier = resolvePlanTierFromStrings({
      selectedPlan: (wmIntake?.quizData as Record<string, unknown> | null)?.selectedPlan as string,
      subscriptionTier: user.subscriptionTier,
    });

    const fallbackSubscription =
      !billingSummary && (firstPaidInvoice || user.subscriptionTier)
        ? {
            id: membershipSubscription?.id || null,
            planName:
              fallbackPlanTier === "PRECISION"
                ? "Sanative Precision"
                : fallbackPlanTier === "CORE"
                  ? "Sanative Core"
                  : user.subscriptionTier || "Weight Management",
            amount: fallbackPlanTier === "PRECISION" ? 499 : fallbackPlanTier === "CORE" ? 349 : null,
            currency: "AUD",
            billingCycle: "monthly",
            status: user.subscriptionStatus || "INACTIVE",
            startDate: membershipSubscription?.startDate?.toISOString() || null,
            currentPeriodEnd: membershipSubscription?.currentPeriodEnd?.toISOString() || null,
            cancelledAt: membershipSubscription?.cancelledAt?.toISOString() || null,
            stripeCustomerId: membershipSubscription?.stripeCustomerId || null,
            stripeSubscriptionId: membershipSubscription?.stripeSubscriptionId || null,
            selectedPlan: fallbackPlanTier,
            firstMonth: firstPaidInvoice
              ? {
                  status: "paid" as const,
                  amountAud: firstPaidInvoice.amount,
                  paidAt: firstPaidInvoice.paidAt?.toISOString() || null,
                }
              : { status: "pending" as const, amountAud: null, paidAt: null },
            recurring: {
              status: "pending_approval",
              label: "Recurring billing starts after doctor approval / welcome call",
              amountAud: fallbackPlanTier === "PRECISION" ? 499 : 349,
              billingLabel: "Monthly",
              paidTill: null,
              nextBillingDate: null,
            },
            availableCadences: [],
            history: [],
          }
        : null;

    return NextResponse.json({
      assessment,
      orders,
      biomarkerPurchases,
      rawSurveyData,
      submittedAt:
        wmIntake?.completedAt?.toISOString() ||
        programMember?.createdAt?.toISOString() ||
        user.createdAt?.toISOString(),
      program: programMember?.program || user.subscriptionTier,
      // Additional data for customer detail page
      notes: user.internalNotes || [],
      biomarkers: biomarkerResults,
      weightLogs,
      healthScores,
      prescriptions,
      invoices: user.invoices || [],
      bookings: (user.consultationBookings || []).map((b) => ({
        id: b.id,
        status: b.status,
        scheduledAt: b.scheduledAt?.toISOString() ?? null,
        doctorName: b.doctorName,
        bookingType: b.bookingType,
        duration: b.duration,
      })),
      billingSummary,
      // Legacy subscription shape for backward compatibility
      subscription: billingSummary
        ? {
            id: billingSummary.subscription?.id || membershipSubscription?.id || null,
            planName: billingSummary.planLabel,
            amount: billingSummary.recurring.amountAud ?? membershipSubscription?.amount ?? null,
            currency: "AUD",
            billingCycle:
              billingSummary.recurring.billingInterval?.toLowerCase() ||
              membershipSubscription?.billingCycle ||
              "monthly",
            status:
              billingSummary.subscription?.status ||
              (billingSummary.firstMonth.status === "paid" &&
              billingSummary.recurring.status === "pending_approval"
                ? "PENDING_APPROVAL"
                : membershipSubscription?.status || "INACTIVE"),
            startDate:
              billingSummary.subscription?.currentPeriodStart ||
              membershipSubscription?.startDate?.toISOString() ||
              null,
            currentPeriodEnd:
              billingSummary.recurring.paidTill ||
              membershipSubscription?.currentPeriodEnd?.toISOString() ||
              null,
            cancelledAt: membershipSubscription?.cancelledAt?.toISOString() || null,
            stripeCustomerId:
              billingSummary.subscription?.stripeCustomerId ||
              membershipSubscription?.stripeCustomerId ||
              null,
            stripeSubscriptionId:
              billingSummary.subscription?.stripeSubscriptionId ||
              membershipSubscription?.stripeSubscriptionId ||
              null,
            selectedPlan: billingSummary.selectedPlan,
            firstMonth: billingSummary.firstMonth,
            recurring: billingSummary.recurring,
            availableCadences: billingSummary.availableCadences,
            history: billingSummary.history,
          }
        : membershipSubscription
          ? {
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
            }
          : fallbackSubscription,
    });
  } catch (error) {
    console.error("Error fetching customer assessment:", error);
    return NextResponse.json(
      { error: "Failed to fetch assessment data" },
      { status: 500 }
    );
  }
}
