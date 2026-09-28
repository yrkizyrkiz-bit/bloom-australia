"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

/** Legacy sexual-health URL — Women's Wellness opens the menopause program home. */
export default function WomensSexualHealthPage() {
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
