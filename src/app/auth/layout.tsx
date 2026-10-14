import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppSessionProviders } from "@/components/AppSessionProviders";
import { privateSurfaceMetadata } from "@/lib/seo/site";

export const metadata: Metadata = privateSurfaceMetadata("Sign in | Sanative");

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <AppSessionProviders>{children}</AppSessionProviders>;
}
