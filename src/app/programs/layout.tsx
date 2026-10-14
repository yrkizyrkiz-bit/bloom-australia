import type { Metadata } from "next";
import type { ReactNode } from "react";
import { privateSurfaceMetadata } from "@/lib/seo/site";

export const metadata: Metadata = privateSurfaceMetadata("Programs | Sanative");

export default function ProgramsLayout({ children }: { children: ReactNode }) {
  return children;
}
