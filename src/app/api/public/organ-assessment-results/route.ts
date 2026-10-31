import { NextRequest, NextResponse } from "next/server";
import {
  handleOrganAssessmentResultsPost,
  isOrganAssessmentKind,
} from "@/lib/promo/handle-organ-assessment-results";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  if (!isOrganAssessmentKind(body.organ)) {
    return NextResponse.json({ error: "Please complete the assessment first." }, { status: 400 });
  }
  return handleOrganAssessmentResultsPost(request, body.organ, body);
}
