import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDoctorOrAdmin } from "@/lib/auth/require-clinical-staff";
import { sendPathologyReferralEmail } from "@/lib/email";
import { SANATIVE_LEGAL } from "@/lib/legal/constants";
import { resolveDoctorProviderNumber } from "@/lib/doctor/provider-number";
import {
  BLOOD_TEST_CATALOG,
  getBloodTestLabel,
  catalogTestsRequireFasting,
} from "@/lib/pathology/blood-test-catalog";
import {
  buildPathologyReferralFilename,
  formatPatientSexForReferral,
  pathologyReferralPdfBase64,
  splitPatientNameForReferral,
} from "@/lib/pathology/generate-pathology-referral-pdf";
import type { PathologyReferralPayload } from "@/lib/pathology/types";
import {
  ALL_PATHOLOGY_PANEL_SLUGS,
  buildPathologyIndicationNotes,
  extractMedicareFromIntake,
  getPathologyPanelMeta,
  isPathologyPanelSlug,
  listPathologyPanelOptionGroups,
  mergePathologyTestIds,
  normalizePatientGender,
} from "@/lib/pathology/pathology-program-panels";
import { getLatestPortalQuizSubmissions } from "@/lib/portal-quiz-submissions";
import { format } from "date-fns";

function buildReferralId(): string {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `SAN-PATH-${stamp}-${rand}`;
}

function formatPatientAddress(patient: {
  addressLine1: string | null;
  addressLine2: string | null;
  suburb: string | null;
  state: string | null;
  postcode: string | null;
}): string {
  return [
    patient.addressLine1,
    patient.addressLine2,
    patient.suburb,
    patient.state,
    patient.postcode,
  ]
    .filter(Boolean)
    .join(", ");
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireDoctorOrAdmin();
    if ("error" in auth) {
      return auth.error;
    }

    const body = await request.json();
    const {
      userId,
      consultationId,
      programSlugs,
      additionalTestIds,
      customTests,
      clinicalIndication,
      fastingRequired,
      urgent,
      medicareNumber,
      medicareIrn,
      emailToPatient,
      doctor,
    } = body as {
      userId?: string;
      consultationId?: string;
      programSlugs?: string[];
      additionalTestIds?: string[];
      customTests?: string;
      clinicalIndication?: string;
      fastingRequired?: boolean;
      urgent?: boolean;
      medicareNumber?: string;
      medicareIrn?: string;
      emailToPatient?: boolean;
      doctor?: {
        fullName?: string;
        providerNumber?: string;
        phone?: string;
        email?: string;
      };
    };

    if (!userId) {
      return NextResponse.json({ error: "Patient ID is required" }, { status: 400 });
    }

    const resolvedProvider = await resolveDoctorProviderNumber(
      auth.userId,
      doctor?.providerNumber
    );

    if (!resolvedProvider.providerNumber) {
      return NextResponse.json(
        {
          error:
            "Medicare provider number is required, enter it in Referral details and save to your doctor profile",
        },
        { status: 400 }
      );
    }

    const providerNumber = resolvedProvider.providerNumber;

    const selectedPrograms = (programSlugs || []).filter(isPathologyPanelSlug);
    const extras = Array.isArray(additionalTestIds) ? additionalTestIds : [];

    if (selectedPrograms.length === 0 && extras.length === 0 && !customTests?.trim()) {
      return NextResponse.json(
        { error: "Select at least one program panel or additional test" },
        { status: 400 }
      );
    }

    const [patient, doctorUser] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          gender: true,
          dateOfBirth: true,
          addressLine1: true,
          addressLine2: true,
          suburb: true,
          state: true,
          postcode: true,
          assignedCarePartnerId: true,
        },
      }),
      prisma.user.findUnique({
        where: { id: auth.userId },
        select: {
          firstName: true,
          lastName: true,
          phone: true,
          email: true,
          addressLine1: true,
          addressLine2: true,
          suburb: true,
          state: true,
          postcode: true,
        },
      }),
    ]);

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    if (auth.role === "DOCTOR" && consultationId) {
      const booking = await prisma.consultationBooking.findFirst({
        where: { id: consultationId, userId },
        select: { doctorId: true },
      });
      if (booking?.doctorId && booking.doctorId !== auth.userId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const gender = normalizePatientGender(patient.gender);
    const mergedTestIds = mergePathologyTestIds(selectedPrograms, gender, extras);

    if (mergedTestIds.length === 0 && !customTests?.trim()) {
      return NextResponse.json(
        { error: "No pathology tests resolved for the selected program(s)" },
        { status: 400 }
      );
    }

    for (const testId of mergedTestIds) {
      if (!BLOOD_TEST_CATALOG[testId]) {
        return NextResponse.json({ error: `Unknown test: ${testId}` }, { status: 400 });
      }
    }

    const telehealthLine = `Telehealth consultation, ${patient.firstName} ${patient.lastName}.`;
    const [portalQuizzes, programMembers] = await Promise.all([
      getLatestPortalQuizSubmissions(userId),
      prisma.programMember.findMany({
        where: { userId },
        select: { intakeData: true },
      }),
    ]);

    const autoIndication = buildPathologyIndicationNotes({
      programSlugs: selectedPrograms,
      testIds: mergedTestIds,
      customTests,
      telehealthLine,
      quizSubmissions: portalQuizzes.map((row) => ({
        programKey: row.programKey,
        answers: row.answers,
        result: row.result,
      })),
      intakeDataList: programMembers.map((m) => m.intakeData),
    });

    const resolvedIndication = clinicalIndication?.trim() || autoIndication;

    const fasting =
      typeof fastingRequired === "boolean"
        ? fastingRequired
        : catalogTestsRequireFasting(mergedTestIds);

    const referralId = buildReferralId();
    const doctorName =
      doctor?.fullName?.trim() ||
      (doctorUser
        ? `Dr ${doctorUser.firstName} ${doctorUser.lastName}`.trim()
        : "Dr Sanative");

    const programLabels = selectedPrograms.map(
      (slug) => getPathologyPanelMeta(slug).label
    );
    const programSummary =
      programLabels.length > 0
        ? programLabels.join(", ")
        : "Individual pathology tests";

    const patientNames = splitPatientNameForReferral(patient.firstName, patient.lastName);
    const patientFullName = patientNames.fullName;
    const patientDob = patient.dateOfBirth
      ? format(new Date(patient.dateOfBirth), "dd/MM/yyyy")
      : "Not recorded";
    const doctorAddress = formatPatientAddress({
      addressLine1: doctorUser?.addressLine1 ?? null,
      addressLine2: doctorUser?.addressLine2 ?? null,
      suburb: doctorUser?.suburb ?? null,
      state: doctorUser?.state ?? null,
      postcode: doctorUser?.postcode ?? null,
    });

    const pdfPayload: PathologyReferralPayload = {
      referralId,
      issuedAt: new Date(),
      doctor: {
        fullName: doctorName,
        providerNumber,
        phone: doctor?.phone || doctorUser?.phone || null,
        email: doctor?.email || doctorUser?.email || null,
        address: doctorAddress || SANATIVE_LEGAL.address,
      },
      patient: {
        fullName: patientFullName,
        surname: patientNames.surname,
        givenNames: patientNames.givenNames,
        sex: formatPatientSexForReferral(patient.gender),
        dateOfBirth: patientDob,
        medicareNumber: medicareNumber?.trim() || "",
        medicareIrn: medicareIrn?.trim() || "",
        address: formatPatientAddress(patient) || "Not recorded",
        postcode: patient.postcode,
        phone: patient.phone,
      },
      programSlugs: selectedPrograms,
      programLabels,
      testIds: mergedTestIds,
      customTests: customTests?.trim() || undefined,
      clinicalIndication: resolvedIndication,
      fastingRequired: fasting,
      urgent: Boolean(urgent),
    };

    const pdfFilename = buildPathologyReferralFilename(patientFullName, referralId);
    const pdfBase64 = pathologyReferralPdfBase64(pdfPayload);

    const testsList = mergedTestIds.map((id) => getBloodTestLabel(id));
    if (customTests?.trim()) {
      testsList.push(customTests.trim());
    }

    const notes = `Pathology referral ${referralId} issued by ${doctorName}.

**Program panels:**
${selectedPrograms.length > 0 ? selectedPrograms.map((s) => `- ${getPathologyPanelMeta(s).label}`).join("\n") : "- Individual tests"}

**Tests requested:**
${testsList.map((t) => `- ${t}`).join("\n")}

**Clinical indication:**
${resolvedIndication}

**Collection:**
- Patient may attend any NATA-accredited pathology collection centre
- Fasting: ${fasting ? "Yes (8–12 hours)" : "No (unless test-specific)"}
- Urgent: ${urgent ? "Yes" : "No"}
${medicareNumber ? `- Medicare no. on referral: ${medicareNumber}${medicareIrn ? ` IRN ${medicareIrn}` : ""}` : ""}
${emailToPatient ? `- Referral emailed to patient: ${patient.email}` : ""}`;

    await prisma.$transaction([
      prisma.careCommunication.create({
        data: {
          userId,
          type: "PATHOLOGY_REQUEST",
          priority: urgent ? "URGENT" : "HIGH",
          subject: `Pathology Referral ${referralId}: ${patient.firstName} ${patient.lastName}`,
          notes,
          status: "PENDING",
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          assignedTo: patient.assignedCarePartnerId || undefined,
        },
      }),
      prisma.internalNote.create({
        data: {
          userId,
          title: `Pathology Referral ${referralId}`,
          content: notes,
          category: "MEDICAL",
          isPinned: false,
          authorId: auth.userId,
          authorName: doctorName,
        },
      }),
      prisma.activityLog.create({
        data: {
          userId,
          action: "PATHOLOGY_REFERRAL_ISSUED",
          entity: "pathology_referral",
          entityId: referralId,
          details: {
            referralId,
            programSlugs: selectedPrograms,
            testIds: mergedTestIds,
            additionalTestIds: extras,
            customTests: customTests?.trim() || null,
            consultationId: consultationId || null,
            issuedBy: auth.userId,
            urgent: Boolean(urgent),
            fastingRequired: fasting,
            emailedToPatient: Boolean(emailToPatient),
          },
        },
      }),
    ]);

    let emailSent = false;
    let emailError: string | undefined;

    if (emailToPatient) {
      const emailResult = await sendPathologyReferralEmail(patient.email, {
        firstName: patient.firstName,
        doctorName,
        referralId,
        programSummary,
        fastingRequired: fasting,
        pdfFilename,
        pdfBase64,
      });
      emailSent = emailResult.success;
      emailError = emailResult.error;
    }

    return NextResponse.json({
      success: true,
      referralId,
      pdfBase64,
      pdfFilename,
      emailSent,
      emailError,
      message: emailToPatient
        ? emailSent
          ? "Referral saved and emailed to patient"
          : "Referral saved; email could not be sent"
        : "Pathology referral recorded",
    });
  } catch (error) {
    console.error("[Pathology Referral POST]", error);
    return NextResponse.json(
      { error: "Failed to record pathology referral" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireDoctorOrAdmin();
    if ("error" in auth) {
      return auth.error;
    }

    const userId = request.nextUrl.searchParams.get("userId");

    if (userId) {
      const [patient, memberships, portalQuizzes] = await Promise.all([
        prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        }),
        prisma.programMember.findMany({
          where: { userId },
          select: { intakeData: true },
        }),
        getLatestPortalQuizSubmissions(userId).catch(() => []),
      ]);

      if (!patient) {
        return NextResponse.json({ error: "Patient not found" }, { status: 404 });
      }

      let medicareNumber: string | undefined;
      let medicareIrn: string | undefined;

      for (const membership of memberships) {
        const extracted = extractMedicareFromIntake(membership.intakeData);
        if (extracted.medicareNumber) {
          medicareNumber = extracted.medicareNumber;
          medicareIrn = extracted.medicareIrn;
          break;
        }
      }

      return NextResponse.json({
        patient: {
          id: patient.id,
          fullName: `${patient.firstName} ${patient.lastName}`.trim(),
          email: patient.email,
          medicareNumber: medicareNumber || null,
          medicareIrn: medicareIrn || null,
          medicareSource: medicareNumber ? "Member intake record" : null,
        },
        quizSubmissions: portalQuizzes.map((row) => ({
          programKey: row.programKey,
          answers: row.answers,
          result: row.result,
          submittedAt: row.submittedAt.toISOString(),
        })),
        intakeDataList: memberships.map((m) => m.intakeData),
      });
    }

    return NextResponse.json({
      panels: ALL_PATHOLOGY_PANEL_SLUGS.map((slug) => {
        const panel = getPathologyPanelMeta(slug);
        return {
          slug,
          label: panel.label,
          description: panel.description,
        };
      }),
      groups: listPathologyPanelOptionGroups(),
    });
  } catch (error) {
    console.error("[Pathology Referral GET]", error);
    return NextResponse.json(
      { error: "Failed to load pathology referral options" },
      { status: 500 }
    );
  }
}
