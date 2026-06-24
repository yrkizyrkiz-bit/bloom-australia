"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import type { ReactNode } from "react";

export function SessionProvider({ children }: { children: ReactNode }) {
  return (
    <NextAuthSessionProvider
      // Refetch session every 5 minutes to keep it fresh
      refetchInterval={5 * 60}
      // Avoid noisy session refetch errors while the dev server is recompiling
      refetchOnWindowFocus={process.env.NODE_ENV === "production"}
    >
      {children}
    </NextAuthSessionProvider>
  );
}
