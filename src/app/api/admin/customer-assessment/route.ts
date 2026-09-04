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
import {
  buildAssessmentFromQuizData,
  resolveLegacyHairSurveyData,
  resolveWeightManagementQuizData,
} from "@/lib/quiz-assessment";
import { resolvePlanTierFromStrings } from "@/lib/billing/catalog";
import { getLatestPortalQuizSubmissions, getAllPortalQuizSubmissions } from "@/lib/portal-quiz-submissions";
import { getMemberBillingOverview, billingSummaryToAdminSubscription } from "@/lib/billing/member-billing-summary";
import { calculateBiomarkerStatus } from "@/lib/biomarker-status";
import {
  hasPaidMemberJourney,
  isProspectiveEnrollment,
} from "@/lib/funnel/member-enrollment-phase";
import { syncMemberQuizArtifacts } from "@/lib/portal/persist-prior-program-quiz";
import { isProgramQuizIntakeNote } from "@/lib/portal-quiz-display";

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

    const [userResult, programMemberResult, wmIntake] = await Promise.all([
      fetchUser().catch(async (firstError) => {
        const code = (firstError as { code?: string })?.code;
        if (code === "P1001") {
          await new Promise((resolve) => setTimeout(resolve, 600));
          return fetchUser();
        }
        throw firstError;
      }),
      prisma.programMember.findFirst({
        where: {
          OR: [{ userId }],
        },
      }).catch((e) => {
        console.log("ProgramMember lookup failed:", e);
        return null;
      }),
      prisma.weightManagementIntake.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
        select: { quizData: true, completedAt: true, createdAt: true, selectedPlan: true },
      }),
    ]);

    const user = userResult;
    let programMember = programMemberResult;

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    await syncMemberQuizArtifacts(userId).catch((err) =>
      console.warn("[customer-assessment] quiz artifact sync failed:", err)
    );

    programMember = await prisma.programMember.findFirst({
      where: {
        OR: [{ userId }, ...(user.email ? [{ email: user.email }] : [])],
      },
      orderBy: { updatedAt: "desc" },
    });

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

    const programIntakeData =
      (programMember?.intakeData as Record<string, unknown> | null) || null;

    const weightManagementQuizData = resolveWeightManagementQuizData({
      wmIntakeQuizData: (wmIntake?.quizData as Record<string, unknown> | null) || null,
      programMemberProgram: programMember?.program,
      programMemberIntake: programIntakeData,
    });

    const booking = user.consultationBookings?.[0];

    // Build assessment data from weight management quiz intake only
    let assessment: Record<string, unknown> | null = null;

    if (weightManagementQuizData) {
      assessment = buildAssessmentFromQuizData(weightManagementQuizData, user, booking);
    } else if (
      (user.subscriptionTier === "weight_management" ||
        programMember?.program === "WEIGHT_MANAGEMENT") &&
      user.internalNotes &&
      user.internalNotes.length > 0
    ) {
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

    const quizNoteCleanup: Array<{ title: { startsWith: string } } | { title: { in: string[] } }> = [
      { title: { startsWith: "Hair Loss," } },
      { title: { startsWith: "Men's Health," } },
      { title: { startsWith: "Men's Sexual Health," } },
      { title: { startsWith: "Women's Health," } },
    ];
    if (weightManagementQuizData) {
      quizNoteCleanup.push(
        { title: { startsWith: "Triage," } },
        {
          title: {
            in: [
              "Patient Motivations",
              "Previous Weight Loss Attempts",
              "Previous Treatment",
              "Exercise Frequency",
              "Waist Measurement",
              "Preferred Start Timing",
            ],
          },
        }
      );
    }
    await prisma.internalNote
      .deleteMany({
        where: {
          userId,
          createdBy: "system",
          OR: quizNoteCleanup,
        },
      })
      .catch((err) =>
        console.warn("[customer-assessment] program quiz note cleanup failed:", err)
      );

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

    const rawSurveyData = resolveLegacyHairSurveyData({
      programMemberProgram: programMember?.program,
      programMemberIntake: programIntakeData,
    });

    const [
      biomarkerResults,
      weightLogs,
      healthScores,
      prescriptions,
      membershipSubscription,
      portalQuizzes,
      portalQuizAllSubmissions,
      billingOverview,
    ] = await Promise.all([
      prisma.biomarkerResult.findMany({
        where: { userId },
        include: { biomarker: true },
        orderBy: [{ testedAt: "desc" }, { biomarkerId: "asc" }],
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
      getLatestPortalQuizSubmissions(userId).catch((e) => {
        console.warn("[customer-assessment] PortalQuizSubmission lookup failed:", e);
        return [];
      }),
      getAllPortalQuizSubmissions(userId).catch((e) => {
        console.warn("[customer-assessment] PortalQuizSubmission history lookup failed:", e);
        return [];
      }),
      getMemberBillingOverview(userId).catch((billingError) => {
        console.error("Billing summary failed for customer assessment:", billingError);
        return null;
      }),
    ]);

    const biomarkersForResponse = biomarkerResults.map((result) => ({
      ...result,
      status: calculateBiomarkerStatus(
        result.value,
        result.biomarker,
        user.gender
      ),
    }));

    let billingSummary = null;
    let programSubscriptions: ReturnType<typeof billingSummaryToAdminSubscription>[] = [];
    if (billingOverview) {
      billingSummary = billingOverview.programs[0] ?? null;
      programSubscriptions = billingOverview.programs.map((program) =>
        billingSummaryToAdminSubscription(program, membershipSubscription)
      );
    }

    const paidInvoices = (user.invoices || []).filter((inv) => inv.status === "PAID");
    const firstPaidInvoice = paidInvoices[0];
    const fallbackPlanTier = resolvePlanTierFromStrings({
      selectedPlan: (wmIntake?.quizData as Record<string, unknown> | null)?.selectedPlan as string,
      subscriptionTier: user.subscriptionTier,
    });

    const fallbackSubscription =
      !billingSummary &&
      (firstPaidInvoice ||
        (user.subscriptionTier && hasPaidMemberJourney(user.journeyStatus)))
        ? {
            id: membershipSubscription?.id || null,
            planName:
              user.subscriptionTier === "membership" ||
              user.subscriptionTier === "sanative_membership"
                ? "Sanative Membership"
                : user.subscriptionTier || "Weight Management",
            amount: membershipSubscription?.amount ?? null,
            currency: "AUD",
            billingCycle: membershipSubscription?.billingCycle || "yearly",
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
              amountAud: membershipSubscription?.amount ?? null,
              billingLabel: membershipSubscription?.billingCycle || "Annual",
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
      portalQuizzes: portalQuizzes.map((q) => ({
        id: q.id,
        programKey: q.programKey,
        answers: q.answers,
        result: q.result,
        intent: q.intent,
        source: q.source,
        submittedAt: q.submittedAt.toISOString(),
      })),
      portalQuizAllSubmissions: portalQuizAllSubmissions.map((q) => ({
        id: q.id,
        programKey: q.programKey,
        answers: q.answers,
        result: q.result,
        intent: q.intent,
        source: q.source,
        submittedAt: q.submittedAt.toISOString(),
      })),
      submittedAt:
        wmIntake?.completedAt?.toISOString() ||
        programMember?.createdAt?.toISOString() ||
        user.createdAt?.toISOString(),
      program: programMember?.program || user.subscriptionTier,
      // Additional data for customer detail page
      notes: (user.internalNotes || []).filter((note) => !isProgramQuizIntakeNote(note)),
      biomarkers: biomarkersForResponse,
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
      billingOverview,
      programSubscriptions,
      isProspectiveEnrollment: isProspectiveEnrollment({
        memberStatus: user.memberStatus,
        journeyStatus: user.journeyStatus,
      }),
      // Legacy subscription shape for backward compatibility
      subscription:
        programSubscriptions[0] ??
        (membershipSubscription
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
          : fallbackSubscription),
    });
  } catch (error) {
    console.error("Error fetching customer assessment:", error);
    return NextResponse.json(
      { error: "Failed to fetch assessment data" },
      { status: 500 }
    );
  }
}
