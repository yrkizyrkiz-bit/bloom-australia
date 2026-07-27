import { redirect } from "next/navigation";

/**
 * DEPRECATED FUNNEL — consolidated into Sanative Membership.
 */
export default function DeprecatedCheckout() {
  redirect("/membership/checkout");
}
