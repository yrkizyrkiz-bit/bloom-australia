"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { usePortalContext } from "@/hooks/usePortalContext";
import {
  MEMBER_HEALTH_OVERVIEW,
  MEMBER_PROGRAMS_HOME,
  resolveMemberHomePath,
} from "@/lib/portal/member-home";
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
      return;
    }

    const home = resolveMemberHomePath(portal);
    if (home !== MEMBER_HEALTH_OVERVIEW && home !== MEMBER_PROGRAMS_HOME) {
      redirectedRef.current = true;
      router.replace(home);
    }
  }, [portal, isLoading, pathname, router]);

  return null;
}
