import { redirect } from "next/navigation";
import { publicPageMeta } from "@/lib/seo/public-page-meta";


export const metadata = publicPageMeta.subscriptionTerms;

export default function SubscriptionTermsPage() {
  redirect("/terms#subscription-terms");
}
