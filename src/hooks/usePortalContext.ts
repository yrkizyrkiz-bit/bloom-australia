import { useApi } from "@/hooks/useApi";
import type { PortalContextPayload } from "@/lib/portal-context";

export function usePortalContext() {
  return useApi<PortalContextPayload>("/api/portal/context");
}
