import { redirect } from "next/navigation";
import type { ReactNode } from "react";

/**
 * RELEASE GATE, the GP/referral join funnel is hidden in this release.
 * Set JOIN_FUNNEL_ENABLED=true to re-enable it. Until then, GP QR codes and
 * legacy links land in the consolidated Sanative Membership funnel.
 */
export default function JoinLayout({ children }: { children: ReactNode }) {
  if (process.env.JOIN_FUNNEL_ENABLED !== "true") {
    redirect("/membership/checkout");
  }
  return <>{children}</>;
}
