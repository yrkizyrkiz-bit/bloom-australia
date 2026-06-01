import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2026-04-22.dahlia",
});

// GAP-005: Stripe Price IDs for ongoing monthly subscriptions (set in Stripe dashboard)
const STRIPE_ONGOING_PRICES = {
  CORE: process.env.STRIPE_WM_CORE_MONTHLY_PRICE_ID,
  PRECISION: process.env.STRIPE_WM_PRECISION_MONTHLY_PRICE_ID,
};

// Plan amounts in cents for ongoing billing
const PLAN_AMOUNTS = {
  CORE: 34900, // $349/month
  PRECISION: 49900, // $499/month
};

// Decision types
type DecisionType = "APPROVED" | "APPROVED_NO_TREATMENT" | "DECLINED" | "APPROVED_PENDING_TESTS";

// Medication form options (for validation)
const VALID_MEDICATION_FORMS = [
  "TABLET",
  "CAPSULE",
  "LIQUID",
  "INJECTION",
  "CREAM",
  "GEL",
  "PATCH",
  "INHALER",
  "DROPS",
  "SPRAY",
  "SUPPOSITORY",
  "POWDER",
  "OTHER",
];

// Decline reason options
const DECLINE_REASONS = {
  contraindication: "Medical contraindication present",
  bmi_insufficient: "BMI below treatment threshold",
  mental_health: "Mental health concerns require further evaluation",
  eating_disorder: "History of eating disorder - not suitable for GLP-1",
  pregnancy: "Pregnancy or planning pregnancy",
  drug_interaction: "Significant drug interaction risk",
  recent_surgery: "Recent GI surgery - not suitable",
  other_medical: "Other medical reason",
  patient_preference: "Patient changed mind / not ready",
  incomplete_info: "Insufficient information for decision",
};

// Blood test options
const BLOOD_TEST_OPTIONS = {
  hba1c: { name: "HbA1c", description: "Glycated hemoglobin", reason: "Assess diabetes risk/control" },
  fasting_glucose: { name: "Fasting Glucose", description: "Fasting blood glucose", reason: "Assess insulin resistance" },
  fasting_insulin: { name: "Fasting Insulin", description: "Fasting insulin level", reason: "Calculate HOMA-IR" },
  lipid_panel: { name: "Lipid Panel", description: "Total cholesterol, LDL, HDL, triglycerides", reason: "Cardiovascular risk assessment" },
  liver_function: { name: "Liver Function", description: "ALT, AST, GGT, ALP, bilirubin", reason: "Assess liver health/fatty liver" },
  kidney_function: { name: "Kidney Function", description: "eGFR, creatinine, urea", reason: "Assess renal function before medication" },
  thyroid: { name: "Thyroid Panel", description: "TSH, Free T4, Free T3", reason: "Rule out thyroid dysfunction" },
  full_blood_count: { name: "Full Blood Count", description: "CBC with differential", reason: "General health screening" },
  iron_studies: { name: "Iron Studies", description: "Ferritin, iron, TIBC", reason: "Assess iron status" },
  vitamin_d: { name: "Vitamin D", description: "25-OH Vitamin D", reason: "Check vitamin D status" },
  cortisol: { name: "Cortisol", description: "Morning cortisol", reason: "Rule out Cushing's" },
};

// ─── GAP-005: Create ongoing subscription after doctor approval ───────────────
// This creates the recurring monthly subscription ($349/$499) starting 30 days after first payment
// First month was already charged via PaymentIntent at checkout
async function createOngoingSubscription(
  userId: string,
  userEmail: string,
  userName: string,
  selectedPlan: "CORE" | "PRECISION",
  firstPaymentIntentId?: string | null
): Promise<{ success: boolean; subscriptionId?: string; error?: string }> {
  try {
    // Get or create Stripe customer
    let customerId: string;
    const existingCustomers = await stripe.customers.list({ email: userEmail, limit: 1 });

    if (existingCustomers.data.length > 0) {
      customerId = existingCustomers.data[0].id;
    } else {
      // Create new customer
      const customer = await stripe.customers.create({
        email: userEmail,
        name: userName,
        metadata: {
          userId,
          sanativePatient: "true",
        },
      });
      customerId = customer.id;
    }

    // Calculate billing anchor: 30 days from now (after first month is complete)
    const billingAnchor = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;

    // Get the Stripe price ID for the plan
    const stripePriceId = STRIPE_ONGOING_PRICES[selectedPlan];

    // Create the subscription
    let subscription: Stripe.Subscription;

    if (stripePriceId) {
      // Use pre-configured price from Stripe dashboard
      subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: stripePriceId }],
        billing_cycle_anchor: billingAnchor,
        proration_behavior: "none",
        metadata: {
          userId,
          selectedPlan,
          sanativeProgram: "WEIGHT_MANAGEMENT",
          firstPaymentIntentId: firstPaymentIntentId || "",
          createdBy: "doctor_approval",
        },
      });
    } else {
      // Create product and price inline (fallback if no Price ID configured)
      console.warn(`[GAP-005] No Stripe Price ID configured for ${selectedPlan}, creating with inline pricing`);

      const product = await stripe.products.create({
        name: `Sanative ${selectedPlan === "CORE" ? "Core" : "Precision"} - Monthly`,
        metadata: {
          sanative_plan: selectedPlan,
          type: "weight_management",
        },
      });

      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: PLAN_AMOUNTS[selectedPlan],
        currency: "aud",
        recurring: { interval: "month" },
      });

      subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: price.id }],
        billing_cycle_anchor: billingAnchor,
        proration_behavior: "none",
        metadata: {
          userId,
          selectedPlan,
          sanativeProgram: "WEIGHT_MANAGEMENT",
          firstPaymentIntentId: firstPaymentIntentId || "",
          createdBy: "doctor_approval",
        },
      });
    }

    // Update user with subscription info
    await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionStatus: "ACTIVE",
        subscriptionTier: `sanative_${selectedPlan.toLowerCase()}`,
      },
    });

    // Log the subscription creation
    await prisma.activityLog.create({
      data: {
        userId,
        action: "SUBSCRIPTION_CREATED",
        entity: "stripe_subscription",
        entityId: subscription.id,
        details: {
          selectedPlan,
          monthlyAmount: PLAN_AMOUNTS[selectedPlan],
          billingAnchor: new Date(billingAnchor * 1000).toISOString(),
          firstPaymentIntentId,
          stripeSubscriptionId: subscription.id,
          stripeCustomerId: customerId,
        },
      },
    });

    // Create internal note
    await prisma.internalNote.create({
      data: {
        userId,
        category: "BILLING",
        title: "Ongoing Subscription Created",
        content: `Monthly subscription created for Sanative ${selectedPlan}. Billing starts ${new Date(billingAnchor * 1000).toLocaleDateString("en-AU")}. Monthly amount: $${(PLAN_AMOUNTS[selectedPlan] / 100).toFixed(2)}. Subscription ID: ${subscription.id}`,
        createdBy: "system",
      },
    });

    console.log(`[GAP-005] Created subscription ${subscription.id} for user ${userId} (${selectedPlan})`);

    return {
      success: true,
      subscriptionId: subscription.id,
    };
  } catch (error) {
    console.error("[GAP-005] Failed to create subscription:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// POST /api/admin/doctor/decision - Submit doctor decision
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !["ADMIN", "DOCTOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      userId,
      consultationId,
      decision,
      // Common fields
      consultationCompleted,
      clinicalNotes,
      // Approval fields - Manual medication entry
      prescribeTreatment, // boolean - whether to prescribe medication
      medicationName,
      genericName,
      strength,
      form, // INJECTION, TABLET, etc.
      dosage,
      frequency,
      instructions,
      quantity,
      quantityUnit,
      daysSupply,
      repeats,
      startDate,
      followUpDate,
      pharmacyNotes,
      safetyCounsellingNotes,
      contraindicationsReviewed,
      patientCounsellingDocumented,
      // Decline fields
      declineReason,
      declineReasonOther,
      safeNextStepGuidance,
      carePartnerFollowUpRequired,
      gpReferralSuggested,
      // Pending tests fields
      testsRequired,
      reasonForTests,
      treatmentMustWaitForResults,
      testFollowUpTimeframe,
    } = body;

    // Validate required fields
    if (!userId || !consultationId || !decision) {
      return NextResponse.json(
        { error: "userId, consultationId, and decision are required" },
        { status: 400 }
      );
    }

    if (!consultationCompleted) {
      return NextResponse.json(
        { error: "Consultation must be marked as completed" },
        { status: 400 }
      );
    }

    if (!clinicalNotes || clinicalNotes.trim().length < 10) {
      return NextResponse.json(
        { error: "Clinical notes are required (minimum 10 characters)" },
        { status: 400 }
      );
    }

    // Fetch user and consultation
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        assignedCarePartnerId: true,
        subscriptionTier: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const consultation = await prisma.consultationBooking.findUnique({
      where: { id: consultationId },
      select: {
        id: true,
        userId: true,
        scheduledAt: true,
        status: true,
        notes: true,
        paymentIntentId: true,
        selectedPlan: true, // GAP-005: Get the selected plan
      },
    });

    if (!consultation) {
      return NextResponse.json({ error: "Consultation not found" }, { status: 404 });
    }

    // GAP-005: Determine the selected plan (CORE or PRECISION)
    const selectedPlan: "CORE" | "PRECISION" =
      consultation.selectedPlan?.toUpperCase() === "PRECISION" ? "PRECISION" : "CORE";

    const doctorName = `Dr. ${session.user.firstName || ""} ${session.user.lastName || ""}`.trim();
    const dashboardUrl = `${process.env.NEXTAUTH_URL || "https://sanative.com.au"}/dashboard/weight-management`;

    // Handle decision based on type
    switch (decision as DecisionType) {
      case "APPROVED": {
        // For APPROVED, treatment must be prescribed
        // Validate medication fields
        if (!prescribeTreatment) {
          return NextResponse.json(
            { error: "Treatment prescription is required for approval. Use 'APPROVED_NO_TREATMENT' for non-medication approval." },
            { status: 400 }
          );
        }

        if (!medicationName || medicationName.trim().length < 2) {
          return NextResponse.json(
            { error: "Medication name is required" },
            { status: 400 }
          );
        }
        if (!dosage || dosage.trim().length < 2) {
          return NextResponse.json(
            { error: "Dosage is required" },
            { status: 400 }
          );
        }
        if (!frequency || frequency.trim().length < 2) {
          return NextResponse.json(
            { error: "Frequency is required" },
            { status: 400 }
          );
        }
        if (!form || !VALID_MEDICATION_FORMS.includes(form)) {
          return NextResponse.json(
            { error: "Valid medication form is required" },
            { status: 400 }
          );
        }
        if (!contraindicationsReviewed) {
          return NextResponse.json(
            { error: "Contraindications review checkbox is required" },
            { status: 400 }
          );
        }
        if (!patientCounsellingDocumented) {
          return NextResponse.json(
            { error: "Patient counselling checkbox is required" },
            { status: 400 }
          );
        }

        // Create prescription with SCRIPT_DRAFT status
        const prescription = await prisma.prescription.create({
          data: {
            patientId: userId,
            medicationName: medicationName.trim(),
            genericName: genericName?.trim() || null,
            strength: strength?.trim() || "",
            form: form as "TABLET" | "CAPSULE" | "INJECTION" | "LIQUID" | "CREAM" | "GEL" | "PATCH" | "INHALER" | "DROPS" | "SPRAY" | "SUPPOSITORY" | "POWDER" | "OTHER",
            dosage: dosage.trim(),
            frequency: frequency.trim(),
            instructions: instructions?.trim() || null,
            quantity: quantity || 1,
            quantityUnit: quantityUnit?.trim() || "units",
            daysSupply: daysSupply || 28,
            refillsTotal: repeats || 0,
            refillsRemaining: repeats || 0,
            prescriberId: session.user.id,
            prescriberName: doctorName,
            status: "ACTIVE",
            scriptStatus: "SCRIPT_DRAFT", // Start as draft
            category: "WEIGHT_MANAGEMENT",
            diagnosis: "Weight management program",
            notes: clinicalNotes,
            pharmacyNotes: pharmacyNotes?.trim() || null,
            safetyCounsellingNotes: safetyCounsellingNotes?.trim() || null,
            startDate: startDate ? new Date(startDate) : new Date(),
            followUpDate: followUpDate ? new Date(followUpDate) : null,
            nextRefillDate: new Date(Date.now() + (daysSupply || 28) * 24 * 60 * 60 * 1000),
          },
        });

        // ─── Link prescription to WeightManagementIntake ─────────────────────────
        try {
          await prisma.weightManagementIntake.updateMany({
            where: { userId },
            data: {
              prescriptionId: prescription.id,
              doctorReviewStatus: "APPROVED",
              doctorId: session.user.id,
              doctorReviewedAt: new Date(),
              doctorDecision: "APPROVED",
              doctorNotes: clinicalNotes,
            },
          });
          console.log(`[Prescription] Linked prescription ${prescription.id} to intake for user ${userId}`);
        } catch (intakeLinkError) {
          console.error("[Prescription] Failed to link prescription to intake:", intakeLinkError);
        }

        // Update user status - DO NOT activate instantly
        // Patient stays at APPROVED status until script workflow progresses
        await prisma.user.update({
          where: { id: userId },
          data: {
            approvalStatus: "APPROVED",
            journeyStatus: "APPROVED", // Doctor approved, script in draft
          },
        });

        // Update consultation
        await prisma.consultationBooking.update({
          where: { id: consultationId },
          data: {
            status: "BOOKING_COMPLETED",
            completedAt: new Date(),
            notes: clinicalNotes,
          },
        });

        // ─── GAP-005: Create ongoing monthly subscription ─────────────────────────
        let subscriptionResult: { success: boolean; subscriptionId?: string; error?: string } = { success: false };
        try {
          subscriptionResult = await createOngoingSubscription(
            userId,
            user.email,
            `${user.firstName} ${user.lastName}`.trim(),
            selectedPlan,
            consultation.paymentIntentId
          );

          if (!subscriptionResult.success) {
            // Log failure but don't block the approval
            console.error(`[GAP-005] Subscription creation failed: ${subscriptionResult.error}`);

            // Create task for manual subscription setup
            await prisma.careCommunication.create({
              data: {
                userId,
                type: "BILLING",
                priority: "HIGH",
                subject: `MANUAL SUBSCRIPTION REQUIRED: ${user.firstName} ${user.lastName}`,
                notes: `Patient was approved but automatic subscription creation failed.

Please manually create the ${selectedPlan} subscription ($${(PLAN_AMOUNTS[selectedPlan] / 100).toFixed(2)}/month).

Error: ${subscriptionResult.error}
Payment Intent: ${consultation.paymentIntentId || "N/A"}`,
                status: "PENDING",
                dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
              },
            });
          }
        } catch (subscriptionError) {
          console.error("[GAP-005] Subscription creation error:", subscriptionError);
        }

        // Create clinical note - DO NOT expose medication details publicly
        await prisma.internalNote.create({
          data: {
            userId,
            memberId: userId,
            authorId: session.user.id,
            authorName: doctorName,
            createdBy: session.user.id,
            category: "MEDICAL",
            title: "Doctor Decision: APPROVED",
            content: `**Decision:** Approved for treatment

**Script Status:** DRAFT - Pending finalization

**Prescription Details:**
- Medication: [CONFIDENTIAL - See Prescription ${prescription.id}]
- Dosage: ${dosage}
- Frequency: ${frequency}
- Repeats: ${repeats || 0}
- Start Date: ${startDate ? new Date(startDate).toLocaleDateString() : "As directed"}
- Follow-up: ${followUpDate ? new Date(followUpDate).toLocaleDateString() : "As clinically indicated"}

**Billing:**
- Plan: ${selectedPlan}
- Monthly Amount: $${(PLAN_AMOUNTS[selectedPlan] / 100).toFixed(2)}
- Subscription Created: ${subscriptionResult.success ? "Yes" : "No (manual setup required)"}

**Safety Notes:**
${safetyCounsellingNotes || "Standard counselling provided"}

**Pharmacy Notes:**
${pharmacyNotes || "None"}

**Clinical Notes:**
${clinicalNotes}

**Checkboxes:**
- Contraindications reviewed: ✓
- Patient counselling documented: ✓

**Prescription ID:** ${prescription.id}`,
            isPinned: true,
          },
        });

        // Create script finalization task for doctor/admin
        await prisma.careCommunication.create({
          data: {
            userId,
            type: "SCRIPT_REVIEW",
            priority: "HIGH",
            subject: `Script Finalization Required: ${user.firstName} ${user.lastName}`,
            notes: `Doctor has approved patient. Script is in DRAFT status.

**Actions Required:**
1. Review prescription details
2. Finalize and sign script
3. Update script status to SCRIPT_WRITTEN
4. Send to pharmacy

Prescription ID: ${prescription.id}`,
            status: "PENDING",
            dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
          },
        });

        // Create onboarding task (will be progressed after script is finalized)
        await prisma.careCommunication.create({
          data: {
            userId,
            type: "ONBOARDING",
            priority: "NORMAL",
            subject: `Patient Onboarding: ${user.firstName} ${user.lastName}`,
            notes: `Doctor has approved ${user.firstName} for treatment.

**Note:** Onboarding should NOT begin until script workflow is complete.

Tasks (after script finalized):
1. Welcome call to patient
2. Confirm shipping details
3. Send onboarding materials
4. Schedule first check-in
5. Set up portal access if needed`,
            status: "PENDING",
            dueDate: new Date(Date.now() + 48 * 60 * 60 * 1000),
            assignedTo: user.assignedCarePartnerId || undefined,
          },
        });

        // Send patient email - NOT mentioning treatment/medication per TGA
        try {
          await sendEmail({
            to: user.email,
            subject: "Your Sanative consultation is complete",
            body: `
              <h2>Hi ${user.firstName},</h2>
              <p>Your doctor has completed your consultation and reviewed your assessment.</p>
              <p>Our team is now preparing your program and will be in touch soon with next steps.</p>
              <div style="margin: 24px 0;">
                <a href="${dashboardUrl}" style="display:inline-block;background:#059669;color:white;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;">
                  Go to My Dashboard
                </a>
              </div>
              <h3>What happens next?</h3>
              <ul>
                <li>Your care team will finalize your program details</li>
                <li>You'll receive confirmation when everything is ready</li>
                <li>Your care partner will reach out to discuss next steps</li>
              </ul>
              <p>We're excited to support you on this journey!</p>
              <p style="color:#666;margin-top:24px;">The Sanative Health Team</p>
            `,
          });
        } catch (emailError) {
          console.error("[Doctor Decision] Failed to send approval email:", emailError);
          // Don't fail the whole request if email fails
        }

        // Log automation (non-critical)
        try {
          await prisma.automationLog.create({
            data: {
              userId,
              automationType: "doctor_decision_approved",
              triggerEvent: "manual_approval",
              channel: "doctor_portal",
              status: "completed",
              metadata: {
                decidedBy: session.user.id,
                doctorName,
                prescriptionId: prescription.id,
                scriptStatus: "SCRIPT_DRAFT",
                consultationId,
                selectedPlan,
                subscriptionCreated: subscriptionResult.success,
                subscriptionId: subscriptionResult.subscriptionId,
                // DO NOT log medication name in automation metadata
              },
            },
          });
        } catch (logError) {
          console.error("[Doctor Decision] Failed to create automation log:", logError);
        }

        // Log activity for audit trail (non-critical)
        try {
          await prisma.activityLog.create({
            data: {
              userId,
              action: "DOCTOR_DECISION_APPROVED",
              entity: "consultation_booking",
              entityId: consultationId,
              details: {
                decidedBy: session.user.id,
                doctorName,
                decision: "APPROVED",
                prescriptionId: prescription.id,
                scriptStatus: "SCRIPT_DRAFT",
                repeats: repeats || 0,
                followUpDate: followUpDate || null,
                selectedPlan,
                subscriptionCreated: subscriptionResult.success,
                subscriptionId: subscriptionResult.subscriptionId,
                monthlyAmount: PLAN_AMOUNTS[selectedPlan],
                timestamp: new Date().toISOString(),
                // Medication details stored in prescription, not in activity log
              },
            },
          });
        } catch (logError) {
          console.error("[Doctor Decision] Failed to create activity log:", logError);
        }

        return NextResponse.json({
          success: true,
          decision: "APPROVED",
          prescriptionId: prescription.id,
          scriptStatus: "SCRIPT_DRAFT",
          selectedPlan,
          subscriptionCreated: subscriptionResult.success,
          subscriptionId: subscriptionResult.subscriptionId,
          monthlyAmount: PLAN_AMOUNTS[selectedPlan],
          message: "Patient approved. Script created in DRAFT status. Monthly subscription " +
            (subscriptionResult.success ? "created successfully." : "requires manual setup."),
        });
      }

      case "APPROVED_NO_TREATMENT": {
        // Approved without medication prescription (e.g., lifestyle only)
        if (!contraindicationsReviewed) {
          return NextResponse.json(
            { error: "Contraindications review checkbox is required" },
            { status: 400 }
          );
        }

        // Update user status
        await prisma.user.update({
          where: { id: userId },
          data: {
            approvalStatus: "APPROVED",
            journeyStatus: "ONBOARDING_PENDING",
          },
        });

        // Update consultation
        await prisma.consultationBooking.update({
          where: { id: consultationId },
          data: {
            status: "BOOKING_COMPLETED",
            completedAt: new Date(),
            notes: clinicalNotes,
          },
        });

        // ─── Update WeightManagementIntake for APPROVED_NO_TREATMENT ─────────────
        try {
          await prisma.weightManagementIntake.updateMany({
            where: { userId },
            data: {
              doctorReviewStatus: "APPROVED",
              doctorId: session.user.id,
              doctorReviewedAt: new Date(),
              doctorDecision: "APPROVED_NO_TREATMENT",
              doctorNotes: clinicalNotes,
              portalStatus: "TREATMENT_PENDING", // No prescription, but approved
            },
          });
          console.log(`[APPROVED_NO_TREATMENT] Updated intake for user ${userId}`);
        } catch (intakeError) {
          console.error("[APPROVED_NO_TREATMENT] Failed to update intake:", intakeError);
        }

        // ─── GAP-005: Create ongoing monthly subscription (even for lifestyle-only) ─
        let subscriptionResult: { success: boolean; subscriptionId?: string; error?: string } = { success: false };
        try {
          subscriptionResult = await createOngoingSubscription(
            userId,
            user.email,
            `${user.firstName} ${user.lastName}`.trim(),
            selectedPlan,
            consultation.paymentIntentId
          );

          if (!subscriptionResult.success) {
            console.error(`[GAP-005] Subscription creation failed: ${subscriptionResult.error}`);

            await prisma.careCommunication.create({
              data: {
                userId,
                type: "BILLING",
                priority: "HIGH",
                subject: `MANUAL SUBSCRIPTION REQUIRED: ${user.firstName} ${user.lastName}`,
                notes: `Patient was approved (lifestyle program) but automatic subscription creation failed.

Please manually create the ${selectedPlan} subscription ($${(PLAN_AMOUNTS[selectedPlan] / 100).toFixed(2)}/month).

Error: ${subscriptionResult.error}`,
                status: "PENDING",
                dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
              },
            });
          }
        } catch (subscriptionError) {
          console.error("[GAP-005] Subscription creation error:", subscriptionError);
        }

        // Create clinical note
        await prisma.internalNote.create({
          data: {
            userId,
            memberId: userId,
            authorId: session.user.id,
            authorName: doctorName,
            createdBy: session.user.id,
            category: "MEDICAL",
            title: "Doctor Decision: APPROVED (No Treatment)",
            content: `**Decision:** Approved for program (no medication prescribed)

**Program Type:** Lifestyle/Support only

**Billing:**
- Plan: ${selectedPlan}
- Monthly Amount: $${(PLAN_AMOUNTS[selectedPlan] / 100).toFixed(2)}
- Subscription Created: ${subscriptionResult.success ? "Yes" : "No (manual setup required)"}

**Clinical Notes:**
${clinicalNotes}

**Checkboxes:**
- Contraindications reviewed: ✓`,
            isPinned: true,
          },
        });

        // Create onboarding task
        await prisma.careCommunication.create({
          data: {
            userId,
            type: "ONBOARDING",
            priority: "HIGH",
            subject: `Patient Onboarding (Lifestyle): ${user.firstName} ${user.lastName}`,
            notes: `Doctor has approved ${user.firstName} for lifestyle-only program (no medication).

Tasks:
1. Welcome call to patient
2. Explain program structure
3. Set expectations and goals
4. Schedule first check-in`,
            status: "PENDING",
            dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
            assignedTo: user.assignedCarePartnerId || undefined,
          },
        });

        // Send patient email
        await sendEmail({
          to: user.email,
          subject: "Your Sanative consultation is complete",
          body: `
            <h2>Hi ${user.firstName},</h2>
            <p>Your doctor has completed your consultation and you're approved to begin your Sanative program.</p>
            <p>Our care team will be in touch soon to get you started.</p>
            <div style="margin: 24px 0;">
              <a href="${dashboardUrl}" style="display:inline-block;background:#059669;color:white;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;">
                Go to My Dashboard
              </a>
            </div>
            <p>We're excited to support you on this journey!</p>
            <p style="color:#666;margin-top:24px;">The Sanative Health Team</p>
          `,
        });

        // Log activity
        await prisma.activityLog.create({
          data: {
            userId,
            action: "DOCTOR_DECISION_APPROVED_NO_TREATMENT",
            entity: "consultation_booking",
            entityId: consultationId,
            details: {
              decidedBy: session.user.id,
              doctorName,
              decision: "APPROVED_NO_TREATMENT",
              selectedPlan,
              subscriptionCreated: subscriptionResult.success,
              subscriptionId: subscriptionResult.subscriptionId,
              monthlyAmount: PLAN_AMOUNTS[selectedPlan],
              timestamp: new Date().toISOString(),
            },
          },
        });

        return NextResponse.json({
          success: true,
          decision: "APPROVED_NO_TREATMENT",
          selectedPlan,
          subscriptionCreated: subscriptionResult.success,
          subscriptionId: subscriptionResult.subscriptionId,
          monthlyAmount: PLAN_AMOUNTS[selectedPlan],
          message: "Patient approved for lifestyle program. " +
            (subscriptionResult.success ? "Monthly subscription created." : "Subscription requires manual setup."),
        });
      }

      case "DECLINED": {
        // Validate decline-specific fields
        if (!declineReason) {
          return NextResponse.json(
            { error: "Decline reason is required" },
            { status: 400 }
          );
        }
        if (!safeNextStepGuidance) {
          return NextResponse.json(
            { error: "Safe next-step guidance is required" },
            { status: 400 }
          );
        }

        const reasonText = DECLINE_REASONS[declineReason as keyof typeof DECLINE_REASONS] || declineReasonOther || declineReason;

        // Update user status
        await prisma.user.update({
          where: { id: userId },
          data: {
            approvalStatus: "DECLINED",
            journeyStatus: "REFUND_PENDING",
          },
        });

        // Update consultation
        await prisma.consultationBooking.update({
          where: { id: consultationId },
          data: {
            status: "BOOKING_COMPLETED",
            completedAt: new Date(),
            notes: clinicalNotes,
          },
        });

        // Create clinical note
        await prisma.internalNote.create({
          data: {
            userId,
            memberId: userId,
            authorId: session.user.id,
            authorName: doctorName,
            createdBy: session.user.id,
            category: "MEDICAL",
            title: "Doctor Decision: DECLINED",
            content: `**Decision:** Declined for treatment

**Reason:** ${reasonText}

**Safe Next Steps:**
${safeNextStepGuidance}

**Clinical Notes:**
${clinicalNotes}

**Follow-up Required:**
- Care partner follow-up: ${carePartnerFollowUpRequired ? "Yes" : "No"}
- GP referral suggested: ${gpReferralSuggested ? "Yes" : "No"}

**NOTE:** Subscription NOT created for declined patients.`,
            isPinned: true,
          },
        });

        // Trigger refund workflow
        let refundInitiated = false;
        if (consultation.paymentIntentId) {
          try {
            await stripe.refunds.create({
              payment_intent: consultation.paymentIntentId,
              reason: "requested_by_customer",
              metadata: {
                userId,
                reason: "doctor_declined",
                declineReason: reasonText,
              },
            });
            refundInitiated = true;

            await prisma.user.update({
              where: { id: userId },
              data: { journeyStatus: "REFUNDED" },
            });
          } catch (stripeError) {
            console.error("Stripe refund error:", stripeError);
            await prisma.careCommunication.create({
              data: {
                userId,
                type: "REFUND_REQUEST",
                priority: "HIGH",
                subject: `MANUAL REFUND REQUIRED: ${user.firstName} ${user.lastName}`,
                notes: `Patient was declined by doctor. Automatic refund failed.

Please process refund manually.
Payment Intent: ${consultation.paymentIntentId}
Reason: ${reasonText}`,
                status: "PENDING",
                dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
              },
            });
          }
        }

        if (carePartnerFollowUpRequired) {
          await prisma.careCommunication.create({
            data: {
              userId,
              type: "FOLLOW_UP",
              priority: "NORMAL",
              subject: `Declined Patient Follow-up: ${user.firstName} ${user.lastName}`,
              notes: `Patient was declined for treatment.

Reason: ${reasonText}

Guidance for patient:
${safeNextStepGuidance}

${gpReferralSuggested ? "Note: GP referral was suggested." : ""}

Please contact patient to provide support and guidance.`,
              status: "PENDING",
              dueDate: new Date(Date.now() + 48 * 60 * 60 * 1000),
              assignedTo: user.assignedCarePartnerId || undefined,
            },
          });
        }

        await sendEmail({
          to: user.email,
          subject: "Important update about your Sanative consultation",
          body: `
            <h2>Hi ${user.firstName},</h2>
            <p>After reviewing your assessment, your Sanative doctor has determined that this program is not clinically suitable at this time.</p>
            <p>Your first-month payment will be refunded${refundInitiated ? " and should appear in your account within 5-10 business days" : ""}.</p>
            ${carePartnerFollowUpRequired ? "<p>Our team will contact you with safe next steps where appropriate.</p>" : ""}
            ${gpReferralSuggested ? "<p>We recommend discussing your health goals with your regular GP, who can provide personalized guidance.</p>" : ""}
            <p>If you have any questions, please don't hesitate to contact our support team.</p>
            <p style="color:#666;margin-top:24px;">The Sanative Health Team</p>
          `,
        });

        await prisma.automationLog.create({
          data: {
            userId,
            automationType: "doctor_decision_declined",
            triggerEvent: "manual_decline",
            channel: "doctor_portal",
            status: "completed",
            metadata: {
              decidedBy: session.user.id,
              doctorName,
              declineReason: reasonText,
              refundInitiated,
              consultationId,
              subscriptionCreated: false, // GAP-005: Never create subscription for declined
            },
          },
        });

        await prisma.activityLog.create({
          data: {
            userId,
            action: "DOCTOR_DECISION_DECLINED",
            entity: "consultation_booking",
            entityId: consultationId,
            details: {
              decidedBy: session.user.id,
              doctorName,
              decision: "DECLINED",
              declineReason: reasonText,
              safeNextStepGuidance,
              carePartnerFollowUp: carePartnerFollowUpRequired,
              gpReferral: gpReferralSuggested,
              refundInitiated,
              subscriptionCreated: false, // GAP-005: Never create subscription for declined
              timestamp: new Date().toISOString(),
            },
          },
        });

        return NextResponse.json({
          success: true,
          decision: "DECLINED",
          refundInitiated,
          subscriptionCreated: false, // GAP-005: Explicitly state no subscription created
          message: "Patient declined. Refund workflow initiated and patient notified. No subscription created.",
        });
      }

      case "APPROVED_PENDING_TESTS": {
        // ─── UAT8-GAP-006: Approved with testing model ────────────────────────────
        // Patient is APPROVED and can proceed with the program
        // Tests are tracked separately and don't block program access
        // Subscription is created immediately
        // This replaces the old blocking behavior

        if (!testsRequired || testsRequired.length === 0) {
          return NextResponse.json(
            { error: "At least one test must be selected" },
            { status: 400 }
          );
        }
        if (!reasonForTests) {
          return NextResponse.json(
            { error: "Reason for tests is required" },
            { status: 400 }
          );
        }

        const testsList = (testsRequired as string[]).map((testId: string) => {
          const test = BLOOD_TEST_OPTIONS[testId as keyof typeof BLOOD_TEST_OPTIONS];
          return test ? `${test.name}: ${test.description}` : testId;
        });

        // ─── Create prescription if medication is provided ────────────────────────
        let prescriptionId: string | null = null;
        if (prescribeTreatment && medicationName) {
          // Validate medication fields
          if (!dosage || dosage.trim().length < 2) {
            return NextResponse.json(
              { error: "Dosage is required when prescribing treatment" },
              { status: 400 }
            );
          }
          if (!frequency || frequency.trim().length < 2) {
            return NextResponse.json(
              { error: "Frequency is required when prescribing treatment" },
              { status: 400 }
            );
          }
          if (!form || !VALID_MEDICATION_FORMS.includes(form)) {
            return NextResponse.json(
              { error: "Valid medication form is required when prescribing treatment" },
              { status: 400 }
            );
          }
          if (!contraindicationsReviewed) {
            return NextResponse.json(
              { error: "Contraindications review checkbox is required" },
              { status: 400 }
            );
          }

          // Create prescription
          const prescription = await prisma.prescription.create({
            data: {
              patientId: userId,
              medicationName: medicationName.trim(),
              genericName: genericName?.trim() || null,
              strength: strength?.trim() || "",
              form: form as "TABLET" | "CAPSULE" | "INJECTION" | "LIQUID" | "CREAM" | "GEL" | "PATCH" | "INHALER" | "DROPS" | "SPRAY" | "SUPPOSITORY" | "POWDER" | "OTHER",
              dosage: dosage.trim(),
              frequency: frequency.trim(),
              instructions: instructions?.trim() || null,
              quantity: quantity || 1,
              quantityUnit: quantityUnit?.trim() || "units",
              daysSupply: daysSupply || 28,
              refillsTotal: repeats || 0,
              refillsRemaining: repeats || 0,
              prescriberId: session.user.id,
              prescriberName: doctorName,
              status: "ACTIVE",
              scriptStatus: "SCRIPT_DRAFT",
              category: "WEIGHT_MANAGEMENT",
              diagnosis: "Weight management program",
              notes: `${clinicalNotes}\n\n--- Pending Tests ---\n${testsList.join("\n")}\nReason: ${reasonForTests}`,
              pharmacyNotes: pharmacyNotes?.trim() || null,
              safetyCounsellingNotes: safetyCounsellingNotes?.trim() || null,
              startDate: startDate ? new Date(startDate) : new Date(),
              followUpDate: followUpDate ? new Date(followUpDate) : null,
              nextRefillDate: new Date(Date.now() + (daysSupply || 28) * 24 * 60 * 60 * 1000),
            },
          });
          prescriptionId = prescription.id;

          // Link prescription to intake
          try {
            await prisma.weightManagementIntake.updateMany({
              where: { userId },
              data: {
                prescriptionId: prescription.id,
                doctorReviewStatus: "APPROVED",
                doctorId: session.user.id,
                doctorReviewedAt: new Date(),
                doctorDecision: "APPROVED_WITH_TESTS",
                doctorNotes: clinicalNotes,
              },
            });
          } catch (intakeLinkError) {
            console.error("[APPROVED_WITH_TESTS] Failed to link prescription to intake:", intakeLinkError);
          }
        } else {
          // No medication - update intake without prescription
          try {
            await prisma.weightManagementIntake.updateMany({
              where: { userId },
              data: {
                doctorReviewStatus: "APPROVED",
                doctorId: session.user.id,
                doctorReviewedAt: new Date(),
                doctorDecision: "APPROVED_WITH_TESTS",
                doctorNotes: clinicalNotes,
              },
            });
          } catch (intakeError) {
            console.error("[APPROVED_WITH_TESTS] Failed to update intake:", intakeError);
          }
        }

        // ─── Update user status - APPROVED, program proceeds ──────────────────────
        // UAT8-GAP-006: Patient is approved and can access program while tests are tracked
        await prisma.user.update({
          where: { id: userId },
          data: {
            approvalStatus: "APPROVED_WITH_TESTS", // New status for tracking
            journeyStatus: prescriptionId ? "APPROVED" : "ONBOARDING_PENDING", // Program proceeds
          },
        });

        // Update consultation
        await prisma.consultationBooking.update({
          where: { id: consultationId },
          data: {
            status: "BOOKING_COMPLETED",
            completedAt: new Date(),
            notes: clinicalNotes,
          },
        });

        // ─── Create ongoing subscription - patient proceeds with billing ──────────
        let subscriptionResult: { success: boolean; subscriptionId?: string; error?: string } = { success: false };
        try {
          subscriptionResult = await createOngoingSubscription(
            userId,
            user.email,
            `${user.firstName} ${user.lastName}`.trim(),
            selectedPlan,
            consultation.paymentIntentId
          );

          if (!subscriptionResult.success) {
            console.error(`[UAT8-GAP-006] Subscription creation failed: ${subscriptionResult.error}`);

            await prisma.careCommunication.create({
              data: {
                userId,
                type: "BILLING",
                priority: "HIGH",
                subject: `MANUAL SUBSCRIPTION REQUIRED: ${user.firstName} ${user.lastName}`,
                notes: `Patient was approved (with testing) but automatic subscription creation failed.

Please manually create the ${selectedPlan} subscription ($${(PLAN_AMOUNTS[selectedPlan] / 100).toFixed(2)}/month).

Error: ${subscriptionResult.error}
Payment Intent: ${consultation.paymentIntentId || "N/A"}`,
                status: "PENDING",
                dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
              },
            });
          }
        } catch (subscriptionError) {
          console.error("[UAT8-GAP-006] Subscription creation error:", subscriptionError);
        }

        // ─── Create clinical note ─────────────────────────────────────────────────
        await prisma.internalNote.create({
          data: {
            userId,
            memberId: userId,
            authorId: session.user.id,
            authorName: doctorName,
            createdBy: session.user.id,
            category: "MEDICAL",
            title: "Doctor Decision: APPROVED WITH TESTING",
            content: `**Decision:** Approved for program — blood tests ordered for monitoring

**Program Status:** ACTIVE — Patient can proceed while tests are completed

**Tests Required:**
${testsList.map((t) => `- ${t}`).join("\n")}

**Reason for Tests:**
${reasonForTests}

**Follow-up timeframe:** ${testFollowUpTimeframe || "2 weeks"}

${prescriptionId ? `**Prescription Created:** ${prescriptionId}
- Medication: [CONFIDENTIAL - See Prescription]
- Dosage: ${dosage}
- Frequency: ${frequency}
- Script Status: DRAFT` : "**No medication prescribed** - Lifestyle program"}

**Billing:**
- Plan: ${selectedPlan}
- Monthly Amount: $${(PLAN_AMOUNTS[selectedPlan] / 100).toFixed(2)}
- Subscription Created: ${subscriptionResult.success ? "Yes" : "No (manual setup required)"}

**Clinical Notes:**
${clinicalNotes}`,
            isPinned: true,
          },
        });

        // ─── Create pathology task (tests are tracked but don't block) ────────────
        await prisma.careCommunication.create({
          data: {
            userId,
            type: "PATHOLOGY_REQUEST",
            priority: "HIGH",
            subject: `Pathology Request (Monitoring): ${user.firstName} ${user.lastName}`,
            notes: `Doctor has approved patient and requested blood tests for ongoing monitoring.

**NOTE:** Patient program is ACTIVE — tests are for monitoring, not blocking.

**Tests Required:**
${testsList.map((t) => `- ${t}`).join("\n")}

**Reason:**
${reasonForTests}

**Action Required:**
1. Generate pathology referral form
2. Contact patient to arrange testing
3. Advise on bulk-billing/Medicare rebates where applicable
4. Follow up on results within ${testFollowUpTimeframe || "2 weeks"}
5. Upload results to patient record when received`,
            status: "PENDING",
            dueDate: new Date(Date.now() + 48 * 60 * 60 * 1000),
            assignedTo: user.assignedCarePartnerId || undefined,
          },
        });

        // Create test follow-up task
        await prisma.careCommunication.create({
          data: {
            userId,
            type: "FOLLOW_UP",
            priority: "NORMAL",
            subject: `Blood Test Follow-up: ${user.firstName} ${user.lastName}`,
            notes: `Patient is approved and program is active.

Blood tests have been ordered for monitoring.

Follow-up in ${testFollowUpTimeframe || "2 weeks"} to:
1. Check if tests have been completed
2. Retrieve and upload results
3. Review results with doctor if abnormal
4. Update patient on any changes to care plan`,
            status: "PENDING",
            dueDate: new Date(Date.now() + (testFollowUpTimeframe === "1 week" ? 7 : testFollowUpTimeframe === "3 weeks" ? 21 : 14) * 24 * 60 * 60 * 1000),
            assignedTo: user.assignedCarePartnerId || undefined,
          },
        });

        // Create script finalization task if prescription was created
        if (prescriptionId) {
          await prisma.careCommunication.create({
            data: {
              userId,
              type: "SCRIPT_REVIEW",
              priority: "HIGH",
              subject: `Script Finalization Required: ${user.firstName} ${user.lastName}`,
              notes: `Doctor has approved patient with testing. Script is in DRAFT status.

**Actions Required:**
1. Review prescription details
2. Finalize and sign script
3. Update script status to SCRIPT_WRITTEN
4. Send to pharmacy

Note: Blood tests have been ordered for monitoring.

Prescription ID: ${prescriptionId}`,
              status: "PENDING",
              dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
            },
          });
        }

        // Create onboarding task
        await prisma.careCommunication.create({
          data: {
            userId,
            type: "ONBOARDING",
            priority: "NORMAL",
            subject: `Patient Onboarding: ${user.firstName} ${user.lastName}`,
            notes: `Doctor has approved ${user.firstName} for the program.

**Note:** Blood tests are ordered for monitoring but don't block onboarding.

Tasks:
1. Welcome call to patient
2. ${prescriptionId ? "Confirm shipping details after script finalized" : "Explain lifestyle program structure"}
3. Send onboarding materials
4. Schedule first check-in
5. Remind about upcoming blood tests`,
            status: "PENDING",
            dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
            assignedTo: user.assignedCarePartnerId || undefined,
          },
        });

        // ─── Send patient email - approved with testing info ──────────────────────
        await sendEmail({
          to: user.email,
          subject: "You're approved! Your Sanative program is ready",
          body: `
            <h2>Hi ${user.firstName},</h2>
            <p>Great news! Your doctor has reviewed your assessment and approved you to begin your Sanative program.</p>

            <div style="background:#d1fae5;border:1px solid #10b981;border-radius:8px;padding:16px;margin:16px 0;">
              <p style="margin:0;color:#065f46;font-weight:600;">Your program is now active and our care team will be in touch soon.</p>
            </div>

            <div style="margin: 24px 0;">
              <a href="${dashboardUrl}" style="display:inline-block;background:#059669;color:white;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;">
                Go to My Dashboard
              </a>
            </div>

            <h3>Blood tests for monitoring</h3>
            <p>Your doctor has also requested some blood tests to help monitor your progress. This is a normal part of personalized care.</p>

            <div style="background:#fef3c7;border:1px solid #f59e0b;border-radius:8px;padding:16px;margin:16px 0;">
              <p style="margin:0 0 8px 0;color:#92400e;font-weight:600;">Tests requested:</p>
              <ul style="margin:0;padding-left:20px;color:#92400e;">
                ${testsList.map((t) => `<li>${t}</li>`).join("")}
              </ul>
            </div>

            <p>Our care team will contact you to arrange convenient testing. Many tests are Medicare-rebated or bulk-billed for eligible patients.</p>

            <h3>What happens next?</h3>
            <ul>
              <li>Your care partner will reach out to welcome you</li>
              ${prescriptionId ? "<li>Your treatment plan is being prepared</li>" : "<li>We'll set up your program details</li>"}
              <li>We'll coordinate your blood tests at a time that works for you</li>
            </ul>

            <p>We're excited to support you on this journey!</p>
            <p style="color:#666;margin-top:24px;">The Sanative Health Team</p>
          `,
        });

        // Log automation
        await prisma.automationLog.create({
          data: {
            userId,
            automationType: "doctor_decision_approved_with_tests",
            triggerEvent: "manual_approval",
            channel: "doctor_portal",
            status: "completed",
            metadata: {
              decidedBy: session.user.id,
              doctorName,
              testsRequired,
              reasonForTests,
              prescriptionId,
              consultationId,
              selectedPlan,
              subscriptionCreated: subscriptionResult.success,
              subscriptionId: subscriptionResult.subscriptionId,
              programActive: true, // UAT8-GAP-006: Program proceeds
            },
          },
        });

        // Log activity
        await prisma.activityLog.create({
          data: {
            userId,
            action: "DOCTOR_DECISION_APPROVED_WITH_TESTS",
            entity: "consultation_booking",
            entityId: consultationId,
            details: {
              decidedBy: session.user.id,
              doctorName,
              decision: "APPROVED_WITH_TESTS",
              testsRequired,
              reasonForTests,
              prescriptionId,
              followUpTimeframe: testFollowUpTimeframe,
              selectedPlan,
              subscriptionCreated: subscriptionResult.success,
              subscriptionId: subscriptionResult.subscriptionId,
              monthlyAmount: PLAN_AMOUNTS[selectedPlan],
              programActive: true, // UAT8-GAP-006: Program proceeds
              timestamp: new Date().toISOString(),
            },
          },
        });

        return NextResponse.json({
          success: true,
          decision: "APPROVED_WITH_TESTS",
          testsRequired,
          prescriptionId,
          selectedPlan,
          subscriptionCreated: subscriptionResult.success,
          subscriptionId: subscriptionResult.subscriptionId,
          monthlyAmount: PLAN_AMOUNTS[selectedPlan],
          programActive: true,
          message: "Patient approved with testing. Program is active and subscription created. Blood tests will be tracked separately.",
        });
      }

      default:
        return NextResponse.json(
          { error: `Invalid decision type: ${decision}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Error processing doctor decision:", error);
    // Return more specific error message for debugging
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to process decision: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// GET /api/admin/doctor/decision - Get decision options
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !["ADMIN", "DOCTOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({
      // No hardcoded medications - doctor enters manually
      medicationForms: VALID_MEDICATION_FORMS,
      declineReasons: Object.entries(DECLINE_REASONS).map(([id, text]) => ({
        id,
        text,
      })),
      bloodTests: Object.entries(BLOOD_TEST_OPTIONS).map(([id, test]) => ({
        id,
        name: test.name,
        description: test.description,
        reason: test.reason,
      })),
      followUpOptions: [
        { id: "2_weeks", label: "2 weeks" },
        { id: "4_weeks", label: "4 weeks" },
        { id: "6_weeks", label: "6 weeks" },
        { id: "8_weeks", label: "8 weeks" },
        { id: "12_weeks", label: "12 weeks" },
        { id: "as_needed", label: "As clinically indicated" },
      ],
      repeatsOptions: [
        { value: 0, label: "No repeats" },
        { value: 1, label: "1 repeat" },
        { value: 2, label: "2 repeats" },
        { value: 3, label: "3 repeats" },
        { value: 5, label: "5 repeats" },
      ],
      frequencyOptions: [
        { id: "once_daily", label: "Once daily" },
        { id: "twice_daily", label: "Twice daily" },
        { id: "once_weekly", label: "Once weekly" },
        { id: "every_other_day", label: "Every other day" },
        { id: "as_needed", label: "As needed (PRN)" },
      ],
      quantityUnits: [
        "tablets",
        "capsules",
        "pens",
        "vials",
        "bottles",
        "tubes",
        "patches",
        "units",
      ],
      // GAP-005: Monthly billing amounts
      billingAmounts: {
        CORE: PLAN_AMOUNTS.CORE,
        PRECISION: PLAN_AMOUNTS.PRECISION,
      },
    });
  } catch (error) {
    console.error("Error fetching decision options:", error);
    return NextResponse.json(
      { error: "Failed to fetch options" },
      { status: 500 }
    );
  }
}
