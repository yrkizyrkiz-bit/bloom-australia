"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ProgramGridDashboard } from "@/components/dashboard/ProgramGridDashboard";

/**
 * Login overlay that presents the program grid on top of the existing portal.
 * Shows once per browser session per user; dismissing reveals the current
 * dashboard underneath unchanged.
 */
export function ProgramGridOverlay() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const openedAtPath = useRef<string | null>(null);
  const dismissedRef = useRef(false);

  const dismissKey = user?.id ? `sanative_grid_overlay_dismissed_${user.id}` : null;

  const dismissOverlay = useCallback(() => {
    if (dismissedRef.current) return;
    dismissedRef.current = true;
    setOpen(false);
    if (dismissKey) {
      try {
        sessionStorage.setItem(dismissKey, "1");
        // Defer so listeners (e.g. home redirect) don't nest router updates in this render.
        queueMicrotask(() => {
          window.dispatchEvent(new Event("sanative:grid-overlay-dismissed"));
        });
      } catch {
        // sessionStorage unavailable, still hide for this mount.
      }
    }
  }, [dismissKey]);

  useEffect(() => {
    if (!user?.id || !dismissKey) return;
    dismissedRef.current = false;
    try {
      if (!sessionStorage.getItem(dismissKey)) {
        setOpen(true);
        openedAtPath.current = pathname;
      }
    } catch {
      // sessionStorage unavailable (private mode), skip the overlay silently.
    }
    // Only evaluate once per user mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Dismiss when the member navigates away (nav link or tile click).
  useEffect(() => {
    if (!open || openedAtPath.current === null || pathname === openedAtPath.current) return;
    dismissOverlay();
  }, [pathname, open, dismissOverlay]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-gradient-to-br from-[#fdfbf7] via-white to-[#f0f7f4]">
      <div className="mx-auto max-w-5xl px-4 py-8 pb-24 sm:px-6 lg:px-8">
        <div className="mb-4 flex justify-end">
          <button
            type="button"
            onClick={dismissOverlay}
            className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
          >
            Skip to dashboard
            <X className="h-4 w-4" />
          </button>
        </div>
        <ProgramGridDashboard onNavigate={dismissOverlay} />
      </div>
    </div>
  );
}
