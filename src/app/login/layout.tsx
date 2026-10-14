import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppSessionProviders } from "@/components/AppSessionProviders";
import { MarketingFonts } from "@/components/promo/MarketingFonts";
import { privateSurfaceMetadata } from "@/lib/seo/site";

export const metadata: Metadata = privateSurfaceMetadata("Log in | Sanative");

export default function LoginLayout({ children }: { children: ReactNode }) {
  return (
    <AppSessionProviders>
      <MarketingFonts>{children}</MarketingFonts>
    </AppSessionProviders>
  );
}
