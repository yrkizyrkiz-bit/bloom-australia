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
import { MEMBER_HEALTH_OVERVIEW } from "@/lib/portal/member-home";
import {
  CareSupportThreadList,
  careSupportThreadsEqual,
  type CareSupportThread,
} from "@/components/care-support/CareSupportThreadList";

export default function DashboardCareTeamPage() {
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
      const next = data.threads || [];
      setThreads((prev) => (careSupportThreadsEqual(prev, next) ? prev : next));
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
      <div className="flex items-center gap-4">
        <Link href={MEMBER_HEALTH_OVERVIEW}>
          <Button variant="ghost" size="icon" aria-label="Back to dashboard">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">My Care Team</h1>
          <p className="text-muted-foreground">Get help with your Sanative membership</p>
        </div>
      </div>

      <Card className="overflow-hidden border-0 bg-gradient-to-r from-[#4a6243] to-[#5c7a52] text-white">
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white">
                <GeorgeMascot size="md" cropFace />
              </div>
              <div>
                <h3 className="text-xl font-bold">Chat with {GEORGE_NAME}</h3>
                <p className="text-white/80">
                  Your care companion — plus Sanative support when you need a human
                </p>
              </div>
            </div>
            <Button
              onClick={() => setChatOpen(true)}
              className="bg-white text-[#2c3628] hover:bg-[#f8f4ec]"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Live Chat
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-[#cdd8c6] bg-gradient-to-br from-[#f8f4ec] to-[#e6ebe3]">
        <CardContent className="space-y-4 p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0D9488] text-white">
              <Send className="h-4 w-4" strokeWidth={2.25} />
            </span>
            <p className="font-serif text-lg font-semibold text-[#2c3628]">
              or Send us a Message
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[#2c3628]">Subject</label>
            <Input
              placeholder="What can we help with?"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="border-[#cdd8c6] bg-white/80"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-[#2c3628]">Message</label>
            <Textarea
              placeholder="Describe your question or concern..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="border-[#cdd8c6] bg-white/80"
            />
          </div>
          <Button
            onClick={handleSubmit}
            disabled={sending}
            className="w-full bg-[#4a6243] text-white hover:bg-[#3d4f38]"
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
          <div className="flex items-center gap-2 text-xs text-[#5c7a52]">
            <Shield className="h-4 w-4" />
            <span>Your message is encrypted and confidential</span>
          </div>
        </CardContent>
      </Card>

      <Card className="border-[#cdd8c6]">
        <CardContent className="space-y-4 p-5">
          <CareSupportThreadList
            threads={threads}
            loading={loadingThreads}
            theme="sage"
            onRefresh={loadThreads}
          />
        </CardContent>
      </Card>

      <LiveChat isOpen={chatOpen} onClose={() => setChatOpen(false)} />
      {!chatOpen && <ChatButton onClick={() => setChatOpen(true)} />}
    </div>
  );
}
