import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ProgramMembershipStatus, ProgramBiomarkerStatus } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Find the clinic associated with this GP
    const clinic = await prisma.clinic.findUnique({
      where: { leadGpEmail: session.user.email },
    });

    if (!clinic) {
      return NextResponse.json(
        { success: false, message: "No clinic found for this account" },
        { status: 404 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") as ProgramMembershipStatus | null;
    const program = searchParams.get("program");

    // Get patients with includes
    const patients = await prisma.programMember.findMany({
      where: {
        clinicId: clinic.id,
        ...(search && {
          OR: [
            { firstName: { contains: search, mode: "insensitive" as const } },
            { lastName: { contains: search, mode: "insensitive" as const } },
          ],
        }),
        ...(status && { membershipStatus: status }),
        ...(program && { program }),
      },
      orderBy: { createdAt: "desc" },
      include: {
        carePartner: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        programBiomarkerResults: {
          orderBy: { testedAt: "desc" },
          take: 5,
        },
        checkIns: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    // Format response
    const formattedPatients = patients.map((patient) => {
      // Determine biomarker status
      const recentResults = patient.programBiomarkerResults;
      let biomarkerStatus: "normal" | "review" | "action" = "normal";

      const flaggedStatuses: ProgramBiomarkerStatus[] = ["ELEVATED", "LOW"];
      const borderlineStatuses: ProgramBiomarkerStatus[] = ["BORDERLINE"];

      if (recentResults.some((r) => flaggedStatuses.includes(r.status))) {
        biomarkerStatus = "action";
      } else if (recentResults.some((r) => borderlineStatuses.includes(r.status))) {
        biomarkerStatus = "review";
      }

      // Get last check-in date
      const lastCheckIn = patient.checkIns[0]?.completedAt;

      return {
        id: patient.id,
        name: `${patient.firstName} ${patient.lastName.charAt(0)}.`,
        fullName: `${patient.firstName} ${patient.lastName}`,
        program: patient.program,
        enrolled: patient.createdAt,
        lastCheckIn: lastCheckIn || null,
        biomarkerStatus,
        membershipStatus: patient.membershipStatus,
        carePartner: patient.carePartner
          ? `${patient.carePartner.firstName} ${patient.carePartner.lastName}`
          : null,
        nextConsult: patient.checkIns.find((c) => c.gpVisitDate)?.gpVisitDate || null,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        patients: formattedPatients,
        totalCount: formattedPatients.length,
        programs: [...new Set(patients.map((p) => p.program))],
      },
    });
  } catch (error) {
    console.error("Get patients error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to get patients" },
      { status: 500 }
    );
  }
}
