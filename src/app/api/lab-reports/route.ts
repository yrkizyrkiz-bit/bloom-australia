import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// GET /api/lab-reports
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || session.user.id;
    const status = searchParams.get("status");

    if (userId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const where: Record<string, unknown> = { userId };
    if (status) where.status = status.toUpperCase();

    const labReports = await prisma.labReport.findMany({
      where,
      include: {
        biomarkerResults: {
          include: { biomarker: { select: { name: true, shortName: true, category: true, unit: true } } },
        },
        user: { select: { firstName: true, lastName: true, email: true } },
      },
      orderBy: { uploadedAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ labReports });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/lab-reports - Create lab report (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { userId, fileName, fileUrl, fileSize, mimeType, notes } = body;

    if (!userId || !fileName) {
      return NextResponse.json({ error: "userId and fileName are required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const labReport = await prisma.labReport.create({
      data: {
        userId,
        fileName,
        fileUrl,
        fileSize,
        mimeType,
        status: "PENDING",
        uploadedBy: session.user.id,
        notes,
      },
    });

    await prisma.notification.create({
      data: {
        userId,
        type: "INFO",
        title: "Lab Report Uploaded",
        message: `A new lab report "${fileName}" has been uploaded.`,
        category: "BIOMARKER",
        actionUrl: "/dashboard",
      },
    });

    await prisma.activityLog.create({
      data: { userId: session.user.id, action: "LAB_REPORT_UPLOADED", entity: "lab_report", entityId: labReport.id, details: { fileName, targetUserId: userId } },
    });

    return NextResponse.json({ labReport }, { status: 201 });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/lab-reports - Update lab report status (admin only)
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, status, notes, biomarkerCount } = body;

    if (!id) return NextResponse.json({ error: "Lab report ID is required" }, { status: 400 });

    const existing = await prisma.labReport.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Lab report not found" }, { status: 404 });

    const labReport = await prisma.labReport.update({
      where: { id },
      data: {
        ...(status !== undefined && { status: status.toUpperCase() }),
        ...(status?.toUpperCase() === "PROCESSED" && { processedAt: new Date() }),
        ...(notes !== undefined && { notes }),
        ...(biomarkerCount !== undefined && { biomarkerCount }),
      },
    });

    if (status?.toUpperCase() === "PROCESSED") {
      await prisma.notification.create({
        data: {
          userId: existing.userId,
          type: "SUCCESS",
          title: "Lab Results Ready",
          message: `Your lab report "${existing.fileName}" has been processed.`,
          category: "BIOMARKER",
          actionUrl: "/dashboard",
        },
      });
    }

    return NextResponse.json({ labReport });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/lab-reports
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "Lab report ID is required" }, { status: 400 });

    await prisma.biomarkerResult.deleteMany({ where: { labReportId: id } });
    await prisma.labReport.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
