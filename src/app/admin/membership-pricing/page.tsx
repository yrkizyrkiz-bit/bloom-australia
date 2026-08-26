"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Save, DollarSign, Plus, Trash2, PackagePlus } from "lucide-react";
import { toast } from "sonner";

function intervalLabel(interval: string): string {
  const labels: Record<string, string> = {
    MONTHLY: "Monthly",
    QUARTERLY: "Every 3 months",
    BIANNUAL: "Every 6 months",
    YEARLY: "Annual",
    ONE_TIME: "One-time",
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
  sortOrder: number;
  isActive: boolean;
  subscriptionCount: number;
  prices: PriceRow[];
};

type ProgramOption = { value: string; label: string };

type PriceDraft = { amountAud: string; label: string; isActive: boolean };
type ProductDraft = {
  name: string;
  planTier: string;
  sortOrder: string;
  isActive: boolean;
};

type NewPriceDraft = {
  billingInterval: string;
  amountAud: string;
  label: string;
  isFirstMonth: boolean;
};

const EMPTY_NEW_PRICE: NewPriceDraft = {
  billingInterval: "MONTHLY",
  amountAud: "",
  label: "",
  isFirstMonth: false,
};

export default function MembershipPricingPage() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [programOptions, setProgramOptions] = useState<ProgramOption[]>([]);
  const [billingIntervals, setBillingIntervals] = useState<string[]>([]);
  const [priceDraft, setPriceDraft] = useState<Record<string, PriceDraft>>({});
  const [productDraft, setProductDraft] = useState<Record<string, ProductDraft>>({});
  const [newPriceDraft, setNewPriceDraft] = useState<Record<string, NewPriceDraft>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false);

  // New product form
  const [showCreate, setShowCreate] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "",
    program: "",
    planTier: "",
    sortOrder: "0",
  });

  const applyProducts = useCallback((rows: ProductRow[]) => {
    setProducts(rows);
    const nextPrices: Record<string, PriceDraft> = {};
    const nextProducts: Record<string, ProductDraft> = {};
    for (const p of rows) {
      nextProducts[p.productId] = {
        name: p.name,
        planTier: p.planTier ?? "",
        sortOrder: String(p.sortOrder),
        isActive: p.isActive,
      };
      for (const price of p.prices) {
        nextPrices[price.id] = {
          amountAud: String(price.amountAud),
          label: price.label ?? "",
          isActive: price.isActive,
        };
      }
    }
    setPriceDraft(nextPrices);
    setProductDraft(nextProducts);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/membership-pricing");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      applyProducts(data.products ?? []);
      setProgramOptions(data.programOptions ?? []);
      setBillingIntervals(data.billingIntervals ?? []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load pricing");
    } finally {
      setLoading(false);
    }
  }, [applyProducts]);

  useEffect(() => {
    load();
  }, [load]);

  const programLabel = useCallback(
    (value: string) =>
      programOptions.find((o) => o.value === value)?.label ?? value,
    [programOptions]
  );

  const grouped = useMemo(() => {
    const map = new Map<string, ProductRow[]>();
    for (const p of products) {
      const list = map.get(p.program) ?? [];
      list.push(p);
      map.set(p.program, list);
    }
    return Array.from(map.entries());
  }, [products]);

  const updatePriceDraft = (id: string, patch: Partial<PriceDraft>) => {
    setPriceDraft((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  };

  const updateProductDraft = (id: string, patch: Partial<ProductDraft>) => {
    setProductDraft((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  };

  const saveAll = async () => {
    setSaving(true);
    try {
      const prices = Object.entries(priceDraft).map(([id, row]) => ({
        id,
        amountCents: Math.round(parseFloat(row.amountAud || "0") * 100),
        label: row.label,
        isActive: row.isActive,
      }));
      const productRows = Object.entries(productDraft).map(([id, row]) => ({
        id,
        name: row.name,
        planTier: row.planTier || null,
        sortOrder: parseInt(row.sortOrder || "0", 10) || 0,
        isActive: row.isActive,
      }));
      const res = await fetch("/api/admin/membership-pricing", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prices, products: productRows }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      applyProducts(data.products ?? []);
      toast.success("Pricing catalog updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const createProduct = async () => {
    if (!newProduct.name.trim() || !newProduct.program) {
      toast.error("Product name and category are required");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/admin/membership-pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newProduct.name,
          program: newProduct.program,
          planTier: newProduct.planTier || null,
          sortOrder: parseInt(newProduct.sortOrder || "0", 10) || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create product");
      applyProducts(data.products ?? []);
      setNewProduct({ name: "", program: "", planTier: "", sortOrder: "0" });
      setShowCreate(false);
      toast.success("Product created, now add its prices");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create product");
    } finally {
      setBusy(false);
    }
  };

  const addPrice = async (productId: string) => {
    const draft = newPriceDraft[productId] ?? EMPTY_NEW_PRICE;
    const amount = parseFloat(draft.amountAud);
    if (!Number.isFinite(amount) || amount < 0) {
      toast.error("Enter a valid amount");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/admin/membership-pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add-price",
          productId,
          price: {
            billingInterval: draft.billingInterval,
            amountCents: Math.round(amount * 100),
            label: draft.label || null,
            isFirstMonth: draft.isFirstMonth,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add price");
      applyProducts(data.products ?? []);
      setNewPriceDraft((prev) => ({ ...prev, [productId]: { ...EMPTY_NEW_PRICE } }));
      toast.success("Price added");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add price");
    } finally {
      setBusy(false);
    }
  };

  const deletePrice = async (priceId: string) => {
    if (!confirm("Delete this price option?")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/membership-pricing?priceId=${priceId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete price");
      applyProducts(data.products ?? []);
      toast.success("Price deleted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete price");
    } finally {
      setBusy(false);
    }
  };

  const deleteProduct = async (product: ProductRow) => {
    const warning =
      product.subscriptionCount > 0
        ? `${product.name} has ${product.subscriptionCount} member subscription(s), so it will be deactivated instead of deleted. Continue?`
        : `Delete "${product.name}" and all of its prices? This cannot be undone.`;
    if (!confirm(warning)) return;
    setBusy(true);
    try {
      const res = await fetch(
        `/api/admin/membership-pricing?productId=${product.productId}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete product");
      applyProducts(data.products ?? []);
      toast.success(data.deactivated ? "Product deactivated" : "Product deleted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete product");
    } finally {
      setBusy(false);
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
            Products &amp; Pricing
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create and manage the products members can purchase, and their billing
            options. Changes take effect immediately across checkout and the portal.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowCreate((v) => !v)}>
            <PackagePlus className="mr-2 h-4 w-4" />
            New product
          </Button>
          <Button onClick={saveAll} disabled={saving || busy}>
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save all changes
          </Button>
        </div>
      </div>

      {showCreate && (
        <Card className="border-primary/40">
          <CardHeader>
            <CardTitle className="text-lg">New product</CardTitle>
            <CardDescription>
              Create the product first, then add its billing options below.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-[1fr_1fr_140px_100px_auto]">
              <div>
                <Label className="text-xs">Product name</Label>
                <Input
                  value={newProduct.name}
                  placeholder="e.g. Weight Management Care"
                  onChange={(e) =>
                    setNewProduct((p) => ({ ...p, name: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label className="text-xs">Category</Label>
                <Select
                  value={newProduct.program}
                  onValueChange={(v) => setNewProduct((p) => ({ ...p, program: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {programOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Plan tier (optional)</Label>
                <Input
                  value={newProduct.planTier}
                  placeholder="e.g. CORE"
                  onChange={(e) =>
                    setNewProduct((p) => ({ ...p, planTier: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label className="text-xs">Sort order</Label>
                <Input
                  type="number"
                  value={newProduct.sortOrder}
                  onChange={(e) =>
                    setNewProduct((p) => ({ ...p, sortOrder: e.target.value }))
                  }
                />
              </div>
              <div className="flex items-end">
                <Button onClick={createProduct} disabled={busy}>
                  {busy ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
                  Create
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {grouped.map(([program, programProducts]) => (
        <div key={program} className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground pt-2">
            {programLabel(program)}
          </h2>
          {programProducts.map((product) => {
            const pd = productDraft[product.productId];
            if (!pd) return null;
            const np = newPriceDraft[product.productId] ?? EMPTY_NEW_PRICE;
            return (
              <Card
                key={product.productId}
                className={pd.isActive ? undefined : "opacity-60"}
              >
                <CardHeader>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="grid gap-3 md:grid-cols-[240px_140px_100px] flex-1">
                      <div>
                        <Label className="text-xs">Product name</Label>
                        <Input
                          value={pd.name}
                          onChange={(e) =>
                            updateProductDraft(product.productId, {
                              name: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Plan tier</Label>
                        <Input
                          value={pd.planTier}
                          placeholder="—"
                          onChange={(e) =>
                            updateProductDraft(product.productId, {
                              planTier: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Sort order</Label>
                        <Input
                          type="number"
                          value={pd.sortOrder}
                          onChange={(e) =>
                            updateProductDraft(product.productId, {
                              sortOrder: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-3 pt-5">
                      {product.subscriptionCount > 0 && (
                        <Badge variant="secondary">
                          {product.subscriptionCount} subscriber
                          {product.subscriptionCount === 1 ? "" : "s"}
                        </Badge>
                      )}
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={pd.isActive}
                          onCheckedChange={(v) =>
                            updateProductDraft(product.productId, { isActive: v })
                          }
                        />
                        <Label className="text-xs">Active</Label>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        disabled={busy}
                        onClick={() => deleteProduct(product)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <CardDescription className="pt-1">
                    Slug: <code className="text-xs">{product.slug}</code>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {product.prices.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No prices yet, add a billing option below so this product can
                      be purchased.
                    </p>
                  )}
                  {product.prices.map((price) => {
                    const d = priceDraft[price.id];
                    if (!d) return null;
                    return (
                      <div
                        key={price.id}
                        className="grid gap-3 rounded-lg border p-4 md:grid-cols-[1fr_120px_1fr_auto_auto]"
                      >
                        <div>
                          <p className="font-medium text-sm pt-5">
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
                            onChange={(e) =>
                              updatePriceDraft(price.id, { amountAud: e.target.value })
                            }
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Label</Label>
                          <Input
                            value={d.label}
                            onChange={(e) =>
                              updatePriceDraft(price.id, { label: e.target.value })
                            }
                          />
                        </div>
                        <div className="flex items-center gap-2 pt-5">
                          <Switch
                            checked={d.isActive}
                            onCheckedChange={(v) =>
                              updatePriceDraft(price.id, { isActive: v })
                            }
                          />
                          <Label className="text-xs">Active</Label>
                        </div>
                        <div className="flex items-center pt-5">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            disabled={busy}
                            onClick={() => deletePrice(price.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}

                  <div className="grid gap-3 rounded-lg border border-dashed p-4 md:grid-cols-[1fr_120px_1fr_auto_auto] bg-muted/30">
                    <div>
                      <Label className="text-xs">Billing interval</Label>
                      <Select
                        value={np.billingInterval}
                        onValueChange={(v) =>
                          setNewPriceDraft((prev) => ({
                            ...prev,
                            [product.productId]: { ...np, billingInterval: v },
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {billingIntervals.map((i) => (
                            <SelectItem key={i} value={i}>
                              {intervalLabel(i)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Amount (AUD)</Label>
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        value={np.amountAud}
                        placeholder="0.00"
                        onChange={(e) =>
                          setNewPriceDraft((prev) => ({
                            ...prev,
                            [product.productId]: { ...np, amountAud: e.target.value },
                          }))
                        }
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Label (optional)</Label>
                      <Input
                        value={np.label}
                        placeholder="e.g. Every 6 months"
                        onChange={(e) =>
                          setNewPriceDraft((prev) => ({
                            ...prev,
                            [product.productId]: { ...np, label: e.target.value },
                          }))
                        }
                      />
                    </div>
                    <div className="flex items-center gap-2 pt-5">
                      <Checkbox
                        checked={np.isFirstMonth}
                        onCheckedChange={(v) =>
                          setNewPriceDraft((prev) => ({
                            ...prev,
                            [product.productId]: { ...np, isFirstMonth: v === true },
                          }))
                        }
                      />
                      <Label className="text-xs">First month</Label>
                    </div>
                    <div className="flex items-center pt-5">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busy}
                        onClick={() => addPrice(product.productId)}
                      >
                        <Plus className="mr-1 h-4 w-4" />
                        Add price
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ))}
    </div>
  );
}
