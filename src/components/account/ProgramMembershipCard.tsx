"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreditCard, CheckCircle, Calendar, Scale, Loader2 } from "lucide-react";
import { formatAud, type MembershipSummary } from "@/lib/membership-display";

type ProgramMembershipCardProps = {
  membership: MembershipSummary | null;
  loading: boolean;
};

function statusBadgeVariant(
  status: string
): "default" | "secondary" | "outline" | "destructive" {
  if (status === "paid" || status === "active") return "default";
  if (status === "pending_approval" || status === "pending") return "secondary";
  return "outline";
}

export function ProgramMembershipCard({ membership, loading }: ProgramMembershipCardProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!membership || membership.program !== "weight_management") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-green-600" />
            Subscription
          </CardTitle>
          <CardDescription>No active program subscription on this account.</CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/dashboard/explore">
            <Button variant="outline">Explore programs</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const { firstMonth, recurring, consultation } = membership;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <Scale className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg">Your program</CardTitle>
            <CardDescription>{membership.programLabel}</CardDescription>
          </div>
          <Badge variant="outline" className="shrink-0 text-emerald-700 border-emerald-200">
            {membership.journeyLabel}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50/80 to-white p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-foreground">{membership.planLabel}</p>
              <p className="text-sm text-muted-foreground mt-1">
                Doctor-led weight management with care team support
              </p>
            </div>
            <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0" />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div className="rounded-lg border p-4 space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              First month
            </p>
            <div className="flex items-center justify-between gap-2">
              <p className="text-lg font-semibold">
                {firstMonth.amountAud != null ? formatAud(firstMonth.amountAud) : "—"}
              </p>
              <Badge variant={statusBadgeVariant(firstMonth.status)}>
                {firstMonth.status === "paid" ? "Paid" : firstMonth.status}
              </Badge>
            </div>
            {firstMonth.paidAt && (
              <p className="text-xs text-muted-foreground">
                Paid {new Date(firstMonth.paidAt).toLocaleDateString("en-AU", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            )}
          </div>

          <div className="rounded-lg border p-4 space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {(membership as { billingLabel?: string | null }).billingLabel || "Recurring program"}
            </p>
            <div className="flex items-center justify-between gap-2">
              <p className="text-lg font-semibold">
                {recurring.amountAud != null
                  ? `${formatAud(recurring.amountAud)}${recurring.billingCycle === "qtr" ? "/qtr" : recurring.billingCycle === "6mo" ? "/6mo" : "/mo"}`
                  : "—"}
              </p>
              <Badge variant={statusBadgeVariant(recurring.status)}>
                {recurring.status === "active"
                  ? "Active"
                  : recurring.status === "pending_approval"
                    ? "Pending"
                    : recurring.status}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">{recurring.label}</p>
            {((membership as { paidTill?: string | null }).paidTill || recurring.nextBillingDate) && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Paid till{" "}
                {new Date(
                  (membership as { paidTill?: string | null }).paidTill ||
                    recurring.nextBillingDate!
                ).toLocaleDateString("en-AU", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            )}
          </div>
        </div>

        {consultation && (
          <div className="rounded-lg bg-muted/50 p-4 text-sm">
            <p className="font-medium">Upcoming consultation</p>
            <p className="text-muted-foreground mt-1">
              {consultation.doctorName || "Your doctor"} —{" "}
              {new Date(consultation.scheduledAt).toLocaleString("en-AU", {
                weekday: "long",
                day: "numeric",
                month: "long",
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Ongoing monthly fees apply only if your doctor confirms treatment is clinically appropriate.
          Questions about billing? Contact your care team.
        </p>

        <div className="flex flex-wrap gap-2">
          <Link href="/dashboard/billing">
            <Button size="sm" className="w-full sm:w-auto">
              <CreditCard className="w-4 h-4 mr-2" />
              Billing & invoices
            </Button>
          </Link>
          <Link href="/dashboard/weight-management/support">
            <Button variant="outline" size="sm" className="w-full sm:w-auto">
              Contact care team
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
