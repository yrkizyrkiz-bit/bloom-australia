import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Fetch enabled biomarker campaigns for a specific quiz type
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const quizType = searchParams.get("quizType");

    const campaigns = await prisma.biomarkerCampaign.findMany({
      where: {
        isEnabled: true,
        ...(quizType ? {
          quizTypes: {
            has: quizType,
          },
        } : {}),
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: {
        key: true,
        name: true,
        headline: true,
        description: true,
        program: true,
        programPath: true,
        programPrice: true,
        crossSellEnabled: true,
        crossSell: true,
        crossSellPath: true,
        crossSellPrice: true,
        thresholdHigh: true,
        thresholdMedium: true,
        thresholdLow: true,
        genderFilter: true,
      },
    });

    return NextResponse.json(campaigns);
  } catch (error) {
    console.error("Error fetching biomarker campaigns:", error);
    // Return empty array on error so quiz pages don't break
    return NextResponse.json([]);
  }
}
