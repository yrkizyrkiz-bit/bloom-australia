"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import type { Session } from "next-auth";
import type { ReactNode } from "react";

type SessionProviderProps = {
  children: ReactNode;
  /** Server-prefetched session, avoids a client round-trip on first paint. */
  session?: Session | null;
};

export function SessionProvider({ children, session }: SessionProviderProps) {
  return (
    <NextAuthSessionProvider
      session={session}
      // Refetch session every 5 minutes to keep it fresh
      refetchInterval={5 * 60}
      // Avoid noisy session refetch errors while the dev server is recompiling
      refetchOnWindowFocus={process.env.NODE_ENV === "production"}
    >
      {children}
    </NextAuthSessionProvider>
  );
}
