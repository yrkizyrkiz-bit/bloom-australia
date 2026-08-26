import { Toaster } from "@/components/ui/sonner";

/** Toasts for public forms without loading NextAuth on marketing pages. */
export function AppToaster() {
  return <Toaster position="top-right" richColors />;
}
