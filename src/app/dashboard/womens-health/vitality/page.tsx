"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

/** Legacy vitality URL — Menopause Care now owns this program key. */
export default function WomensVitalityPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard/womens-health/menopause");
  }, [router]);

  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-rose-600" />
    </div>
  );
}
