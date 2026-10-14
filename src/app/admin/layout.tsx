import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppSessionProviders } from "@/components/AppSessionProviders";
import { privateSurfaceMetadata } from "@/lib/seo/site";
import AdminLayoutClient from "./AdminLayoutClient";

export const metadata: Metadata = privateSurfaceMetadata("Admin | Sanative");

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AppSessionProviders>
      <AdminLayoutClient>{children}</AdminLayoutClient>
    </AppSessionProviders>
  );
}
