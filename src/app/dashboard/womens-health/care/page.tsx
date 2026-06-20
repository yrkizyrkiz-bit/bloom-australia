"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bot, ChevronRight, HeartHandshake, MessageCircle, Shield, Sparkles, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LiveChat } from "@/components/chat/LiveChat";

const supportTopics = [
  "Hormone symptoms and biomarker context",
  "Menopause, perimenopause or HRT questions",
  "PCOS, cycle or metabolic concerns",
  "Fertility planning and reproductive health",
  "Treatment side effects or prescription questions",
  "When to book a doctor follow-up",
];

export default function WomensHealthCarePage() {
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link href="/dashboard/womens-health">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <HeartHandshake className="w-6 h-6 text-rose-600" />
            Care Team
          </h1>
          <p className="text-muted-foreground">Talk to the AI assistant or message your care team.</p>
        </div>
      </div>

      <Card className="overflow-hidden border-0 bg-gradient-to-br from-rose-600 via-pink-600 to-purple-700 text-white">
        <CardContent className="p-6">
          <Badge className="bg-white/20 text-white border-white/20 mb-4">Women&apos;s Health support</Badge>
          <h2 className="text-2xl font-serif mb-3">Ask a question or get care-team help</h2>
          <p className="text-white/85 max-w-2xl">
            Use the AI assistant for quick navigation and general guidance, or send a message
            to your care team for account, treatment, prescription and follow-up support.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Button className="bg-white text-rose-700 hover:bg-white/90" onClick={() => setChatOpen(true)}>
              <Bot className="w-4 h-4 mr-2" />
              Talk to AI assistant
            </Button>
            <Button asChild variant="outline" className="border-white/40 text-white hover:bg-white/10">
              <Link href="/dashboard/messages">
                <MessageCircle className="w-4 h-4 mr-2" />
                Message care team
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-rose-600" />
              AI assistant
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Best for quick questions, finding the right portal area, understanding reports,
              and preparing questions for your clinician.
            </p>
            <Button className="w-full bg-rose-600 hover:bg-rose-700" onClick={() => setChatOpen(true)}>
              Start chat
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-purple-600" />
              Care team messages
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Best for treatment updates, prescription questions, follow-ups, admin support
              and anything that needs to stay on your member record.
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard/messages">
                Open messages <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-amber-600" />
              Safety guidance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              For chest pain, severe bleeding, fainting, signs of stroke, severe allergic
              reaction or urgent symptoms, call 000 or seek emergency care.
            </p>
            <p>
              The AI assistant cannot diagnose, prescribe or change medication doses.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Common reasons to contact us</CardTitle>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {supportTopics.map((topic) => (
            <div key={topic} className="rounded-xl border border-rose-100 bg-rose-50/50 p-3 text-sm">
              {topic}
            </div>
          ))}
        </CardContent>
      </Card>

      <LiveChat isOpen={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  );
}
