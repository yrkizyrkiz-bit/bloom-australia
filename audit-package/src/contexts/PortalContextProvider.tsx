"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { PortalContextPayload } from "@/lib/portal-context";

const CACHE_KEY = "sanative_portal_context_v1";
const CACHE_TTL_MS = 60_000;

type PortalContextValue = {
  data: PortalContextPayload | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

const PortalContext = createContext<PortalContextValue | null>(null);

function readCache(): PortalContextPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { at: number; data: PortalContextPayload };
    if (Date.now() - parsed.at > CACHE_TTL_MS) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

function writeCache(data: PortalContextPayload) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), data }));
  } catch {
    // ignore quota errors
  }
}

export function PortalContextProvider({ children }: { children: ReactNode }) {
  const cached = useRef(readCache());
  const [data, setData] = useState<PortalContextPayload | null>(cached.current);
  const [isLoading, setIsLoading] = useState(!cached.current);
  const [error, setError] = useState<string | null>(null);
  const inflight = useRef<Promise<void> | null>(null);

  const fetchPortal = useCallback(async (background = false) => {
    if (inflight.current) return inflight.current;

    const run = async () => {
      if (!background) setIsLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/portal/context");
        if (!res.ok) {
          throw new Error(`Failed to load portal context (${res.status})`);
        }
        const payload = (await res.json()) as PortalContextPayload;
        setData(payload);
        writeCache(payload);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load portal context");
      } finally {
        setIsLoading(false);
      }
    };

    inflight.current = run().finally(() => {
      inflight.current = null;
    });
    return inflight.current;
  }, []);

  useEffect(() => {
    void fetchPortal(Boolean(cached.current));
  }, [fetchPortal]);

  const value = useMemo(
    () => ({
      data,
      isLoading,
      error,
      refetch: () => fetchPortal(false),
    }),
    [data, isLoading, error, fetchPortal]
  );

  return <PortalContext.Provider value={value}>{children}</PortalContext.Provider>;
}

export function usePortalContextValue() {
  const ctx = useContext(PortalContext);
  if (!ctx) {
    throw new Error("usePortalContext must be used within PortalContextProvider");
  }
  return ctx;
}
