"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  ArrowLeft,
  HelpCircle,
  MessageSquare,
  MessageCircle,
  Loader2,
  Send,
  Sparkles,
  Shield,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { LiveChat, ChatButton } from "@/components/chat/LiveChat";
import { GeorgeMascot } from "@/components/george/GeorgeMascot";
import { GEORGE_NAME } from "@/lib/george";
import {
  CareSupportThreadList,
  type CareSupportThread,
} from "@/components/care-support/CareSupportThreadList";

const FAQ_ITEMS = [
  {
    question: "How do I track my weight?",
    answer:
      "Go to the Weight Tracking section from the main menu. You can manually enter your weight or connect a smart scale for automatic tracking. We recommend weighing yourself at the same time each day for consistent results.",
  },
  {
    question: "How often should I take my medication?",
    answer:
      "Your medication schedule is set by your healthcare provider. Check the Treatment section to see your dosing schedule. If you have questions about your medication, please contact your doctor or pharmacist.",
  },
  {
    question: "What should I do if I miss a dose?",
    answer:
      "If you miss a scheduled dose, take it as soon as you remember if it's within 48 hours. If it's been longer, skip the missed dose and continue with your regular schedule. Contact your healthcare provider if you're unsure.",
  },
  {
    question: "How do I log my meals?",
    answer:
      "Use the Meal Diary in the Weight Management section. You can search our food database with over 100 foods, or add custom meals. Track your calories and macronutrients to stay on target.",
  },
  {
    question: "Can I change my weight unit preference?",
    answer:
      "Yes! Go to your Account settings and look for the Units section. You can switch between kilograms (kg) and pounds (lbs) at any time.",
  },
  {
    question: "How do weekly check-ins work?",
    answer:
      "Weekly check-ins help you reflect on your progress. You'll rate your energy, sleep, and stress levels, and set goals for the upcoming week. Consistent check-ins help build healthy habits.",
  },
];

export default function SupportPage() {
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
      <div className="flex items-center gap-4">
        <Link href="/dashboard/weight-management">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">My Care Team</h1>
          <p className="text-muted-foreground">Get help with your weight management journey</p>
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
              Start Chat
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Link href="/dashboard/messages">
          <Card className="h-full cursor-pointer border-pink-200 bg-gradient-to-br from-pink-50 to-rose-50 transition-shadow hover:shadow-md dark:from-pink-950/20 dark:to-rose-950/20">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-pink-500">
                <MessageCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="font-semibold">Message your care partner</p>
                <p className="text-sm text-pink-700">
                  Ongoing conversation with your assigned coordinator
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Card
          className="h-full cursor-pointer border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 transition-shadow hover:shadow-md dark:from-blue-950/20 dark:to-indigo-950/20"
          onClick={() => setChatOpen(true)}
        >
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500">
              <MessageSquare className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="font-semibold">Live Chat</p>
              <p className="text-sm text-blue-600">Quick questions via the care team</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden border-[#cdd8c6] bg-gradient-to-br from-[#f8f4ec] to-[#e6ebe3]">
        <CardContent className="space-y-4 p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0D9488] text-white">
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

      <Card className="border-[#cdd8c6]">
        <CardContent className="space-y-4 p-5">
          <CareSupportThreadList
            threads={threads}
            loading={loadingThreads}
            theme="sage"
            onRefresh={async () => {
              setLoadingThreads(true);
              await loadThreads();
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Frequently Asked Questions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {FAQ_ITEMS.map((item, index) => (
              <AccordionItem key={item.question} value={`item-${index}`}>
                <AccordionTrigger className="text-left">{item.question}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{item.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      <LiveChat isOpen={chatOpen} onClose={() => setChatOpen(false)} />

      {!chatOpen && <ChatButton onClick={() => setChatOpen(true)} />}
    </div>
  );
}
