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
      // Do not background-refetch the session. An empty/failed /api/auth/session
      // reply has cleared the client session mid-chat (notifications + messaging)
      // and bounced staff/members to login. JWT maxAge is 30 days.
      refetchInterval={0}
      refetchOnWindowFocus={false}
      refetchWhenOffline={false}
    >
      {children}
    </NextAuthSessionProvider>
  );
}
