"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Send, X } from "lucide-react";
import { GeorgeMascot } from "@/components/george/GeorgeMascot";
import { GEORGE_NAME } from "@/lib/george";

type ChatTurn = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const SUGGESTED_QUESTION = "I have a question about Sanative";

const WELCOME: ChatTurn[] = [
  {
    id: "welcome-1",
    role: "assistant",
    content:
      "Hi, welcome to Sanative. I am George, your care companion — not a doctor. I can help with membership, programs and how Sanative works.",
  },
  {
    id: "welcome-2",
    role: "assistant",
    content: "How can I help?",
  },
];

export function GuestSupportChat({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [email, setEmail] = useState("");
  const [draft, setDraft] = useState("");
  const [turns, setTurns] = useState<ChatTurn[]>(WELCOME);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestedUsed, setSuggestedUsed] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [turns, open]);

  function useSuggestedQuestion() {
    if (suggestedUsed) return;
    setSuggestedUsed(true);
    setTurns((current) => [
      ...current,
      { id: "suggested-user", role: "user", content: SUGGESTED_QUESTION },
      {
        id: "suggested-reply",
        role: "assistant",
        content:
          "Got it — share your question below. Leave an email so we can follow up if you need the team.",
      },
    ]);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const message = draft.trim();
    if (!message || sending) return;
    if (!email.trim()) {
      setError("Add your email so we can follow up.");
      return;
    }

    setError(null);
    setDraft("");
    const userTurn: ChatTurn = {
      id: `user-${Date.now()}`,
      role: "user",
      content: message,
    };
    const history = turns
      .filter((turn) => turn.id !== "welcome-1" && turn.id !== "welcome-2")
      .map(({ role, content }) => ({ role, content }));
    setTurns((current) => [...current, userTurn]);
    setSending(true);

    try {
      const response = await fetch("/api/public/contact-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          message,
          history,
        }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        reply?: string;
        error?: string;
      };
      if (!response.ok) {
        throw new Error(data.error || "Please try again.");
      }
      setTurns((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: data.reply || "Thanks — the team can follow up at your email.",
        },
      ]);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Please try again.");
      setDraft(message);
    } finally {
      setSending(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-[#2c3628]/20 sm:bg-transparent sm:pointer-events-none">
      <aside className="pointer-events-auto flex h-full w-full max-w-md flex-col border-l border-[#e6ebe3] bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-[#e6ebe3] px-4 py-3">
          <div className="flex items-center gap-3">
            <GeorgeMascot size="sm" cropFace idle />
            <div>
              <p className="text-sm font-medium text-[#2c3628]">Sanative Support · {GEORGE_NAME}</p>
              <p className="text-xs text-[#7e9a72]">AI companion · not a doctor</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-[#5c7a52] hover:bg-[#f4f7f2]"
            aria-label="Close chat"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div ref={listRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-5">
          {turns.map((turn) => (
            <div
              key={turn.id}
              className={`flex ${turn.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <p
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  turn.role === "user"
                    ? "rounded-tr-md bg-[#c17a58] text-white"
                    : "rounded-tl-md bg-[#f4f7f2] text-[#2c3628]"
                }`}
              >
                {turn.content}
              </p>
            </div>
          ))}

          {!suggestedUsed && (
            <button
              type="button"
              onClick={useSuggestedQuestion}
              className="rounded-full border border-[#e6ebe3] px-4 py-2 text-sm text-[#2c3628] hover:border-[#c17a58] hover:text-[#c17a58]"
            >
              {SUGGESTED_QUESTION}
            </button>
          )}

          {sending && (
            <p className="text-xs text-[#7e9a72]">George is typing…</p>
          )}
        </div>

        <form onSubmit={onSubmit} className="border-t border-[#e6ebe3] px-4 py-4 space-y-3">
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="email@example.com"
            autoComplete="email"
            className="w-full rounded-xl border border-[#c17a58]/50 px-3 py-2.5 text-sm text-[#2c3628] outline-none focus:border-[#c17a58] focus:ring-2 focus:ring-[#c17a58]/20"
          />
          <div className="relative">
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Message…"
              rows={3}
              className="w-full resize-none rounded-xl border border-[#c17a58]/50 px-3 py-2.5 pr-12 text-sm text-[#2c3628] outline-none focus:border-[#c17a58] focus:ring-2 focus:ring-[#c17a58]/20"
            />
            <button
              type="submit"
              disabled={sending}
              className="absolute bottom-2.5 right-2.5 flex h-9 w-9 items-center justify-center rounded-full bg-[#c17a58] text-white hover:bg-[#a96848] disabled:opacity-60"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          {error && <p className="text-xs text-[#c17a58]">{error}</p>}
          <p className="text-[11px] leading-relaxed text-[#7e9a72]">
            For emergencies call 000. George does not give medical advice. Your email is only used
            to reply to this enquiry.
          </p>
        </form>
      </aside>
    </div>
  );
}
