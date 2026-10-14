import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppToaster } from "@/components/AppToaster";
import { privateSurfaceMetadata } from "@/lib/seo/site";

export const metadata: Metadata = privateSurfaceMetadata("Forgot password | Sanative");

export default function ForgotPasswordLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <AppToaster />
    </>
  );
}
