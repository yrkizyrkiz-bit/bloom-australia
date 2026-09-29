"use client";

import { X, Sparkles } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { usePortalContext } from "@/hooks/usePortalContext";
import { cn } from "@/lib/utils";

const DISMISS_KEY = "sanative_awaiting_consult_banner_dismissed";

function readDismissed() {
  try {
    return sessionStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

function writeDismissed() {
  try {
    sessionStorage.setItem(DISMISS_KEY, "1");
  } catch {
    // ignore
  }
}

function pathHasProgramSidebar(pathname: string) {
  return (
    pathname.startsWith("/dashboard/mens-health") ||
    pathname.startsWith("/dashboard/womens-health") ||
    pathname.startsWith("/dashboard/weight-management")
  );
}

export function PortalAwaitingConsultationBanner() {
  const pathname = usePathname() || "";
  const { data: portal } = usePortalContext();
  const [dismissed, setDismissed] = useState(readDismissed);

  if (!portal?.awaitingConsultationArrangement || dismissed) return null;

  return (
    <div
      className={cn(
        "mb-6 bg-gradient-to-r from-emerald-700 to-emerald-600 text-white px-4 py-3 md:px-6 rounded-xl",
        pathHasProgramSidebar(pathname) && "md:ml-56"
      )}
    >
      <div className="max-w-3xl mx-auto flex items-start gap-3">
        <Sparkles className="w-5 h-5 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm md:text-base">Welcome to your Sanative portal</p>
          <p className="text-white/90 text-xs md:text-sm mt-0.5">
            A Sanative care partner will review your intake questions and contact you to arrange a
            doctor consultation to discuss your treatment options.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            writeDismissed();
            setDismissed(true);
          }}
          className="p-1 rounded-lg hover:bg-white/10 transition-colors shrink-0"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
