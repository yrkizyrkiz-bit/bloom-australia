import { redirect } from "next/navigation";
import { publicPageMeta } from "@/lib/seo/public-page-meta";


export const metadata = publicPageMeta.medicalDisclaimer;

export default function MedicalDisclaimerPage() {
  redirect("/terms#medical-disclaimer");
}
