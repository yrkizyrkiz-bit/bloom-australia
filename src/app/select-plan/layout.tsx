import type { Metadata } from "next";
import type { ReactNode } from "react";
import { privateSurfaceMetadata } from "@/lib/seo/site";

export const metadata: Metadata = privateSurfaceMetadata("Select plan | Sanative");

export default function SelectPlanLayout({ children }: { children: ReactNode }) {
  return children;
}
