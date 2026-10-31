import { NextRequest } from "next/server";
import { handleOrganAssessmentResultsPost } from "@/lib/promo/handle-organ-assessment-results";

export async function POST(request: NextRequest) {
  return handleOrganAssessmentResultsPost(request, "liver");
}
