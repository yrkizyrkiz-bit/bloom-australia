import type { Metadata } from "next";
import type { ReactNode } from "react";
import { privateSurfaceMetadata } from "@/lib/seo/site";

/** App-route metabolic care (e.g. fatty-liver assessment) — not public marketing pages. */
export const metadata: Metadata = privateSurfaceMetadata("Metabolic care | Sanative");

export default function MetabolicCareAppLayout({ children }: { children: ReactNode }) {
  return children;
}
