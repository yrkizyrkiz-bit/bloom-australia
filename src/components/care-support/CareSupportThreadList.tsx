"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/contexts/NotificationContext";

function readThreadQuery(): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("thread");
}

function writeThreadQuery(threadId: string | null) {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (threadId) url.searchParams.set("thread", threadId);
  else url.searchParams.delete("thread");
  window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
}

export type CareSupportMessage = {
  id: string;
  senderRole: string;
  body: string;
  createdAt: string;
};

export type CareSupportThread = {
  id: string;
  subject: string;
  status: string;
  lastMessageAt: string;
  messages: CareSupportMessage[];
};

type Theme = "sage" | "rose";

const themes: Record<
  Theme,
  {
    card: string;
    title: string;
    muted: string;
    badge: string;
    memberBubble: string;
    staffBubble: string;
    replyBtn: string;
    openBtn: string;
  }
> = {
  sage: {
    card: "rounded-xl border border-[#cdd8c6] bg-[#f8f4ec]/60 p-4",
    title: "text-[#2c3628]",
    muted: "text-[#5c7a52]",
    badge: "bg-[#e6ebe3] text-[#4a6243]",
    memberBubble: "ml-6 bg-[#4a6243] text-white",
    staffBubble: "mr-6 border border-[#cdd8c6] bg-white text-[#2c3628]",
    replyBtn: "bg-[#4a6243] text-white hover:bg-[#3d4f38]",
    openBtn: "border-[#cdd8c6] text-[#4a6243] hover:bg-[#e6ebe3]",
  },
  rose: {
    card: "rounded-xl border border-rose-200 bg-rose-50/60 p-4",
    title: "text-rose-950",
    muted: "text-rose-700/80",
    badge: "bg-rose-100 text-rose-800",
    memberBubble: "ml-6 bg-rose-600 text-white",
    staffBubble: "mr-6 border border-rose-200 bg-white text-rose-950",
    replyBtn: "bg-rose-600 text-white hover:bg-rose-700",
    openBtn: "border-rose-200 text-rose-800 hover:bg-rose-100",
  },
};

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString("en-AU", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

type Props = {
  threads: CareSupportThread[];
  loading: boolean;
  theme?: Theme;
  onRefresh: () => Promise<void> | void;
  headingClassName?: string;
  ghostBtnClassName?: string;
};

export function CareSupportThreadList({
  threads,
  loading,
  theme = "sage",
  onRefresh,
  headingClassName,
  ghostBtnClassName,
}: Props) {
  const t = themes[theme];
  const { markMatchingActionUrlRead } = useNotifications();
  const [openThreadId, setOpenThreadId] = useState<string | null>(null);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [replyingId, setReplyingId] = useState<string | null>(null);

  useEffect(() => {
    const fromQuery = readThreadQuery();
    if (fromQuery) {
      setOpenThreadId(fromQuery);
      return;
    }
    // Staff-started "Message from your care team" — open the newest thread so Reply is ready.
    if (threads.length > 0) {
      setOpenThreadId((current) => current ?? threads[0].id);
    }
  }, [threads]);

  useEffect(() => {
    if (!openThreadId || threads.length === 0) return;
    const el = document.getElementById(`care-thread-${openThreadId}`);
    el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [openThreadId, threads]);

  // Keep open conversation fresh without requiring Refresh / bell click
  useEffect(() => {
    const tick = () => {
      void onRefresh();
    };
    const interval = window.setInterval(tick, 4000);
    return () => window.clearInterval(interval);
  }, [onRefresh]);

  // Clear matching bell notifications while this thread is open
  useEffect(() => {
    if (!openThreadId) return;
    markMatchingActionUrlRead(`thread=${openThreadId}`);
    const interval = window.setInterval(() => {
      markMatchingActionUrlRead(`thread=${openThreadId}`);
    }, 5000);
    return () => window.clearInterval(interval);
  }, [openThreadId, markMatchingActionUrlRead]);

  const openThread = (threadId: string) => {
    setOpenThreadId(threadId);
    writeThreadQuery(threadId);
    markMatchingActionUrlRead(`thread=${threadId}`);
  };

  const sendReply = async (threadId: string) => {
    const text = (replyDrafts[threadId] || "").trim();
    if (!text) {
      toast.error("Please write a reply");
      return;
    }
    setReplyingId(threadId);
    try {
      const res = await fetch(`/api/care-support/messages/${threadId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to send reply");
      setReplyDrafts((prev) => ({ ...prev, [threadId]: "" }));
      toast.success("Reply sent");
      await onRefresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send reply");
    } finally {
      setReplyingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p
          className={cn(
            "font-serif text-lg font-semibold",
            headingClassName || t.title
          )}
        >
          Your messages
        </p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => void onRefresh()}
          className={ghostBtnClassName || t.muted}
        >
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className={cn("h-6 w-6 animate-spin", t.muted)} />
        </div>
      ) : threads.length === 0 ? (
        <p className={cn("text-sm", t.muted)}>
          No messages yet. Send a note above and your care team will reply here.
        </p>
      ) : (
        <div className="space-y-4">
          {threads.map((thread) => {
            const isOpen = openThreadId === thread.id;
            const closed = thread.status === "CLOSED";
            return (
              <div key={thread.id} id={`care-thread-${thread.id}`} className={t.card}>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className={cn("font-medium", t.title)}>{thread.subject}</p>
                    <p className={cn("text-xs", t.muted)}>
                      Updated {formatWhen(thread.lastMessageAt)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className={t.badge}>
                      {thread.status === "OPEN" ? "Active" : thread.status}
                    </Badge>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className={t.openBtn}
                      onClick={() => openThread(thread.id)}
                    >
                      {isOpen ? "Replying" : "Open"}
                    </Button>
                  </div>
                </div>

                {isOpen && (
                  <>
                    <div className="space-y-2">
                      {thread.messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={cn(
                            "rounded-lg px-3 py-2 text-sm",
                            msg.senderRole === "MEMBER" ? t.memberBubble : t.staffBubble
                          )}
                        >
                          <p className="mb-1 text-[10px] uppercase tracking-wide opacity-70">
                            {msg.senderRole === "MEMBER" ? "You" : "Care team"} ·{" "}
                            {formatWhen(msg.createdAt)}
                          </p>
                          <p className="whitespace-pre-wrap">{msg.body}</p>
                        </div>
                      ))}
                    </div>

                    {closed ? (
                      <p className={cn("mt-3 text-xs", t.muted)}>
                        This conversation is closed. Start a new message above if you need more
                        help.
                      </p>
                    ) : (
                      <div className="mt-3 space-y-2">
                        <Textarea
                          placeholder="Write your reply..."
                          value={replyDrafts[thread.id] || ""}
                          onChange={(e) =>
                            setReplyDrafts((prev) => ({
                              ...prev,
                              [thread.id]: e.target.value,
                            }))
                          }
                          rows={3}
                          className="bg-white/90"
                        />
                        <Button
                          type="button"
                          className={cn("w-full sm:w-auto", t.replyBtn)}
                          disabled={replyingId === thread.id}
                          onClick={() => void sendReply(thread.id)}
                        >
                          {replyingId === thread.id ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Sending...
                            </>
                          ) : (
                            <>
                              <Send className="mr-2 h-4 w-4" />
                              Reply
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </>
                )}

                {!isOpen && thread.messages.length > 0 && (
                  <p className={cn("line-clamp-2 text-sm", t.muted)}>
                    {thread.messages[thread.messages.length - 1]?.body}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
