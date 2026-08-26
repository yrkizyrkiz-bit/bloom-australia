import type { ReactNode } from "react";
import { AppToaster } from "@/components/AppToaster";

export default function ForgotPasswordLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <AppToaster />
    </>
  );
}
