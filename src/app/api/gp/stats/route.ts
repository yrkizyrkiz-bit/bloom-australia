import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const clinic = await prisma.clinic.findUnique({
      where: { leadGpEmail: session.user.email },
    });

    if (!clinic) {
      return NextResponse.json(
        { success: false, message: "No clinic found for this account" },
        { status: 404 }
      );
    }

    // Get total enrolled patients
    const totalPatients = await prisma.programMember.count({
      where: { clinicId: clinic.id },
    });

    // Get active patients (active membership)
    const activePatients = await prisma.programMember.count({
      where: {
        clinicId: clinic.id,
        membershipStatus: "ACTIVE",
      },
    });

    // Get patients with activity in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentlyActivePatients = await prisma.programMember.count({
      where: {
        clinicId: clinic.id,
        checkIns: {
          some: {
            completedAt: { gte: thirtyDaysAgo },
          },
        },
      },
    });

    // Get upcoming consultations (check-ins with GP visit dates)
    const upcomingConsults = await prisma.programCheckIn.count({
      where: {
        member: { clinicId: clinic.id },
        gpVisitDate: { gte: new Date() },
        gpVisitCoordinated: true,
      },
    });

    // Get QR scan stats
    const totalScans = await prisma.qrScanEvent.count({
      where: { clinicId: clinic.id },
    });

    const convertedScans = await prisma.qrScanEvent.count({
      where: {
        clinicId: clinic.id,
        converted: true,
      },
    });

    const conversionRate = totalScans > 0 ? (convertedScans / totalScans) * 100 : 0;

    // Get scans in the last 30 days
    const recentScans = await prisma.qrScanEvent.count({
      where: {
        clinicId: clinic.id,
        scannedAt: { gte: thirtyDaysAgo },
      },
    });

    // Get patients with flagged results
    const patientsWithFlags = await prisma.programMember.count({
      where: {
        clinicId: clinic.id,
        programBiomarkerResults: {
          some: {
            status: { in: ["ELEVATED", "LOW", "BORDERLINE"] },
          },
        },
      },
    });

    // Get unread notifications count
    const unreadNotifications = await prisma.gpNotification.count({
      where: {
        clinicId: clinic.id,
        read: false,
      },
    });

    // Get program breakdown
    const programBreakdown = await prisma.programMember.groupBy({
      by: ["program"],
      where: { clinicId: clinic.id },
      _count: true,
    });

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalPatients,
          activePatients,
          recentlyActivePatients,
          upcomingConsults,
          patientsWithFlags,
          unreadNotifications,
        },
        qrStats: {
          totalScans,
          totalEnrolments: convertedScans,
          conversionRate: parseFloat(conversionRate.toFixed(1)),
          recentScans,
        },
        programBreakdown: programBreakdown.map((p) => ({
          program: p.program,
          count: p._count,
        })),
        clinic: {
          name: clinic.name,
          gpName: clinic.leadGpName,
          status: clinic.status,
        },
      },
    });
  } catch (error) {
    console.error("Get GP stats error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to get stats" },
      { status: 500 }
    );
  }
}
