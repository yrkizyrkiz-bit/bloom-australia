import { redirect } from "next/navigation";
import { publicPageMeta } from "@/lib/seo/public-page-meta";


export const metadata = publicPageMeta.pricing;

/** Pricing lives in FAQs / program how-it-works; keep this URL for old links. */
export default function PricingPage() {
  redirect("/faqs");
}
