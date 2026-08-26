import type { ReactNode } from "react";
import { AppToaster } from "@/components/AppToaster";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#fdfbf7]">
      {children}
      <AppToaster />
    </div>
  );
}
