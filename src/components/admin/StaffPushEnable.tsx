"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { BellRing, BellOff, Loader2 } from "lucide-react";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) {
    output[i] = raw.charCodeAt(i);
  }
  return output;
}

type Status = "loading" | "unsupported" | "unconfigured" | "denied" | "off" | "on";

/**
 * Lets care partners / admins enable browser (and iOS home-screen PWA) push
 * for Live Chat care-team requests.
 */
export function StaffPushEnable({ className }: { className?: string }) {
  const [status, setStatus] = useState<Status>("loading");
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
      setStatus("unsupported");
      return;
    }

    try {
      const keyRes = await fetch("/api/push/vapid-public-key");
      if (keyRes.status === 503) {
        setStatus("unconfigured");
        return;
      }
      if (!keyRes.ok) {
        setStatus("unsupported");
        return;
      }

      if (Notification.permission === "denied") {
        setStatus("denied");
        return;
      }

      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      const existing = await registration.pushManager.getSubscription();
      setStatus(existing ? "on" : "off");
    } catch {
      setStatus("unsupported");
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const enable = async () => {
    setBusy(true);
    try {
      const keyRes = await fetch("/api/push/vapid-public-key");
      if (!keyRes.ok) {
        setStatus("unconfigured");
        return;
      }
      const { publicKey } = (await keyRes.json()) as { publicKey?: string };
      if (!publicKey) {
        setStatus("unconfigured");
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "denied" : "off");
        return;
      }

      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
        });
      }

      const json = subscription.toJSON();
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: json.endpoint,
          keys: json.keys,
          userAgent: navigator.userAgent,
        }),
      });
      if (!res.ok) throw new Error("subscribe failed");
      setStatus("on");
    } catch (error) {
      console.error("[StaffPushEnable]", error);
      setStatus("off");
    } finally {
      setBusy(false);
    }
  };

  const disable = async () => {
    setBusy(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        await subscription.unsubscribe();
      }
      setStatus("off");
    } catch (error) {
      console.error("[StaffPushEnable] disable", error);
    } finally {
      setBusy(false);
    }
  };

  if (status === "loading" || status === "unsupported" || status === "unconfigured") {
    return null;
  }

  if (status === "denied") {
    return (
      <span
        className={`hidden sm:inline text-xs text-slate-400 px-2 ${className || ""}`}
        title="Notification permission blocked in browser settings"
      >
        Push blocked
      </span>
    );
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={busy}
      onClick={() => (status === "on" ? disable() : enable())}
      className={`gap-1.5 text-slate-300 hover:text-white hover:bg-slate-800 ${className || ""}`}
      title={
        status === "on"
          ? "Disable push alerts for care chat"
          : "Enable push alerts on this device (iOS: add to Home Screen first)"
      }
    >
      {busy ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : status === "on" ? (
        <BellRing className="w-4 h-4 text-emerald-400" />
      ) : (
        <BellOff className="w-4 h-4" />
      )}
      <span className="hidden lg:inline text-xs">
        {status === "on" ? "Push on" : "Enable push"}
      </span>
    </Button>
  );
}
