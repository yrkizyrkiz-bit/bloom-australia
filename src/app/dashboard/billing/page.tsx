"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MemberBillingPanel } from "@/components/account/MemberBillingPanel";
import type { MemberBillingSummary } from "@/lib/billing/member-billing-summary";
import { ArrowLeft, CreditCard } from "lucide-react";

type InvoiceRow = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  description: string | null;
  issuedAt: string;
  paidAt: string | null;
};

export default function BillingPage() {
  const [billing, setBilling] = useState<MemberBillingSummary | null>(null);
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [membershipRes, invoicesRes] = await Promise.all([
          fetch("/api/account/membership"),
          fetch("/api/account/billing/invoices"),
        ]);

        if (membershipRes.ok) {
          const data = await membershipRes.json();
          setBilling(data.billing || null);
        }

        if (invoicesRes.ok) {
          const data = await invoicesRes.json();
          setInvoices(data.invoices || []);
        }
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/settings">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CreditCard className="w-7 h-7 text-emerald-600" />
            Billing & subscription
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your plan, payment method, and view invoices
          </p>
        </div>
      </div>

      <MemberBillingPanel
        billing={billing}
        invoices={invoices}
        loading={loading}
      />
    </div>
  );
}
