"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { isHiddenWomensPortalArea } from "@/lib/programs/release-flags";

/** Fertility portal area is hidden for Women's Health v2. */
export default function FertilityPage() {
  const router = useRouter();

  useEffect(() => {
    if (isHiddenWomensPortalArea("fertility")) {
      router.replace("/dashboard/womens-health");
    }
  }, [router]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-rose-600" />
    </div>
  );
}
