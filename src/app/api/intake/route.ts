import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { resolveAustralianTimezone } from "@/lib/australia-timezone";

// ─── Program type definitions ─────────────────────────────────────────────────

export type ProgramType =
  | "WEIGHT_MANAGEMENT"
  | "WOMENS_HEALTH"
  | "MENS_HEALTH"
  | "HAIR_LOSS"
  | "FATTY_LIVER";

const PROGRAM_CONFIG: Record<ProgramType, {
  subscriptionTier: string;
  portalPath: string;
  carePartnerQueue: string;
  emailTemplateCategory: string;
  consultationAmount: number; // in AUD cents
}> = {
  WEIGHT_MANAGEMENT: {
    subscriptionTier:       "weight_management",
    portalPath:             "/dashboard/weight-management",
    carePartnerQueue:       "WEIGHT_MANAGEMENT_TRIAGE",
    emailTemplateCategory:  "WELCOME",
    consultationAmount:     4900, // $49
  },
  WOMENS_HEALTH: {
    subscriptionTier:       "womens_health",
    portalPath:             "/dashboard/womens-health",
    carePartnerQueue:       "WOMENS_HEALTH_TRIAGE",
    emailTemplateCategory:  "WELCOME",
    consultationAmount:     4900,
  },
  MENS_HEALTH: {
    subscriptionTier:       "mens_health",
    portalPath:             "/dashboard/mens-health",
    carePartnerQueue:       "MENS_HEALTH_TRIAGE",
    emailTemplateCategory:  "WELCOME",
    consultationAmount:     4900,
  },
  HAIR_LOSS: {
    subscriptionTier:       "hair_loss",
    portalPath:             "/dashboard/mens-health",
    carePartnerQueue:       "HAIR_LOSS_TRIAGE",
    emailTemplateCategory:  "WELCOME",
    consultationAmount:     4900,
  },
  FATTY_LIVER: {
    subscriptionTier:       "fatty_liver",
    portalPath:             "/dashboard/weight-management",
    carePartnerQueue:       "FATTY_LIVER_TRIAGE",
    emailTemplateCategory:  "WELCOME",
    consultationAmount:     4900,
  },
};

// ─── Main handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // Add CORS headers for cross-origin requests from promo site
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  try {
    const data = await req.json();

    // Log incoming data for debugging
    console.log("[Intake API] Received data:", {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      programType: data.programType,
    });

    const programType: ProgramType = data.programType || "WEIGHT_MANAGEMENT";
    const config = PROGRAM_CONFIG[programType];

    if (!config) {
      console.error("[Intake API] Unknown program type:", programType);
      return NextResponse.json(
        { error: `Unknown programType: ${programType}` },
        { status: 400, headers }
      );
    }

    // Validate required fields
    if (!data.email || !data.email.includes("@")) {
      console.error("[Intake API] Invalid email:", data.email);
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400, headers }
      );
    }

    // Guard: prevent duplicate registrations for COMPLETED users
    const existing = await prisma.user.findUnique({
      where: { email: data.email?.toLowerCase().trim() },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        email: true,
        passwordHash: true,
        journeyStatus: true,
        subscriptionStatus: true,
        dateOfBirth: true,
        createdAt: true,
      }
    });

    if (existing) {
      // Check if this is a COMPLETED user (has password or has paid)
      // vs an IN-PROGRESS intake (still filling out the quiz)
      const hasPassword = !!existing.passwordHash;
      const hasActiveSubscription = existing.subscriptionStatus === "ACTIVE";
      const completedJourneyStatuses = [
        "CONSULTATION_PAID", "PRE_TRIAGE_PENDING", "PRE_TRIAGE_COMPLETE",
        "AWAITING_DOCTOR_CALL", "CONSULT_COMPLETED", "AWAITING_DOCTOR_DECISION",
        "APPROVED", "DECLINED", "ACTIVE", "PAUSED", "CANCELLED"
      ];
      const hasCompletedJourney = completedJourneyStatuses.includes(existing.journeyStatus || "");

      // If user has completed registration, block updates (security)
      if (hasPassword || hasActiveSubscription || hasCompletedJourney) {
        console.log("[Intake API] Blocking update to completed user:", existing.email, {
          hasPassword,
          hasActiveSubscription,
          journeyStatus: existing.journeyStatus,
        });

        return NextResponse.json({
          error: "An account with this email already exists",
          code: "EMAIL_EXISTS",
          message: "Please log in to your existing account or use a different email address.",
          loginUrl: "/login",
        }, { status: 409, headers }); // 409 Conflict
      }

      // User is still in intake flow - update User record with new personal details
      // This is safe because we already blocked COMPLETED users above
      console.log("[Intake API] Existing in-progress user found:", existing.email);

      let intakeId: string | null = null;
      let intakeCreated = false;
      let intakeUpdated = false;
      let userUpdated = false;

      // Build the full quiz data object
      const fullQuizData = { ...data, submittedAt: new Date().toISOString() };

      // Check if this submission has more quiz data than what's stored
      const hasNewQuizData = data.metabolicConditions || data.seriousConditions ||
                             data.digestiveConditions || data.cardiovascularConditions ||
                             data.mentalHealthConditions || data.currentMedications ||
                             data.motivations || data.streetAddress;

      // ═══════════════════════════════════════════════════════════════════════
      // FIX: Update User record with personal details from full quiz submission
      // Previously only WeightManagementIntake was updated, leaving User with
      // minimal data (missing lastName, phone, DOB, gender, address)
      // ═══════════════════════════════════════════════════════════════════════
      if (hasNewQuizData) {
        try {
          const userUpdateData: Record<string, unknown> = {};

          // Personal details
          if (data.lastName) userUpdateData.lastName = data.lastName.trim();
          if (data.phone) userUpdateData.phone = data.phone.trim();
          if (data.dateOfBirth) userUpdateData.dateOfBirth = parseDOB(data.dateOfBirth);
          if (data.gender) userUpdateData.gender = mapGender(data.gender);

          // Address fields from shipping step
          if (data.streetAddress) userUpdateData.addressLine1 = data.streetAddress.trim();
          if (data.addressUnit) userUpdateData.addressLine2 = data.addressUnit.trim();
          if (data.suburb) userUpdateData.suburb = data.suburb.trim();
          if (data.state) userUpdateData.state = data.state.trim();
          if (data.postcode) userUpdateData.postcode = data.postcode.trim();
          if (data.state || data.postcode) {
            userUpdateData.timezone = resolveAustralianTimezone(
              (data.state as string) ?? undefined,
              (data.postcode as string) ?? undefined
            );
          }

          // Only update if we have fields to update
          if (Object.keys(userUpdateData).length > 0) {
            await prisma.user.update({
              where: { id: existing.id },
              data: userUpdateData,
            });
            userUpdated = true;
            console.log("[Intake API] Updated User record with personal details:", {
              userId: existing.id,
              fieldsUpdated: Object.keys(userUpdateData),
            });
          }
        } catch (userUpdateError) {
          console.error("[Intake API] Error updating User record:", userUpdateError);
          // Non-blocking - continue with intake creation
        }
      }

      // Check if WeightManagementIntake already exists for this user
      if (programType === "WEIGHT_MANAGEMENT") {
        const existingIntake = await prisma.weightManagementIntake.findFirst({
          where: { userId: existing.id },
          select: { id: true, quizData: true },
        });

        if (!existingIntake) {
          // CREATE new WeightManagementIntake with quiz data
          try {
            const intake = await prisma.weightManagementIntake.create({
              data: {
                userId: existing.id,
                selectedPlan: data.selectedPlan === "precision" ? "PRECISION" : "CORE",
                quizData: fullQuizData,
                portalStatus: data.streetAddress ? "INTAKE_COMPLETED" : "INTAKE_STARTED",
                completedAt: data.streetAddress ? new Date() : undefined,
                paymentStatus: "UNPAID",
                doctorReviewStatus: "PENDING_TRIAGE",
                bookingStatus: "NOT_BOOKED",
              },
            });
            intakeId = intake.id;
            intakeCreated = true;
            console.log("[Intake API] Created WeightManagementIntake for existing user:", {
              intakeId,
              userId: existing.id,
              hasQuizData: !!hasNewQuizData,
            });
          } catch (intakeError) {
            console.error("[Intake API] Error creating WeightManagementIntake:", intakeError);
          }
        } else {
          // UPDATE existing intake with new quiz data if this submission has more data
          intakeId = existingIntake.id;

          if (hasNewQuizData) {
            try {
              // Merge existing quiz data with new data (new data takes precedence)
              const existingQuizData = (existingIntake.quizData as Record<string, unknown>) || {};
              const mergedQuizData = { ...existingQuizData, ...fullQuizData };

              await prisma.weightManagementIntake.update({
                where: { id: existingIntake.id },
                data: {
                  quizData: mergedQuizData,
                  selectedPlan: data.selectedPlan === "precision" ? "PRECISION" : "CORE",
                  portalStatus: data.streetAddress ? "INTAKE_COMPLETED" : "INTAKE_STARTED",
                  completedAt: data.streetAddress ? new Date() : undefined,
                },
              });
              intakeUpdated = true;
              console.log("[Intake API] Updated WeightManagementIntake with full quiz data:", {
                intakeId,
                userId: existing.id,
                fieldsAdded: Object.keys(fullQuizData).length,
              });
            } catch (updateError) {
              console.error("[Intake API] Error updating WeightManagementIntake:", updateError);
            }
          } else {
            console.log("[Intake API] WeightManagementIntake exists, no new quiz data to add:", intakeId);
          }
        }

        // ═══════════════════════════════════════════════════════════════════════
        // FIX: Also update ProgramMember.intakeData so admin portal shows quiz data
        // Previously, ProgramMember was created early at EmailGate with minimal data,
        // and never updated when full quiz was submitted. This fixes that.
        // ═══════════════════════════════════════════════════════════════════════
        if (hasNewQuizData) {
          await saveNotesForProgram(existing.id, programType, data);

          try {
            const existingProgramMember = await prisma.programMember.findUnique({
              where: { email: existing.email },
            });

            if (existingProgramMember) {
              // Merge existing intakeData with new full quiz data
              const existingIntakeData = (existingProgramMember.intakeData as Record<string, unknown>) || {};
              const mergedIntakeData = { ...existingIntakeData, ...fullQuizData };

              await prisma.programMember.update({
                where: { email: existing.email },
                data: { intakeData: mergedIntakeData },
              });
              console.log("[Intake API] Updated ProgramMember.intakeData with full quiz data:", {
                programMemberId: existingProgramMember.id,
                userId: existing.id,
                fieldsAdded: Object.keys(fullQuizData).length,
              });
            } else {
              console.log("[Intake API] No ProgramMember found to update for:", existing.email);
            }
          } catch (pmError) {
            console.error("[Intake API] Error updating ProgramMember.intakeData:", pmError);
            // Non-blocking - WeightManagementIntake still has the data as backup
          }
        }
      }

      // Return success - user exists, intake may have been created/updated
      return NextResponse.json({
        userId: existing.id,
        intakeId,
        existing: true,
        intakeCreated,
        intakeUpdated,
        userUpdated,
        inProgress: true,
      }, { headers });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // NEW USER CREATION
    // ═══════════════════════════════════════════════════════════════════════════

    // Calculate triage score based on program type
    const triageScore = calculateTriageScore(programType, data);
    const approvalStatus = data.hasContraindications ? "DEFERRED" : "PENDING";

    // Build program-specific related record creates
    const programSpecificCreates = buildProgramSpecificRecords(programType, data);

    // Create user with all related records
    const user = await prisma.user.create({
      data: {
        firstName:        data.firstName?.trim() || "",
        lastName:         data.lastName?.trim() || "",
        email:            data.email?.toLowerCase().trim(),
        phone:            data.phone?.trim(),
        dateOfBirth:      data.dateOfBirth ? parseDOB(data.dateOfBirth) : undefined,
        gender:           mapGender(data.gender || ""),
        postcode:         data.postcode?.trim(),
        // Address fields from shipping info step
        addressLine1:     data.streetAddress?.trim(),
        addressLine2:     data.addressUnit?.trim(),
        suburb:           data.suburb?.trim(),
        state:            data.state?.trim(),
        timezone:         resolveAustralianTimezone(data.state, data.postcode),
        country:          "Australia",
        role:             "MEMBER",
        memberStatus:     "POTENTIAL_MEMBER",
        subscriptionStatus: "INACTIVE",
        subscriptionTier: config.subscriptionTier,
        journeyStatus:    "SURVEY_COMPLETED",
        leadSource:       data.howHeard || "survey",
        triageScore,
        approvalStatus,
        referralCode:     generateReferralCode(data.email),

        // Health profile (always create)
        healthProfile: {
          create: buildHealthProfile(programType, data)
        },

        // Program-specific records
        ...programSpecificCreates,
      }
    });

    console.log("[Intake API] User created successfully:", {
      userId: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    });

    // ─── Create ProgramMember record ─────────────────────────────────────────────
    // GAP-008: Patient can only become ACTIVE after all activation criteria are met
    let programMemberId: string | null = null;
    try {
      const membershipEnd = new Date();
      membershipEnd.setFullYear(membershipEnd.getFullYear() + 1);

      const programMember = await prisma.programMember.create({
        data: {
          userId:           user.id,
          firstName:        data.firstName?.trim() || "",
          lastName:         data.lastName?.trim() || "",
          email:            data.email?.toLowerCase().trim(),
          mobile:           data.phone?.trim() || "",
          dob:              data.dateOfBirth ? parseDOB(data.dateOfBirth) : new Date(),
          program:          programType,
          intakeData:       data, // Store full survey data as JSON
          membershipStatus: "PENDING", // GAP-008: Not ACTIVE until activation criteria met
          membershipStart:  new Date(),
          membershipEnd:    membershipEnd,
        }
      });
      programMemberId = programMember.id;
      console.log("[Intake API] Created ProgramMember:", programMemberId);
    } catch (memberError) {
      // Log but don't fail if ProgramMember creation fails
      console.error("Error creating ProgramMember:", memberError);
    }

    // ─── Create ConsultationBooking if date/time provided ────────────────────────
    let bookingId: string | null = null;
    if (programType === "WEIGHT_MANAGEMENT" && data.consultationDate && data.consultationTime) {
      try {
        const scheduledDate = parseConsultationDateTime(
          data.consultationDate as string,
          data.consultationTime as string
        );

        const booking = await prisma.consultationBooking.create({
          data: {
            userId:       user.id,
            bookingType:  "initial_consultation",
            scheduledAt:  scheduledDate,
            duration:     30,
            status:       "SLOT_HELD",
            notes:        `Weight Management Program - Booked via quiz. Goals: ${((data.motivations as string[]) || []).join(", ")}`,
            selectedPlan: data.selectedPlan || "core",
          }
        });
        bookingId = booking.id;
        console.log("[Intake API] Created ConsultationBooking:", bookingId);
      } catch (bookingError) {
        console.error("Error creating ConsultationBooking:", bookingError);
      }
    }

    // ─── Create WeightManagementIntake (CRITICAL for durable tracking) ───────────
    let intakeId: string | null = null;
    if (programType === "WEIGHT_MANAGEMENT") {
      try {
        const intake = await prisma.weightManagementIntake.create({
          data: {
            userId: user.id,
            selectedPlan: data.selectedPlan === "precision" ? "PRECISION" : "CORE",
            quizData: { ...data, submittedAt: new Date().toISOString() },
            portalStatus: data.streetAddress ? "INTAKE_COMPLETED" : "INTAKE_STARTED",
            completedAt: data.streetAddress ? new Date() : undefined,
            // Link to ProgramMember
            programMemberId: programMemberId || undefined,
            // Link to booking
            bookingId: bookingId || undefined,
            bookingStatus: bookingId ? "SLOT_HELD" : "NOT_BOOKED",
            // Initial statuses
            paymentStatus: "UNPAID",
            doctorReviewStatus: "PENDING_TRIAGE",
          },
        });
        intakeId = intake.id;
        console.log("[Intake API] Created WeightManagementIntake with links:", {
          intakeId,
          programMemberId,
          bookingId,
        });
      } catch (intakeError) {
        console.error("[Intake API] Error creating WeightManagementIntake:", intakeError);
      }
    }

    // Save conditions/concerns as internal notes
    await saveNotesForProgram(user.id, programType, data);

    // If women's health has a booked appointment, create it now
    if (programType === "WOMENS_HEALTH" && data.selectedDate && data.selectedTime) {
      await createWomensHealthAppointment(user.id, data);
    }

    // Log automation event
    await prisma.automationLog.create({
      data: {
        userId:         user.id,
        automationType: "survey_completed",
        triggerEvent:   `${programType.toLowerCase()}_assessment_submit`,
        channel:        "system",
        status:         "completed",
        metadata:       { programType, intakeId, programMemberId, bookingId },
      }
    }).catch(console.error);

    // Send welcome email (non-blocking)
    sendWelcomeEmailForProgram(user, programType, config.emailTemplateCategory)
      .catch(console.error);

    return NextResponse.json({
      userId:              user.id,
      intakeId,
      programMemberId,
      bookingId,
      triageScore,
      approvalStatus,
      programType,
      portalPath:          config.portalPath,
      consultationAmount:  config.consultationAmount,
      // GAP-009+: Full linking summary
      links: {
        patientId: user.id,
        intakeId,
        programEnrollmentId: programMemberId,
        bookingId,
        selectedPlan: data.selectedPlan || "core",
        paymentStatus: "UNPAID",
        bookingStatus: bookingId ? "SLOT_HELD" : "NOT_BOOKED",
        doctorReviewStatus: "PENDING_TRIAGE",
        portalStatus: data.streetAddress ? "INTAKE_COMPLETED" : "INTAKE_STARTED",
      },
    }, { headers });

  } catch (error: unknown) {
    console.error("Unified intake API error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to create patient record", detail: message },
      { status: 500, headers }
    );
  }
}

// Handle CORS preflight
export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    }
  });
}

// ─── Parse consultation date/time helper ──────────────────────────────────────

function parseConsultationDateTime(dateStr: string, timeStr: string): Date {
  // Parse time (e.g., "10:00 AM")
  const [time, period] = timeStr.split(" ");
  const [hours, minutes] = time.split(":").map(Number);
  let hour = hours;
  if (period === "PM" && hours !== 12) hour += 12;
  if (period === "AM" && hours === 12) hour = 0;

  // Create a date object for the next matching day
  const scheduledDate = new Date();
  scheduledDate.setHours(hour, minutes || 0, 0, 0);

  // If the date string has day info (e.g., "Thu, 24 May"), try to find the next matching day
  const dayMatch = dateStr.match(/(\d+)/);
  if (dayMatch) {
    const targetDay = parseInt(dayMatch[1]);
    // Move forward until we find the target day
    let attempts = 0;
    while (scheduledDate.getDate() !== targetDay && attempts < 60) {
      scheduledDate.setDate(scheduledDate.getDate() + 1);
      attempts++;
    }
  }

  return scheduledDate;
}

// ─── Triage scoring by program ────────────────────────────────────────────────

function calculateTriageScore(programType: ProgramType, data: Record<string, unknown>): number {
  switch (programType) {
    case "WEIGHT_MANAGEMENT": return scoreWeightManagement(data);
    case "WOMENS_HEALTH":     return scoreWomensHealth(data);
    case "MENS_HEALTH":       return scoreMensHealth(data);
    case "HAIR_LOSS":         return scoreHairLoss(data);
    case "FATTY_LIVER":       return scoreFattyLiver(data);
    default:                  return 70;
  }
}

function scoreWeightManagement(data: Record<string, unknown>): number {
  let score = 100;
  const serious = ((data.seriousConditions as string[]) || []).filter(
    (c: string) => c !== "None of these apply" && c !== "None"
  );
  score -= serious.length * 20;
  if (((data.mentalHealthConditions as string[]) || []).some((c: string) =>
    c.toLowerCase().includes("anorexia") || c.toLowerCase().includes("bulimia")
  )) score -= 25;
  const bmi = calcBMI(data.currentWeight as string, data.height as string);
  if (bmi && bmi < 27) score -= 15;
  if (data.hasContraindications) score -= 30;
  return clampScore(score);
}

function scoreWomensHealth(data: Record<string, unknown>): number {
  let score = 85; // Most women's health concerns are appropriate for telehealth
  const highRisk = ["Breast cancer history", "Blood clotting disorder", "Migraines with aura"];
  const conditions = (data.medicalConditions as string[]) || [];
  highRisk.forEach(c => {
    if (conditions.includes(c)) score -= 20;
  });
  const highRiskFamily = ["Breast cancer", "Blood clots"];
  const family = (data.familyHistory as string[]) || [];
  highRiskFamily.forEach(c => {
    if (family.includes(c)) score -= 10;
  });
  return clampScore(score);
}

function scoreMensHealth(data: Record<string, unknown>): number {
  let score = 80;
  if (data.takingNitrates === "yes") score -= 40; // Absolute contraindication for ED meds
  const riskConditions = [
    "Heart disease", "Recent heart attack", "Stroke", "Uncontrolled blood pressure"
  ];
  const conditions = (data.medicalConditions as string[]) || [];
  riskConditions.forEach(c => {
    if (conditions.some((mc: string) => mc.toLowerCase().includes(c.toLowerCase()))) score -= 15;
  });
  return clampScore(score);
}

function scoreHairLoss(data: Record<string, unknown>): number {
  let score = 90; // Hair loss is generally low clinical risk
  if (data.pregnancyStatus === "pregnant") score -= 50; // No finasteride in pregnancy
  const conditions = (data.medicalConditions as string[]) || [];
  if (conditions.some((c: string) => c.toLowerCase().includes("liver"))) score -= 20;
  return clampScore(score);
}

function scoreFattyLiver(data: Record<string, unknown>): number {
  let score = 75;
  if (((data.conditions as string[]) || []).some((c: string) =>
    c.toLowerCase().includes("cirrhosis") || c.toLowerCase().includes("liver failure")
  )) score -= 40;
  return clampScore(score);
}

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, score));
}

// ─── Health profile builder ───────────────────────────────────────────────────

function buildHealthProfile(programType: ProgramType, data: Record<string, unknown>): Record<string, unknown> {
  const base: Record<string, unknown> = {
    smokingStatus: "NEVER",
  };

  if (programType === "WEIGHT_MANAGEMENT") {
    const cvConditions = (data.cardiovascularConditions as string[]) || [];
    base.familyHistoryCVD = cvConditions.some((c: string) =>
      c.toLowerCase().includes("heart") || c.toLowerCase().includes("angina")
    );
    base.onBPMedication = ((data.currentMedications as string[]) || []).some((m: string) =>
      m.toLowerCase().includes("blood pressure") || m.toLowerCase().includes("antihypertensive")
    );
  }

  return base;
}

// ─── Program-specific Prisma record creators ──────────────────────────────────

function buildProgramSpecificRecords(programType: ProgramType, data: Record<string, unknown>): Record<string, unknown> {
  if (programType === "WEIGHT_MANAGEMENT") {
    return {
      weightLogs: {
        create: [{
          weight:   parseFloat(data.currentWeight as string) || 0,
          source:   "MANUAL",
          notes:    "Initial assessment weight",
          loggedAt: new Date(),
        }]
      },
      weightGoals: {
        create: [{
          startWeight:      parseFloat(data.currentWeight as string) || 0,
          targetWeight:     deriveTargetWeight(data),
          currentWeight:    parseFloat(data.currentWeight as string) || 0,
          targetDate:       new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          weeklyTargetLoss: 0.5,
          notes:            ((data.motivations as string[]) || []).join(", "),
        }]
      }
    };
  }
  // Other programs don't need weight goals or logs at intake
  return {};
}

// ─── Internal notes by program ────────────────────────────────────────────────

async function saveNotesForProgram(userId: string, programType: ProgramType, data: Record<string, unknown>) {
  const noteGroups: Array<{ title: string; conditions: string[] }> = [];

  if (programType === "WEIGHT_MANAGEMENT") {
    noteGroups.push(
      { title: "Triage — Metabolic Conditions",      conditions: (data.metabolicConditions as string[]) || [] },
      { title: "Triage — Digestive Conditions",      conditions: (data.digestiveConditions as string[]) || [] },
      { title: "Triage — Cardiovascular Conditions", conditions: (data.cardiovascularConditions as string[]) || [] },
      { title: "Triage — Mental Health Conditions",  conditions: (data.mentalHealthConditions as string[]) || [] },
      { title: "Triage — Serious Conditions (FLAG)", conditions: ((data.seriousConditions as string[]) || []).filter((c: string) => c !== "None of these apply") },
      { title: "Triage — Current Medications",       conditions: (data.currentMedications as string[]) || [] },
      { title: "Patient Motivations",                conditions: (data.motivations as string[]) || [] },
    );
  }

  if (programType === "WOMENS_HEALTH") {
    noteGroups.push(
      { title: "Women's Health — Category",          conditions: [(data.category as string) || "general"] },
      { title: "Women's Health — Primary Concerns",  conditions: (data.primaryConcerns as string[]) || [] },
      { title: "Women's Health — Medical Conditions",conditions: (data.medicalConditions as string[]) || [] },
      { title: "Women's Health — Family History",    conditions: (data.familyHistory as string[]) || [] },
      { title: "Women's Health — Current Treatments",conditions: (data.currentTreatments as string[]) || [] },
      { title: "Women's Health — Goals",             conditions: (data.goals as string[]) || [] },
    );
  }

  if (programType === "MENS_HEALTH") {
    noteGroups.push(
      { title: "Men's Health — Primary Concern",     conditions: [(data.concern as string) || ""] },
      { title: "Men's Health — ED Details",          conditions: [
          `Duration: ${(data.edDuration as string) || "n/a"}`,
          `Severity: ${(data.edSeverity as string) || "n/a"}`,
          `Morning erections: ${(data.morningErections as string) || "n/a"}`,
        ].filter(Boolean)
      },
      { title: "Men's Health — Contributing Causes", conditions: (data.edCauses as string[]) || [] },
      { title: "Men's Health — Medical Conditions",  conditions: (data.medicalConditions as string[]) || [] },
      { title: "Men's Health — Lifestyle Factors",   conditions: (data.lifestyleFactors as string[]) || [] },
      { title: "Men's Health — Nitrates (FLAG)",     conditions: data.takingNitrates === "yes" ? ["TAKING NITRATES — DO NOT PRESCRIBE PDE5 INHIBITORS"] : [] },
      { title: "Men's Health — Other Concerns",      conditions: (data.otherConcerns as string[]) || [] },
    );
  }

  if (programType === "HAIR_LOSS") {
    noteGroups.push(
      { title: "Hair Loss — Stage",                  conditions: [(data.hairStage as string) || ""] },
      { title: "Hair Loss — Timeline",               conditions: [(data.hairLossTimeline as string) || ""] },
      { title: "Hair Loss — Family History",         conditions: [(data.familyHistory as string) || ""] },
      { title: "Hair Loss — Medical Conditions",     conditions: (data.medicalConditions as string[]) || [] },
      { title: "Hair Loss — Pregnancy Status (FLAG)",conditions: data.pregnancyStatus === "pregnant" ? ["PATIENT IS PREGNANT — NO FINASTERIDE"] : [] },
    );
  }

  const titles = noteGroups.map((g) => g.title);
  await prisma.internalNote.deleteMany({
    where: {
      userId,
      createdBy: "system",
      category: "MEDICAL",
      title: { in: titles },
    },
  }).catch(console.error);

  // Write all notes (skip empty groups)
  for (const group of noteGroups) {
    if (group.conditions.filter(Boolean).length > 0) {
      await prisma.internalNote.create({
        data: {
          userId:    userId,
          category:  "MEDICAL",
          title:     group.title,
          content:   group.conditions.filter(Boolean).join(", "),
          createdBy: "system",
        }
      }).catch(console.error);
    }
  }
}

// ─── Women's health appointment creator ──────────────────────────────────────

async function createWomensHealthAppointment(userId: string, data: Record<string, unknown>) {
  // The women's health quiz has date/time selection built into the form
  try {
    const selectedDate = new Date(data.selectedDate as string);
    const timeStr = (data.selectedTime as string) || "9:00 AM";
    const [time, period] = timeStr.split(" ");
    const [hours, minutes] = time.split(":").map(Number);
    let hour = hours;
    if (period === "PM" && hours !== 12) hour += 12;
    if (period === "AM" && hours === 12) hour = 0;
    selectedDate.setHours(hour, minutes || 0, 0, 0);

    await prisma.appointment.create({
      data: {
        userId:      userId,
        type:        "CONSULTATION",
        title:       `Women's Health Consultation — ${(data.category as string) || "General"}`,
        scheduledAt: selectedDate,
        duration:    30,
        location:    "Video",
        status:      "SCHEDULED",
        notes:       `Category: ${(data.category as string) || "general"}. Primary concerns: ${((data.primaryConcerns as string[]) || []).join(", ")}`,
      }
    });
  } catch (error) {
    console.error("Failed to create women's health appointment:", error);
  }
}

// ─── Email sender by program ──────────────────────────────────────────────────

async function sendWelcomeEmailForProgram(
  user: { email: string; firstName: string },
  programType: ProgramType,
  _category: string
) {
  // Find a welcome template
  const template = await prisma.emailTemplate.findFirst({
    where: { category: "WELCOME", isActive: true }
  });

  const programNames: Record<ProgramType, string> = {
    WEIGHT_MANAGEMENT: "Weight Management",
    WOMENS_HEALTH:     "Women's Health",
    MENS_HEALTH:       "Men's Health",
    HAIR_LOSS:         "Hair Loss Treatment",
    FATTY_LIVER:       "Metabolic Health",
  };

  const subject = `Welcome to Sanative ${programNames[programType]}`;
  const html = template?.body
    ?.replace(/{{firstName}}/g, user.firstName || "")
    ?.replace(/{{program}}/g, programNames[programType]) ||
    `<p>Welcome to Sanative Health, ${user.firstName}. Your ${programNames[programType]} consultation is being arranged.</p>`;

  await sendEmail({ to: user.email, subject, body: html });
}

// ─── Utility functions ────────────────────────────────────────────────────────

function calcBMI(weight: string, heightCm: string): number | null {
  const w = parseFloat(weight);
  const h = parseFloat(heightCm) / 100;
  if (!w || !h) return null;
  return Math.round((w / (h * h)) * 10) / 10;
}

function deriveTargetWeight(data: Record<string, unknown>): number {
  const current = parseFloat(data.currentWeight as string) || 0;
  const goal = (data.weightLossGoal as string) || "10-15 kg";
  const match = goal.match(/(\d+)/);
  const loss = match ? parseInt(match[1]) : 10;
  return Math.max(current - loss, current * 0.7);
}

function parseDOB(dob: string): Date {
  if (dob.includes("/")) {
    const [day, month, year] = dob.split("/");
    return new Date(`${year}-${month?.padStart(2, "0")}-${day?.padStart(2, "0")}`);
  }
  return new Date(dob);
}

function mapGender(gender: string): "MALE" | "FEMALE" | "OTHER" | "PREFER_NOT_TO_SAY" {
  const g = gender.toLowerCase();
  if (g === "female" || g === "woman") return "FEMALE";
  if (g === "male" || g === "man") return "MALE";
  return "PREFER_NOT_TO_SAY";
}

function generateReferralCode(email: string): string {
  const prefix = (email.split("@")[0] || "").slice(0, 4).toUpperCase();
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}${suffix}`;
}
