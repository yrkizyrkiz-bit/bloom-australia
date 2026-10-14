import type { ReactNode } from "react";
import { cormorant, outfit } from "@/lib/fonts";

/** Scopes marketing display fonts so portal routes do not download them. */
export function MarketingFonts({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`${cormorant.variable} ${outfit.variable} ${className}`.trim()}>
      {children}
    </div>
  );
}
