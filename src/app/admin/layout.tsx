import type { ReactNode } from "react";
import { AppSessionProviders } from "@/components/AppSessionProviders";
import AdminLayoutClient from "./AdminLayoutClient";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AppSessionProviders>
      <AdminLayoutClient>{children}</AdminLayoutClient>
    </AppSessionProviders>
  );
}
