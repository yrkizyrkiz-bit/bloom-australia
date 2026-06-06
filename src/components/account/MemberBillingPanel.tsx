"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  CreditCard,
  Calendar,
  Loader2,
  Receipt,
  Sparkles,
  ArrowUpRight,
  AlertTriangle,
  MessageSquare,
} from "lucide-react";
import { formatAud } from "@/lib/membership-display";
import type { MemberBillingSummary } from "@/lib/billing/member-billing-summary";

type InvoiceRow = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  description: string | null;
  issuedAt: string;
  paidAt: string | null;
};

type MemberBillingPanelProps = {
  billing: MemberBillingSummary | null;
  invoices?: InvoiceRow[];
  loading?: boolean;
  compact?: boolean;
  showUpgradeRequest?: boolean;
};

export function MemberBillingPanel({
  billing,
  invoices = [],
  loading = false,
  compact = false,
  showUpgradeRequest = true,
}: MemberBillingPanelProps) {
  const [portalLoading, setPortalLoading] = useState(false);
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [upgradeRequested, setUpgradeRequested] = useState(false);

  const openPortal = async () => {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/account/billing/portal", { method: "POST" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to open portal");
      }
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not open payment portal");
    } finally {
      setPortalLoading(false);
    }
  };

  const requestUpgrade = async () => {
    setUpgradeLoading(true);
    try {
      const res = await fetch("/api/account/billing/request-upgrade", {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit request");
      }
      setUpgradeRequested(true);
      toast.success(data.message || "Request sent to your care team");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to submit request");
    } finally {
      setUpgradeLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-16 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!billing || billing.program !== "weight_management") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Billing
          </CardTitle>
          <CardDescription>No program billing on this account yet.</CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/dashboard/explore">
            <Button variant="outline">Explore programs</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const isPastDue = billing.recurring.status === "past_due";
  const canRequestPrecision =
    showUpgradeRequest && billing.selectedPlan === "CORE";

  return (
    <div className="space-y-6">
      {isPastDue && (
        <Card className="border-red-200 bg-red-50/50">
          <CardContent className="py-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-red-800">Payment issue</p>
              <p className="text-sm text-red-700 mt-1">
                Please update your payment method to keep your program active.
              </p>
              <Button
                size="sm"
                className="mt-3"
                onClick={openPortal}
                disabled={portalLoading}
              >
                {portalLoading ? "Opening..." : "Update payment method"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Current subscription</CardTitle>
          <CardDescription>{billing.recurring.label}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="rounded-lg border p-4">
              <p className="text-xs text-muted-foreground">Plan</p>
              <p className="font-semibold text-lg">{billing.planLabel}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-xs text-muted-foreground">Recurring</p>
              <p className="font-semibold text-lg">
                {billing.recurring.amountAud != null
                  ? formatAud(billing.recurring.amountAud)
                  : "—"}
              </p>
              <p className="text-xs text-muted-foreground">
                {billing.recurring.billingLabel || "Monthly"}
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-xs text-muted-foreground">Status</p>
              <Badge variant="outline" className="mt-1 capitalize">
                {billing.recurring.status.replace(/_/g, " ")}
              </Badge>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Paid till
              </p>
              <p className="font-semibold">
                {billing.recurring.paidTill
                  ? new Date(billing.recurring.paidTill).toLocaleDateString("en-AU", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : "—"}
              </p>
            </div>
          </div>

          <div className="rounded-lg border p-4 bg-muted/30">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              First month
            </p>
            <div className="flex items-center justify-between mt-2">
              <p className="font-medium">
                {billing.firstMonth.amountAud != null
                  ? formatAud(billing.firstMonth.amountAud)
                  : "—"}
              </p>
              <Badge variant="outline">{billing.firstMonth.status}</Badge>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={openPortal} disabled={portalLoading} variant="default">
              <CreditCard className="w-4 h-4 mr-2" />
              {portalLoading ? "Opening..." : "Manage payment method"}
            </Button>
            {compact && (
              <Link href="/dashboard/billing">
                <Button variant="outline">
                  <Receipt className="w-4 h-4 mr-2" />
                  View full billing
                </Button>
              </Link>
            )}
            <Link href="/dashboard/weight-management/support">
              <Button variant="outline">
                <MessageSquare className="w-4 h-4 mr-2" />
                Contact care team
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {canRequestPrecision && !compact && (
        <Card className="border-violet-200 bg-gradient-to-br from-violet-50/80 to-white">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-violet-600" />
              Upgrade to Precision
            </CardTitle>
            <CardDescription>
              Closer clinical monitoring, priority support, and enhanced program features.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg border bg-white p-3">
                <p className="font-medium">Sanative Core</p>
                <p className="text-muted-foreground mt-1">Your current plan</p>
                <p className="font-semibold mt-2">
                  {formatAud(billing.recurring.amountAud ?? 349)}/mo
                </p>
              </div>
              <div className="rounded-lg border border-violet-200 bg-violet-50/50 p-3">
                <p className="font-medium text-violet-900">Sanative Precision</p>
                <p className="text-violet-700/80 mt-1">Enhanced monitoring</p>
                <p className="font-semibold mt-2 text-violet-900">from $499/mo</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Upgrades are reviewed by your care team for clinical suitability. Billing changes apply from your next billing period.
            </p>
            <Button
              onClick={requestUpgrade}
              disabled={upgradeLoading || upgradeRequested}
              variant="secondary"
            >
              {upgradeLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : upgradeRequested ? (
                "Request submitted"
              ) : (
                <>
                  <ArrowUpRight className="w-4 h-4 mr-2" />
                  Request Precision upgrade
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {!compact && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              Payment history
            </CardTitle>
          </CardHeader>
          <CardContent>
            {invoices.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                No payments recorded yet.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell>
                        {new Date(inv.paidAt || inv.issuedAt).toLocaleDateString("en-AU", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </TableCell>
                      <TableCell>{inv.description || "Payment"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{inv.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatAud(inv.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
