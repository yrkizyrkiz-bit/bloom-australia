"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { AlertTriangle, CreditCard, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { SubscriptionAccessStatus } from "@/lib/billing/paid-till";

type ProgramSubscriptionGateProps = {
  programSlug: string;
  children: ReactNode;
};

type ProgramSubscriptionResponse = {
  programLabel?: string;
  paidTill?: string | null;
  subscriptionAccess?: SubscriptionAccessStatus;
  found?: boolean;
};

export function ProgramSubscriptionGate({
  programSlug,
  children,
}: ProgramSubscriptionGateProps) {
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [data, setData] = useState<ProgramSubscriptionResponse | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch(
          `/api/account/program-subscription?program=${encodeURIComponent(programSlug)}`
        );
        if (!res.ok) throw new Error("Failed to load subscription");
        const json = (await res.json()) as ProgramSubscriptionResponse;
        if (!cancelled) setData(json);
      } catch {
        if (!cancelled) {
          setData({
            found: false,
            subscriptionAccess: {
              isActive: true,
              isExpired: false,
              expiresAt: null,
              message: null,
            },
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [programSlug]);

  const openPortal = async () => {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/account/billing/portal", { method: "POST" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to open billing portal");
      }
      const payload = await res.json();
      if (payload.url) window.location.href = payload.url;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not open billing portal");
    } finally {
      setPortalLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const access = data?.subscriptionAccess;
  if (data?.found === false || !access?.isExpired) {
    return <>{children}</>;
  }

  const label = data?.programLabel || "this program";
  const expiresAt = access.expiresAt || data?.paidTill;

  return (
    <div className="mx-auto max-w-2xl py-8">
      <Card className="border-amber-200 bg-amber-50/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-amber-950">
            <AlertTriangle className="h-5 w-5 text-amber-700" />
            Subscription renewal required
          </CardTitle>
          <CardDescription className="text-amber-900/80">
            {access.message ||
              `Update your subscription to continue accessing ${label}.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {expiresAt && (
            <p className="text-sm text-amber-900/90">
              Paid till:{" "}
              <strong>
                {new Date(expiresAt).toLocaleDateString("en-AU", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </strong>
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button onClick={openPortal} disabled={portalLoading}>
              <CreditCard className="mr-2 h-4 w-4" />
              {portalLoading ? "Opening..." : "Update subscription"}
            </Button>
            <Link href="/dashboard/billing">
              <Button variant="outline">View billing</Button>
            </Link>
            <Link href="/dashboard/programs">
              <Button variant="ghost">Back to programs</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
