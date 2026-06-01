"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { subscriptionPlans } from "@/data/crm-data";
import { toast } from "sonner";
import {
  DollarSign,
  CreditCard,
  TrendingUp,
  Download,
  Send,
  CheckCircle,
  AlertTriangle,
  Clock,
  MoreHorizontal,
  Eye,
  RefreshCw,
  Loader2,
  FileText,
  Plus
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Invoice {
  id: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  plan: string;
  tier: string;
  amount: number;
  tax: number;
  total: number;
  status: string;
  dueDate: string;
  paidAt: string | null;
  createdAt: string;
  items: { description: string; quantity: number; unitPrice: number; total: number }[];
}

interface InvoiceSummary {
  total: number;
  paid: number;
  pending: number;
  overdue: number;
  totalRevenue: number;
  pendingRevenue: number;
}

interface Customer {
  id: string;
  subscriptionStatus: string;
  subscriptionTier: string | null;
}

export default function BillingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [summary, setSummary] = useState<InvoiceSummary | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Fetch invoices and customers
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch invoices
        const invoicesRes = await fetch("/api/invoices?limit=100");
        if (invoicesRes.ok) {
          const data = await invoicesRes.json();
          setInvoices(data.invoices || []);
          setSummary(data.summary || null);
        }

        // Fetch customers for plan stats
        const customersRes = await fetch("/api/users?role=MEMBER&limit=100");
        if (customersRes.ok) {
          const data = await customersRes.json();
          setCustomers(data.users || []);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load billing data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredInvoices = useMemo(() => {
    return invoices
      .filter(i => statusFilter === "all" || i.status.toLowerCase() === statusFilter.toLowerCase())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [invoices, statusFilter]);

  // Calculate MRR from active subscribers
  const mrr = useMemo(() => {
    return customers
      .filter(c => c.subscriptionStatus === "ACTIVE")
      .reduce((sum, c) => {
        const plan = subscriptionPlans.find(p => p.tier === (c.subscriptionTier || "free"));
        return sum + (plan?.price || 0);
      }, 0);
  }, [customers]);

  const getStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase();
    const styles: Record<string, string> = {
      paid: "bg-green-500/10 text-green-600",
      pending: "bg-yellow-500/10 text-yellow-600",
      overdue: "bg-red-500/10 text-red-600",
      failed: "bg-red-500/10 text-red-600",
      refunded: "bg-gray-500/10 text-gray-600"
    };
    const icons: Record<string, React.ReactNode> = {
      paid: <CheckCircle className="w-3 h-3 mr-1" />,
      pending: <Clock className="w-3 h-3 mr-1" />,
      overdue: <AlertTriangle className="w-3 h-3 mr-1" />,
      failed: <AlertTriangle className="w-3 h-3 mr-1" />,
      refunded: <RefreshCw className="w-3 h-3 mr-1" />
    };
    return (
      <Badge className={styles[statusLower] || styles.pending}>
        {icons[statusLower] || icons.pending}
        {status}
      </Badge>
    );
  };

  const handleSendReminder = async (invoice: Invoice) => {
    try {
      const response = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: invoice.customerEmail,
          subject: `Payment Reminder - Invoice #${invoice.id}`,
          body: `Hi ${invoice.customerName.split(" ")[0]},\n\nThis is a reminder that your invoice #${invoice.id} for ${invoice.total.toFixed(2)} is ${invoice.status === "OVERDUE" ? "overdue" : "pending"}.\n\nPlease process your payment at your earliest convenience.\n\nThank you,\nSanative Health Team`,
        }),
      });

      if (response.ok) {
        toast.success(`Reminder sent to ${invoice.customerName}`);
      } else {
        throw new Error("Failed to send reminder");
      }
    } catch (error) {
      toast.error("Failed to send reminder");
    }
  };

  const handleDownloadPDF = async (invoice: Invoice) => {
    try {
      toast.loading("Generating PDF...", { id: "pdf-download" });

      const response = await fetch(`/api/invoices/${invoice.id}/pdf`);

      if (!response.ok) {
        throw new Error("Failed to generate PDF");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Invoice-${invoice.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("PDF downloaded successfully", { id: "pdf-download" });
    } catch (error) {
      console.error("Error downloading PDF:", error);
      toast.error("Failed to download PDF", { id: "pdf-download" });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading billing data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif text-foreground">Billing & Invoices</h1>
          <p className="text-muted-foreground mt-1">Manage invoices, payments, and subscription plans</p>
        </div>
        <Button variant="outline" onClick={() => window.location.reload()}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Monthly Revenue</p>
                <p className="text-3xl font-serif font-bold text-green-600 mt-1">${mrr}</p>
                <p className="text-xs text-muted-foreground mt-1">MRR</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-3xl font-serif font-bold text-foreground mt-1">
                  ${summary?.totalRevenue?.toFixed(2) || "0.00"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{summary?.paid || 0} paid invoices</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-3xl font-serif font-bold text-yellow-600 mt-1">
                  ${summary?.pendingRevenue?.toFixed(2) || "0.00"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {(summary?.pending || 0) + (summary?.overdue || 0)} invoices
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Subscribers</p>
                <p className="text-3xl font-serif font-bold text-foreground mt-1">
                  {customers.filter(c => c.subscriptionStatus === "ACTIVE").length}
                </p>
                <p className="text-xs text-muted-foreground mt-1">of {customers.length} total</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="invoices">
        <TabsList>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="plans">Subscription Plans</TabsTrigger>
        </TabsList>

        {/* Invoices Tab */}
        <TabsContent value="invoices" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Invoices</CardTitle>
                  <CardDescription>{summary?.total || 0} total invoices</CardDescription>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {filteredInvoices.length > 0 ? (
                <ScrollArea className="max-h-[500px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredInvoices.map(invoice => (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-medium">#{invoice.id}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{invoice.customerName}</p>
                              <p className="text-xs text-muted-foreground">{invoice.customerEmail}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">{invoice.tier}</Badge>
                          </TableCell>
                          <TableCell className="font-bold">${invoice.total.toFixed(2)}</TableCell>
                          <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(invoice.dueDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  className="gap-2"
                                  onClick={() => handleDownloadPDF(invoice)}
                                >
                                  <Download className="w-4 h-4" />
                                  Download PDF
                                </DropdownMenuItem>
                                {invoice.status !== "PAID" && (
                                  <DropdownMenuItem
                                    className="gap-2"
                                    onClick={() => handleSendReminder(invoice)}
                                  >
                                    <Send className="w-4 h-4" />
                                    Send Reminder
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p>No invoices found</p>
                  <p className="text-sm">Invoices will appear when customers subscribe</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Plans Tab */}
        <TabsContent value="plans" className="mt-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {subscriptionPlans.map(plan => {
              const subscribers = customers.filter(
                c => (c.subscriptionTier || "free") === plan.tier && c.subscriptionStatus === "ACTIVE"
              ).length;
              return (
                <Card key={plan.id} className={plan.tier === "premium" ? "border-primary/50 bg-primary/5" : ""}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{plan.name}</CardTitle>
                      {plan.tier === "premium" && <Badge>Popular</Badge>}
                    </div>
                    <div className="mt-2">
                      <span className="text-3xl font-serif font-bold">${plan.price}</span>
                      <span className="text-muted-foreground">/month</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 mb-4">
                      {plan.features.map((feature, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                    <div className="pt-4 border-t">
                      <p className="text-sm text-muted-foreground">
                        <span className="font-bold text-foreground">{subscribers}</span> active subscribers
                      </p>
                      <p className="text-sm text-green-600">
                        ${subscribers * plan.price}/mo revenue
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
