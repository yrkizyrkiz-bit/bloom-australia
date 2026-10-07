"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  Send,
  Shield,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { LiveChat, ChatButton } from "@/components/chat/LiveChat";
import { GeorgeMascot } from "@/components/george/GeorgeMascot";
import { GEORGE_NAME } from "@/lib/george";
import {
  CareSupportThreadList,
  type CareSupportThread,
} from "@/components/care-support/CareSupportThreadList";

export default function WomensHealthCarePage() {
  const [message, setMessage] = useState("");
  const [subject, setSubject] = useState("");
  const [sending, setSending] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [threads, setThreads] = useState<CareSupportThread[]>([]);
  const [loadingThreads, setLoadingThreads] = useState(true);

  const loadThreads = useCallback(async () => {
    try {
      const res = await fetch("/api/care-support/messages", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setThreads(data.threads || []);
    } catch (error) {
      console.error("Failed to load support messages", error);
    } finally {
      setLoadingThreads(false);
    }
  }, []);

  useEffect(() => {
    void loadThreads();
  }, [loadThreads]);

  const handleSubmit = async () => {
    if (!message.trim() || !subject.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/care-support/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, body: message }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to send message");
      }
      toast.success("Message sent! We'll respond within 24 hours.");
      setMessage("");
      setSubject("");
      await loadThreads();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-600 via-pink-600 to-purple-700 p-6 text-white">
        <div className="absolute top-0 right-0 h-40 w-40 -translate-y-1/2 translate-x-1/3 rounded-full bg-white/5" />
        <div className="absolute bottom-0 left-0 h-32 w-32 translate-y-1/2 -translate-x-1/3 rounded-full bg-white/5" />

        <div className="relative z-10">
          <Link
            href="/dashboard/womens-health"
            className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
            aria-label="Back to Women's Wellness"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <p className="mb-1 text-sm text-white/75">Women&apos;s Wellness</p>
          <h1 className="mb-1 font-serif text-2xl font-semibold md:text-3xl">My Care Team</h1>
          <p className="text-sm text-white/80">Get help with your women&apos;s health journey</p>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-600 to-pink-700 p-5 text-white">
        <div className="pointer-events-none absolute top-1 right-1 h-10 w-10 rounded-full bg-white/10 blur-md" />
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white">
              <GeorgeMascot size="md" cropFace />
            </div>
            <div className="min-w-0">
              <h3 className="font-serif text-xl font-semibold">Chat with {GEORGE_NAME}</h3>
              <p className="text-sm text-white/80">
                Your care companion — plus Sanative support when you need a human
              </p>
            </div>
          </div>
          <Button
            onClick={() => setChatOpen(true)}
            className="shrink-0 bg-white text-rose-700 hover:bg-rose-50"
          >
            <Sparkles className="mr-2 h-4 w-4 text-rose-500" />
            Start Chat
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden border-rose-200 bg-gradient-to-br from-rose-50 to-pink-50">
        <CardContent className="space-y-4 p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-600 text-white">
              <Send className="h-4 w-4" strokeWidth={2.25} />
            </span>
            <div>
              <p className="font-serif text-lg font-semibold text-rose-950">Send a Message</p>
              <p className="text-xs text-rose-700/80">We usually respond within 24 hours</p>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-rose-950">Subject</label>
            <Input
              placeholder="What can we help with?"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="border-rose-200 bg-white/80"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-rose-950">Message</label>
            <Textarea
              placeholder="Describe your question or concern..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="border-rose-200 bg-white/80"
            />
          </div>
          <Button
            onClick={handleSubmit}
            disabled={sending}
            className="w-full bg-rose-600 text-white hover:bg-rose-700"
          >
            {sending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send Message
              </>
            )}
          </Button>
          <div className="flex items-center gap-2 text-xs text-rose-700/80">
            <Shield className="h-4 w-4" />
            <span>Your message is encrypted and confidential</span>
          </div>
        </CardContent>
      </Card>

      <Card className="border-rose-200">
        <CardContent className="space-y-4 p-5">
          <CareSupportThreadList
            threads={threads}
            loading={loadingThreads}
            theme="rose"
            onRefresh={loadThreads}
            headingClassName="text-rose-950"
            ghostBtnClassName="text-rose-700"
          />
        </CardContent>
      </Card>

      <Card className="border-amber-200 bg-amber-50/50">
        <CardContent className="space-y-2 p-5 text-sm text-amber-950/80">
          <p className="font-medium text-amber-950">Safety guidance</p>
          <p>
            For chest pain, severe bleeding, fainting, signs of stroke, severe allergic
            reaction or urgent symptoms, call 000 or seek emergency care.
          </p>
          <p>{GEORGE_NAME} cannot diagnose, prescribe or change medication doses.</p>
        </CardContent>
      </Card>

      <LiveChat isOpen={chatOpen} onClose={() => setChatOpen(false)} />

      {!chatOpen && <ChatButton onClick={() => setChatOpen(true)} />}
    </div>
  );
}
