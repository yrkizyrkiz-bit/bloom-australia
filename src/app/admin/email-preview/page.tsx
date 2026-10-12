"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, Send, Eye, Code, RefreshCw } from "lucide-react";

// Email template types
const EMAIL_TEMPLATES = [
  { id: "order_confirmation", name: "Order Confirmation", category: "Transaction" },
  { id: "order_confirmation_discount", name: "Order Confirmation (with Discount)", category: "Transaction" },
  { id: "patient_welcome", name: "Patient Welcome", category: "Onboarding" },
  { id: "clinic_welcome", name: "Clinic Welcome", category: "Onboarding" },
  { id: "results_ready", name: "Results Ready", category: "Notification" },
  { id: "check_in_reminder", name: "Check-in Reminder", category: "Reminder" },
  { id: "gp_visit_reminder", name: "GP Visit Reminder", category: "Reminder" },
  { id: "gp_enrolment", name: "GP Enrolment Notification", category: "Notification" },
  { id: "gp_biomarker_alert", name: "GP Biomarker Alert", category: "Alert" },
];

// Sample data for each template
const SAMPLE_DATA: Record<string, Record<string, string>> = {
  order_confirmation: {
    firstName: "Sarah",
    program: "Weight Management",
    orderDate: new Date().toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" }),
    originalAmount: "49.00",
    discountAmount: "0",
    finalAmount: "49.00",
  },
  order_confirmation_discount: {
    firstName: "Michael",
    program: "Weight Management",
    orderDate: new Date().toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" }),
    originalAmount: "49.00",
    discountAmount: "50.00",
    discountType: "new_member_promotion",
    finalAmount: "0.00",
  },
  patient_welcome: {
    firstName: "Emma",
    lastName: "Thompson",
    program: "Weight Management",
    carePartnerName: "Mia",
  },
  clinic_welcome: {
    clinicName: "Greenwood Medical Centre",
    gpName: "Dr. James Wilson",
    qrToken: "GRN12345AB",
  },
  results_ready: {
    firstName: "David",
    program: "Weight Management",
    carePartnerName: "Sarah",
  },
  check_in_reminder: {
    firstName: "Lisa",
    carePartnerName: "Mia",
    checkInType: "Weekly Progress Check",
    scheduledDate: "Monday, 26 May 2025",
  },
  gp_visit_reminder: {
    firstName: "John",
    clinicName: "Sunrise Medical",
    gpName: "Dr. Sarah Chen",
    visitDate: "28 May 2025",
    visitTime: "10:30 AM",
  },
  gp_enrolment: {
    gpName: "Dr. Phillips",
    clinicName: "City Health Clinic",
    patientName: "Rebecca Miller",
    program: "Weight Management",
    enrolledAt: new Date().toLocaleDateString("en-AU"),
  },
  gp_biomarker_alert: {
    gpName: "Dr. Johnson",
    clinicName: "Metro Medical",
    patientName: "Robert Smith",
    biomarkerName: "HbA1c",
    value: "7.2",
    unit: "%",
    status: "HIGH",
  },
};

type MemberEmailDraft = {
  to: string;
  subject: string;
  body: string;
};

function escapeEmailText(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function basicEmailPreviewHtml(body: string) {
  const paragraphs = escapeEmailText(body)
    .split("\n")
    .map((line) => `<p style="margin:0 0 12px;line-height:1.5;">${line || "&nbsp;"}</p>`)
    .join("");
  return `<!DOCTYPE html><html><body style="margin:0;padding:24px;font-family:Georgia,'Times New Roman',serif;color:#2c3628;">${paragraphs}</body></html>`;
}

export default function EmailPreviewPage() {
  const [selectedTemplate, setSelectedTemplate] = useState("order_confirmation_discount");
  const [sampleData, setSampleData] = useState<Record<string, string>>(
    SAMPLE_DATA.order_confirmation_discount
  );
  const [emailHtml, setEmailHtml] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [memberDraft, setMemberDraft] = useState<MemberEmailDraft | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const to = params.get("to")?.trim() || "";
    if (to) {
      const firstName = params.get("firstName")?.trim() || "";
      const lastName = params.get("lastName")?.trim() || "";
      setTestEmail(to);
      setMemberDraft({
        to,
        subject: "",
        body: firstName ? `Hi ${firstName},\n\n` : "",
      });
      setSampleData((current) => ({
        ...current,
        ...(firstName ? { firstName } : {}),
        ...(lastName ? { lastName } : {}),
        ...((firstName || lastName)
          ? { patientName: [firstName, lastName].filter(Boolean).join(" ") }
          : {}),
      }));
    }
  }, []);

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    const next = { ...(SAMPLE_DATA[templateId] || {}) };
    const params = new URLSearchParams(window.location.search);
    const firstName = params.get("firstName")?.trim() || "";
    const lastName = params.get("lastName")?.trim() || "";
    if (firstName && "firstName" in next) next.firstName = firstName;
    if (lastName && "lastName" in next) next.lastName = lastName;
    if ((firstName || lastName) && "patientName" in next) {
      next.patientName = [firstName, lastName].filter(Boolean).join(" ");
    }
    setSampleData(next);
    setEmailHtml("");
  };

  const handleDataChange = (key: string, value: string) => {
    setSampleData((prev) => ({ ...prev, [key]: value }));
  };

  const generatePreview = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/email-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: selectedTemplate,
          data: sampleData,
        }),
      });

      const result = await response.json();
      if (result.html) {
        setEmailHtml(result.html);
        toast.success("Preview generated!");
      } else {
        toast.error(result.error || "Failed to generate preview");
      }
    } catch (error) {
      console.error("Preview error:", error);
      toast.error("Failed to generate preview");
    } finally {
      setIsLoading(false);
    }
  };

  const sendTestEmail = async () => {
    if (!testEmail.trim()) {
      toast.error("Enter an email address");
      return;
    }

    setIsSending(true);
    try {
      const response = await fetch("/api/admin/email-preview/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: testEmail.trim(),
          templateId: selectedTemplate,
          data: sampleData,
        }),
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.success) {
        toast.error(result.error || "Failed to send email");
        return;
      }
      toast.success(`Sent "${result.subject || "template"}" to ${testEmail.trim()}`);
    } catch (error) {
      console.error("Send error:", error);
      toast.error("Failed to send email");
    } finally {
      setIsSending(false);
    }
  };

  const sendMemberEmail = async () => {
    if (!memberDraft?.to.trim()) {
      toast.error("Enter the member's email address");
      return;
    }
    if (!memberDraft.subject.trim() || !memberDraft.body.trim()) {
      toast.error("Add a subject and a message");
      return;
    }

    setIsSending(true);
    try {
      const response = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: memberDraft.to.trim(),
          subject: memberDraft.subject.trim(),
          body: memberDraft.body,
          trackOpens: false,
          trackClicks: false,
        }),
      });
      const result = await response.json().catch(() => ({}));
      const sent = result?.summary?.sent ?? 0;
      if (!response.ok || sent < 1) {
        toast.error(result?.results?.[0]?.error || result?.error || "Failed to send email");
        return;
      }
      toast.success(`Email sent to ${memberDraft.to.trim()}`);
    } catch (error) {
      console.error("Send error:", error);
      toast.error("Failed to send email");
    } finally {
      setIsSending(false);
    }
  };

  const templateInfo = EMAIL_TEMPLATES.find((t) => t.id === selectedTemplate);

  if (memberDraft) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Mail className="w-6 h-6" />
            Email Preview
          </h1>
          <p className="text-muted-foreground mt-1">
            Write to this member, or edit the message before you send it.
          </p>
        </div>

        <div className="grid lg:grid-cols-[400px_1fr] gap-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Message</CardTitle>
              <CardDescription>The member is already filled in. Change any of it.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="member-to">To</Label>
                <Input
                  id="member-to"
                  type="email"
                  value={memberDraft.to}
                  onChange={(e) => setMemberDraft({ ...memberDraft, to: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="member-subject">Subject</Label>
                <Input
                  id="member-subject"
                  value={memberDraft.subject}
                  onChange={(e) => setMemberDraft({ ...memberDraft, subject: e.target.value })}
                  placeholder="Subject"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="member-body">Message</Label>
                <Textarea
                  id="member-body"
                  value={memberDraft.body}
                  onChange={(e) => setMemberDraft({ ...memberDraft, body: e.target.value })}
                  rows={12}
                  placeholder="Type the email"
                />
              </div>
              <Button onClick={sendMemberEmail} disabled={isSending} className="w-full">
                {isSending ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send email
                  </>
                )}
              </Button>
              <Button variant="ghost" className="w-full" onClick={() => setMemberDraft(null)}>
                Use a template instead
              </Button>
            </CardContent>
          </Card>

          <Card className="h-fit">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Preview</CardTitle>
              <CardDescription>
                {memberDraft.subject.trim() || "No subject yet"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden bg-white">
                <iframe
                  srcDoc={basicEmailPreviewHtml(memberDraft.body)}
                  className="w-full h-[700px]"
                  title="Email Preview"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Mail className="w-6 h-6" />
            Email Preview
          </h1>
          <p className="text-muted-foreground mt-1">
            Preview and test email templates before sending
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[400px_1fr] gap-6">
        {/* Left Panel - Configuration */}
        <div className="space-y-6">
          {/* Template Selector */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Template</CardTitle>
              <CardDescription>Select an email template to preview</CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent>
                  {EMAIL_TEMPLATES.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      <div className="flex items-center gap-2">
                        <span>{template.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({template.category})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {templateInfo && (
                <div className="mt-3 p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium">{templateInfo.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Category: {templateInfo.category}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sample Data Editor */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Sample Data</CardTitle>
              <CardDescription>Edit the template variables</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(sampleData).map(([key, value]) => (
                <div key={key} className="space-y-1.5">
                  <Label htmlFor={key} className="text-xs font-medium capitalize">
                    {key.replace(/([A-Z])/g, " $1").trim()}
                  </Label>
                  <Input
                    id={key}
                    value={value}
                    onChange={(e) => handleDataChange(key, e.target.value)}
                    className="h-9"
                  />
                </div>
              ))}

              <Button
                onClick={generatePreview}
                disabled={isLoading}
                className="w-full mt-4"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4 mr-2" />
                    Generate Preview
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Send Test Email */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Send template</CardTitle>
              <CardDescription>Send this template to the address below</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="testEmail" className="text-xs font-medium">
                  Email Address
                </Label>
                <Input
                  id="testEmail"
                  type="email"
                  placeholder="test@example.com"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  className="h-9"
                />
              </div>

              <Button
                onClick={sendTestEmail}
                disabled={isSending || !testEmail.trim()}
                variant="outline"
                className="w-full"
              >
                {isSending ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send template
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Preview */}
        <Card className="h-fit">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Preview</CardTitle>
            <CardDescription>
              {emailHtml
                ? "Email preview rendered below"
                : "Click 'Generate Preview' to see the email"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {emailHtml ? (
              <Tabs defaultValue="preview" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="preview" className="gap-2">
                    <Eye className="w-4 h-4" />
                    Preview
                  </TabsTrigger>
                  <TabsTrigger value="html" className="gap-2">
                    <Code className="w-4 h-4" />
                    HTML Source
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="preview">
                  <div className="border rounded-lg overflow-hidden bg-white">
                    <iframe
                      srcDoc={emailHtml}
                      className="w-full h-[700px]"
                      title="Email Preview"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="html">
                  <div className="border rounded-lg overflow-hidden">
                    <pre className="p-4 bg-slate-950 text-slate-50 text-xs overflow-auto h-[700px]">
                      <code>{emailHtml}</code>
                    </pre>
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="border-2 border-dashed rounded-lg h-[500px] flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <Mail className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p className="font-medium">No preview yet</p>
                  <p className="text-sm mt-1">
                    Select a template and click Generate Preview
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
