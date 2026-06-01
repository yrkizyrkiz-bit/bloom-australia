"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { emailTemplates } from "@/data/crm-data";
import { toast } from "sonner";
import {
  Mail,
  Phone,
  Calendar,
  MessageSquare,
  Send,
  Plus,
  Edit,
  Clock,
  CheckCircle,
  Search,
  Copy,
  Loader2,
  Users,
  AlertCircle,
  RefreshCw,
  Check,
  X
} from "lucide-react";

interface Customer {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  subscriptionStatus: string;
  subscriptionTier: string | null;
}

interface ActivityLog {
  id: string;
  action: string;
  entity: string;
  userName: string;
  createdAt: string;
}

interface EmailStatus {
  configured: boolean;
  mode: string;
  fromEmail: string;
  fromName: string;
  message: string;
  setupInstructions?: {
    steps: string[];
    envExample: string;
  };
}

export default function CommunicationsPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [emailStatus, setEmailStatus] = useState<EmailStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showComposeDialog, setShowComposeDialog] = useState(false);
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [showSetupDialog, setShowSetupDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [emailTo, setEmailTo] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSending, setIsSending] = useState(false);

  // Bulk email state
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [bulkSubject, setBulkSubject] = useState("");
  const [bulkBody, setBulkBody] = useState("");
  const [bulkTemplate, setBulkTemplate] = useState("");
  const [bulkSearchQuery, setBulkSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Fetch customers and email status
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch email status
        const statusRes = await fetch("/api/email/status");
        if (statusRes.ok) {
          const data = await statusRes.json();
          setEmailStatus(data);
        }

        // Fetch customers
        const customersRes = await fetch("/api/users?role=MEMBER&limit=100");
        if (customersRes.ok) {
          const data = await customersRes.json();
          setCustomers(data.users || []);
        }

        // Fetch recent email activity from admin stats
        const statsRes = await fetch("/api/admin/stats");
        if (statsRes.ok) {
          const data = await statsRes.json();
          setActivityLogs(
            data.recentActivity
              ?.filter((a: ActivityLog) => a.action.includes("EMAIL"))
              .slice(0, 20) || []
          );
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filtered customers for bulk selection
  const filteredCustomersForBulk = useMemo(() => {
    return customers.filter(customer => {
      const matchesSearch = bulkSearchQuery === "" ||
        customer.firstName.toLowerCase().includes(bulkSearchQuery.toLowerCase()) ||
        customer.lastName.toLowerCase().includes(bulkSearchQuery.toLowerCase()) ||
        customer.email.toLowerCase().includes(bulkSearchQuery.toLowerCase());

      const matchesStatus = statusFilter === "all" ||
        customer.subscriptionStatus.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [customers, bulkSearchQuery, statusFilter]);

  const handleSendEmail = async () => {
    if (!emailTo || !emailSubject || !emailBody) {
      toast.error("Please fill in all fields");
      return;
    }

    const customer = customers.find(c => c.id === emailTo);
    if (!customer) {
      toast.error("Customer not found");
      return;
    }

    setIsSending(true);
    try {
      const response = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: customer.email,
          subject: emailSubject,
          body: emailBody,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send email");
      }

      toast.success(`Email sent to ${customer.firstName} ${customer.lastName}`, {
        description: data.mode === "simulation" ? "Simulated (no SendGrid key)" : "Delivered via SendGrid"
      });

      setShowComposeDialog(false);
      setEmailTo("");
      setEmailSubject("");
      setEmailBody("");
      setSelectedTemplate("");
    } catch (error) {
      console.error("Error sending email:", error);
      toast.error(error instanceof Error ? error.message : "Failed to send email");
    } finally {
      setIsSending(false);
    }
  };

  const handleSendBulkEmail = async () => {
    if (selectedCustomers.length === 0) {
      toast.error("Please select at least one customer");
      return;
    }
    if (!bulkSubject || !bulkBody) {
      toast.error("Please fill in subject and message");
      return;
    }

    const emails = selectedCustomers
      .map(id => customers.find(c => c.id === id)?.email)
      .filter(Boolean) as string[];

    setIsSending(true);
    try {
      const response = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: emails,
          subject: bulkSubject,
          body: bulkBody,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send emails");
      }

      toast.success(`Bulk email sent to ${data.summary.sent} recipients`, {
        description: data.summary.failed > 0
          ? `${data.summary.failed} failed`
          : data.mode === "simulation" ? "Simulated mode" : "Delivered"
      });

      setShowBulkDialog(false);
      setSelectedCustomers([]);
      setBulkSubject("");
      setBulkBody("");
      setBulkTemplate("");
    } catch (error) {
      console.error("Error sending bulk email:", error);
      toast.error(error instanceof Error ? error.message : "Failed to send bulk email");
    } finally {
      setIsSending(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedCustomers.length === filteredCustomersForBulk.length) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers(filteredCustomersForBulk.map(c => c.id));
    }
  };

  const handleToggleCustomer = (customerId: string) => {
    setSelectedCustomers(prev =>
      prev.includes(customerId)
        ? prev.filter(id => id !== customerId)
        : [...prev, customerId]
    );
  };

  const handleUseTemplate = (templateId: string, forBulk = false) => {
    const template = emailTemplates.find(t => t.id === templateId);
    if (template) {
      if (forBulk) {
        setBulkSubject(template.subject);
        setBulkBody(template.body);
        setBulkTemplate(templateId);
      } else {
        setEmailSubject(template.subject);
        setEmailBody(template.body);
        setSelectedTemplate(templateId);
      }
      toast.success(`Template "${template.name}" loaded`);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase();
    const styles: Record<string, string> = {
      active: "bg-green-500/10 text-green-600 border-green-500/30",
      inactive: "bg-gray-500/10 text-gray-600 border-gray-500/30",
      trial: "bg-blue-500/10 text-blue-600 border-blue-500/30",
      cancelled: "bg-red-500/10 text-red-600 border-red-500/30",
      expired: "bg-orange-500/10 text-orange-600 border-orange-500/30"
    };
    return styles[statusLower] || styles.inactive;
  };

  // Stats
  const stats = {
    totalCustomers: customers.length,
    activeCustomers: customers.filter(c => c.subscriptionStatus === "ACTIVE").length,
    emailsSent: activityLogs.filter(a => a.action.includes("EMAIL")).length,
    bulkEmails: activityLogs.filter(a => a.action.includes("BULK")).length
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading communications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Email Status Banner */}
      {emailStatus && !emailStatus.configured && (
        <Card className="border-yellow-500/30 bg-yellow-500/5">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="font-medium text-yellow-800">Email Simulation Mode</p>
                  <p className="text-sm text-yellow-700">
                    SendGrid not configured. Emails are simulated (logged to console).
                  </p>
                </div>
              </div>
              <Dialog open={showSetupDialog} onOpenChange={setShowSetupDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="border-yellow-500/50 text-yellow-700 hover:bg-yellow-500/10">
                    Setup SendGrid
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Setup SendGrid for Email Delivery</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <p className="text-sm text-muted-foreground">
                      Follow these steps to enable real email delivery:
                    </p>
                    <div className="space-y-3">
                      {emailStatus.setupInstructions?.steps.map((step, i) => (
                        <div key={i} className="flex gap-3 text-sm">
                          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-xs font-medium text-primary">
                            {i + 1}
                          </div>
                          <span>{step.replace(/^\d+\.\s*/, '')}</span>
                        </div>
                      ))}
                    </div>
                    <div className="p-3 rounded-lg bg-muted font-mono text-sm">
                      {emailStatus.setupInstructions?.envExample}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Add this to your <code className="bg-muted px-1 rounded">.env</code> file and restart the server.
                    </p>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      )}

      {emailStatus?.configured && (
        <Card className="border-green-500/30 bg-green-500/5">
          <CardContent className="py-3">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <span className="font-medium text-green-800">SendGrid Connected</span>
                <span className="text-sm text-green-700 ml-2">
                  Emails sent from: {emailStatus.fromName} ({emailStatus.fromEmail})
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif text-foreground">Communications</h1>
          <p className="text-muted-foreground mt-1">Send emails to customers individually or in bulk</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showComposeDialog} onOpenChange={setShowComposeDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Mail className="w-4 h-4" />
                Compose
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Compose Email</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Label>To</Label>
                    <Select value={emailTo} onValueChange={setEmailTo}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select customer..." />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map(c => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.firstName} {c.lastName} ({c.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Template</Label>
                    <Select value={selectedTemplate} onValueChange={(v) => handleUseTemplate(v, false)}>
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Use template..." />
                      </SelectTrigger>
                      <SelectContent>
                        {emailTemplates.map(t => (
                          <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Subject</Label>
                  <Input
                    value={emailSubject}
                    onChange={e => setEmailSubject(e.target.value)}
                    placeholder="Email subject..."
                  />
                </div>
                <div>
                  <Label>Message</Label>
                  <Textarea
                    value={emailBody}
                    onChange={e => setEmailBody(e.target.value)}
                    placeholder="Write your message..."
                    rows={10}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowComposeDialog(false)}>Cancel</Button>
                  <Button onClick={handleSendEmail} disabled={isSending} className="gap-2">
                    {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Send Email
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Users className="w-4 h-4" />
                Bulk Email
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
              <DialogHeader>
                <DialogTitle>Send Bulk Email</DialogTitle>
              </DialogHeader>
              <div className="flex-1 overflow-hidden flex gap-6 pt-4">
                {/* Customer Selection */}
                <div className="w-1/2 flex flex-col">
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between">
                      <Label>Select Recipients</Label>
                      <Button variant="ghost" size="sm" onClick={handleSelectAll}>
                        {selectedCustomers.length === filteredCustomersForBulk.length ? "Deselect All" : "Select All"}
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="Search customers..."
                          value={bulkSearchQuery}
                          onChange={(e) => setBulkSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[120px]">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="trial">Trial</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <ScrollArea className="flex-1 border rounded-lg p-2">
                    <div className="space-y-1">
                      {filteredCustomersForBulk.map(customer => {
                        const isSelected = selectedCustomers.includes(customer.id);
                        return (
                          <div
                            key={customer.id}
                            className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                              isSelected ? "bg-primary/10 border border-primary/30" : "hover:bg-muted/50"
                            }`}
                            onClick={() => handleToggleCustomer(customer.id)}
                          >
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => handleToggleCustomer(customer.id)}
                            />
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                {customer.firstName[0]}{customer.lastName[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">
                                {customer.firstName} {customer.lastName}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">{customer.email}</p>
                            </div>
                            <Badge variant="outline" className={`text-xs ${getStatusBadge(customer.subscriptionStatus)}`}>
                              {customer.subscriptionStatus.toLowerCase()}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>

                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {filteredCustomersForBulk.length} customers
                    </span>
                    <Badge variant="secondary">
                      {selectedCustomers.length} selected
                    </Badge>
                  </div>
                </div>

                {/* Email Compose */}
                <div className="w-1/2 flex flex-col space-y-4">
                  <div>
                    <Label>Template</Label>
                    <Select value={bulkTemplate} onValueChange={(v) => handleUseTemplate(v, true)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a template..." />
                      </SelectTrigger>
                      <SelectContent>
                        {emailTemplates.map(t => (
                          <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Subject</Label>
                    <Input
                      value={bulkSubject}
                      onChange={e => setBulkSubject(e.target.value)}
                      placeholder="Email subject..."
                    />
                  </div>
                  <div className="flex-1">
                    <Label>Message</Label>
                    <Textarea
                      value={bulkBody}
                      onChange={e => setBulkBody(e.target.value)}
                      placeholder="Write your message..."
                      className="h-[calc(100%-24px)] min-h-[200px]"
                    />
                  </div>

                  <div className="p-3 rounded-lg bg-muted/50 text-sm">
                    <p className="font-medium flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-yellow-600" />
                      Preview
                    </p>
                    <p className="text-muted-foreground mt-1">
                      This email will be sent to {selectedCustomers.length} recipient(s)
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowBulkDialog(false)}>Cancel</Button>
                <Button
                  onClick={handleSendBulkEmail}
                  disabled={isSending || selectedCustomers.length === 0}
                  className="gap-2"
                >
                  {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Send to {selectedCustomers.length} Recipients
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalCustomers}</p>
                <p className="text-sm text-muted-foreground">Total Customers</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.activeCustomers}</p>
                <p className="text-sm text-muted-foreground">Active Subscribers</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Mail className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.emailsSent}</p>
                <p className="text-sm text-muted-foreground">Emails Sent</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Send className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.bulkEmails}</p>
                <p className="text-sm text-muted-foreground">Bulk Campaigns</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="quick-send">
        <TabsList>
          <TabsTrigger value="quick-send">Quick Send</TabsTrigger>
          <TabsTrigger value="templates">Email Templates</TabsTrigger>
          <TabsTrigger value="history">Email History</TabsTrigger>
        </TabsList>

        {/* Quick Send Tab */}
        <TabsContent value="quick-send" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Send to Customer Groups</CardTitle>
              <CardDescription>Send emails to specific customer segments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <Card className="border-dashed hover:border-primary/50 transition-colors cursor-pointer" onClick={() => {
                  setStatusFilter("active");
                  setSelectedCustomers(customers.filter(c => c.subscriptionStatus === "ACTIVE").map(c => c.id));
                  setShowBulkDialog(true);
                }}>
                  <CardContent className="pt-6 text-center">
                    <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-6 h-6 text-green-500" />
                    </div>
                    <h3 className="font-medium">Active Subscribers</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {customers.filter(c => c.subscriptionStatus === "ACTIVE").length} customers
                    </p>
                    <Button variant="outline" size="sm" className="mt-4">
                      Send Email
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-dashed hover:border-primary/50 transition-colors cursor-pointer" onClick={() => {
                  setStatusFilter("trial");
                  setSelectedCustomers(customers.filter(c => c.subscriptionStatus === "TRIAL").map(c => c.id));
                  setShowBulkDialog(true);
                }}>
                  <CardContent className="pt-6 text-center">
                    <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
                      <Clock className="w-6 h-6 text-blue-500" />
                    </div>
                    <h3 className="font-medium">Trial Users</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {customers.filter(c => c.subscriptionStatus === "TRIAL").length} customers
                    </p>
                    <Button variant="outline" size="sm" className="mt-4">
                      Send Email
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-dashed hover:border-primary/50 transition-colors cursor-pointer" onClick={() => {
                  setStatusFilter("inactive");
                  setSelectedCustomers(customers.filter(c => ["INACTIVE", "CANCELLED", "EXPIRED"].includes(c.subscriptionStatus)).map(c => c.id));
                  setShowBulkDialog(true);
                }}>
                  <CardContent className="pt-6 text-center">
                    <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center mx-auto mb-4">
                      <RefreshCw className="w-6 h-6 text-orange-500" />
                    </div>
                    <h3 className="font-medium">Win-back Campaign</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {customers.filter(c => ["INACTIVE", "CANCELLED", "EXPIRED"].includes(c.subscriptionStatus)).length} customers
                    </p>
                    <Button variant="outline" size="sm" className="mt-4">
                      Send Email
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="mt-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {emailTemplates.map(template => (
              <Card key={template.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <CardDescription>{template.category}</CardDescription>
                    </div>
                    <Badge variant="outline">{template.isActive ? "Active" : "Inactive"}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Subject:</p>
                      <p className="text-sm font-medium">{template.subject}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Variables:</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {template.variables.map(v => (
                          <Badge key={v} variant="outline" className="text-xs">
                            {`{{${v}}}`}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={() => {
                        handleUseTemplate(template.id, false);
                        setShowComposeDialog(true);
                      }}>
                        <Mail className="w-3 h-3" />
                        Single
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={() => {
                        handleUseTemplate(template.id, true);
                        setShowBulkDialog(true);
                      }}>
                        <Users className="w-3 h-3" />
                        Bulk
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Add Template Card */}
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center h-full min-h-[250px]">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Plus className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="font-medium">Create Template</p>
                <p className="text-sm text-muted-foreground">Add a new email template</p>
                <Button variant="outline" className="mt-4">Create</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Email Activity</CardTitle>
              <CardDescription>View email sending history and status</CardDescription>
            </CardHeader>
            <CardContent>
              {activityLogs.length > 0 ? (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4">
                    {activityLogs.map(activity => (
                      <div key={activity.id} className="flex items-center gap-4 p-3 rounded-lg border">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          activity.action.includes("BULK") ? "bg-purple-500/10" : "bg-blue-500/10"
                        }`}>
                          {activity.action.includes("BULK") ? (
                            <Users className="w-5 h-5 text-purple-500" />
                          ) : (
                            <Mail className="w-5 h-5 text-blue-500" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">
                            {activity.action.replace(/_/g, " ")}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            By: {activity.userName}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className="bg-green-500/10 text-green-600">
                            Sent
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(activity.createdAt).toLocaleDateString('en-AU', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Mail className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p>No email history yet</p>
                  <p className="text-sm">Send your first email to see activity here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
