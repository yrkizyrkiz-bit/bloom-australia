import { redirect } from "next/navigation";

/** Pricing lives in FAQs / program how-it-works; keep this URL for old links. */
export default function PricingPage() {
  redirect("/faqs");
}
