import { NextRequest } from "next/server";
import { handleOrganAssessmentResultsPost } from "@/lib/promo/handle-organ-assessment-results";

export const maxDuration = 30;

export async function POST(request: NextRequest) {
  return handleOrganAssessmentResultsPost(request, "liver");
}
