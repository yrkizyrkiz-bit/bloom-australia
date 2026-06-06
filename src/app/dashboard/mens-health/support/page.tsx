"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft, MessageCircle, Phone, Mail, Clock,
  ChevronRight, ChevronDown, HelpCircle, Shield,
  FileText, Send, CheckCircle2, Loader2, Sparkles
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { LiveChat, ChatButton } from "@/components/chat/LiveChat";

const faqs = [
  {
    category: "Hair Loss",
    questions: [
      {
        q: "How long until I see results from hair treatment?",
        a: "Most patients begin to see initial results around 3-6 months, with more noticeable improvement at 6-12 months. Hair growth is gradual, so consistency is key.",
      },
      {
        q: "Is temporary shedding normal?",
        a: "Yes, some patients experience temporary shedding in the first 2-4 weeks. This is actually a positive sign that the treatment is working, as weak hairs make room for stronger ones.",
      },
      {
        q: "Can I stop treatment once I see results?",
        a: "Hair loss treatments work by maintaining an environment that supports hair growth. If you stop treatment, hair loss may resume over time.",
      },
    ],
  },
  {
    category: "ED Treatment",
    questions: [
      {
        q: "How quickly do ED medications work?",
        a: "Sildenafil typically works within 30-60 minutes on an empty stomach. Tadalafil may take 1-2 hours but offers longer duration of effectiveness.",
      },
      {
        q: "Can I take ED medication with alcohol?",
        a: "Moderate alcohol consumption is generally acceptable, but excessive alcohol can reduce effectiveness and increase side effects. Always consult your doctor.",
      },
      {
        q: "Are there any food interactions?",
        a: "High-fat meals can delay the absorption of sildenafil. Tadalafil is less affected by food. Take as directed by your healthcare provider.",
      },
    ],
  },
  {
    category: "Vitality",
    questions: [
      {
        q: "What supplements support testosterone?",
        a: "Vitamin D, Zinc, Magnesium, and Ashwagandha have evidence supporting their role in maintaining healthy testosterone levels. Always consult before starting supplements.",
      },
      {
        q: "How does sleep affect my energy levels?",
        a: "Quality sleep is crucial for hormone regulation, energy, and recovery. Aim for 7-9 hours per night and maintain consistent sleep-wake times.",
      },
    ],
  },
];

export default function SupportPage() {
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
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
    // Simulate sending
    await new Promise(resolve => setTimeout(resolve, 1500));
    setSending(false);
    toast.success("Message sent! We'll respond within 24 hours.");
    setMessage("");
    setSubject("");
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/mens-health">
          <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-teal-600" />
            My Care Team
          </h1>
          <p className="text-muted-foreground">We&apos;re here to help</p>
        </div>
      </div>

      {/* Live Chat CTA */}
      <Card className="bg-gradient-to-r from-teal-600 to-cyan-600 border-0 text-white overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
                <MessageCircle className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Chat with a Health Coach</h3>
                <p className="text-teal-100">Get instant support from our care team or AI assistant</p>
              </div>
            </div>
            <Button
              onClick={() => setChatOpen(true)}
              className="bg-white text-teal-700 hover:bg-teal-50"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Start Chat
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Contact Options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card
          className="border-slate-200 dark:border-slate-800 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => setChatOpen(true)}
        >
          <CardContent className="p-4 text-center">
            <div className="w-12 h-12 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center mx-auto mb-3">
              <MessageCircle className="w-6 h-6 text-teal-600" />
            </div>
            <p className="font-semibold">Live Chat</p>
            <p className="text-xs text-muted-foreground mb-3">Chat with our team</p>
            <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
              <span className="w-2 h-2 rounded-full bg-green-500 mr-1 animate-pulse" />
              Online Now
            </Badge>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-4 text-center">
            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-3">
              <Phone className="w-6 h-6 text-blue-600" />
            </div>
            <p className="font-semibold">Phone</p>
            <p className="text-xs text-muted-foreground mb-3">Speak with us directly</p>
            <p className="text-sm font-medium text-blue-600">1300 XXX XXX</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-4 text-center">
            <div className="w-12 h-12 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center mx-auto mb-3">
              <Mail className="w-6 h-6 text-violet-600" />
            </div>
            <p className="font-semibold">Email</p>
            <p className="text-xs text-muted-foreground mb-3">Response within 24hrs</p>
            <p className="text-sm font-medium text-violet-600">support@sanative.com.au</p>
          </CardContent>
        </Card>
      </div>

      {/* Response Time */}
      <Card className="bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-950/20 dark:to-cyan-950/20 border-teal-200 dark:border-teal-900">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900/50 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <p className="font-medium text-teal-900 dark:text-teal-100">Average Response Time</p>
            <p className="text-sm text-teal-700 dark:text-teal-300">Healthcare queries: under 4 hours • General: under 24 hours</p>
          </div>
        </CardContent>
      </Card>

      {/* Send Message */}
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

      {/* FAQs */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="w-5 h-5 text-teal-600" />
            Frequently Asked Questions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {faqs.map((category, catIndex) => (
            <div key={catIndex}>
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                {category.category}
              </p>
              <div className="space-y-2">
                {category.questions.map((faq, faqIndex) => {
                  const faqId = `${catIndex}-${faqIndex}`;
                  const isExpanded = expandedFaq === faqId;

                  return (
                    <div
                      key={faqIndex}
                      className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden"
                    >
                      <button
                        onClick={() => setExpandedFaq(isExpanded ? null : faqId)}
                        className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                      >
                        <span className="font-medium text-sm">{faq.q}</span>
                        <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>
                      {isExpanded && (
                        <div className="px-4 pb-4 pt-0 text-sm text-muted-foreground border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                          <p className="pt-3">{faq.a}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Emergency Notice */}
      <Card className="bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900">
        <CardContent className="p-4">
          <p className="font-semibold text-red-800 dark:text-red-200 text-sm mb-1">Medical Emergency?</p>
          <p className="text-sm text-red-700 dark:text-red-300">
            If you&apos;re experiencing a medical emergency, please call 000 immediately or go to your nearest emergency department.
          </p>
        </CardContent>
      </Card>

      {/* Live Chat */}
      <LiveChat
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
      />

      {/* Floating Chat Button (when chat is closed) */}
      {!chatOpen && (
        <ChatButton onClick={() => setChatOpen(true)} />
      )}
    </div>
  );
}
