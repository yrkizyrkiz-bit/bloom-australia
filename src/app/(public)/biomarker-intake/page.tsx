import { redirect } from "next/navigation";
import { publicPageMeta } from "@/lib/seo/public-page-meta";


export const metadata = publicPageMeta.biomarkerIntake;

/**
 * DEPRECATED FUNNEL, consolidated into Sanative Membership.
 * Package selection is gone: membership includes the Essential biomarker
 * panel; larger panels are portal upgrades after activation.
 */
export default function DeprecatedBiomarkerIntake() {
  redirect("/membership/checkout?intent=biomarkers");
}
