import { redirect } from "next/navigation";
import { publicPageMeta } from "@/lib/seo/public-page-meta";


export const metadata = publicPageMeta.pricing;

/** Legacy pricing URL; keep it from 404ing by sending old links home. */
export default function PricingPage() {
  redirect("/");
}
