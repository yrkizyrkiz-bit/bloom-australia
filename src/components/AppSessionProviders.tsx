import type { ReactNode } from "react";
import { getServerSession } from "next-auth";
import { AuthProvider } from "@/contexts/AuthContext";
import { SessionProvider } from "@/components/SessionProvider";
import { Toaster } from "@/components/ui/sonner";
import { authOptions } from "@/lib/auth";

/** Session + auth + toasts for member, admin, login, and GP routes, not the public homepage. */
export async function AppSessionProviders({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);
  return (
    <SessionProvider session={session}>
      <AuthProvider>
        {children}
        <Toaster position="top-right" richColors />
      </AuthProvider>
    </SessionProvider>
  );
}
