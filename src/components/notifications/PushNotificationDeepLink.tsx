"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LiveChat } from "@/components/chat/LiveChat";
import { useNotifications } from "@/contexts/NotificationContext";

function readChatQuery(): boolean {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("chat") === "1";
}

/**
 * Handles mobile push / notification deep links:
 * - ?chat=1 opens live chat on any dashboard page
 * - service worker SANATIVE_NOTIFICATION_OPEN navigates + opens chat when needed
 */
export function PushNotificationDeepLink() {
  const router = useRouter();
  const { markMatchingActionUrlRead } = useNotifications();
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    if (readChatQuery()) {
      setChatOpen(true);
      markMatchingActionUrlRead("chat=1");
    }
    const thread = typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("thread")
      : null;
    if (thread) markMatchingActionUrlRead(`thread=${thread}`);
  }, [markMatchingActionUrlRead]);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const onMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data || data.type !== "SANATIVE_NOTIFICATION_OPEN" || typeof data.url !== "string") {
        return;
      }

      try {
        const target = new URL(data.url, window.location.origin);
        const pathWithQuery = `${target.pathname}${target.search}${target.hash}`;
        const openChat = target.searchParams.get("chat") === "1";
        const threadId = target.searchParams.get("thread");

        if (openChat) {
          setChatOpen(true);
          markMatchingActionUrlRead("chat=1");
        }
        if (threadId) markMatchingActionUrlRead(`thread=${threadId}`);

        const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
        if (current !== pathWithQuery) {
          router.push(pathWithQuery);
        }
      } catch {
        // ignore malformed URLs
      }
    };

    navigator.serviceWorker.addEventListener("message", onMessage);
    return () => navigator.serviceWorker.removeEventListener("message", onMessage);
  }, [router, markMatchingActionUrlRead]);

  return <LiveChat isOpen={chatOpen} onClose={() => setChatOpen(false)} />;
}
