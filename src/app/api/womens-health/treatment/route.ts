import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const SCRIPT_STATUS_DESCRIPTIONS: Record<string, { label: string; description: string }> = {
  SCRIPT_DRAFT: { label: "Script being prepared", description: "Your doctor is preparing your prescription" },
  SCRIPT_WRITTEN: { label: "Script written", description: "Your prescription has been written" },
  SCRIPT_SENT_TO_PHARMACY: { label: "Sent to pharmacy", description: "Your prescription has been sent to the pharmacy" },
  PHARMACY_PENDING: { label: "At pharmacy", description: "Pharmacy is preparing your treatment" },
  DISPENSING: { label: "Being dispensed", description: "Your treatment is being dispensed" },
  SHIPPED: { label: "Shipped", description: "Your treatment has been shipped" },
  DELIVERED: { label: "Delivered", description: "Your treatment has been delivered" },
};

const WOMENS_HEALTH_KEYWORDS = [
  "women",
  "female",
  "menopause",
  "perimenopause",
  "hormone",
  "hrt",
  "pcos",
  "fertility",
  "progesterone",
  "estradiol",
  "oestrogen",
  "estrogen",
  "thyroid",
  "iron",
  "vitamin",
];

function hasWomensHealthContext(...values: Array<string | null | undefined>): boolean {
  const haystack = values.join(" ").toLowerCase();
  return WOMENS_HEALTH_KEYWORDS.some((keyword) => haystack.includes(keyword));
}

function statusInfo(scriptStatus: string) {
  return SCRIPT_STATUS_DESCRIPTIONS[scriptStatus] || {
    label: scriptStatus.replace(/_/g, " "),
    description: "Status information unavailable",
  };
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const [user, programMember, prescriptions, treatments] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          firstName: true,
          subscriptionTier: true,
          journeyStatus: true,
          approvalStatus: true,
        },
      }),
      prisma.programMember.findFirst({
        where: {
          OR: [{ userId }, { email: session.user.email || "" }],
          program: "WOMENS_HEALTH",
        },
        select: {
          id: true,
          membershipStatus: true,
          intakeData: true,
          createdAt: true,
        },
      }),
      prisma.prescription.findMany({
        where: {
          patientId: userId,
          status: "ACTIVE",
          OR: [
            { category: "HORMONE_THERAPY" },
            { category: "THYROID" },
            {
              category: "VITAMIN_SUPPLEMENT",
              OR: [
                { diagnosis: { contains: "women", mode: "insensitive" } },
                { diagnosis: { contains: "fertility", mode: "insensitive" } },
                { diagnosis: { contains: "hormone", mode: "insensitive" } },
                { notes: { contains: "women", mode: "insensitive" } },
              ],
            },
            { diagnosis: { contains: "women", mode: "insensitive" } },
            { diagnosis: { contains: "menopause", mode: "insensitive" } },
            { diagnosis: { contains: "hormone", mode: "insensitive" } },
            { diagnosis: { contains: "pcos", mode: "insensitive" } },
            { diagnosis: { contains: "fertility", mode: "insensitive" } },
          ],
        },
        orderBy: { prescribedAt: "desc" },
        include: {
          refills: {
            orderBy: { requestedAt: "desc" },
            take: 3,
          },
        },
      }),
      prisma.treatment.findMany({
        where: { userId, isActive: true },
        include: {
          doses: {
            orderBy: { scheduledAt: "desc" },
            take: 60,
          },
        },
        orderBy: { startDate: "asc" },
      }),
    ]);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const womensPrescriptions = prescriptions.filter((rx) =>
      hasWomensHealthContext(
        rx.medicationName,
        rx.genericName,
        rx.diagnosis,
        rx.notes,
        rx.patientNotes
      ) || ["HORMONE_THERAPY", "THYROID"].includes(rx.category)
    );

    const womensTreatments = treatments.filter((treatment) =>
      hasWomensHealthContext(
        treatment.medicationName,
        treatment.instructions
      )
    );

    return NextResponse.json({
      user: {
        firstName: user.firstName,
        subscriptionTier: user.subscriptionTier,
        journeyStatus: user.journeyStatus,
        approvalStatus: user.approvalStatus,
      },
      isWomensHealthMember:
        user.subscriptionTier === "womens_health" || programMember?.id != null,
      programMember,
      summary: {
        isApproved: user.approvalStatus === "APPROVED" || user.approvalStatus === "APPROVED_WITH_TESTS",
        hasPrescription: womensPrescriptions.length > 0,
        hasActiveTreatment: womensTreatments.length > 0,
        activePrescriptionCount: womensPrescriptions.length,
        activeTreatmentCount: womensTreatments.length,
      },
      prescriptions: womensPrescriptions.map((rx) => {
        const latestRefill = rx.refills[0];
        const info = statusInfo(rx.scriptStatus);
        return {
          id: rx.id,
          medicationName: rx.medicationName,
          genericName: rx.genericName,
          strength: rx.strength,
          form: rx.form,
          dosage: rx.dosage,
          frequency: rx.frequency,
          instructions: rx.instructions,
          quantity: rx.quantity,
          quantityUnit: rx.quantityUnit,
          daysSupply: rx.daysSupply,
          refillsTotal: rx.refillsTotal,
          refillsRemaining: rx.refillsRemaining,
          prescriberName: rx.prescriberName,
          pharmacyName: rx.pharmacyName,
          pharmacyPhone: rx.pharmacyPhone,
          status: rx.status,
          scriptStatus: rx.scriptStatus,
          scriptStatusLabel: info.label,
          scriptStatusDescription: info.description,
          category: rx.category,
          diagnosis: rx.diagnosis,
          startDate: rx.startDate.toISOString(),
          followUpDate: rx.followUpDate?.toISOString() || null,
          nextRefillDate: rx.nextRefillDate?.toISOString() || null,
          trackingNumber: latestRefill?.trackingNumber || null,
          deliveryMethod: latestRefill?.deliveryMethod || null,
          deliveredAt: latestRefill?.deliveredAt?.toISOString() || null,
        };
      }),
      treatments: womensTreatments.map((treatment) => {
        const dueDoses = treatment.doses.filter(
          (dose) => dose.scheduledAt <= new Date() && !dose.skipped
        );
        const takenDoses = dueDoses.filter((dose) => dose.takenAt).length;
        return {
          id: treatment.id,
          prescriptionId: treatment.prescriptionId,
          medicationName: treatment.medicationName,
          dosage: treatment.dosage,
          frequency: treatment.frequency,
          instructions: treatment.instructions,
          startDate: treatment.startDate.toISOString(),
          nextDoseDate: treatment.nextDoseDate?.toISOString() || null,
          adherence:
            dueDoses.length > 0 ? Math.round((takenDoses / dueDoses.length) * 100) : null,
        };
      }),
    });
  } catch (error) {
    console.error("[womens-health/treatment]", error);
    return NextResponse.json({ error: "Failed to load Women's Health treatments" }, { status: 500 });
  }
}
