import { prisma } from "@/lib/prisma";
import { getBiomarkerSubscriptionPlan } from "@/lib/biomarkers/public-subscription-panels";
import {
  billingTierToPublicTier,
  isValidPublicPanelTier,
} from "@/lib/biomarkers/public-checkout-tier-map";
import { isBiomarkersPanelBookingNotes } from "@/lib/stripe/verify-biomarkers-panel-booking-payment";
import { resolvePublicConsultProgramFromContext } from "./public-consult-programs";
import { genderForPublicConsultSlug } from "./program-gender";

/** Program metadata stored on pre-triage tasks (clinical funnel + biomarkers consults). */
export type PreTriageProgramInfo = {
  slug: string;
  label: string;
  isWeightManagement: boolean;
  programKey?: string;
  panelTier?: string;
};

export function resolveBiomarkersPreTriageProgram(
  paymentMetadata?: Record<string, string> | null
): PreTriageProgramInfo {
  const publicPanelTier = paymentMetadata?.publicPanelTier;
  const billingPanelTier = paymentMetadata?.panelTier;

  let label = "Biomarkers Panel";
  let panelTier = billingPanelTier;

  if (publicPanelTier && isValidPublicPanelTier(publicPanelTier)) {
    const plan = getBiomarkerSubscriptionPlan(publicPanelTier);
    label = `${plan.name} Biomarkers`;
    panelTier = panelTier ?? publicPanelTier;
  } else if (
    billingPanelTier === "essential" ||
    billingPanelTier === "extended" ||
    billingPanelTier === "comprehensive"
  ) {
    const publicTier = billingTierToPublicTier(billingPanelTier);
    const plan = getBiomarkerSubscriptionPlan(publicTier);
    label = `${plan.name} Biomarkers`;
    panelTier = billingPanelTier;
  }

  return {
    slug: "biomarkers",
    label,
    isWeightManagement: false,
    programKey: "BIOLOGICAL_CLOCK",
    panelTier,
  };
}

/** True when this paid consult came from the public weight-management membership funnel. */
export function isWeightManagementMembershipFunnel(
  paymentMetadata?: Record<string, string> | null,
  bookingNotes?: string | null
): boolean {
  const intent = (paymentMetadata?.intentProgram || "").toLowerCase();
  const source = (paymentMetadata?.source || "").toLowerCase();
  if (intent === "weight_management" || source === "weight_management_assessment") {
    return true;
  }
  const notes = (bookingNotes || "").toLowerCase();
  return (
    paymentMetadata?.purchaseType === "sanative_membership" &&
    notes.includes("weight management")
  );
}

/** Clinical `User.subscriptionTier` so the member appears in In Triage. */
export function clinicalSubscriptionTierForProgram(
  program: Pick<PreTriageProgramInfo, "slug" | "isWeightManagement">
): string | null {
  if (program.isWeightManagement || program.slug === "weight_management") {
    return "weight_management";
  }
  if (program.slug === "hair_loss" || program.slug === "mens_health" || program.slug === "womens_health") {
    return program.slug;
  }
  return null;
}

/** Resolve pre-triage program from booking context (biomarkers consults before legacy WM fallback). */
export function resolvePreTriageProgramForBooking(ctx: {
  subscriptionTier?: string | null;
  bookingNotes?: string | null;
  paymentMetadata?: Record<string, string> | null;
}): PreTriageProgramInfo {
  if (isWeightManagementMembershipFunnel(ctx.paymentMetadata, ctx.bookingNotes)) {
    return {
      slug: "weight_management",
      label: "Weight Management",
      isWeightManagement: true,
      programKey: "WEIGHT_MANAGEMENT",
    };
  }

  // Hair / women's Advanced funnels pay for biomarkers but the clinical program
  // is the condition, keep one In Triage booking, not a biomarkers pre-triage.
  if (ctx.paymentMetadata?.sourceProgram === "hair_loss") {
    return {
      slug: "hair_loss",
      label: "Hair Loss",
      isWeightManagement: false,
      programKey: "HAIR_LOSS",
      panelTier: ctx.paymentMetadata.panelTier,
    };
  }

  if (ctx.paymentMetadata?.sourceProgram === "mens_health") {
    return {
      slug: "mens_health",
      label: "Men's Health",
      isWeightManagement: false,
      programKey:
        ctx.paymentMetadata.programKey === "MENS_HEALTH_SEXUAL"
          ? "MENS_HEALTH_SEXUAL"
          : "MENS_HEALTH_VITALITY",
      panelTier: ctx.paymentMetadata?.panelTier,
    };
  }

  const womensSource = ctx.paymentMetadata?.sourceProgram;
  if (
    womensSource === "womens_health" ||
    womensSource === "womens_health_sexual" ||
    womensSource === "womens_health_vitality"
  ) {
    return {
      slug: "womens_health",
      label: "Women's Health",
      isWeightManagement: false,
      programKey:
        womensSource === "womens_health_sexual"
          ? "WOMENS_HEALTH_SEXUAL"
          : "WOMENS_HEALTH_VITALITY",
      panelTier: ctx.paymentMetadata?.panelTier,
    };
  }

  if (isBiomarkersPanelBookingNotes(ctx.bookingNotes)) {
    return resolveBiomarkersPreTriageProgram(ctx.paymentMetadata);
  }

  const program = resolvePublicConsultProgramFromContext(ctx);
  return {
    slug: program.slug,
    label: program.label,
    isWeightManagement: program.isWeightManagement,
  };
}

export type CreateProgramPreTriageInput = {
  userId: string;
  bookingId: string;
  patientName: string;
  scheduledAt: Date;
  intakeId?: string | null;
  program: PreTriageProgramInfo;
  /** Extra context stored in task notes JSON (concern, category, etc.). */
  context?: Record<string, unknown>;
};

/** Idempotent: promote a confirmed public consult into care-partner In Triage. */
export async function createProgramPreTriageTask(
  input: CreateProgramPreTriageInput
): Promise<void> {
  // Public assessment bookings must land in In Triage (journey status) for care
  // partners to assign a doctor. They must NOT create a Pre-Triage Queue task,
  // that queue is for portal add-ons when a consult is already in triage.
  const existingPatient = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { assignedCarePartnerId: true, journeyStatus: true },
  });

  let assignedOwnerId: string | null = existingPatient?.assignedCarePartnerId ?? null;
  if (!assignedOwnerId) {
    try {
      const carePartners = await prisma.user.findMany({
        where: { role: "CARE_PARTNER" },
        select: { id: true },
      });
      if (carePartners.length > 0) {
        assignedOwnerId = carePartners[0].id;
      }
    } catch (e) {
      console.error("[in-triage] care partner lookup failed:", e);
    }
  }

  const programGender = genderForPublicConsultSlug(input.program.slug);
  const alreadyInTriage = existingPatient?.journeyStatus === "PRE_TRIAGE_PENDING";
  const clinicalTier = clinicalSubscriptionTierForProgram(input.program);

  await prisma.user.update({
    where: { id: input.userId },
    data: {
      journeyStatus: "PRE_TRIAGE_PENDING",
      memberStatus: "MEMBER",
      ...(clinicalTier ? { subscriptionTier: clinicalTier } : {}),
      ...(programGender ? { gender: programGender } : {}),
      ...(assignedOwnerId ? { assignedCarePartnerId: assignedOwnerId } : {}),
    },
  });

  if (assignedOwnerId && !alreadyInTriage) {
    await prisma.notification
      .create({
        data: {
          userId: assignedOwnerId,
          type: "INFO",
          title: `New ${input.program.label} in triage`,
          message: `${input.patientName} booked a consultation on ${input.scheduledAt.toLocaleDateString("en-AU", {
            weekday: "long",
            day: "numeric",
            month: "long",
            hour: "numeric",
            minute: "2-digit",
          })}. Review intake and assign a doctor.`,
          isRead: false,
        },
      })
      .catch(() => undefined);
  }

  await completeOnboardingPreTriageTasksForPatient(input.userId);
}

/** Close public-subscription Pre-Triage Queue rows once the member is In Triage. */
export async function completeOnboardingPreTriageTasksForPatient(userId: string): Promise<void> {
  await prisma.preTriageTask.updateMany({
    where: {
      patientId: userId,
      status: { in: ["PENDING", "IN_PROGRESS", "BLOCKED"] },
      notes: { contains: '"source":"public_subscription"' },
    },
    data: {
      status: "COMPLETED",
      completedAt: new Date(),
    },
  });
}

/** Move booked public WM funnel members from Pre-Triage Queue into In Triage. */
export async function promoteBookedWeightManagementFunnelMembersToTriage(): Promise<number> {
  const tasks = await prisma.preTriageTask.findMany({
    where: {
      status: { in: ["PENDING", "IN_PROGRESS", "BLOCKED"] },
      notes: { contains: "weight_management" },
    },
    select: { patientId: true, notes: true },
  });

  const seen = new Set<string>();
  let promoted = 0;

  for (const task of tasks) {
    if (seen.has(task.patientId)) continue;
    let meta: { source?: string; intentProgram?: string } = {};
    try {
      meta = JSON.parse(task.notes || "{}") as { source?: string; intentProgram?: string };
    } catch {
      continue;
    }
    if (meta.source !== "public_subscription") continue;
    if ((meta.intentProgram || "").toLowerCase() !== "weight_management") continue;

    const booking = await prisma.consultationBooking.findFirst({
      where: {
        userId: task.patientId,
        status: { in: ["BOOKING_CONFIRMED", "SLOT_HELD"] },
      },
      select: { id: true, scheduledAt: true },
    });
    if (!booking) continue;

    const user = await prisma.user.findUnique({
      where: { id: task.patientId },
      select: { firstName: true, lastName: true },
    });

    seen.add(task.patientId);
    await createProgramPreTriageTask({
      userId: task.patientId,
      bookingId: booking.id,
      patientName: `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "Member",
      scheduledAt: booking.scheduledAt,
      program: {
        slug: "weight_management",
        label: "Weight Management",
        isWeightManagement: true,
        programKey: "WEIGHT_MANAGEMENT",
      },
    });
    promoted += 1;
  }

  // Membership activation leaves subscriptionTier as "membership". In Triage only
  // lists clinical program tiers, so booked WM funnel members can be pending but hidden.
  const stranded = await prisma.user.findMany({
    where: {
      subscriptionTier: "membership",
      journeyStatus: "PRE_TRIAGE_PENDING",
      consultationBookings: {
        some: {
          status: "BOOKING_CONFIRMED",
          notes: { contains: "Weight Management" },
        },
      },
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      consultationBookings: {
        where: { status: "BOOKING_CONFIRMED" },
        orderBy: { scheduledAt: "desc" },
        take: 1,
        select: { id: true, scheduledAt: true },
      },
    },
  });

  for (const member of stranded) {
    if (seen.has(member.id)) continue;
    const booking = member.consultationBookings[0];
    if (!booking) continue;
    seen.add(member.id);
    await createProgramPreTriageTask({
      userId: member.id,
      bookingId: booking.id,
      patientName: `${member.firstName || ""} ${member.lastName || ""}`.trim() || "Member",
      scheduledAt: booking.scheduledAt,
      program: {
        slug: "weight_management",
        label: "Weight Management",
        isWeightManagement: true,
        programKey: "WEIGHT_MANAGEMENT",
      },
    });
    promoted += 1;
  }

  return promoted;
}

/** Onboarding triage for subscription-only public flows (e.g. organ care). */
export async function createOnboardingPreTriageTask(input: {
  userId: string;
  programLabel: string;
  programSlug: string;
  paymentIntentId: string;
  context?: Record<string, unknown>;
}): Promise<void> {
  const existing = await prisma.preTriageTask.findFirst({
    where: {
      patientId: input.userId,
      notes: { contains: input.paymentIntentId },
    },
    select: { id: true },
  });
  if (existing) return;

  let assignedOwnerId: string | null = null;
  const partner = await prisma.user.findFirst({
    where: { role: "CARE_PARTNER" },
    select: { id: true },
  });
  assignedOwnerId = partner?.id ?? null;

  const dueDate = new Date(Date.now() + 48 * 60 * 60 * 1000);
  const notes = JSON.stringify({
    programSlug: input.programSlug,
    programLabel: input.programLabel,
    source: "public_subscription",
    paymentIntentId: input.paymentIntentId,
    appointmentConfirmed: false,
    ...input.context,
  });

  await prisma.preTriageTask.create({
    data: {
      patientId: input.userId,
      assignedOwnerId,
      dueDate,
      status: "PENDING",
      quizComplete: true,
      appointmentConfirmed: false,
      notes,
    },
  });

  if (assignedOwnerId) {
    await prisma.notification
      .create({
        data: {
          userId: assignedOwnerId,
          type: "INFO",
          title: `New ${input.programLabel} member`,
          message: `A member completed ${input.programLabel} checkout. Schedule onboarding consultation.`,
          isRead: false,
        },
      })
      .catch(() => undefined);
  }
}
