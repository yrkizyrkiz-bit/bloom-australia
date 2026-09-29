"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { getSession } from "next-auth/react";
import { useAuth } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { PortalContextProvider } from "@/contexts/PortalContextProvider";
import { FaceIdEnrollPrompt } from "@/components/account/FaceIdEnrollPrompt";
import { DashboardNav } from "@/components/dashboard/DashboardNav";
import { MobileNav } from "@/components/dashboard/MobileNav";
import { Heart } from "lucide-react";

const SESSION_RELOAD_KEY = "sanative_session_document_reload";

function buildLoginRedirect(pathname: string, search: string) {
  const returnTo = `${pathname}${search}`;
  return `/login?redirect=${encodeURIComponent(returnTo)}`;
}

function readReloadFlag() {
  try {
    return sessionStorage.getItem(SESSION_RELOAD_KEY) === "1";
  } catch {
    return false;
  }
}

function writeReloadFlag() {
  try {
    sessionStorage.setItem(SESSION_RELOAD_KEY, "1");
  } catch {
    // ignore
  }
}

function clearReloadFlag() {
  try {
    sessionStorage.removeItem(SESSION_RELOAD_KEY);
  } catch {
    // ignore
  }
}

export default function DashboardLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname() || "/dashboard";
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const searchSuffix = search ? `?${search}` : "";
  const confirmStarted = useRef(false);

  useEffect(() => {
    if (isLoading) return;

    if (user) {
      clearReloadFlag();
      if (user.role === "admin") {
        window.location.assign("/admin");
      }
      return;
    }

    if (confirmStarted.current) return;
    confirmStarted.current = true;

    let cancelled = false;
    void (async () => {
      const session = await getSession();
      if (cancelled) return;

      if (session?.user?.id) {
        // The document was painted logged-out, but the cookie is present.
        // One full load picks it up. A second miss goes to login.
        if (!readReloadFlag()) {
          writeReloadFlag();
          window.location.assign(`${pathname}${searchSuffix}`);
          return;
        }
      }
      clearReloadFlag();
      router.replace(buildLoginRedirect(pathname, searchSuffix));
    })();

    return () => {
      cancelled = true;
      confirmStarted.current = false;
    };
  }, [user, isLoading, router, pathname, searchSuffix]);

  if (isLoading || !user || user.role === "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#fdfbf7] via-white to-[#f0f7f4]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1D9E75] to-[#178a64] flex items-center justify-center shadow-lg">
            <Heart className="w-8 h-8 text-white animate-pulse" />
          </div>
          <div className="text-center">
            <p className="font-serif text-xl text-[#34412f]">sanative</p>
            <p className="text-[#5c7a52] text-sm mt-1">Loading your health data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <PortalContextProvider>
      <NotificationProvider>
        <div className="min-h-screen bg-gradient-to-br from-[#fdfbf7] via-white to-[#f0f7f4]">
          <DashboardNav />
          <main className="mx-auto min-w-0 max-w-7xl overflow-x-hidden px-4 py-6 pb-24 sm:px-6 md:pb-8 lg:px-8">
            {children}
          </main>
          <MobileNav />
          <FaceIdEnrollPrompt />
        </div>
      </NotificationProvider>
    </PortalContextProvider>
  );
}
