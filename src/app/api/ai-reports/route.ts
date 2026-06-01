import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { GoogleGenerativeAI } from "@google/generative-ai";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { calculateBiologicalAge, mapBiomarkerResultsToInput } from "@/lib/biological-age";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// GET /api/ai-reports
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || session.user.id;
    const latest = searchParams.get("latest") === "true";

    if (userId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (latest) {
      const report = await prisma.aIReport.findFirst({ where: { userId }, orderBy: { generatedAt: "desc" } });
      return NextResponse.json({ report });
    }

    const reports = await prisma.aIReport.findMany({ where: { userId }, orderBy: { generatedAt: "desc" }, take: 10 });
    return NextResponse.json({ reports });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/ai-reports - Generate AI health report
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const userId = body.userId || session.user.id;

    if (userId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true, dateOfBirth: true, gender: true },
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Get latest biomarker results
    const results = await prisma.biomarkerResult.findMany({
      where: { userId },
      include: { biomarker: true },
      orderBy: { testedAt: "desc" },
    });

    if (results.length === 0) {
      return NextResponse.json({ error: "No biomarker results found" }, { status: 400 });
    }

    const latestResults = new Map();
    for (const result of results) {
      if (!latestResults.has(result.biomarkerId)) {
        latestResults.set(result.biomarkerId, result);
      }
    }

    const biomarkerData = Array.from(latestResults.values()).map(r => ({
      name: r.biomarker.name,
      shortName: r.biomarker.shortName,
      category: r.biomarker.category,
      value: r.value,
      unit: r.biomarker.unit,
      status: r.status,
    }));

    // Calculate biological age
    let biologicalAgeData = null;
    if (user.dateOfBirth) {
      const chronologicalAge = Math.floor((Date.now() - new Date(user.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      const biomarkerArray = Array.from(latestResults.values()).map(r => ({ biomarkerId: r.biomarkerId, value: r.value }));
      const biomarkers = mapBiomarkerResultsToInput(biomarkerArray);
      biologicalAgeData = calculateBiologicalAge({ chronologicalAge, gender: user.gender === "FEMALE" ? "female" : "male", biomarkers });
    }

    // Get health goals
    const goals = await prisma.healthGoal.findMany({
      where: { userId, status: "IN_PROGRESS" },
      include: { biomarker: { select: { name: true, shortName: true } } },
    });

    let aiReport;

    if (process.env.GEMINI_API_KEY) {
      try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const prompt = `Analyze health data for ${user.firstName}:
${biologicalAgeData ? `Biological Age: ${biologicalAgeData.biologicalAge} (Chronological: ${biologicalAgeData.chronologicalAge})` : ''}
Biomarkers: ${biomarkerData.map(b => `${b.name}: ${b.value} ${b.unit} [${b.status}]`).join(', ')}
Goals: ${goals.map(g => `${g.biomarker.name}: ${g.currentValue} → ${g.targetValue}`).join(', ')}

Return JSON: {"summary":"","keyFindings":[{"type":"positive|negative|neutral","finding":"","impact":"high|medium|low"}],"recommendations":[{"priority":"high|medium|low","category":"diet|exercise|supplement|lifestyle","recommendation":"","rationale":""}],"achievements":[],"riskFactors":[{"risk":"","severity":"high|medium|low","mitigation":""}]}`;

        const result = await model.generateContent(prompt);
        const content = result.response.text();
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) aiReport = JSON.parse(jsonMatch[0]);
      } catch (e) {
        console.error("AI error:", e);
      }
    }

    // Fallback report
    if (!aiReport) {
      const optimal = biomarkerData.filter(b => b.status === "OPTIMAL").length;
      const outOfRange = biomarkerData.filter(b => b.status === "OUT_OF_RANGE" || b.status === "CRITICAL").length;
      aiReport = {
        summary: `Analysis of ${biomarkerData.length} biomarkers: ${optimal} optimal, ${outOfRange} need attention.`,
        keyFindings: optimal > biomarkerData.length * 0.6 ? [{ type: "positive", finding: "Majority of biomarkers in optimal range", impact: "high" }] : [],
        recommendations: [{ priority: "medium", category: "lifestyle", recommendation: "Continue healthy habits", rationale: "Maintain current progress" }],
        achievements: [{ achievement: `${optimal} biomarkers in optimal range` }],
        riskFactors: outOfRange > 3 ? [{ risk: "Multiple biomarkers need attention", severity: "medium", mitigation: "Consult healthcare provider" }] : [],
      };
    }

    const savedReport = await prisma.aIReport.create({
      data: {
        userId,
        summary: aiReport.summary || "Health analysis completed.",
        keyFindings: aiReport.keyFindings || [],
        correlations: aiReport.correlations || [],
        recommendations: aiReport.recommendations || [],
        achievements: aiReport.achievements || [],
        projectedImprovements: aiReport.projectedImprovements || [],
        riskFactors: aiReport.riskFactors || [],
        nextSteps: aiReport.recommendations?.slice(0, 3).map((r: { recommendation: string }) => r.recommendation) || [],
      },
    });

    await prisma.notification.create({
      data: { userId, type: "SUCCESS", title: "AI Health Report Ready", message: "Your personalized health analysis is ready.", category: "SYSTEM", actionUrl: "/dashboard/reports" },
    });

    return NextResponse.json({ report: savedReport, biologicalAge: biologicalAgeData }, { status: 201 });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
