"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { usePortalContext } from "@/hooks/usePortalContext";
import { MEMBER_PROGRAMS_HOME } from "@/lib/portal/member-home";
import { hasPortalFeature } from "@/components/portal/ProgramFeatureGate";

function hasSeenProgramGridThisSession(userId: string | undefined): boolean {
  if (!userId) return false;
  try {
    return Boolean(sessionStorage.getItem(`sanative_grid_overlay_dismissed_${userId}`));
  } catch {
    return false;
  }
}

/** Route members to the right home: programs hub vs classic health overview. */
export function DashboardHomeRedirect() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const { data: portal, isLoading } = usePortalContext();
  const redirectedRef = useRef(false);

  useEffect(() => {
    const maybeRedirect = () => {
      if (redirectedRef.current) return;
      if (isLoading || !portal) return;
      if (pathname !== "/dashboard") return;

      if (!hasPortalFeature(portal, "biomarkerResults")) {
        redirectedRef.current = true;
        router.replace(MEMBER_PROGRAMS_HOME);
        return;
      }

      if (
        hasSeenProgramGridThisSession(user?.id) &&
        portal.programs.weightManagement &&
        (portal.portalMode === "PRE_PROGRAM" || portal.portalMode === "ACTIVATING")
      ) {
        redirectedRef.current = true;
        router.replace("/dashboard/weight-management");
      }
    };

    maybeRedirect();
    window.addEventListener("sanative:grid-overlay-dismissed", maybeRedirect);
    return () => window.removeEventListener("sanative:grid-overlay-dismissed", maybeRedirect);
  }, [portal, isLoading, pathname, user?.id, router]);

  return null;
}
