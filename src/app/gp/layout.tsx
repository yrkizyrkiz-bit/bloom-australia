import type { ReactNode } from "react";
import { AppSessionProviders } from "@/components/AppSessionProviders";

export default function GPLayout({ children }: { children: ReactNode }) {
  return <AppSessionProviders>{children}</AppSessionProviders>;
}
