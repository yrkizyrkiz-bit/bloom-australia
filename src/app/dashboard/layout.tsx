import { Suspense } from "react";
import { AppSessionProviders } from "@/components/AppSessionProviders";
import DashboardLayoutClient from "./DashboardLayoutClient";

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
