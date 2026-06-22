"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { usePortalContext } from "@/hooks/usePortalContext";
import { MEMBER_PROGRAMS_HOME } from "@/lib/portal/member-home";
import { hasPortalFeature } from "@/components/portal/ProgramFeatureGate";

/** Route members to the right home: programs hub vs classic health overview. */
export function DashboardHomeRedirect() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: portal, isLoading } = usePortalContext();
  const redirectedRef = useRef(false);

  useEffect(() => {
    if (redirectedRef.current || isLoading || !portal) return;
    if (pathname !== "/dashboard") return;

    if (!hasPortalFeature(portal, "biomarkerResults")) {
      redirectedRef.current = true;
      router.replace(MEMBER_PROGRAMS_HOME);
    }
  }, [portal, isLoading, pathname, router]);

  return null;
}
