import { redirect } from "next/navigation";
import { publicPageMeta } from "@/lib/seo/public-page-meta";


export const metadata = publicPageMeta.labsActionPlan;

/** Former Action Plan page, content now lives on /labs#roadmap. */
export default function LabsActionPlanPage() {
  redirect("/labs#roadmap");
}
