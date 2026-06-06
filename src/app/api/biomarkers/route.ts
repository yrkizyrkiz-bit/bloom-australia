import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// GET /api/biomarkers - Get all biomarker definitions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    const where = {
      isActive: true,
      ...(category && { category: category.toUpperCase() as any }),
    };

    const biomarkers = await prisma.biomarkerDefinition.findMany({
      where,
      orderBy: [{ category: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
    });

    return NextResponse.json({ biomarkers });
  } catch (error) {
    console.error("Error fetching biomarkers:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/biomarkers - Create a new biomarker definition (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      biomarkerId,
      name,
      shortName,
      category,
      description,
      whyItMatters,
      unit,
      maleRanges,
      femaleRanges,
      improvementTips,
      relatedBiomarkerIds,
    } = body;

    // Validate required fields
    if (!biomarkerId || !name || !shortName || !category || !description || !unit) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if biomarker ID already exists
    const existing = await prisma.biomarkerDefinition.findUnique({
      where: { biomarkerId },
    });
    if (existing) {
      return NextResponse.json({ error: "Biomarker ID already exists" }, { status: 409 });
    }

    const biomarker = await prisma.biomarkerDefinition.create({
      data: {
        biomarkerId,
        name,
        shortName,
        category: category.toUpperCase(),
        description,
        whyItMatters: whyItMatters || "",
        unit,
        maleRanges: maleRanges || {},
        femaleRanges: femaleRanges || {},
        improvementTips: improvementTips || [],
        relatedBiomarkerIds: relatedBiomarkerIds || [],
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "BIOMARKER_CREATED",
        entity: "biomarker_definition",
        entityId: biomarker.id,
        details: { biomarkerId, name },
      },
    });

    return NextResponse.json({ biomarker }, { status: 201 });
  } catch (error) {
    console.error("Error creating biomarker:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
