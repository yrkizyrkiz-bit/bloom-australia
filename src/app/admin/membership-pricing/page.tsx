"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, DollarSign } from "lucide-react";
import { toast } from "sonner";

function intervalLabel(interval: string): string {
  const labels: Record<string, string> = {
    MONTHLY: "Monthly",
    QUARTERLY: "Every 3 months",
    BIANNUAL: "Every 6 months",
    YEARLY: "Annual",
    ONE_TIME: "First month",
  };
  return labels[interval] ?? interval;
}

type PriceRow = {
  id: string;
  billingInterval: string;
  amountCents: number;
  amountAud: number;
  label: string | null;
  isDefault: boolean;
  isFirstMonth: boolean;
  isActive: boolean;
};

type ProductRow = {
  productId: string;
  slug: string;
  name: string;
  program: string;
  planTier: string | null;
  prices: PriceRow[];
};

export default function MembershipPricingPage() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [draft, setDraft] = useState<Record<string, { amountAud: string; label: string; isActive: boolean }>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/membership-pricing");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      setProducts(data.products ?? []);
      const nextDraft: Record<string, { amountAud: string; label: string; isActive: boolean }> = {};
      for (const p of data.products ?? []) {
        for (const price of p.prices) {
          nextDraft[price.id] = {
            amountAud: String(price.amountAud),
            label: price.label ?? "",
            isActive: price.isActive,
          };
        }
      }
      setDraft(nextDraft);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load pricing");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const updateDraft = (id: string, patch: Partial<{ amountAud: string; label: string; isActive: boolean }>) => {
    setDraft((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  };

  const saveAll = async () => {
    setSaving(true);
    try {
      const prices = Object.entries(draft).map(([id, row]) => ({
        id,
        amountCents: Math.round(parseFloat(row.amountAud || "0") * 100),
        label: row.label,
        isActive: row.isActive,
      }));
      const res = await fetch("/api/admin/membership-pricing", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prices }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setProducts(data.products ?? []);
      toast.success("Membership pricing updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <DollarSign className="h-6 w-6" />
            Membership Pricing
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Control in-portal subscription prices for every program. First-month rows include the
            doctor consultation. Recurring rows apply after the first billing period.
          </p>
        </div>
        <Button onClick={saveAll} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save all changes
        </Button>
      </div>

      <div className="grid gap-6">
        {products.map((product) => (
          <Card key={product.productId}>
            <CardHeader>
              <CardTitle className="text-lg">{product.name}</CardTitle>
              <CardDescription>
                Program: <Badge variant="outline">{product.program}</Badge>
                {product.planTier && (
                  <Badge variant="secondary" className="ml-2">
                    {product.planTier}
                  </Badge>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {product.prices.map((price) => {
                const d = draft[price.id];
                if (!d) return null;
                return (
                  <div
                    key={price.id}
                    className="grid gap-3 rounded-lg border p-4 md:grid-cols-[1fr_120px_1fr_auto]"
                  >
                    <div>
                      <p className="font-medium text-sm">
                        {intervalLabel(price.billingInterval)}
                        {price.isFirstMonth && (
                          <Badge className="ml-2" variant="secondary">
                            First month
                          </Badge>
                        )}
                        {price.isDefault && !price.isFirstMonth && (
                          <Badge className="ml-2" variant="outline">
                            Default recurring
                          </Badge>
                        )}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs">Amount (AUD)</Label>
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        value={d.amountAud}
                        onChange={(e) => updateDraft(price.id, { amountAud: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Label</Label>
                      <Input
                        value={d.label}
                        onChange={(e) => updateDraft(price.id, { label: e.target.value })}
                      />
                    </div>
                    <div className="flex items-center gap-2 pt-5">
                      <Switch
                        checked={d.isActive}
                        onCheckedChange={(v) => updateDraft(price.id, { isActive: v })}
                      />
                      <Label className="text-xs">Active</Label>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
