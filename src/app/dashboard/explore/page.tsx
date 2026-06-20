"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { MEMBER_PROGRAMS_HOME } from "@/lib/portal/member-home";

/** Legacy route — programs hub replaced the explore page. */
export default function ExploreRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(MEMBER_PROGRAMS_HOME);
  }, [router]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-[#5c7a52]" />
    </div>
  );
}
