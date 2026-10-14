import type { Metadata } from "next";
import { Suspense } from "react";
import { AppSessionProviders } from "@/components/AppSessionProviders";
import { privateSurfaceMetadata } from "@/lib/seo/site";
import DashboardLayoutClient from "./DashboardLayoutClient";

export const metadata: Metadata = privateSurfaceMetadata("Member Portal | Sanative");

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppSessionProviders>
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#fdfbf7] via-white to-[#f0f7f4]">
            <p className="text-[#5c7a52] text-sm">Loading your health data...</p>
          </div>
        }
      >
        <DashboardLayoutClient>{children}</DashboardLayoutClient>
      </Suspense>
    </AppSessionProviders>
  );
}
