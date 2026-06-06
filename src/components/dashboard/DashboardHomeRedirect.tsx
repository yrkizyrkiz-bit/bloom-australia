"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePortalContext } from "@/hooks/usePortalContext";

/** Send new weight members to their program home instead of generic biomarker overview. */
export function DashboardHomeRedirect() {
  const router = useRouter();
  const { data: portal, isLoading } = usePortalContext();

  useEffect(() => {
    if (isLoading || !portal) return;
    if (
      portal.programs.weightManagement &&
      (portal.portalMode === "PRE_PROGRAM" || portal.portalMode === "ACTIVATING")
    ) {
      router.replace("/dashboard/weight-management");
    }
  }, [portal, isLoading, router]);

  return null;
}
