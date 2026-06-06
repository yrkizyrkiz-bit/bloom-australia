import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Lab results webhook - receives results from NATA-accredited labs
// This would be configured with your lab provider (e.g., QML, Sullivan Nicolaides, Laverty)

interface LabResult {
  patientEmail: string;
  patientFirstName: string;
  patientLastName: string;
  labName: string;
  collectionDate: string;
  results: Array<{
    biomarkerName: string;
    category: string;
    value: number;
    unit: string;
    referenceLow?: number;
    referenceHigh?: number;
    status: "NORMAL" | "BORDERLINE" | "ELEVATED" | "LOW";
  }>;
}

// Simple API key validation for lab webhook
function validateLabApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get("x-lab-api-key");
  const expectedKey = process.env.LAB_WEBHOOK_API_KEY;

  if (!expectedKey) {
    console.warn("LAB_WEBHOOK_API_KEY not configured");
    return false;
  }

  return apiKey === expectedKey;
}

export async function POST(request: NextRequest) {
  try {
    // Validate API key
    if (!validateLabApiKey(request)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body: LabResult = await request.json();

    // Validate required fields
    if (!body.patientEmail || !body.results || body.results.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Find the member
    const member = await prisma.programMember.findUnique({
      where: { email: body.patientEmail },
      include: {
        clinic: true,
        carePartner: true,
      },
    });

    if (!member) {
      return NextResponse.json(
        { error: "Member not found" },
        { status: 404 }
      );
    }

    const testedAt = new Date(body.collectionDate);
    const flaggedResults: string[] = [];

    // Store each biomarker result
    for (const result of body.results) {
      await prisma.programBiomarkerResult.create({
        data: {
          memberId: member.id,
          biomarkerName: result.biomarkerName,
          category: result.category,
          value: result.value,
          unit: result.unit,
          referenceLow: result.referenceLow,
          referenceHigh: result.referenceHigh,
          status: result.status,
          testedAt,
          labName: body.labName,
        },
      });

      // Track flagged results
      if (result.status !== "NORMAL") {
        flaggedResults.push(`${result.biomarkerName} (${result.status.toLowerCase()})`);
      }
    }

    // Create notification for member
    await prisma.memberNotification.create({
      data: {
        memberId: member.id,
        type: "RESULT_READY",
        message: `Your biomarker results from ${body.labName} are now available in your dashboard.`,
      },
    });

    // If there are flagged results, notify the GP
    if (member.clinicId && flaggedResults.length > 0) {
      await prisma.gpNotification.create({
        data: {
          clinicId: member.clinicId,
          type: "BIOMARKER_ALERT",
          message: `${member.firstName} ${member.lastName} has flagged biomarker results: ${flaggedResults.join(", ")}`,
          patientName: `${member.firstName} ${member.lastName}`,
          patientId: member.id,
        },
      });
    }

    // Create a check-in task for the care partner to review results
    if (member.carePartnerId) {
      await prisma.programCheckIn.create({
        data: {
          memberId: member.id,
          carePartnerId: member.carePartnerId,
          type: "SCHEDULED",
          notes: `Results review scheduled - ${body.results.length} biomarkers uploaded from ${body.labName}${flaggedResults.length > 0 ? `. Flagged: ${flaggedResults.join(", ")}` : ""}`,
        },
      });
    }

    console.log(`Lab results processed for member ${member.id}: ${body.results.length} biomarkers`);

    return NextResponse.json({
      success: true,
      message: "Lab results processed successfully",
      data: {
        memberId: member.id,
        biomarkersProcessed: body.results.length,
        flaggedCount: flaggedResults.length,
      },
    });
  } catch (error) {
    console.error("Lab webhook error:", error);
    return NextResponse.json(
      { error: "Failed to process lab results" },
      { status: 500 }
    );
  }
}

// Health check endpoint for lab integration
export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "Sanative Health Lab Results Webhook",
    timestamp: new Date().toISOString(),
  });
}
