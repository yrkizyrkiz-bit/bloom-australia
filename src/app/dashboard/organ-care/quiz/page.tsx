"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { usePortalContext } from "@/hooks/usePortalContext";
import { ORGAN_CARE_CARD } from "@/lib/programs/catalog";
import { isOrganCareEntitled } from "@/lib/membership/organ-care-access";

/**
 * DEPRECATED — Organ Care is no longer a standalone purchase. It is included
 * with every biomarker panel and with Sanative Membership. Entitled members go
 * to the Organ Care hub; everyone else goes to the biomarker panel quiz
 * (any panel unlocks Organ Care).
 */
export default function OrganCareQuizPage() {
  const router = useRouter();
  const { data: portal, isLoading: portalLoading } = usePortalContext();
  const hasOrganCare = isOrganCareEntitled(portal?.membership);

  useEffect(() => {
    if (portalLoading) return;
    router.replace(hasOrganCare ? ORGAN_CARE_CARD.hubRoute : "/dashboard/biomarkers/quiz");
  }, [portalLoading, hasOrganCare, router]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-[#5c7a52]" />
    </div>
  );
}
