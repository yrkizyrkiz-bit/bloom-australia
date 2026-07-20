import { usePortalContextValue } from "@/contexts/PortalContextProvider";
import type { PortalContextPayload } from "@/lib/portal-context";

export function usePortalContext() {
  return usePortalContextValue();
}

export type { PortalContextPayload };
