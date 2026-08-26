import type { ReactNode } from "react";
import { AppSessionProviders } from "@/components/AppSessionProviders";

export default function LoginLayout({ children }: { children: ReactNode }) {
  return <AppSessionProviders>{children}</AppSessionProviders>;
}
