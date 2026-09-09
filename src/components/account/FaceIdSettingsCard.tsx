"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, ScanFace, Smartphone, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { enrollFaceId, webauthnErrorMessage } from "@/lib/webauthn/client";
import { canUseFaceId } from "@/lib/webauthn/device";

type PasskeyRow = {
  id: string;
  deviceName: string | null;
  createdAt: string;
  lastUsedAt: string | null;
};

function formatDate(value: string | null) {
  if (!value) return "Never";
  return new Date(value).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function FaceIdSettingsCard({ staffCopy = false }: { staffCopy?: boolean }) {
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [platformReady, setPlatformReady] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [passkeys, setPasskeys] = useState<PasskeyRow[]>([]);

  const loadStatus = useCallback(async () => {
    try {
      const [ready, res] = await Promise.all([
        canUseFaceId(),
        fetch("/api/auth/webauthn/status"),
      ]);
      setPlatformReady(ready);
      if (!res.ok) throw new Error("Could not load Face ID settings");
      const data = await res.json();
      setEnabled(data.enabled !== false);
      setPasskeys(data.passkeys || []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load Face ID settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  const handleEnroll = async () => {
    setEnrolling(true);
    try {
      // Always attempt enrollment — don't hide the button behind browser heuristics.
      // If Face ID isn't available here, the OS/browser returns a clear error.
      if (!(await canUseFaceId())) {
        toast.error("Open Sanative in Safari on your iPhone, then tap Enable Face ID.");
        return;
      }
      await enrollFaceId();
      toast.success("Face ID is ready. Use it next time you sign in.");
      await loadStatus();
    } catch (error) {
      toast.error(webauthnErrorMessage(error, "Could not enable Face ID"));
    } finally {
      setEnrolling(false);
    }
  };

  const handleRemove = async (id: string) => {
    setRemovingId(id);
    try {
      const res = await fetch(`/api/auth/webauthn/passkeys/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not remove this device");
      toast.success("Device removed. Email and password still work.");
      await loadStatus();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not remove this device");
    } finally {
      setRemovingId(null);
    }
  };

  const enableLabel = passkeys.length === 0 ? "Enable Face ID" : "Add this device";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#5c7a52]/10 flex items-center justify-center">
            <ScanFace className="w-5 h-5 text-[#5c7a52]" />
          </div>
          <div>
            <CardTitle className="text-lg">Face ID</CardTitle>
            <CardDescription>
              {staffCopy
                ? "Use Face ID on your own phone. Do not enable it on a shared clinic iPad."
                : "Sign in faster on your phone with Face ID."}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading devices...
          </div>
        ) : !enabled ? (
          <p className="text-sm text-muted-foreground">
            Face ID is turned off for this account. Email and password still work. Ask care if you need it turned back on.
          </p>
        ) : (
          <>
            <p className="text-sm">
              Status:{" "}
              <span className="font-medium">
                {passkeys.length > 0 ? "On" : platformReady ? "Ready to enable" : "Available"}
              </span>
            </p>

            <Button type="button" onClick={handleEnroll} disabled={enrolling} className="w-full sm:w-auto">
              {enrolling ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Smartphone className="w-4 h-4 mr-2" />
              )}
              {enableLabel}
            </Button>

            {!platformReady && (
              <p className="text-sm text-muted-foreground">
                Best on your iPhone in Safari. Tap the button above — your phone will ask for Face ID.
              </p>
            )}

            {passkeys.length === 0 ? (
              <p className="text-sm text-muted-foreground">No phones have Face ID set up yet.</p>
            ) : (
              <ul className="space-y-2">
                {passkeys.map((passkey) => (
                  <li
                    key={passkey.id}
                    className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-medium">{passkey.deviceName || "This device"}</p>
                      <p className="text-xs text-muted-foreground">
                        Added {formatDate(passkey.createdAt)} · Last used {formatDate(passkey.lastUsedAt)}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemove(passkey.id)}
                      disabled={removingId === passkey.id}
                      aria-label="Remove Face ID device"
                    >
                      {removingId === passkey.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
