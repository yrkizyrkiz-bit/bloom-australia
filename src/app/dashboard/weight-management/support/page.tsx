"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowLeft, HelpCircle, MessageSquare, Phone, Mail, Clock, CheckCircle2, Loader2, Send, ExternalLink, Sparkles } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { LiveChat, ChatButton } from "@/components/chat/LiveChat";

interface Ticket {
  id: string;
  subject: string;
  category: string;
  message: string;
  status: string;
  response: string | null;
  createdAt: string;
}

const FAQ_ITEMS = [
  {
    question: "How do I track my weight?",
    answer: "Go to the Weight Tracking section from the main menu. You can manually enter your weight or connect a smart scale for automatic tracking. We recommend weighing yourself at the same time each day for consistent results."
  },
  {
    question: "How often should I take my medication?",
    answer: "Your medication schedule is set by your healthcare provider. Check the Treatment section to see your dosing schedule. If you have questions about your medication, please contact your doctor or pharmacist."
  },
  {
    question: "What should I do if I miss a dose?",
    answer: "If you miss a scheduled dose, take it as soon as you remember if it's within 48 hours. If it's been longer, skip the missed dose and continue with your regular schedule. Contact your healthcare provider if you're unsure."
  },
  {
    question: "How do I log my meals?",
    answer: "Use the Meal Diary in the Weight Management section. You can search our food database with over 100 foods, or add custom meals. Track your calories and macronutrients to stay on target."
  },
  {
    question: "Can I change my weight unit preference?",
    answer: "Yes! Go to your Account settings and look for the Units section. You can switch between kilograms (kg) and pounds (lbs) at any time."
  },
  {
    question: "How do weekly check-ins work?",
    answer: "Weekly check-ins help you reflect on your progress. You'll rate your energy, sleep, and stress levels, and set goals for the upcoming week. Consistent check-ins help build healthy habits."
  },
];

const CATEGORIES = [
  { value: "MEDICATION", label: "Medication" },
  { value: "TRACKING", label: "Tracking & Progress" },
  { value: "TECHNICAL", label: "Technical Issues" },
  { value: "BILLING", label: "Billing & Account" },
  { value: "OTHER", label: "Other" },
];

export default function SupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const res = await fetch("/api/weight-management/support");
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets);
      }
    } catch (error) {
      console.error("Error fetching tickets:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !category || !message) {
      toast.error("Please fill in all fields");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/weight-management/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, category, message }),
      });

      if (res.ok) {
        toast.success("Support request submitted!");
        setSubject("");
        setCategory("");
        setMessage("");
        setShowForm(false);
        fetchTickets();
      }
    } catch (error) {
      toast.error("Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "OPEN": return <Badge variant="secondary">Open</Badge>;
      case "IN_PROGRESS": return <Badge className="bg-blue-500">In Progress</Badge>;
      case "RESOLVED": return <Badge className="bg-green-500">Resolved</Badge>;
      case "CLOSED": return <Badge variant="outline">Closed</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/weight-management">
          <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">My Care Team</h1>
          <p className="text-muted-foreground">Get help with your weight management journey</p>
        </div>
      </div>

      {/* Live Chat CTA */}
      <Card className="bg-gradient-to-r from-teal-600 to-emerald-600 border-0 text-white overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
                <MessageSquare className="w-7 h-7" />
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

      {/* Quick Contact */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card
          className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setChatOpen(true)}
        >
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-semibold">Live Chat</p>
              <p className="text-sm text-blue-600">Chat now with our team</p>
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

      {/* FAQ Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5" />
            Frequently Asked Questions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {FAQ_ITEMS.map((item, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">{item.question}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {/* Submit Ticket */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Need More Help?</CardTitle>
              <CardDescription>Submit a support request and we&apos;ll get back to you</CardDescription>
            </div>
            {!showForm && (
              <Button onClick={() => setShowForm(true)}>
                <Send className="w-4 h-4 mr-2" /> New Request
              </Button>
            )}
          </div>
        </CardHeader>
        {showForm && (
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Subject *</Label>
                  <Input placeholder="Brief description of your issue" value={subject} onChange={(e) => setSubject(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Category *</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Message *</Label>
                <Textarea placeholder="Describe your issue in detail..." value={message} onChange={(e) => setMessage(e.target.value)} rows={4} required />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Submit
                </Button>
                <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        )}
      </Card>

      {/* My Tickets */}
      {tickets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>My Support Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tickets.map((ticket) => (
                <div key={ticket.id} className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium">{ticket.subject}</p>
                      <p className="text-xs text-muted-foreground">{new Date(ticket.createdAt).toLocaleDateString()}</p>
                    </div>
                    {getStatusBadge(ticket.status)}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{ticket.message}</p>
                  {ticket.response && (
                    <div className="mt-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                      <p className="text-xs font-medium text-green-700 mb-1">Response:</p>
                      <p className="text-sm">{ticket.response}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
