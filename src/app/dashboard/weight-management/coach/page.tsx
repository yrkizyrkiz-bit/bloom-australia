"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, MessageCircle, Send, Heart, Sparkles, Clock, User, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface Message {
  id: string;
  content: string;
  isFromCoach: boolean;
  timestamp: Date;
  type: "text" | "encouragement" | "tip";
}

// Sample messages for demo
const SAMPLE_MESSAGES: Message[] = [
  {
    id: "1",
    content: "Welcome to your weight management journey! I'm here to support you every step of the way. How are you feeling about getting started?",
    isFromCoach: true,
    timestamp: new Date(Date.now() - 86400000 * 2),
    type: "text",
  },
  {
    id: "2",
    content: "I'm feeling motivated but a bit nervous about sticking to the plan.",
    isFromCoach: false,
    timestamp: new Date(Date.now() - 86400000 * 2 + 3600000),
    type: "text",
  },
  {
    id: "3",
    content: "That's completely normal! Starting any new health journey can bring up mixed emotions. Remember, we're here to support you, and there's no pressure to be perfect. Small, consistent steps lead to big changes over time. What's one small goal you'd like to focus on this week?",
    isFromCoach: true,
    timestamp: new Date(Date.now() - 86400000),
    type: "text",
  },
];

const QUICK_TIPS = [
  "Start each day with a glass of water before breakfast",
  "Try adding an extra portion of vegetables to one meal today",
  "Take a 10-minute walk after lunch if you can",
  "Get 7-8 hours of sleep to support your metabolism",
];

export default function CoachPage() {
  const [messages, setMessages] = useState<Message[]>(SAMPLE_MESSAGES);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!newMessage.trim()) return;

    setSending(true);
    const userMessage: Message = {
      id: Date.now().toString(),
      content: newMessage,
      isFromCoach: false,
      timestamp: new Date(),
      type: "text",
    };

    setMessages([...messages, userMessage]);
    setNewMessage("");

    // Simulate coach response
    setTimeout(() => {
      const coachResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: "Thank you for sharing that with me. I've noted your message and will review it. In the meantime, remember that every small step counts towards your goal. Is there anything specific you'd like guidance on?",
        isFromCoach: true,
        timestamp: new Date(),
        type: "text",
      };
      setMessages((prev) => [...prev, coachResponse]);
      setSending(false);
    }, 2000);
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/weight-management">
          <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Health Coach</h1>
          <p className="text-muted-foreground">Personalized support for your journey</p>
        </div>
      </div>

      {/* Coach Profile */}
      <Card className="bg-gradient-to-r from-pink-500 to-rose-500 text-white border-0">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16 border-2 border-white">
              <AvatarFallback className="bg-white/20 text-white text-xl">HC</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-bold">Your Health Coach</h2>
              <p className="text-white/80">Here to guide and support you</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge className="bg-white/20 text-white border-0">
                  <Clock className="w-3 h-3 mr-1" /> Responds within 24h
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Tips */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            Daily Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {QUICK_TIPS.map((tip, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
                <Heart className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <p className="text-sm">{tip}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Messages */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Messages
          </CardTitle>
          <CardDescription>Chat with your health coach</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-96 overflow-y-auto mb-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.isFromCoach ? "" : "flex-row-reverse"}`}
              >
                <Avatar className="w-8 h-8 shrink-0">
                  <AvatarFallback className={message.isFromCoach ? "bg-pink-100 text-pink-600" : "bg-primary/10 text-primary"}>
                    {message.isFromCoach ? "HC" : <User className="w-4 h-4" />}
                  </AvatarFallback>
                </Avatar>
                <div className={`max-w-[80%] ${message.isFromCoach ? "" : "text-right"}`}>
                  <div
                    className={`p-3 rounded-2xl ${
                      message.isFromCoach
                        ? "bg-muted rounded-tl-none"
                        : "bg-primary text-primary-foreground rounded-tr-none"
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {message.timestamp.toLocaleDateString()} at {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-pink-100 text-pink-600">HC</AvatarFallback>
                </Avatar>
                <div className="bg-muted rounded-2xl rounded-tl-none p-3">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
              </div>
            )}
          </div>

          {/* Message Input */}
          <div className="flex gap-2">
            <Textarea
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="resize-none"
              rows={2}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <Button onClick={handleSend} disabled={!newMessage.trim() || sending} className="shrink-0">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* FAQ */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Common Questions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              "How often should I weigh myself?",
              "What if I miss a day of logging?",
              "How do I handle cravings?",
              "When will I see results?",
            ].map((question, index) => (
              <Button key={index} variant="outline" className="w-full justify-start text-left h-auto py-3">
                {question}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
