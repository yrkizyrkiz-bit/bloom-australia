import { redirect } from "next/navigation";
import { publicPageMeta } from "@/lib/seo/public-page-meta";


export const metadata = publicPageMeta.telehealthConsent;

export default function TelehealthConsentPage() {
  redirect("/terms#telehealth-consent");
}
