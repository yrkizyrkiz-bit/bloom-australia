"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { usePortalContext } from "@/hooks/usePortalContext";
import {
  MEMBER_PROGRAMS_HOME,
  resolveMemberHomePath,
} from "@/lib/portal/member-home";

/**
 * After login, route activating members to their enrolled program home
 * instead of leaving them on the generic programs grid.
 */
export function MemberProgramHomeRedirect() {
  const router = useRouter();
  const { data: portal, isLoading } = usePortalContext();
  const redirectedRef = useRef(false);

  useEffect(() => {
    if (redirectedRef.current || isLoading || !portal) return;

    const home = resolveMemberHomePath(portal);
    const shouldAutoRoute =
      portal.portalMode === "PRE_PROGRAM" || portal.portalMode === "ACTIVATING";

    if (shouldAutoRoute && home !== MEMBER_PROGRAMS_HOME) {
      redirectedRef.current = true;
      router.replace(home);
    }
  }, [portal, isLoading, router]);

  return null;
}
