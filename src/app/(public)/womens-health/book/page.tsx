import { redirect } from "next/navigation";
import { publicPageMeta } from "@/lib/seo/public-page-meta";


export const metadata = publicPageMeta.womensBook;

/** Legacy standalone booking checkout, use the assessment funnel instead. */
export default function LegacyWomensHealthBookPage() {
  redirect("/womens-health/assessment");
}
