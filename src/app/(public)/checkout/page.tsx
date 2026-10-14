import { redirect } from "next/navigation";
import { publicPageMeta } from "@/lib/seo/public-page-meta";


export const metadata = publicPageMeta.checkout;

/**
 * DEPRECATED FUNNEL, consolidated into Sanative Membership.
 */
export default function DeprecatedCheckout() {
  redirect("/membership/checkout");
}
