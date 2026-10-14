import type { Metadata } from "next";
import type { ReactNode } from "react";
import { privateSurfaceMetadata } from "@/lib/seo/site";

export const metadata: Metadata = privateSurfaceMetadata("Reset password | Sanative");

export default function ResetPasswordLayout({ children }: { children: ReactNode }) {
  return children;
}
