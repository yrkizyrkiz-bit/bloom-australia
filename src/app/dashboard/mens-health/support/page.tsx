"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  MessageSquare,
  MessageCircle,
  Send,
  Shield,
  Loader2,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { LiveChat, ChatButton } from "@/components/chat/LiveChat";
import { GeorgeMascot } from "@/components/george/GeorgeMascot";
import { GEORGE_NAME } from "@/lib/george";
import { usePortalContext } from "@/hooks/usePortalContext";
import { isProgramEntitled } from "@/lib/membership/program-access";
import {
  mensHealthShellFromPathname,
  mensHealthShellHome,
  mensHealthShellLabel,
  readStoredMensHealthShell,
  resolveMensHealthShell,
  writeStoredMensHealthShell,
  type MensHealthShell,
} from "@/lib/portal/mens-health-shell";

/** WM sage + daily-ring accents (matches hair restoration hub). */
const RING = {
  orange: "#F97316",
  teal: "#0D9488",
  emerald: "#059669",
  coral: "#F87171",
} as const;

export default function SupportPage() {
  const pathname = usePathname() || "";
  const { data: portal } = usePortalContext();
  const [storedShell, setStoredShell] = useState<MensHealthShell | null>(() =>
    readStoredMensHealthShell()
  );
  const [message, setMessage] = useState("");
  const [subject, setSubject] = useState("");
  const [sending, setSending] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    const fromPath = mensHealthShellFromPathname(pathname);
    if (fromPath) {
      writeStoredMensHealthShell(fromPath);
      setStoredShell(fromPath);
      return;
    }
    setStoredShell(readStoredMensHealthShell());
  }, [pathname]);

  const shell = resolveMensHealthShell({
    pathname,
    hasSexual: isProgramEntitled(portal?.membership, "MENS_HEALTH_SEXUAL"),
    hasHair: isProgramEntitled(portal?.membership, "HAIR_LOSS"),
    stored: storedShell,
  });
  const homeHref = mensHealthShellHome(shell);
  const programLabel = mensHealthShellLabel(shell);
  const journeyCopy =
    shell === "sexual"
      ? "Get help with your sexual health journey"
      : "Get help with your hair health journey";

  const handleSubmit = async () => {
    if (!message.trim() || !subject.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    setSending(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setSending(false);
    toast.success("Message sent! We'll respond within 24 hours.");
    setMessage("");
    setSubject("");
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#4a6243] via-[#3d4f38] to-[#34412f] p-6 text-white">
        <div className="absolute top-0 right-0 h-40 w-40 -translate-y-1/2 translate-x-1/3 rounded-full bg-white/5" />
        <div className="absolute bottom-0 left-0 h-32 w-32 translate-y-1/2 -translate-x-1/3 rounded-full bg-white/5" />
        <div
          className="pointer-events-none absolute top-6 right-10 h-16 w-16 rounded-full opacity-30 blur-xl"
          style={{ backgroundColor: RING.orange }}
        />
        <div
          className="pointer-events-none absolute bottom-8 right-24 h-12 w-12 rounded-full opacity-25 blur-lg"
          style={{ backgroundColor: RING.teal }}
        />

        <div className="relative z-10">
          <Link
            href={homeHref}
            className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
            aria-label={`Back to ${programLabel}`}
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <p className="mb-1 text-sm text-[#cdd8c6]">{programLabel}</p>
          <h1 className="mb-1 font-serif text-2xl font-semibold md:text-3xl">My Care Team</h1>
          <p className="text-sm text-[#a8bb9e]">{journeyCopy}</p>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#4a6243] to-[#3d4f38] p-5 text-white">
        <div className="pointer-events-none absolute top-1 right-1 h-10 w-10 rounded-full bg-white/10 blur-md" />
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white">
              <GeorgeMascot size="md" cropFace />
            </div>
            <div className="min-w-0">
              <h3 className="font-serif text-xl font-semibold">Chat with {GEORGE_NAME}</h3>
              <p className="text-sm text-[#cdd8c6]">
                Your care companion — plus Sanative support when you need a human
              </p>
            </div>
          </div>
          <Button
            onClick={() => setChatOpen(true)}
            className="shrink-0 bg-white text-[#2c3628] hover:bg-[#f8f4ec]"
          >
            <Sparkles className="mr-2 h-4 w-4" style={{ color: RING.coral }} />
            Start Chat
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Link href="/dashboard/messages">
          <div className="group relative flex h-full min-h-[100px] flex-col overflow-hidden rounded-2xl bg-gradient-to-br from-[#f0e8d8] to-[#e5d7bf] p-4 transition-transform duration-300 md:hover:scale-[1.02]">
            <div className="relative z-10 mb-2 flex items-center justify-between gap-2">
              <p className="font-serif text-sm text-[#2c3628]">Message care partner</p>
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white"
                style={{ backgroundColor: RING.coral }}
              >
                <MessageCircle className="h-4 w-4" strokeWidth={2.25} />
              </span>
            </div>
            <p className="relative z-10 text-xs text-[#5c7a52]">
              Ongoing conversation with your assigned coordinator
            </p>
          </div>
        </Link>

        <button
          type="button"
          onClick={() => setChatOpen(true)}
          className="group relative flex h-full min-h-[100px] w-full flex-col overflow-hidden rounded-2xl bg-gradient-to-br from-[#e6ebe3] to-[#cdd8c6] p-4 text-left transition-transform duration-300 md:hover:scale-[1.02]"
        >
          <div className="relative z-10 mb-2 flex items-center justify-between gap-2">
            <p className="font-serif text-sm text-[#2c3628]">Live Chat</p>
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white"
              style={{ backgroundColor: RING.teal }}
            >
              <MessageSquare className="h-4 w-4" strokeWidth={2.25} />
            </span>
          </div>
          <p className="relative z-10 text-xs text-[#5c7a52]">Quick questions via the care team</p>
        </button>
      </div>

      <Card className="overflow-hidden border-[#cdd8c6] bg-gradient-to-br from-[#f8f4ec] to-[#e6ebe3]">
        <CardContent className="space-y-4 p-5">
          <div className="flex items-center gap-3">
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white"
              style={{ backgroundColor: RING.teal }}
            >
              <Send className="h-4 w-4" strokeWidth={2.25} />
            </span>
            <div>
              <p className="font-serif text-lg font-semibold text-[#2c3628]">Send a Message</p>
              <p className="text-xs text-[#5c7a52]">We usually respond within 24 hours</p>
            </div>
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

      <LiveChat isOpen={chatOpen} onClose={() => setChatOpen(false)} />

      {!chatOpen && <ChatButton onClick={() => setChatOpen(true)} />}
    </div>
  );
}
