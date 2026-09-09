"use client";

import { useEffect, useState } from "react";
import { Loader2, ScanFace } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { enrollFaceId, webauthnErrorMessage } from "@/lib/webauthn/client";
import {
  canUseFaceId,
  dismissFaceIdPrompt,
  faceIdPromptDismissed,
  markFaceIdSetupOnThisDevice,
} from "@/lib/webauthn/device";

export function FaceIdEnrollPrompt({ staffCopy = false }: { staffCopy?: boolean }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;

    async function maybePrompt(userId: string) {
      if (faceIdPromptDismissed(userId)) return;
      if (!(await canUseFaceId())) return;
      const res = await fetch("/api/auth/webauthn/status");
      if (!res.ok) return;
      const data = await res.json();
      if (cancelled) return;
      if (data.enabled === false || (data.passkeys || []).length > 0) return;
      setOpen(true);
    }

    void maybePrompt(user.id);
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  if (!user?.id) return null;

  const closeAndDismiss = () => {
    dismissFaceIdPrompt(user.id);
    setOpen(false);
  };

  const handleEnable = async () => {
    setEnrolling(true);
    try {
      await enrollFaceId();
      markFaceIdSetupOnThisDevice(user.email);
      dismissFaceIdPrompt(user.id);
      setOpen(false);
      toast.success("Face ID is ready. Use it next time you sign in on this phone.");
    } catch (error) {
      toast.error(webauthnErrorMessage(error, "Could not enable Face ID setup"));
    } finally {
      setEnrolling(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? setOpen(true) : closeAndDismiss())}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ScanFace className="w-5 h-5 text-[#5c7a52]" />
            Use Face ID next time?
          </DialogTitle>
          <DialogDescription>
            {staffCopy
              ? "Sign in faster on this phone with Face ID. Only enable it on your own phone, not a shared clinic iPad."
              : "Sign in faster next time on this phone with Face ID. You can change this later in Settings."}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="ghost" onClick={closeAndDismiss} disabled={enrolling}>
            Not now
          </Button>
          <Button type="button" onClick={handleEnable} disabled={enrolling}>
            {enrolling && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Enable Face ID
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
