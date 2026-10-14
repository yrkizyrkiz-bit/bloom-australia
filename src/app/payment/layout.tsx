import type { Metadata } from "next";
import type { ReactNode } from "react";
import { privateSurfaceMetadata } from "@/lib/seo/site";

export const metadata: Metadata = privateSurfaceMetadata("Payment | Sanative");

export default function PaymentLayout({ children }: { children: ReactNode }) {
  return children;
}
