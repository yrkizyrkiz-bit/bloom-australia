import { redirect } from "next/navigation";
import { publicPageMeta } from "@/lib/seo/public-page-meta";


export const metadata = publicPageMeta.menopause;

export default function MenopausePage() {
  redirect("/womens-health");
}
