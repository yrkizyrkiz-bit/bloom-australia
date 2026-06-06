"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Phone,
  Loader2,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertTriangle,
  User,
  Pill,
  DollarSign,
  ExternalLink,
  Sparkles,
} from "lucide-react";

interface WelcomeCallItem {
  id: string;
  subject: string;
  notes: string | null;
  status: string;
  priority: string | null;
  dueDate: string | null;
  createdAt: string;
  completedAt: string | null;
  urgency: "overdue" | "today" | "upcoming" | "none";
  patient: {
    id: string;
    fullName: string;
    email: string;
    phone: string | null;
    journeyStatus: string;
    approvalStatus: string;
    subscriptionTier: string | null;
    selectedPlan: string | null;
    hasStripeSubscription?: boolean;
    doctorName: string | null;
    hasCompletedPortalOnboarding: boolean;
  };
  prescription: {
    id: string;
    medicationName: string;
    scriptStatus: string;
    pharmacyName: string | null;
  } | null;
  urls: {
    memberProfile: string;
    prescriptions: string;
  };
}

export default function WelcomeCallsPage() {
  const [items, setItems] = useState<WelcomeCallItem[]>([]);
  const [counts, setCounts] = useState({
    pending: 0,
    completed: 0,
    overdue: 0,
    dueToday: 0,
  });
  const [loading, setLoading] = useState(true);
  const [statusTab, setStatusTab] = useState<"pending" | "completed" | "all">("pending");
  const [search, setSearch] = useState("");

  const [selected, setSelected] = useState<WelcomeCallItem | null>(null);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [onboardingNotes, setOnboardingNotes] = useState("");
  const [activateProgram, setActivateProgram] = useState(true);
  const [processing, setProcessing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/welcome-calls?status=${statusTab}`);
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setItems(data.items || []);
        setCounts(data.counts || { pending: 0, completed: 0, overdue: 0, dueToday: 0 });
      } else {
        toast.error(data.error || "Failed to load welcome calls");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load welcome calls");
    } finally {
      setLoading(false);
    }
  }, [statusTab]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = items.filter((item) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      item.patient.fullName.toLowerCase().includes(q) ||
      item.patient.email.toLowerCase().includes(q) ||
      (item.subject || "").toLowerCase().includes(q)
    );
  });

  const urgencyBadge = (urgency: WelcomeCallItem["urgency"]) => {
    if (urgency === "overdue") {
      return <Badge className="bg-red-100 text-red-700">Overdue</Badge>;
    }
    if (urgency === "today") {
      return <Badge className="bg-amber-100 text-amber-800">Due today</Badge>;
    }
    if (urgency === "upcoming") {
      return <Badge variant="outline">Upcoming</Badge>;
    }
    return null;
  };

  const completeWelcomeCall = async () => {
    if (!selected) return;
    setProcessing(true);
    try {
      const res = await fetch("/api/care-comms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "completeOnboarding",
          memberId: selected.patient.id,
          notes: onboardingNotes.trim() || undefined,
          activateProgram,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to complete welcome call");
      }
      toast.success(
        activateProgram
          ? "Welcome call complete — program activated (first dose week 2)"
          : "Welcome call marked complete"
      );
      setShowCompleteDialog(false);
      setOnboardingNotes("");
      setActivateProgram(true);
      setSelected(null);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to complete");
    } finally {
      setProcessing(false);
    }
  };

  const activateMemberProgram = async (memberId: string) => {
    setProcessing(true);
    try {
      const res = await fetch("/api/care-comms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "activateProgram",
          memberId,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to activate program");
      }
      toast.success("Program activated — first dose scheduled for week 2");
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to activate");
    } finally {
      setProcessing(false);
    }
  };

  const upgradeToPrecision = async (memberId: string) => {
    setProcessing(true);
    try {
      const res = await fetch("/api/admin/billing/upgrade-tier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId,
          notes: "Precision upgrade from welcome call",
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to upgrade");
      }
      toast.success("Upgraded to Precision (effective next period)");
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to upgrade");
    } finally {
      setProcessing(false);
    }
  };

  const sendBillingOffer = async (memberId: string) => {
    try {
      const res = await fetch("/api/care-comms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "createBillingUpgradeOffer",
          memberId,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed");
      }
      toast.success("Billing upgrade offer task created");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create offer");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="w-7 h-7 text-emerald-600" />
            Welcome Calls
          </h1>
          <p className="text-muted-foreground mt-1">
            Onboard new members — welcome call, program walkthrough, and script follow-up
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold">{counts.pending}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-red-600">{counts.overdue}</p>
            <p className="text-xs text-muted-foreground">Overdue</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-amber-600">{counts.dueToday}</p>
            <p className="text-xs text-muted-foreground">Due today</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-emerald-600">{counts.completed}</p>
            <p className="text-xs text-muted-foreground">Completed (loaded)</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <Tabs
          value={statusTab}
          onValueChange={(v) => setStatusTab(v as typeof statusTab)}
        >
          <TabsList>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
        </Tabs>
        <Input
          placeholder="Search member name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            <Phone className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No welcome calls in this list</p>
            <p className="text-sm mt-1">
              New tasks appear when a doctor approves a member for treatment.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((item) => (
            <Card
              key={item.id}
              className={`transition-shadow hover:shadow-md ${
                item.urgency === "overdue" ? "border-red-200 bg-red-50/30" : ""
              }`}
            >
              <CardHeader className="pb-2">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                      {item.patient.fullName}
                      {urgencyBadge(item.urgency)}
                      <Badge variant="outline" className="capitalize">
                        {item.patient.journeyStatus.replace(/_/g, " ").toLowerCase()}
                      </Badge>
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {item.patient.email}
                      {item.patient.phone && ` · ${item.patient.phone}`}
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {item.patient.phone && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={`tel:${item.patient.phone}`}>
                          <Phone className="w-4 h-4 mr-1" />
                          Call
                        </a>
                      </Button>
                    )}
                    <Button variant="outline" size="sm" asChild>
                      <Link href={item.urls.memberProfile}>
                        <User className="w-4 h-4 mr-1" />
                        Profile
                      </Link>
                    </Button>
                    {item.status !== "COMPLETED" ? (
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelected(item);
                          setShowCompleteDialog(true);
                        }}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                        Complete
                      </Button>
                    ) : item.patient.journeyStatus !== "ACTIVE" ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => activateMemberProgram(item.patient.id)}
                        disabled={processing}
                      >
                        <Sparkles className="w-4 h-4 mr-1" />
                        Activate program
                      </Button>
                    ) : null}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Plan</p>
                    <p className="font-medium">
                      {item.patient.selectedPlan || item.patient.subscriptionTier || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Doctor</p>
                    <p className="font-medium">{item.patient.doctorName || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Script status</p>
                    <p className="font-medium flex items-center gap-1">
                      <Pill className="w-3 h-3" />
                      {item.prescription?.scriptStatus.replace(/_/g, " ") || "No script yet"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Portal onboarding</p>
                    <p className="font-medium">
                      {item.patient.hasCompletedPortalOnboarding ? (
                        <span className="text-emerald-600">Done</span>
                      ) : (
                        <span className="text-amber-600">Pending</span>
                      )}
                    </p>
                  </div>
                </div>

                {item.dueDate && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Due {new Date(item.dueDate).toLocaleDateString("en-AU", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    })}
                  </p>
                )}

                {item.notes && (
                  <ScrollArea className="h-[72px] rounded-md border bg-muted/30 p-2">
                    <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                      {item.notes}
                    </p>
                  </ScrollArea>
                )}

                <Separator />

                <div className="flex flex-wrap gap-2">
                  {item.prescription && (
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={item.urls.prescriptions}>
                        <ExternalLink className="w-3 h-3 mr-1" />
                        Script workflow
                      </Link>
                    </Button>
                  )}
                  {item.patient.selectedPlan === "CORE" &&
                    item.patient.hasStripeSubscription && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => upgradeToPrecision(item.patient.id)}
                      disabled={processing}
                    >
                      <Sparkles className="w-3 h-3 mr-1" />
                      Upgrade to Precision
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => sendBillingOffer(item.patient.id)}
                  >
                    <DollarSign className="w-3 h-3 mr-1" />
                    Log billing upgrade offer
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete welcome call</DialogTitle>
            <DialogDescription>
              {selected
                ? `Complete the welcome call for ${selected.patient.fullName}. Activate the program when they are ready to start week 1 (first dose begins week 2).`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-1">
              <p className="font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Checklist
              </p>
              <ul className="text-xs text-muted-foreground list-disc pl-5 space-y-0.5">
                <li>Program walkthrough and expectations</li>
                <li>Script / pharmacy timeline explained (delivery is separate)</li>
                <li>Portal onboarding (weight, goals, diet) encouraged</li>
                <li>Quarterly / 6-month billing discussed if appropriate</li>
              </ul>
            </div>
            <div className="flex items-start gap-3 rounded-lg border p-3">
              <Checkbox
                id="activateProgram"
                checked={activateProgram}
                onCheckedChange={(checked) => setActivateProgram(checked === true)}
              />
              <div className="space-y-1">
                <Label htmlFor="activateProgram" className="text-sm font-medium cursor-pointer">
                  Activate program now
                </Label>
                <p className="text-xs text-muted-foreground">
                  Member can use the dashboard immediately. First medication dose is scheduled for the start of week 2.
                </p>
              </div>
            </div>
            <div>
              <Label htmlFor="welcomeNotes">Call notes (optional)</Label>
              <Textarea
                id="welcomeNotes"
                value={onboardingNotes}
                onChange={(e) => setOnboardingNotes(e.target.value)}
                placeholder="Summary of welcome call..."
                rows={4}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCompleteDialog(false)}>
              Cancel
            </Button>
            <Button onClick={completeWelcomeCall} disabled={processing}>
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Mark complete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
