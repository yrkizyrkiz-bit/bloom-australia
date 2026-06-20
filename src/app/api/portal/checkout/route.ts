import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeProgramKey, PROGRAM_LABELS } from "@/lib/membership/keys";
import { grantEntitlement } from "@/lib/membership/entitlement-service";
import { getProgramOffer } from "@/lib/programs/offers";
import { getSexualHealthFocusLabel } from "@/lib/programs/quizzes/sexual-health-quiz";
import { savePortalQuizSubmission } from "@/lib/portal-quiz-submissions";

/**
 * In-portal upsell checkout.
 *
 * NOTE: real Stripe charge wiring is the remaining Phase 4 step. For now this
 * records the member's intent: it creates a PENDING program entitlement
 * (source ADMIN_GRANT so the reconcile sync won't deactivate it) and a care-team
 * task to arrange the doctor consultation. Once a Stripe PaymentIntent succeeds,
 * the success handler should call grantEntitlement(... status: "ACTIVE").
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const body = await request.json().catch(() => ({}));
    const programKey = normalizeProgramKey(body?.programKey);
    if (!programKey) {
      return NextResponse.json({ error: "Unknown program" }, { status: 400 });
    }

    const offer = getProgramOffer(programKey);
    const label = PROGRAM_LABELS[programKey];
    const isConsultationFirst = body?.intent === "doctor_consultation";
    const treatmentFocus = body?.answers?.treatmentFocus as string | undefined;
    const focusText = treatmentFocus
      ? getSexualHealthFocusLabel(programKey, treatmentFocus)
      : label;

    // Record intent as a pending entitlement (protected from reconcile sync).
    await grantEntitlement({
      userId,
      type: "PROGRAM",
      key: programKey,
      status: "PENDING",
      source: "ADMIN_GRANT",
      notes: isConsultationFirst
        ? `In-portal consultation request: ${focusText}. A prescribed program must not start until after doctor approval.`
        : `In-portal subscription intent for ${label} (${offer.priceHint}).`,
    });

    await savePortalQuizSubmission({
      userId,
      programKey,
      answers: body?.answers ?? {},
      intent: body?.intent ?? "program_purchase",
      result: {
        focusLabel: focusText,
        priceLabel: offer.priceHint,
        consultationFirst: isConsultationFirst,
      },
    });

    const commType = isConsultationFirst ? "DOCTOR_CONSULTATION_REQUEST" : "PROGRAM_PURCHASE_REQUEST";
    const subjectNeedle = isConsultationFirst ? focusText : label;

    const existing = await prisma.careCommunication.findFirst({
      where: {
        userId,
        type: commType,
        subject: { contains: subjectNeedle, mode: "insensitive" },
        status: { in: ["PENDING", "IN_PROGRESS"] },
      },
    });

    if (!existing) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { firstName: true, lastName: true, assignedCarePartnerId: true },
      });

      const notes = isConsultationFirst
        ? `Member completed the in-portal Sexual Health quiz and requested a doctor consultation.

Treatment focus: ${focusText}
Consultation included in first subscription period: ${offer.priceHint}
Quiz answers: ${JSON.stringify(body?.answers ?? {}, null, 2)}

Action: arrange AHPRA doctor consultation. Do NOT start a prescribed treatment program until the doctor confirms clinical suitability.`
        : `Member started an in-portal purchase for ${label}.

Offer: ${offer.headline} — ${offer.priceHint}
Quiz answers: ${JSON.stringify(body?.answers ?? {}, null, 2)}

Action: confirm payment, then arrange the doctor consultation. Activate the program entitlement once payment clears.`;

      await prisma.careCommunication.create({
        data: {
          userId,
          type: commType,
          priority: "NORMAL",
          subject: isConsultationFirst
            ? `${focusText} consultation: ${user?.firstName || ""} ${user?.lastName || ""}`.trim()
            : `${label} purchase: ${user?.firstName || ""} ${user?.lastName || ""}`.trim(),
          notes,
          status: "PENDING",
          dueDate: new Date(Date.now() + 48 * 60 * 60 * 1000),
          assignedTo: user?.assignedCarePartnerId || undefined,
        },
      });
    }

    return NextResponse.json({
      success: true,
      programKey,
      message: isConsultationFirst
        ? `Thank you. Our care team will arrange your confidential ${focusText} doctor consultation. A treatment program will only be discussed after that consultation.`
        : `You're in. Our care team will confirm your ${label} consultation shortly.`,
    });
  } catch (error) {
    console.error("[portal/checkout]", error);
    return NextResponse.json({ error: "Failed to start checkout" }, { status: 500 });
  }
}
