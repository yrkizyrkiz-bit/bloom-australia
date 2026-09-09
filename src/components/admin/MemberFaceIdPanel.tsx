"use client";

import { useCallback, useState } from "react";
import { Loader2, ScanFace, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

export function MemberFaceIdPanel({
  userId,
  onChanged,
}: {
  userId: string;
  onChanged?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [passkeys, setPasskeys] = useState<PasskeyRow[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/passkeys`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not load Face ID devices");
      setEnabled(data.enabled !== false);
      setPasskeys(data.passkeys || []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load Face ID devices");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const patch = async (body: Record<string, unknown>) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/passkeys`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not update Face ID");
      setEnabled(data.enabled !== false);
      setPasskeys(data.passkeys || []);
      onChanged?.();
      toast.success("Face ID updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update Face ID");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        className="w-full justify-start gap-2"
        onClick={() => {
          setOpen(true);
          void load();
        }}
      >
        <ScanFace className="w-4 h-4" />
        Face ID
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ScanFace className="w-5 h-5 text-[#5c7a52]" />
              Face ID devices
            </DialogTitle>
            <DialogDescription>
              You can revoke a phone or turn Face ID off. You cannot turn it on from here.
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading devices...
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm">
                Status: <span className="font-medium">{enabled ? "Available" : "Disabled"}</span>
              </p>

              {passkeys.length === 0 ? (
                <p className="text-sm text-muted-foreground">No Face ID devices enrolled.</p>
              ) : (
                <ul className="space-y-2">
                  {passkeys.map((passkey) => (
                    <li
                      key={passkey.id}
                      className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2"
                    >
                      <div>
                        <p className="text-sm font-medium">{passkey.deviceName || "Device"}</p>
                        <p className="text-xs text-muted-foreground">
                          Added {formatDate(passkey.createdAt)} · Last used {formatDate(passkey.lastUsedAt)}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={busy}
                        onClick={() => patch({ revokePasskeyId: passkey.id })}
                        aria-label="Revoke Face ID device"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}

              <div className="flex flex-col gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy || passkeys.length === 0}
                  onClick={() => patch({ revokeAll: true })}
                >
                  Revoke all devices
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="text-amber-700"
                  disabled={busy || !enabled}
                  onClick={() => patch({ passkeysEnabled: false })}
                >
                  Disable Face ID
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
