import type { ReactNode } from "react";
import { AppToaster } from "@/components/AppToaster";
import { MarketingFonts } from "@/components/promo/MarketingFonts";

/**
 * Marketing surfaces only: Cormorant + Outfit load here (and on `/` / login),
 * so portal/admin pages do not download those font files.
 */
export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <MarketingFonts className="min-h-screen bg-[#fdfbf7]">
      {children}
      <AppToaster />
    </MarketingFonts>
  );
}
