import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import QRCode from "qrcode";

export async function GET(request: NextRequest) {
  try {
    // Get the session to verify GP is authenticated
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
      include: {
        qrScanEvents: true,
        enrolledMembers: true,
      },
    });

    if (!clinic) {
      return NextResponse.json(
        { success: false, message: "No clinic found for this account" },
        { status: 404 }
      );
    }

    // Generate QR code URL
    const qrUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "https://sanative.com.au"}/join?clinic=${clinic.qrToken}`;

    // Generate QR code as data URL (PNG)
    const qrDataUrl = await QRCode.toDataURL(qrUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: "#04342C",
        light: "#FFFFFF",
      },
      errorCorrectionLevel: "H",
    });

    // Calculate stats
    const totalScans = clinic.qrScanEvents.length;
    const totalEnrolments = clinic.enrolledMembers.length;
    const conversionRate =
      totalScans > 0 ? ((totalEnrolments / totalScans) * 100).toFixed(1) : "0";

    return NextResponse.json({
      success: true,
      data: {
        qrDataUrl,
        qrUrl,
        clinicName: clinic.name,
        qrToken: clinic.qrToken,
        stats: {
          totalScans,
          totalEnrolments,
          conversionRate: parseFloat(conversionRate),
        },
      },
    });
  } catch (error) {
    console.error("QR code generation error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to generate QR code" },
      { status: 500 }
    );
  }
}
