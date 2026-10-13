"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge, badgeVariants } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  DollarSign,
  CreditCard,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  Clock,
  RefreshCw,
  Loader2,
  FileText,
} from "lucide-react";

interface Invoice {
  id: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  amount: number;
  status: string;
  description: string | null;
  issuedAt: string;
  paidAt: string | null;
}

interface InvoiceSummary {
  total: number;
  paid: number;
  pending: number;
  failed: number;
  refunded: number;
  totalRevenue: number;
  pendingRevenue: number;
  refundedAmount: number;
  paidThisMonth: number;
  paidThisMonthCount: number;
  activeMembers: number;
  totalMembers: number;
}

interface BillingPlan {
  slug: string;
  label: string;
  name: string;
  activeSubscribers: number;
  prices: { amountAud: number; interval: string; label: string | null }[];
}

export default function BillingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [summary, setSummary] = useState<InvoiceSummary | null>(null);
  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Fetch invoices and customers
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch invoices
        const invoicesRes = await fetch("/api/admin/billing/invoices");
        if (invoicesRes.ok) {
          const data = await invoicesRes.json();
          setInvoices(data.invoices || []);
          setSummary(data.summary || null);
          setPlans(data.plans || []);
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
      .sort(
        (a, b) =>
          new Date(b.paidAt || b.issuedAt).getTime() - new Date(a.paidAt || a.issuedAt).getTime()
      );
  }, [invoices, statusFilter]);

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
                <p className="text-sm text-muted-foreground">Paid this month</p>
                <p className="text-3xl font-serif font-bold text-green-600 mt-1">
                  ${(summary?.paidThisMonth ?? 0).toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {summary?.paidThisMonthCount || 0} paid
                </p>
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
                <p className="text-sm text-muted-foreground">Total paid</p>
                <p className="text-3xl font-serif font-bold text-foreground mt-1">
                  ${(summary?.totalRevenue ?? 0).toFixed(2)}
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
                  ${(summary?.pendingRevenue ?? 0).toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {summary?.pending || 0} invoices
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
                <p className="text-sm text-muted-foreground">Active members</p>
                <p className="text-3xl font-serif font-bold text-foreground mt-1">
                  {summary?.activeMembers ?? 0}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  of {summary?.totalMembers ?? 0} members
                </p>
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
                  <CardDescription>
                    {summary?.total || 0} invoices
                    {invoices.length < (summary?.total || 0)
                      ? ` · showing latest ${invoices.length}`
                      : ""}
                  </CardDescription>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
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
                        <TableHead>Date</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredInvoices.map(invoice => (
                        <TableRow key={invoice.id}>
                          <TableCell>
                            {new Date(invoice.paidAt || invoice.issuedAt).toLocaleDateString("en-AU", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{invoice.customerName}</p>
                              <p className="text-xs text-muted-foreground">{invoice.customerEmail}</p>
                            </div>
                          </TableCell>
                          <TableCell>{invoice.description || "Payment"}</TableCell>
                          <TableCell>
                            {invoice.status.toUpperCase() === "PAID" ? (
                              <Link
                                href={`/invoices/${invoice.id}`}
                                className={badgeVariants({ variant: "outline" })}
                              >
                                Invoice
                              </Link>
                            ) : (
                              getStatusBadge(invoice.status)
                            )}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            ${invoice.amount.toFixed(2)}
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
          {plans.length === 0 ? (
            <p className="text-sm text-muted-foreground">No subscription plans are configured.</p>
          ) : (
            <div className="grid sm:grid-cols-2 xl:grid-cols-5 gap-6">
              {plans.map((plan) => (
                <Card key={plan.slug}>
                  <CardHeader>
                    <CardTitle>{plan.label}</CardTitle>
                    <CardDescription>{plan.name}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {plan.prices.map((price) => (
                      <div key={`${plan.slug}-${price.interval}-${price.amountAud}`}>
                        <p className="text-2xl font-serif font-bold">
                          ${Number.isInteger(price.amountAud) ? price.amountAud.toFixed(0) : price.amountAud.toFixed(2)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {price.label || price.interval}
                        </p>
                      </div>
                    ))}
                    <div className="pt-4 border-t">
                      <p className="text-sm text-muted-foreground">
                        <span className="font-bold text-foreground">{plan.activeSubscribers}</span>{" "}
                        active
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
