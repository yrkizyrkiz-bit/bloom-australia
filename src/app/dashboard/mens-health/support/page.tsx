"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  MessageSquare,
  MessageCircle,
  Phone,
  Mail,
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

export default function SupportPage() {
  const [message, setMessage] = useState("");
  const [subject, setSubject] = useState("");
  const [sending, setSending] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

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
      <div className="flex items-center gap-4">
        <Link href="/dashboard/mens-health">
          <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">My Care Team</h1>
          <p className="text-muted-foreground">Get help with your hair health journey</p>
        </div>
      </div>

      <Card className="bg-gradient-to-r from-[#4a6243] to-[#5c7a52] border-0 text-white overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center overflow-hidden shrink-0">
                <GeorgeMascot size="md" cropFace />
              </div>
              <div>
                <h3 className="text-xl font-bold">Chat with {GEORGE_NAME}</h3>
                <p className="text-white/80">Your care companion — plus Sanative support when you need a human</p>
              </div>
            </div>
            <Button
              onClick={() => setChatOpen(true)}
              className="bg-white text-[#2c3628] hover:bg-[#f8f4ec]"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Start Chat
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/dashboard/messages">
          <Card className="h-full bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-950/20 dark:to-rose-950/20 border-pink-200 hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 bg-pink-500 rounded-xl flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-semibold">Message your care partner</p>
                <p className="text-sm text-pink-700">Ongoing conversation with your assigned coordinator</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Card
          className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 cursor-pointer hover:shadow-md transition-shadow h-full"
          onClick={() => setChatOpen(true)}
        >
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-semibold">Live Chat</p>
              <p className="text-sm text-blue-600">Quick questions via the care team</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
              <Phone className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="font-semibold">Phone Support</p>
              <p className="text-sm text-muted-foreground">1800 123 456</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <Mail className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="font-semibold">Email</p>
              <p className="text-sm text-muted-foreground">support@sanative.com.au</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Send className="w-5 h-5 text-teal-600" />
            Send a Message
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Subject</label>
            <Input
              placeholder="What can we help with?"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Message</label>
            <Textarea
              placeholder="Describe your question or concern..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
            />
          </div>
          <Button
            onClick={handleSubmit}
            disabled={sending}
            className="w-full bg-teal-600 hover:bg-teal-700"
          >
            {sending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send Message
              </>
            )}
          </Button>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Shield className="w-4 h-4" />
            <span>Your message is encrypted and confidential</span>
          </div>
        </CardContent>
      </Card>

      <LiveChat
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
      />

      {!chatOpen && (
        <ChatButton onClick={() => setChatOpen(true)} />
      )}
    </div>
  );
}
