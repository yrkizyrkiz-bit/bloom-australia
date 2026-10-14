import { redirect } from "next/navigation";
import { publicPageMeta } from "@/lib/seo/public-page-meta";


export const metadata = publicPageMeta.metabolicCare;

/** Public hub is Organ Care. Keep /metabolic-care URLs working. */
export default function MetabolicCareRedirect() {
  redirect("/organ-care");
}
