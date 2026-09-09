"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { PortalContextProvider } from "@/contexts/PortalContextProvider";
import { FaceIdEnrollPrompt } from "@/components/account/FaceIdEnrollPrompt";
import { DashboardNav } from "@/components/dashboard/DashboardNav";
import { MobileNav } from "@/components/dashboard/MobileNav";
import { Heart } from "lucide-react";

function buildLoginRedirect(pathname: string, search: string) {
  const returnTo = `${pathname}${search}`;
  return `/login?redirect=${encodeURIComponent(returnTo)}`;
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

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace(buildLoginRedirect(pathname, searchSuffix));
      return;
    }

    if (user.role === "admin") {
      router.replace("/admin");
    }
  }, [user, isLoading, router, pathname, searchSuffix]);

  if (isLoading) {
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

  if (!user || user.role === "admin") {
    return null;
  }

  return (
    <PortalContextProvider>
      <NotificationProvider>
        <div className="min-h-screen bg-gradient-to-br from-[#fdfbf7] via-white to-[#f0f7f4]">
          <DashboardNav />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-8">
            {children}
          </main>
          <MobileNav />
          <FaceIdEnrollPrompt />
        </div>
      </NotificationProvider>
    </PortalContextProvider>
  );
}
