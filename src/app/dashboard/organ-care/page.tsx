"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { usePortalContext } from "@/hooks/usePortalContext";
import { UnifiedHealthDashboard } from "@/components/dashboard/UnifiedHealthDashboard";
import { Button } from "@/components/ui/button";
import { ORGAN_CARE_CARD } from "@/lib/programs/catalog";
import { MEMBER_PROGRAMS_HOME } from "@/lib/portal/member-home";
import type { DerivedMembershipEntitlements } from "@/lib/membership/entitlements";

function isOrganCareEntitled(membership: DerivedMembershipEntitlements | undefined): boolean {
  const scope = membership?.scopes?.ORGAN_CARE;
  if (!scope?.hasEntitlement || scope.status === "INACTIVE") return false;
  const state = scope.state ?? "locked_upgrade";
  return state === "ready" || state === "partial" || state === "pending_results";
}

/** Organ & Metabolic Care overview — unified scores across all six health categories. */
export default function OrganCareDashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { data: portal, isLoading } = usePortalContext();
  const gender = (user?.gender === "male" ? "male" : "female") as "male" | "female";
  const entitled = isOrganCareEntitled(portal?.membership);

  useEffect(() => {
    if (isLoading) return;
    if (!entitled) {
      router.replace(MEMBER_PROGRAMS_HOME);
    }
  }, [isLoading, entitled, router]);

  if (isLoading || !entitled) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4 sm:space-y-6">
      <div className="flex items-start gap-2 sm:gap-3">
        <Button variant="ghost" size="icon" asChild className="shrink-0">
          <Link href={MEMBER_PROGRAMS_HOME} aria-label="Back to programs">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="min-w-0">
          <h1 className="font-serif text-xl text-foreground sm:text-2xl">
            Organ & <span className="text-[#4a6243]">{ORGAN_CARE_CARD.titleAccent}</span>
          </h1>
          <p className="text-xs text-muted-foreground sm:text-sm">{ORGAN_CARE_CARD.tagline}</p>
        </div>
      </div>

      <UnifiedHealthDashboard gender={gender} />
    </div>
  );
}
