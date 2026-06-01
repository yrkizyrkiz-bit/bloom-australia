"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { DashboardNav } from "@/components/dashboard/DashboardNav";
import { MobileNav } from "@/components/dashboard/MobileNav";
import { Loader2, Heart } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => {
        setIsCheckingAuth(false);
        if (!user) {
          router.push("/");
        } else if (user.role === "admin") {
          router.push("/admin");
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [user, isLoading, router]);

  if (isLoading || isCheckingAuth) {
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

  if (!user) {
    return null;
  }

  return (
    <NotificationProvider>
      <div className="min-h-screen bg-gradient-to-br from-[#fdfbf7] via-white to-[#f0f7f4]">
        <DashboardNav />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-8">
          {children}
        </main>
        <MobileNav />
      </div>
    </NotificationProvider>
  );
}
