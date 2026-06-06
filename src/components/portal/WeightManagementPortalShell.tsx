"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { usePortalContext } from "@/hooks/usePortalContext";
import { isWeightProgressPath } from "@/lib/portal-context";
import { ProgramFeatureGate } from "./ProgramFeatureGate";
import { PostCheckoutWelcome } from "./PostCheckoutWelcome";

type WeightManagementPortalShellProps = {
  children: React.ReactNode;
};

export function WeightManagementPortalShell({
  children,
}: WeightManagementPortalShellProps) {
  const pathname = usePathname() || "";
  const searchParams = useSearchParams();
  const { data: portal, isLoading } = usePortalContext();

  const showPostCheckout = searchParams.get("onboarding") === "post-checkout";
  const progressLocked =
    !isLoading && portal && isWeightProgressPath(pathname) && !portal.features.weightProgress;

  return (
    <>
      {showPostCheckout && <PostCheckoutWelcome />}
      {progressLocked ? (
        <ProgramFeatureGate
          portal={portal}
          feature="weightProgress"
          title="Progress tracking unlocks when your program is active"
        />
      ) : (
        children
      )}
    </>
  );
}
