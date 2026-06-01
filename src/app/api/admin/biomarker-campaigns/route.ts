import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET - List all biomarker campaigns
export async function GET() {
  try {
    const campaigns = await prisma.biomarkerCampaign.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });

    return NextResponse.json(campaigns);
  } catch (error) {
    console.error("Error fetching biomarker campaigns:", error);
    return NextResponse.json(
      { error: "Failed to fetch campaigns" },
      { status: 500 }
    );
  }
}

// POST - Create a new biomarker campaign
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      key,
      name,
      headline,
      description,
      program,
      programPath,
      programPrice,
      crossSellEnabled,
      crossSell,
      crossSellPath,
      crossSellPrice,
      thresholdHigh,
      thresholdMedium,
      thresholdLow,
      quizTypes,
      genderFilter,
      isEnabled,
      sortOrder,
    } = body;

    // Validate required fields
    if (!key || !name || !headline || !description || !program || !programPath || !programPrice) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if key already exists
    const existing = await prisma.biomarkerCampaign.findUnique({
      where: { key },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A campaign with this key already exists" },
        { status: 400 }
      );
    }

    const campaign = await prisma.biomarkerCampaign.create({
      data: {
        key,
        name,
        headline,
        description,
        program,
        programPath,
        programPrice,
        crossSellEnabled: crossSellEnabled || false,
        crossSell: crossSell || null,
        crossSellPath: crossSellPath || null,
        crossSellPrice: crossSellPrice || null,
        thresholdHigh: thresholdHigh || 60,
        thresholdMedium: thresholdMedium || 35,
        thresholdLow: thresholdLow || 20,
        quizTypes: quizTypes || [],
        genderFilter: genderFilter || "ALL",
        isEnabled: isEnabled !== undefined ? isEnabled : true,
        sortOrder: sortOrder || 0,
        createdBy: session.user.email || undefined,
      },
    });

    return NextResponse.json(campaign, { status: 201 });
  } catch (error) {
    console.error("Error creating biomarker campaign:", error);
    return NextResponse.json(
      { error: "Failed to create campaign" },
      { status: 500 }
    );
  }
}

// PUT - Update an existing biomarker campaign
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Campaign ID is required" },
        { status: 400 }
      );
    }

    const campaign = await prisma.biomarkerCampaign.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(campaign);
  } catch (error) {
    console.error("Error updating biomarker campaign:", error);
    return NextResponse.json(
      { error: "Failed to update campaign" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a biomarker campaign
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Campaign ID is required" },
        { status: 400 }
      );
    }

    await prisma.biomarkerCampaign.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting biomarker campaign:", error);
    return NextResponse.json(
      { error: "Failed to delete campaign" },
      { status: 500 }
    );
  }
}
